import type { Signal } from "./metered";
export interface Signaling {
  connect(
    room: string,
    onSignal: (s: Signal) => void,
    onStatus: (text: string) => void,
  ): Promise<{ peerId: string; iceServers: RTCIceServer[] }>;
  send(to: string, data: unknown): Promise<void>;
  close(): void;
}
/** Same-device development signaling only; game messages still use actual RTCDataChannels. */
export class LocalSignaling implements Signaling {
  private channel?: BroadcastChannel;
  private id = crypto.randomUUID();
  async connect(
    room: string,
    signal: (s: Signal) => void,
    status: (text: string) => void,
  ) {
    this.channel = new BroadcastChannel(`sm-dev-${room}`);
    this.channel.onmessage = (e) => {
      const p = e.data;
      if (p?.to === this.id && typeof p.from === "string")
        signal({ from: p.from, data: p.data });
    };
    status("Development loopback signaling — not a remote service test");
    return { peerId: this.id, iceServers: [] };
  }
  async send(to: string, data: unknown) {
    this.channel?.postMessage({ to, from: this.id, data });
  }
  close() {
    this.channel?.close();
  }
}
export class StarTransport {
  peerId = "";
  private connections = new Map<string, RTCPeerConnection>();
  private channels = new Map<string, RTCDataChannel>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private candidates = new Map<string, RTCIceCandidateInit[]>();
  private ice: RTCIceServer[] = [];
  private disposed = false;
  private pulse?: ReturnType<typeof setInterval>;
  private seen = new Map<string, number>();
  private expectedHost = "";
  constructor(
    private signaling: Signaling,
    private host: boolean,
    private message: (peer: string, raw: string) => void,
    private status: (text: string) => void,
    private disconnected: (peer: string) => void,
    private opened: (peer: string) => void,
    private relayOnly = false,
  ) {}
  async connect(room: string) {
    const info = await this.signaling.connect(
      room,
      (s) => {
        void this.signal(s).catch((e) =>
          this.status(`Signaling error: ${String(e)}`),
        );
      },
      this.status,
    );
    this.peerId = info.peerId;
    this.ice = info.iceServers;
    this.pulse = setInterval(() => {
      for (const [peer, ch] of this.channels) {
        if (ch.readyState !== "open") continue;
        if (
          performance.now() - (this.seen.get(peer) ?? performance.now()) >
          4000
        ) {
          this.drop(peer);
          continue;
        }
        ch.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 1000);
    if (
      this.relayOnly &&
      !this.ice.some((s) =>
        (Array.isArray(s.urls) ? s.urls : [s.urls]).some(
          (u) => u.startsWith("turn:") || u.startsWith("turns:"),
        ),
      )
    )
      throw new Error("Forced relay requires provider-issued TURN credentials");
    return info;
  }
  async join(hostPeer: string) {
    if (this.host) throw new Error("Host cannot join itself");
    this.expectedHost = hostPeer;
    await this.signaling.send(hostPeer, { type: "knock" });
    this.timer(hostPeer);
  }
  private timer(peer: string) {
    clearTimeout(this.timers.get(peer));
    this.timers.set(
      peer,
      setTimeout(() => {
        this.status(
          "Connection timed out after 20 seconds; check invite, provider and TURN setup",
        );
        this.drop(peer);
      }, 20000),
    );
  }
  private make(peer: string) {
    const existing = this.connections.get(peer);
    if (existing) return existing;
    if (
      // Three seats plus one temporary rejoin handshake. Authentication then
      // retires the old peer; this never creates a fourth player seat.
      (this.host && this.connections.size >= 4) ||
      (!this.host && this.connections.size >= 1)
    )
      throw new Error("Star topology seat limit");
    const pc = new RTCPeerConnection({
      iceServers: this.ice,
      iceTransportPolicy: this.relayOnly ? "relay" : "all",
    });
    this.connections.set(peer, pc);
    this.timer(peer);
    pc.onicecandidate = (e) => {
      if (e.candidate)
        void this.signaling
          .send(peer, { type: "ice", candidate: e.candidate.toJSON() })
          .catch((e) => this.status(String(e)));
    };
    pc.ondatachannel = (e) => this.attach(peer, e.channel);
    pc.onconnectionstatechange = () => {
      this.status(`Peer ${peer.slice(0, 6)}: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        this.disconnected(peer);
        if (pc.connectionState !== "closed") this.drop(peer);
      }
    };
    return pc;
  }
  private attach(peer: string, ch: RTCDataChannel) {
    if (
      ch.label !== "orders" ||
      !ch.ordered ||
      ch.maxRetransmits !== null ||
      ch.maxPacketLifeTime !== null
    ) {
      ch.close();
      return;
    }
    this.channels.set(peer, ch);
    this.seen.set(peer, performance.now());
    ch.onopen = () => {
      clearTimeout(this.timers.get(peer));
      this.opened(peer);
    };
    ch.onmessage = (e) => {
      this.seen.set(peer, performance.now());
      if (e.data === '{"type":"heartbeat"}') {
        ch.send('{"type":"heartbeat-ack"}');
        return;
      }
      if (e.data === '{"type":"heartbeat-ack"}') return;
      if (typeof e.data !== "string" || e.data.length > 65536) {
        this.status("Rejected oversized channel frame");
        return;
      }
      this.message(peer, e.data);
    };
    ch.onclose = () => {
      if (!this.disposed) this.drop(peer);
    };
    ch.onerror = () =>
      this.status(
        "Data channel error; reconnect using the saved seat credential",
      );
  }
  private async signal({ from, data }: Signal) {
    if (
      this.disposed ||
      (!this.host && from !== this.expectedHost) ||
      !data ||
      typeof data !== "object" ||
      JSON.stringify(data).length > 65536
    )
      return;
    const d = data as Record<string, unknown>;
    if (d.type === "knock" && this.host) {
      const pc = this.make(from);
      if (pc.signalingState !== "stable") return;
      this.attach(from, pc.createDataChannel("orders", { ordered: true }));
      await pc.setLocalDescription(await pc.createOffer());
      await this.signaling.send(from, {
        type: "offer",
        description: pc.localDescription?.toJSON(),
      });
    } else if (d.type === "offer" && !this.host) {
      const pc = this.make(from);
      await pc.setRemoteDescription(d.description as RTCSessionDescriptionInit);
      await this.flush(from, pc);
      await pc.setLocalDescription(await pc.createAnswer());
      await this.signaling.send(from, {
        type: "answer",
        description: pc.localDescription?.toJSON(),
      });
    } else if (d.type === "answer" && this.host) {
      const pc = this.connections.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(d.description as RTCSessionDescriptionInit);
      await this.flush(from, pc);
    } else if (d.type === "ice") {
      const candidate = d.candidate as RTCIceCandidateInit;
      const pc = this.connections.get(from);
      // A host creates a connection before it sends an offer. Unknown sender
      // ICE has no legitimate route and must not allocate unbounded map keys.
      if (this.host && !pc) return;
      if (pc?.remoteDescription) await pc.addIceCandidate(candidate);
      else {
        const list = this.candidates.get(from) ?? [];
        if (list.length < 64) list.push(candidate);
        this.candidates.set(from, list);
      }
    }
  }
  private async flush(peer: string, pc: RTCPeerConnection) {
    for (const c of this.candidates.get(peer) ?? [])
      await pc.addIceCandidate(c);
    this.candidates.delete(peer);
  }
  send(peer: string, text: string) {
    const ch = this.channels.get(peer);
    if (!ch || ch.readyState !== "open")
      throw new Error("Peer disconnected; keep pending command and reconnect");
    if (text.length > 65536) throw new Error("Frame exceeds 64 KiB");
    if (ch.bufferedAmount > 512000)
      throw new Error("Connection congested; retry after synchronization");
    ch.send(text);
  }
  peers() {
    return [...this.channels.entries()]
      .filter(([, c]) => c.readyState === "open")
      .map(([id]) => id);
  }
  drop(peer: string) {
    clearTimeout(this.timers.get(peer));
    const ch = this.channels.get(peer);
    this.channels.delete(peer);
    if (ch) {
      ch.onclose = null;
      ch.onmessage = null;
      ch.close();
    }
    const pc = this.connections.get(peer);
    if (pc) {
      pc.onconnectionstatechange = null;
      pc.close();
    }
    this.connections.delete(peer);
    this.candidates.delete(peer);
    this.seen.delete(peer);
    if (!this.disposed) this.disconnected(peer);
  }
  close() {
    this.disposed = true;
    clearInterval(this.pulse);
    for (const id of this.connections.keys()) this.drop(id);
    for (const t of this.timers.values()) clearTimeout(t);
    this.signaling.close();
  }
}
