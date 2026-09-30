# Managed multiplayer connectivity

The game uses static hosting. Optional private matches use one player's browser
as authoritative host and native reliable ordered WebRTC data channels between
that host and each guest. Managed signaling exchanges connection information;
STUN discovers routes and TURN relays connections when direct routes fail.
These external services are still required. The host can inspect and change the
authoritative simulation; this is a friends-only trust model, not ranked security.

## Adapter and setup

`src/network/metered.ts` dynamically loads `@metered-ca/realtime` 1.2.0. Local
gameplay does not need a provider account or key. The adapter uses
`SignallingClient`, avoiding the SDK's automatic all-peer connection topology.
Its `send` method sends signaling only, not gameplay orders or snapshots.

1. Create a Metered account and a Realtime Messaging publishable key in the
   provider dashboard. No account or paid service was created by the implementation.
2. Enable an active TURN service and the key's **Auto-inject TURN** option.
3. Restrict dashboard channel patterns to the game's room prefix (for example,
   `silmarillion-*`) and only the required subscribe, presence and send actions.
4. Set `VITE_METERED_PUBLISHABLE_KEY=pk_live_REPLACE_ME` in the local deployment
   environment. Vite values are public. Never add `sk_secret_`, a private API key,
   a TURN signing secret or permanent TURN credentials to Vite variables.
5. Build and serve the static site over HTTPS. Use the game invitation UI for
   room creation/joining. Missing configuration must leave single-player usable.

The adapter validates the welcome peer identity, ICE schemes and bounded
credential lengths. It rejects missing TURN rather than implying STUN-only
connectivity is reliable. Connection and room subscription have a combined
15-second timeout. Closing cancels in-flight setup; late messages are ignored.
Transport loss requires an explicit rejoin rather than silently changing the
provider identity beneath an authenticated game seat. The session layer must
authenticate seat recovery separately from transient provider peer IDs.

## Unresolved provider authorization requirement

**Publishable-key mode is not complete production room authorization.** Every
holder of the key has the same provider permissions; Metered documents no origin
restriction or per-user scoping in this mode. Anyone can extract the key and use
its signaling/TURN allowance. Random room invitations and host-checked capabilities
can restrict game participation, but do not turn a shared provider key into
provider-enforced per-user authorization. Do not treat a hidden room name as a
server access-control rule.

Metered's room-scoped, expiring JWT path requires a private token issuer. Its REST
token endpoint also requires private signing credentials. No issuer is deployed
or quietly embedded in the browser here. The publisher must obtain a compatible
externally operated authorization/credential service before claiming the full
short-lived scoped credential requirement is met. Merely hosting a custom token
issuer on a managed function platform would still introduce publisher-operated
backend logic and is not the selected static-only architecture.

The publishable-key TURN auto-injection documentation does not establish
per-player credential expiry. Credential expiration, account limits, room access
restrictions and forced relay behavior need real service validation. There is no
fallback to permanent secrets. Cloudflare's TURN API similarly requires a private
issuer and is not a substitute that removes this dependency.

## Recovery and test boundaries

The signaling adapter does not persist or authorize game state. The host session
must bind authenticated seats to connections, validate commands, deduplicate
retries and send filtered guest views. The host checkpoint and guest save are
different trust domains. Closing or suspending the host stops simulation;
restoration must use a committed authoritative checkpoint, with no promise of
seamless host migration. A provider connection status is not proof that a WebRTC
channel or game synchronization is ready.

`npm test -- tests/metered.test.ts` tests mocked provider welcome validation,
private-key rejection, malformed/oversized input, direct signaling, timeout,
closure and cancellation. These are **mock SDK tests**, not remote connection
evidence. No production credentials were available; cross-network 2/3/4-player
matches, forced TURN (`iceTransportPolicy: 'relay'`), credential expiration,
provider room restrictions and real reconnect behavior remain unexecuted.

### Local recovery evidence (2026-09-29–30)

The Chromium browser suite additionally exercises actual reliable ordered
RTCDataChannels with same-device BroadcastChannel signaling. Two-, three- and
four-tab UI flows authenticated seats, committed orders, resolved a week,
reconnected and detected host loss against an immutable production preview.
This verifies browser WebRTC locally, not managed signaling or internet routing.
Fault-injection cases interrupted an order before acceptance, dropped its receipt
after acceptance, and interrupted the first welcome halfway through a multi-frame
snapshot. Each case rejoined and restored a committed checkpoint on a new host;
accepted commands occurred exactly once. Unit regressions cover stale/duplicate
orders, credential preservation, wrong-seat/match snapshots, incomplete transfer
cleanup and late old-transport callbacks.

The final scoped run passed all six browser cases in 52 seconds, including manual
host save/export preservation of joined guests' seat credentials. Its immutable
UI bundle used `r6-sim-2` (built 2026-09-29 21:04 UTC); the three fault-injection
cases used live source modules before the subsequent `r6-sim-3` version update.
This scoped result does not claim final-release browser validation of later rule
changes. The full networking/persistence unit slice passed 26 tests; typecheck
and scoped lint also passed.

An initial ten-run four-player stress test reproduced two reconnect failures.
The host's three-connection cap could reject a replacement peer before the old
channel-close callback arrived. The transport now reserves one bounded temporary
handshake slot, authenticates the saved seat credential, and retires the old peer.
A unit regression reproduces that capacity race; a subsequent immutable-preview
stress run passed all ten four-player cases. The initial failure evidence remains
recorded rather than being concealed by passing retries. The test file
accepts `SILMARILLION_TEST_URL` for its UI cases so they can run against an
immutable preview. Source-module fault injection still uses the development
server and must not be mistaken for a production bundle test.

Rejoin credentials are generated and stored by the guest before the first hello.
The host binds that credential upon an invitation-authorized first seat claim.
Consequently a lost first welcome cannot permanently lock the guest out. A valid
saved credential replaces the prior peer binding even if its close event is late;
the superseded peer cannot continue submitting commands.

Guest views retain visible uncarried neutral equipment so dropped hero gear can
be reclaimed. Enemy-carried inventory and unseen drops remain filtered. Unknown
host-side ICE senders cannot allocate queues; guests accept offers and ICE only
from their invitation's host identity. Checkpoint encoding validates the complete
candidate through the same decoder before opening an IndexedDB write transaction,
so invalid metadata or an oversized export cannot replace the last valid save.

Before release, run those checks on independent networks and inspect the selected
ICE candidate pair (`getStats`) to confirm relay use. Test interruption before
acceptance, after commitment and during snapshot transfer, then reconnect and
confirm exactly-once command resolution. Verify host loss and checkpoint recovery
without leaking authoritative hidden data into guest exports. Record actual
Chrome, Firefox and Safari versions and results; local-tab mocks cannot certify
internet reliability.

## Official documentation verified 2026-09-29

- [Metered authentication](https://www.metered.ca/docs/realtime-messaging/sdk-javascript/guides/authentication/): publishable-key limitations, TURN auto-injection, private JWT issuance.
- [SignallingClient API](https://www.metered.ca/docs/realtime-messaging/sdk-javascript/api-reference/signalling-client/): events, direct messaging, lifecycle and welcome ICE data.
- [SDK getting started](https://www.metered.ca/docs/realtime-messaging/sdk-javascript/getting-started/): `send` is server-routed; native data channels carry P2P data.
- [Cloudflare TURN credentials](https://developers.cloudflare.com/realtime/turn/generate-credentials/): private backend credential generation requirement.

Metered's API-reference example still describes publishable-key ICE data as
undefined, while its authentication guide documents auto-injection. Installed
SDK declarations accept optional welcome `iceServers`. Runtime validation is
therefore mandatory; the adapter fails visibly when the provider omits them.

## Remaining managed-service verification plan — 2026-09-30

**Status: external verification blocked, not completed.** The current adapter
accepts a publishable key only; it does not implement a provider-operated login,
room-authorization exchange, JWT `tokenProvider`, credential renewal or a proven
TURN expiry policy. Adding a dashboard key enables connectivity experiments; it
does not close the authorization requirement. No external account, credential,
purchase or deployment was created during this review.

Current official documentation was rechecked on 2026-09-30:

- [Metered SDK authentication](https://www.metered.ca/docs/realtime-messaging/sdk-javascript/guides/authentication/) still separates shared publishable-key permissions from private JWT issuance. Its auto-injection path requires active TURN service; shared keys have no origin restrictions.
- [Metered scoped signaling example](https://www.metered.ca/docs/realtime-messaging/guides/integrations/webrtc-signalling/) obtains JWTs through a private key pair. Provider-hosted signing does not remove the private authorization caller.
- [Metered no-backend guide](https://www.metered.ca/docs/realtime-messaging/guides/integrations/webrtc-signalling-no-backend/) describes identical scopes for all public-key users. It also mentions `allowedOrigins` and separate TURN fetching, contradicting the SDK authentication guide. Obtain provider clarification and inspect actual dashboard/response behavior; do not claim those restrictions exist.
- [Cloudflare credential generation](https://developers.cloudflare.com/realtime/turn/generate-credentials/) requires private authorization to generate temporary credentials. It does not establish a browser-safe room-authorizing issuer for this game.

### Gate A — architecture and external setup

Before marking production multiplayer ready, select a **provider-operated**
authorization mechanism that authenticates a returning player, grants only their
allowed room/seat, issues bounded-lifetime signaling and TURN credentials, and
supports revocation/renewal without owner-written server code or exposed private
keys. Record its official API contract, operator, identity recovery policy,
expiry limits, quotas and abuse controls. No compatible mechanism has yet been
verified. An owner-maintained serverless function is not an exemption from the
static-only constraint.

After that mechanism is identified, implement its exchange behind the signaling
adapter, then add mocked denial, expiry, renewal and cancellation tests. Keep the
existing host seat capability separate from provider identity. TURN credentials
are necessarily delivered to the browser: protect the private issuance secret,
not a claim that browser users cannot inspect their own temporary credentials.
Record signaling room scope separately from TURN relay authorization; a signaling
JWT expiry does not by itself prove TURN allocations expire at the same instant.

For a limited connectivity experiment with the existing adapter, an authorized
operator can configure the documented public key, active TURN service and narrow
channel/action permissions. Use an isolated provider project with a finite usage
limit and only invited testers. This experiment remains **publishable-key mode**
and cannot pass the per-player authorization/expiry rows below.

### Gate B — build and test preparation

1. Record the exact source revision, `VERSION`, build time, browser versions and
   provider configuration revision. Run `npm ci` and `npm run check` from the
   repository root. Keep credential values out of command logs and reports.
2. Build two immutable static artifacts: ordinary connectivity with
   `VITE_FORCE_TURN=false`, and forced relay with `VITE_FORCE_TURN=true` set in
   the build environment before `npm run build`. Vite embeds these values at
   build time; changing a hosting environment variable after building is
   insufficient. Both artifacts need the authorized public/provider adapter
   configuration. Hosting preparation is a separate authorized operator action.
3. Serve `dist/` over HTTPS using static hosting. Open the game Network panel,
   choose managed signaling, create a private room and distribute its invite
   privately. Do not use local BroadcastChannel mode for any remote evidence.
4. Use distinct devices and independently routed networks: one residential
   connection, one mobile connection, and additional independent connections for
   three/four players. Separate tabs or browsers behind one router are insufficient.
5. Preserve only redacted diagnostics: elapsed times, candidate types, relay
   protocol, frame/byte counts, turn/revision and command outcome. Remove invite
   capabilities, seat tokens, JWTs, TURN usernames/passwords, SDP addresses and
   authoritative hidden state from shared reports. Private host checkpoints may
   be retained by the authorized host outside public build assets.

### Gate C — execution matrix

Every row below is **UNEXECUTED against managed services**. Run each applicable
row for 2, 3 and 4 seats; repeat direct/automatic and forced-relay configurations.
For cross-browser coverage, rotate host responsibility among installed Chrome,
Firefox and Safari. Record unavailable browsers as gaps, never passes.

| ID | Procedure | Required result and evidence |
| --- | --- | --- |
| M01 | Join distinct seats using the normal private invite UI; ready every living seat; submit legal orders and resolve 10 weeks. Repeat each player count three times. | All expected host–guest channels open reliably and ordered; no guest–guest simulation channel; all guests reach the same public turn/revision and their correct filtered views. Record each attempt, including failures and time to ready. |
| M02 | Repeat M01 with the relay build on every device. Inspect the selected ICE candidate pair using browser WebRTC diagnostics or `RTCPeerConnection.getStats()` instrumentation. | Every host–guest connection has a selected relay candidate; record UDP/TCP/TLS where available. Merely seeing a configured TURN URL or an unused relay candidate is not a pass. Instrumentation exposing safe candidate statistics remains to be added if browser diagnostics are unavailable. |
| M03 | On a new test client, attempt an uninvited room, another room's scoped credential, an expired credential and a revoked identity. Then attempt a wrong seat capability through the game handshake. | Provider denies room access at its boundary; host separately denies seat impersonation. A host denial alone does not prove provider room isolation. Current shared-key mode cannot satisfy provider per-player isolation. |
| M04 | Obtain a short test lifetime from the selected managed issuer. Record issuance/expiry without recording the token. Test a fresh signaling connection and a fresh forced-relay allocation immediately before and after expiry. | Fresh use after expiry is rejected; authorized renewal produces new scoped credentials without a permanent secret in browser storage. Record behavior of already-established allocations separately, including documented grace periods; do not assume expiry instantly closes an existing channel. |
| M05 | Interrupt one guest before command acceptance, after host acceptance but before its receipt, and after committed resolution. Rejoin using the same saved seat identity. | Pending commands retry once through normal validation; accepted IDs never spend stock/operations twice. Resolved commands remain committed. Wrong credentials fail, and superseded peers cannot send orders. Capture command IDs, receipt outcomes and revisions only. |
| M06 | Interrupt a large guest snapshot mid-transfer; reconnect. Deliver delayed old-connection fragments and, using a bounded test harness, an older same-revision transfer after a newer one. | No partial view renders; retired connections and decreasing transfer ordinals cannot replace the newer view. A fresh authenticated welcome synchronizes the seat. Local mock evidence exists; managed-network fault injection still requires an external harness/test session. |
| M07 | Close or suspend the host during planning and after a committed checkpoint. Attempt guest orders, then reopen the host from the saved checkpoint and create a new room. | Guests report stopped/unavailable host, not continuing simulation. Restored host preserves committed state, assignments' credentials and deduplication history; guests use the new invite and saved seat capability. Uncommitted plans may need re-entry. No seamless migration claim. |
| M08 | Disconnect one ready guest; attempt host resolution, wait through connection timeout, then reconnect. Try an incompatible rules/save version separately. | Resolution pauses until all living seats reconnect and commit. Rejoin restores the original seat; mismatches receive actionable rejection and cannot silently migrate an active game. Record actual timeout and recovery duration. |
| M09 | Compare each guest snapshot/export/log against a host-controlled hidden unit, enemy cargo/route and private production queue. Attempt malformed, stale and repeated commands through the test harness. | Hidden data stays absent from every guest surface; malformed/unauthorized inputs change no authoritative resources. Rate-limited peers cannot amplify broadcasts indefinitely. Host checkpoints must never be used as guest exports. |
| M10 | Revoke the test key/authorization, exhaust a deliberately low test quota, and disable TURN on the isolated project. Restore configuration afterward. | Actionable setup/quota/revocation errors, cleanup and bounded retries; local single-player remains available. No silent fallback to permanent TURN credentials or assertion of relay coverage after STUN-only connection. Requires separately authorized provider configuration changes. |

The existing `tests/browser/multiplayer.spec.ts` is a **local WebRTC regression
suite**, not an executable remote-provider certification harness. Remote fault
injection and safe per-peer statistics capture are remaining test tooling. Do
not replace these matrix rows with its six passing local cases.

### Evidence and acceptance

For each run record: matrix ID, player count, artifact/version, UTC interval,
browser/device/network categories, signaling mode, selected candidate types,
expected result, actual result, sanitized log/screenshot locations, and
PASS/FAIL/BLOCKED. Keep initial failures and root-cause fixes alongside reruns.
Use the existing `docs/reports/runtime/` report location; do not create `output/`.

The gate closes only when the static-owner authorization mechanism is verified
and implemented, all required remote rows have recorded passes, and unresolved
browser/network combinations are explicitly accepted or remain open. Until then,
state the narrower result: local WebRTC and recovery are tested; managed adapter
code exists; provider authorization, real relay reliability and credential
lifecycle remain blocked/unverified.
