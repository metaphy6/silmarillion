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
