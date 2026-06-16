# Heat mode participant stop is final

In Heat mode, stopping a participant's timer is a one-way transition: `running → stopped`. There is no restart.
Lap mode has no such constraint — participants can be stopped individually at any time.

We chose this because a Heat models a race or a single timed effort. The result for a participant is the elapsed
time at the moment they cross the finish line; allowing a restart would make the recorded result ambiguous (which
run counts?). Enforcing finality also simplifies the heat results grid, which assumes exactly one result (or DNF)
per participant per heat.

The trade-off is that a trainer who taps Stop by mistake cannot undo it within the same heat. They must record
the heat as-is and start a new one. This was accepted on the basis that Lap mode exists for scenarios where
participants need to be tracked across multiple efforts without a hard stop.
