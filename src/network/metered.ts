/** Managed signaling only. Match orders travel through native WebRTC data channels. */
export interface Signal {
  from: string;
  data: unknown;
}
type Client = InstanceType<
  (typeof import("@metered-ca/realtime"))["SignallingClient"]
>;
const MAX_BYTES = 65_536;
const identity = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function safePayload(data: unknown): boolean {
  try {
    const text = JSON.stringify(data);
    return (
      typeof text === "string" &&
      new TextEncoder().encode(text).length <= MAX_BYTES
    );
  } catch {
    return false;
  }
}

function validateIce(value: unknown): RTCIceServer[] {
  if (!Array.isArray(value) || !value.length || value.length > 16)
    throw new Error(
      "Managed TURN credentials missing or invalid. Enable TURN auto-injection in Metered.",
    );
  let relay = false;
  const servers = value.map((server: unknown): RTCIceServer => {
    if (!record(server)) throw new Error("Invalid ICE server response.");
    const urls = typeof server.urls === "string" ? [server.urls] : server.urls;
    if (
      !Array.isArray(urls) ||
      !urls.length ||
      urls.length > 16 ||
      urls.some(
        (url: unknown) =>
          typeof url !== "string" ||
          url.length > 512 ||
          !/^(stun|stuns|turn|turns):[A-Za-z0-9.[\]:-]+(?:\?transport=(?:udp|tcp))?$/.test(
            url,
          ),
      )
    )
      throw new Error("Invalid ICE server URL.");
    const isTurn = urls.some((url: string) => /^turns?:/.test(url));
    if (
      isTurn &&
      (typeof server.username !== "string" ||
        !server.username.length ||
        server.username.length > 1024 ||
        typeof server.credential !== "string" ||
        !server.credential.length ||
        server.credential.length > 1024)
    )
      throw new Error("Invalid TURN credential response.");
    relay ||= isTurn;
    const validatedUrls =
      typeof server.urls === "string" ? server.urls : ([...urls] as string[]);
    return isTurn
      ? {
          urls: validatedUrls,
          username: server.username as string,
          credential: server.credential as string,
        }
      : { urls: validatedUrls };
  });
  if (!relay)
    throw new Error(
      "Managed TURN unavailable. Enable TURN auto-injection; STUN alone cannot guarantee connectivity.",
    );
  return servers;
}

export class MeteredSignaling {
  private client?: Client;
  private generation = 0;
  private cancel?: () => void;
  private ready = false;
  private status: (text: string) => void = () => {};
  constructor(private readonly publicKey: string) {}

  async connect(
    room: string,
    onSignal: (signal: Signal) => void,
    onStatus: (text: string) => void,
  ): Promise<{ peerId: string; iceServers: RTCIceServer[] }> {
    this.close();
    if (!/^pk_live_[A-Za-z0-9_-]+$/.test(this.publicKey))
      throw new Error(
        "Configure a Metered publishable pk_live_ key. Private keys are never accepted in browser configuration.",
      );
    if (!identity(room)) throw new Error("Invalid room identifier.");
    const generation = this.generation;
    this.status = onStatus;
    onStatus("Connecting to managed signaling…");
    let rejectConnection: (reason: Error) => void = () => {};
    const stopped = new Promise<never>((_, reject) => {
      rejectConnection = reject;
    });
    this.cancel = () =>
      rejectConnection(new Error("Signaling connection closed."));
    const timer = setTimeout(
      () =>
        rejectConnection(
          new Error(
            "Signaling connection timed out after 15 seconds. Check provider configuration and connectivity.",
          ),
        ),
      15_000,
    );
    const attempt = async () => {
      const { SignallingClient } = await import("@metered-ca/realtime");
      if (generation !== this.generation)
        throw new Error("Signaling connection closed.");
      const client = new SignallingClient({
        apiKey: this.publicKey,
        reconnect: false,
      });
      this.client = client;
      let welcome: { peerId: string; iceServers: RTCIceServer[] } | undefined;
      let welcomeError: Error | undefined;
      client.on("connected", (response: unknown) => {
        if (generation !== this.generation) return;
        try {
          if (!record(response) || !identity(response.peerId))
            throw new Error("Invalid provider peer identity.");
          welcome = {
            peerId: response.peerId,
            iceServers: validateIce(response.iceServers),
          };
        } catch (error) {
          welcomeError =
            error instanceof Error
              ? error
              : new Error("Invalid provider welcome.");
        }
      });
      client.on("direct", (message: unknown) => {
        if (generation !== this.generation || !this.ready) return;
        if (
          !record(message) ||
          !identity(message.from) ||
          !safePayload(message.data)
        ) {
          onStatus("Rejected malformed or oversized signaling message.");
          return;
        }
        onSignal({ from: message.from, data: message.data });
      });
      client.on("disconnected", () => {
        if (generation !== this.generation) return;
        this.ready = false;
        onStatus(
          "Managed signaling disconnected. Rejoin the invitation to reconnect; the host pauses the match.",
        );
        rejectConnection(
          new Error(
            "Managed signaling disconnected before room connection completed.",
          ),
        );
      });
      await client.connect();
      if (welcomeError) throw welcomeError;
      if (!welcome)
        throw new Error(
          "Provider did not supply a valid welcome with TURN credentials.",
        );
      await client.subscribe(room);
      if (generation !== this.generation)
        throw new Error("Signaling connection closed.");
      this.ready = true;
      onStatus(
        "Managed signaling connected. Establishing WebRTC data channels…",
      );
      return welcome;
    };
    try {
      return await Promise.race([attempt(), stopped]);
    } catch (error) {
      if (generation === this.generation) this.close();
      throw error;
    } finally {
      clearTimeout(timer);
      if (generation === this.generation) this.cancel = undefined;
    }
  }

  async send(to: string, data: unknown): Promise<void> {
    if (!this.ready || !this.client)
      throw new Error("Managed signaling is not connected. Rejoin the room.");
    if (!identity(to)) throw new Error("Invalid signaling recipient.");
    if (!safePayload(data))
      throw new Error(
        "Signaling payload exceeds size limit or is not serializable.",
      );
    await this.client.send(to, data);
  }

  close(): void {
    this.generation++;
    this.ready = false;
    this.cancel?.();
    this.cancel = undefined;
    const client = this.client;
    this.client = undefined;
    if (client)
      void client
        .close()
        .catch(() =>
          this.status("Signaling cleanup failed; refresh before rejoining."),
        );
  }
}
