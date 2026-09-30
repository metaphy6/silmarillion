import { VERSION, type Match } from "../simulation/types";
import { parseMatch } from "../simulation/schema";
export interface Checkpoint {
  kind: "authoritative-host";
  version: string;
  state: Match;
  assignments: Record<string, string>;
  seatTokens: Record<string, string>;
}
export function encodeCheckpoint(
  state: Match,
  assignments: Record<string, string> = {},
  seatTokens: Record<string, string> = {},
): string {
  if (state.orders.length || state.combatPhase)
    throw new Error(
      "Save only a committed turn boundary; resolve current orders first",
    );
  parseMatch(state);
  const text = JSON.stringify({
    kind: "authoritative-host",
    version: VERSION,
    state,
    assignments,
    seatTokens,
  });
  // Validate the complete export, including metadata and the import-size cap,
  // before opening a write transaction that can replace the last valid save.
  decodeCheckpoint(text);
  return text;
}
export function decodeCheckpoint(text: string): Checkpoint {
  if (text.length > 8_000_000) throw new Error("Save exceeds 8 MB limit");
  const data: unknown = JSON.parse(text);
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== VERSION
  )
    throw new Error(
      "Incompatible save: use its original game version; migration is not automatic",
    );
  const d = data as Record<string, unknown>;
  if (d.kind !== "authoritative-host")
    throw new Error("Guest exports cannot restore an authoritative match");
  const state = parseMatch(d.state);
  if (state.orders.length || state.combatPhase)
    throw new Error("Checkpoint must be a committed turn boundary");
  const mapping = (v: unknown) => {
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw new Error("Invalid checkpoint assignments");
    const result: Record<string, string> = {};
    for (const [k, x] of Object.entries(v)) {
      if (!state.players[k] || typeof x !== "string" || x.length > 256)
        throw new Error("Invalid checkpoint seat");
      result[k] = x;
    }
    return result;
  };
  return {
    kind: "authoritative-host",
    version: VERSION,
    state,
    assignments: mapping(d.assignments),
    seatTokens: mapping(d.seatTokens),
  };
}
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("silmarillion-checkpoints", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("checkpoints");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function saveCheckpoint(
  state: Match,
  assignments: Record<string, string> = {},
  seatTokens: Record<string, string> = {},
) {
  const text = encodeCheckpoint(state, assignments, seatTokens);
  const database = await db();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("checkpoints", "readwrite");
      const store = tx.objectStore("checkpoints");
      store.put(text, "latest");
      store.put(text, state.id);
      tx.oncomplete = () => resolve();
      tx.onabort = () =>
        reject(
          tx.error ?? new Error("Save interrupted; prior checkpoint preserved"),
        );
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    database.close();
  }
}
export async function loadCheckpoint(): Promise<Checkpoint | null> {
  const database = await db();
  try {
    return await new Promise((resolve, reject) => {
      const tx = database.transaction("checkpoints", "readonly");
      const r = tx.objectStore("checkpoints").get("latest");
      r.onsuccess = () => {
        try {
          resolve(r.result ? decodeCheckpoint(r.result) : null);
        } catch (e) {
          reject(e);
        }
      };
      r.onerror = () => reject(r.error);
    });
  } finally {
    database.close();
  }
}
