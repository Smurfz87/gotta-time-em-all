// Compute elapsed ms, safely handling null startedAt (paused state).
// When startedAt is null the timer is paused — return elapsed as-is.
export function computeElapsed(elapsed, startedAt, now) {
  return elapsed + (startedAt ? now - startedAt : 0)
}

// Compute a new lap entry for a timer at time `now`.
export function makeLap(laps, elapsed, startedAt, now) {
  const cumulative = computeElapsed(elapsed, startedAt, now)
  const prev = laps[laps.length - 1]
  const gap = prev ? cumulative - prev.cumulative : cumulative
  return { number: laps.length + 1, cumulative, gap }
}
