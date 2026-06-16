# Epoch timestamps for timer persistence

Timer state is stored with `startedAt` as an absolute wall-clock epoch (`Date.now()`) rather than a relative offset
or a boolean "is running" flag. Elapsed time is computed live as `accumulated + (now - startedAt)`.

We chose this because it means timers survive a page reload with zero adjustment — when the app restores from
localStorage, any `startedAt` value is still a valid epoch and the elapsed calculation just works. The alternative,
storing only accumulated milliseconds and a running flag, would require the app to pause all timers on unload and
resume them on load. That logic is fragile (unload events are unreliable on mobile) and fails the trainer scenario
where an accidental refresh should not interrupt a live heat.

The trade-off is that pause/resume arithmetic is more explicit: pausing adds `(now - startedAt)` to `accumulated`
and nulls `startedAt`; resuming sets a fresh `startedAt`. Code touching timers must respect this invariant.