# Rest mode rep start is anchored to the scheduled rest boundary, not the tick time

When a participant's rest countdown expires and they transition back to the `effort` state,
their new `repStartedAt` is set to `restEndsAt` — the scheduled end of the rest period — rather
than to `t`, the timestamp of the tick that detected the expiry.

The timer runs on a 50ms interval, so `t` can be anywhere from 0 to ~50ms after `restEndsAt`.
If `repStartedAt = t`, that jitter accumulates: after several reps, a participant's elapsed times
are inflated by the sum of all the tick delays that fell on their rest boundaries. With ten reps
and an average 25ms overshoot per boundary, the final elapsed is already 250ms longer than the
true effort time — a meaningful error in a sport where hundredths of a second matter.

Anchoring to `restEndsAt` eliminates the drift entirely. The rest period ends exactly when it was
scheduled to end. The next rep starts from that precise boundary. Tick timing only affects how
quickly the UI reflects the transition, not the underlying time values.

The trade-off is a small inaccuracy in the opposite direction: if the tick fires 30ms late, the
participant's elapsed starts counting 30ms before the UI shows them as active. In practice this
is invisible — the trainer is not watching the hundredths digit at the moment of rest expiry.
The alternative (real tick time) compounds over many reps in a way that is eventually noticeable
and has no clean remedy other than retroactive correction.

The same principle governs the interval mode boundary — `repStartedAt` for participants
re-entering `active` from `resting` is set to the group cycle boundary
(`intervalSessionStart + currentCycle * sendOff`), not to the tick time.