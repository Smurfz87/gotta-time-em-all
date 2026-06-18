# sessionLogic.js accepts explicit timestamps and never calls Date.now() internally

All pure session logic lives in `sessionLogic.js`. Functions that deal with time — starting
timers, recording reps, advancing countdowns, building archive entries — receive a timestamp `t`
as an explicit parameter. No function in `sessionLogic.js` calls `Date.now()` directly.

The immediate motivation was testability. Svelte 5's reactive runtime (`$state`, `$effect`,
`$derived`) cannot run in a Vitest environment, so session logic that lives in `.svelte.js` files
cannot be unit-tested without a full browser. Extracting the logic into a plain JS module solves
the import problem — but only if the module does not reach for wall-clock time on its own. A
function that calls `Date.now()` internally cannot be given a controlled timeline in a test; the
test must real-wait or mock a global, both of which are fragile.

With explicit timestamps, every behaviour can be exercised by passing the right `t`. A test can
simulate a participant finishing exactly at the send-off boundary, or 1ms past it, or 30s into
a rest period — all by controlling the value of `t`. The 102 unit tests in `sessionLogic.test.js`
rely entirely on this property.

The constraint is a rule that lives outside the code — nothing in the module enforces it. The
risk is that a future contributor adds a helper that calls `Date.now()` and the tests continue to
pass (because the new helper is not itself tested with a controlled clock), masking a latent
correctness problem. The mitigation is this ADR: the rule should be knowable from the record, not
inferred from the pattern.

The callers in `session.svelte.js` sample `Date.now()` once at the point of user interaction or
ticker tick, then pass that value through to the pure functions. Reactive state (`$state.snapshot`)
is also snapshotted at the call site before being handed to pure functions, keeping the boundary
between reactive and pure code explicit.