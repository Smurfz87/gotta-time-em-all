# Interval mode overflow behaviour is session-level configurable

When a participant in Interval mode has not completed their Rep before their Pace Group's send-off
resets, they enter Overflow. Their personal timer continues until they tap; the question is what
happens to their next Rep's send-off countdown.

Three options are offered, selected once per session before start and applied uniformly to all groups:

- **Rejoin** — the participant's next Rep is measured from the group's last reset, which already
  occurred. They effectively have less time than the full send-off and must keep up with the group.
- **Reset** — the participant gets a fresh full send-off starting from the moment they tap. They
  fall behind the group's rhythm but are not penalised with extra difficulty.
- **Reset + buffer** — same as Reset, plus a trainer-configured number of extra seconds. Gives
  struggling participants guaranteed rest before their next Rep.

We chose configurability rather than a single fixed behaviour because the right answer depends on
the coaching context. Rejoin reflects competitive training ("you missed the wall, you still go on
the next one"). Reset suits recreational or mixed-ability groups where the goal is completing the
workout, not enforcing pace. Reset + buffer was specifically requested for a masters group where
maintaining effort over many reps matters more than hitting exact intervals.

Config is session-level (not per group) to limit setup complexity — in practice, a trainer who
wants different overflow rules for different groups is rare, and would simply run two separate
sessions. Config is locked once the session starts to prevent ambiguity in recorded Rep times
(was a Rep measured against the old or new overflow rule?).

The alternative of a single fixed behaviour (Reset was the natural default) would have required
the trainer to adapt their coaching approach to the app rather than the other way around.