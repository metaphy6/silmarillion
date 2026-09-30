import { HostAuthority, guestSnapshot, type Reply } from "./protocol";
import { StarTransport, LocalSignaling, type Signaling } from "./star";
import { MeteredSignaling } from "./metered";
import { VERSION, type Match, type Order } from "../simulation/types";
import { parseMatch } from "../simulation/schema";
import { saveCheckpoint } from "../persistence/checkpoints";
import { z } from "zod";
const replySchema = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("error"), message: z.string().max(2048) })
    .strict(),
  z
    .object({
      type: z.literal("welcome"),
      seat: z.string(),
      token: z.string().min(32).max(256),
      snapshot: z.unknown(),
    })
    .strict(),
  z
    .object({
      type: z.literal("receipt"),
      ok: z.boolean(),
      message: z.string().max(2048),
      id: z.string().max(160),
      snapshot: z.unknown(),
    })
    .strict(),
  z.object({ type: z.literal("snapshot"), snapshot: z.unknown() }).strict(),
]);
interface Invite {
  room: string;
  matchId: string;
  host: string;
  cap: string;
  dev: boolean;
  version: string;
}
export class MatchSession {
  authority?: HostAuthority;
  transport?: StarTransport;
  seat = "p1";
  invite = "";
  private info?: Invite;
  private token = "";
  private pending = new Map<string, Order>();
  private transfers = new Map<
    string,
    { chunks: string[]; count: number; bytes: number; at: number }
  >();
  private sequence = 0;
  private hostPeer = "";
  private closed = false;
  private generation = 0;
  private blockedPeers = new Set<string>();
  private inboundRates = new Map<string, { at: number; count: number }>();
  constructor(
    private changed: (s: Match, seat: string) => void,
    private status: (message: string) => void,
  ) {}
  private provider(dev: boolean): Signaling {
    if (dev) return new LocalSignaling();
    const key = import.meta.env.VITE_METERED_PUBLISHABLE_KEY;
    if (!key)
      throw new Error(
        "Set public VITE_METERED_PUBLISHABLE_KEY for managed rooms; local development signaling is a separate test mode",
      );
    return new MeteredSignaling(key);
  }
  async host(state: Match, dev = false, tokens: Record<string, string> = {}) {
    const room = `silmarillion-${crypto.randomUUID()}`,
      cap = crypto.randomUUID() + crypto.randomUUID();
    this.authority = new HostAuthority(structuredClone(state), cap, tokens);
    for (const p of Object.values(this.authority.state.players)) p.ai = false;
    this.transport = new StarTransport(
      this.provider(dev),
      true,
      (peer, raw) => this.hostMessage(peer, raw),
      this.status,
      (peer) => {
        if (!Object.values(this.authority?.assignments ?? {}).includes(peer))
          return;
        this.authority?.disconnect(peer);
        this.status(
          "Match paused: peer disconnected. Rejoin before resolution.",
        );
      },
      () =>
        this.status(
          "Transport connected; awaiting private seat authentication",
        ),
      import.meta.env.VITE_FORCE_TURN === "true",
    );
    const info = await this.transport.connect(room);
    this.info = {
      room,
      matchId: state.id,
      host: info.peerId,
      cap,
      dev,
      version: VERSION,
    };
    this.invite = JSON.stringify(this.info);
    this.changed(this.authority.state, "p1");
    this.status(
      "Room open. Send the private invite to friends; each chooses a distinct reserved seat.",
    );
    return this.invite;
  }
  async join(inviteText: string, seat: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(inviteText);
    } catch {
      throw new Error("Paste a complete private invitation");
    }
    if (!parsed || typeof parsed !== "object")
      throw new Error("Invalid invite");
    const i = parsed as Invite;
    if (
      typeof i.room !== "string" ||
      typeof i.matchId !== "string" ||
      i.matchId.length > 160 ||
      typeof i.host !== "string" ||
      typeof i.cap !== "string" ||
      i.cap.length < 20 ||
      i.cap.length > 256 ||
      typeof i.dev !== "boolean" ||
      i.version !== VERSION
    )
      throw new Error("Invalid or incompatible invitation");
    this.info = i;
    this.invite = inviteText;
    this.seat = seat;
    this.hostPeer = i.host;
    this.token =
      sessionStorage.getItem(`sm-seat-${i.matchId}-${seat}`) ??
      crypto.randomUUID() + crypto.randomUUID();
    sessionStorage.setItem(`sm-seat-${i.matchId}-${seat}`, this.token);
    await this.connectGuest();
  }
  private async connectGuest() {
    if (!this.info) return;
    const generation = ++this.generation;
    this.transfers.clear();
    const i = this.info;
    this.closed = false;
    this.transport = new StarTransport(
      this.provider(i.dev),
      false,
      (peer, raw) => {
        if (generation === this.generation && !this.closed)
          this.guestMessage(peer, raw);
      },
      this.status,
      () =>
        this.status(
          "Host unavailable: match stopped. Reconnect or restore a committed host checkpoint; no seamless migration.",
        ),
      () => {
        this.transport!.send(
          i.host,
          JSON.stringify({
            type: "hello",
            version: VERSION,
            invite: i.cap,
            seat: this.seat,
            token: this.token,
          }),
        );
      },
      import.meta.env.VITE_FORCE_TURN === "true",
    );
    await this.transport.connect(i.room);
    await this.transport.join(i.host);
  }
  async reconnect() {
    this.status("Reconnecting seat; awaiting a fresh authenticated snapshot");
    if (this.authority)
      throw new Error(
        "Host recovery requires restoring an authoritative checkpoint and opening a new room",
      );
    this.transport?.close();
    await this.connectGuest();
  }
  private hostMessage(peer: string, raw: string) {
    if (!this.authority || this.closed || this.blockedPeers.has(peer)) return;
    const now = performance.now();
    let rate = this.inboundRates.get(peer);
    if (!rate || now - rate.at >= 1000) {
      if (!rate && this.inboundRates.size >= 64)
        this.inboundRates.delete(this.inboundRates.keys().next().value!);
      rate = { at: now, count: 0 };
      this.inboundRates.set(peer, rate);
    }
    // Count before protocol validation, including oversized/invalid packets.
    if (++rate.count > 30) {
      this.disconnectFlooder(peer);
      return;
    }
    const previousState = this.authority.state;
    const previousAssignments = { ...this.authority.assignments };
    const reply = this.authority.receive(peer, raw, now);
    if (reply.type === "error") {
      if (reply.message.startsWith("Rate limit:")) {
        this.disconnectFlooder(peer);
      } else this.sendReply(peer, reply);
      return;
    }
    if (reply.type === "welcome") {
      const previousPeer = previousAssignments[reply.seat];
      if (previousPeer && previousPeer !== peer)
        this.transport?.drop(previousPeer);
    }
    this.sendReply(peer, reply);
    if (reply.type === "welcome")
      void saveCheckpoint(
        this.authority.state,
        this.authority.assignments,
        this.authority.seatTokens,
      ).catch((e) => this.status(String(e)));
    if (this.authority.state !== previousState) {
      this.changed(this.authority.state, "p1");
      this.broadcast(peer);
    }
  }
  private disconnectFlooder(peer: string) {
    // Bound error traffic and already queued callbacks. Evicted old IDs have
    // closed transports; a legitimate rejoin receives a new provider identity.
    if (this.blockedPeers.size >= 64)
      this.blockedPeers.delete(this.blockedPeers.values().next().value!);
    this.blockedPeers.add(peer);
    this.inboundRates.delete(peer);
    this.transport?.drop(peer);
    this.status("Peer disconnected for excessive messages; rejoin to resume.");
  }
  private sendReply(peer: string, reply: Reply) {
    const text = JSON.stringify(reply);
    const size = 24000;
    const id = `snapshot:${++this.sequence}`;
    const count = Math.ceil(text.length / size);
    if (count > 160) {
      this.status("Snapshot exceeds transfer budget");
      return;
    }
    try {
      for (let i = 0; i < count; i++)
        this.transport!.send(
          peer,
          JSON.stringify({
            type: "chunk",
            id,
            index: i,
            count,
            data: text.slice(i * size, (i + 1) * size),
          }),
        );
    } catch (e) {
      this.status(
        `Transfer interrupted: ${String(e)}. Reconnect to synchronize a fresh snapshot.`,
      );
    }
  }
  private guestMessage(peer: string, raw: string) {
    if (peer !== this.hostPeer) return;
    try {
      const d = JSON.parse(raw) as {
        type: string;
        id: string;
        index: number;
        count: number;
        data: string;
      };
      if (
        d.type !== "chunk" ||
        typeof d.id !== "string" ||
        d.id.length > 100 ||
        !Number.isInteger(d.index) ||
        !Number.isInteger(d.count) ||
        d.count < 1 ||
        d.count > 160 ||
        d.index < 0 ||
        d.index >= d.count ||
        typeof d.data !== "string" ||
        d.data.length > 24000
      )
        throw new Error("Invalid snapshot frame");
      for (const [id, t] of this.transfers)
        if (performance.now() - t.at > 20000) this.transfers.delete(id);
      let transfer = this.transfers.get(d.id);
      if (!transfer) {
        if (this.transfers.size >= 4)
          throw new Error("Too many pending snapshots");
        transfer = {
          chunks: [],
          count: d.count,
          bytes: 0,
          at: performance.now(),
        };
        this.transfers.set(d.id, transfer);
      }
      if (transfer.count !== d.count)
        throw new Error("Snapshot frame mismatch");
      if (transfer.chunks[d.index] !== undefined)
        throw new Error("Duplicate snapshot frame");
      transfer.bytes += d.data.length;
      if (transfer.bytes > 4_000_000) throw new Error("Snapshot too large");
      transfer.chunks[d.index] = d.data;
      if (
        transfer.chunks.filter((x) => x !== undefined).length !== transfer.count
      )
        return;
      this.transfers.delete(d.id);
      const reply = replySchema.parse(JSON.parse(transfer.chunks.join("")));
      if (reply.type === "error") {
        this.status(reply.message);
        return;
      }
      const snapshot = parseMatch(reply.snapshot, this.seat);
      if (snapshot.id !== this.info?.matchId)
        throw new Error("Snapshot belongs to another match");
      if (reply.type === "welcome" && reply.seat !== this.seat)
        throw new Error("Welcome belongs to another seat");
      if (reply.type === "welcome") {
        this.token = reply.token;
        sessionStorage.setItem(
          `sm-seat-${this.info!.matchId}-${this.seat}`,
          reply.token,
        );
      }
      if (reply.type === "receipt") {
        this.pending.delete(reply.id);
        this.status(reply.message);
      }
      this.changed(snapshot, this.seat);
      if (reply.type === "welcome") {
        for (const o of this.pending.values())
          this.transport!.send(
            this.hostPeer,
            JSON.stringify({ type: "order", order: o }),
          );
        this.status(
          `Connected as ${this.seat}; filtered snapshot synchronized`,
        );
      }
    } catch (e) {
      this.status(`Rejected host snapshot: ${String(e)}`);
    }
  }
  order(o: Order) {
    if (this.authority) {
      const result = this.authority.local(o);
      this.changed(this.authority.state, "p1");
      this.broadcast();
      return result.reason;
    }
    if (this.pending.size)
      throw new Error(
        "Wait for the pending command receipt or reconnect before another order",
      );
    if (this.pending.size >= 32)
      throw new Error("Too many pending commands; reconnect to synchronize");
    this.pending.set(o.id, o);
    this.transport!.send(
      this.hostPeer,
      JSON.stringify({ type: "order", order: o }),
    );
    return "Order sent; waiting for authoritative receipt";
  }
  async resolve() {
    if (!this.authority)
      throw new Error("Only the host resolves after all seats commit");
    this.authority.resolve();
    if (!this.authority.state.combatPhase)
      await saveCheckpoint(
        this.authority.state,
        this.authority.assignments,
        this.authority.seatTokens,
      );
    this.changed(this.authority.state, "p1");
    this.broadcast();
  }
  private broadcast(excludePeer?: string) {
    if (!this.authority) return;
    for (const [seat, peer] of Object.entries(this.authority.assignments)) {
      if (peer === excludePeer) continue;
      this.sendReply(peer, {
        type: "snapshot",
        snapshot: guestSnapshot(this.authority.state, seat),
      });
    }
  }
  guestExport(state: Match) {
    return JSON.stringify({
      kind: "guest-view",
      version: VERSION,
      seat: this.seat,
      state,
    });
  }
  close() {
    this.generation++;
    this.closed = true;
    this.transport?.close();
    this.pending.clear();
    this.transfers.clear();
    this.blockedPeers.clear();
    this.inboundRates.clear();
  }
  isClosed() {
    return this.closed;
  }
}
