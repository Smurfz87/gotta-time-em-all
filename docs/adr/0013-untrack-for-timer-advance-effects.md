# Timer-advance effects read `now` as tracked but mutate participant state via untrack()

The interval and rest cycle-advance logic runs inside `$effect` callbacks that read `now`
(a reactive `$state` value updated by a 50ms `setInterval`) and then mutate the participants
map in place. The mutation happens inside `untrack()`:

```js
$effect(() => {
  if (session.mode !== 'rest' || heatPhase !== 'running') return
  const t = now                       // tracked — effect re-runs when now changes
  untrack(() => {
    advanceRestTimers(restParticipants, session.restConfig, t)  // mutates in place
  })
})
```

Without `untrack()`, the effect would read `now` and write to `restParticipants` in the same
reactive scope. Svelte 5 detects the write, schedules another re-run, which reads `now` again,
writes again, and so on — an infinite reactive loop.

The alternative was to model the timer advance as a `$derived` value rather than an in-place
mutation. This would require the participants map to be a derived projection rather than mutable
`$state`, which conflicts with the shared-reference pattern used for localStorage persistence:
`restParticipants` is the same object reference as `session.restState.participants`, so mutations
flow automatically to the storage `$effect` without any additional wiring. Switching to derived
would require an explicit copy-and-replace on every tick, which is more expensive and severs the
shared-reference persistence chain.

`untrack()` is the standard Svelte 5 escape hatch for this pattern. The cost is that the mutation
is invisible to the reactive graph — if something else needs to react to individual participant
state changes it must read directly from `restParticipants`, not from a derived value. In
practice, the components that display participant state already do this (they receive
`restParticipants` as a prop and read it reactively).

The same pattern applies to `advanceIntervalCycles` in interval mode.