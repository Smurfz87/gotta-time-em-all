# Rosters are one-way templates, not live-synced participant lists

Loading a Roster copies its participant list into the session. Subsequent changes to the session's
participants — adding someone, removing someone who didn't show up — do not affect the saved Roster.
The full Roster is available unchanged the next time the trainer loads it.

We chose the template model over live sync for two reasons. First, the described workflow is
explicitly one-way: the trainer loads a Roster, removes a participant who is absent that day, and
expects to find that participant back in the Roster the following session. Live sync would require
a deliberate "undo" action to restore a temporarily-removed participant, adding friction to the
most common adjustment. Second, live sync introduces ambiguity — any session-level change
(removing an absent swimmer, adding a guest) would silently mutate a shared template the trainer
may rely on across multiple groups.

An explicit "Save changes to Roster" action was considered as a middle ground but rejected. It
requires the trainer to remember to save when they do want permanent changes, and to remember not
to save when they don't — the wrong choice in either direction has consequences. The template model
removes the decision entirely: session changes are always temporary, Roster changes are always
explicit (via the Roster editing screen).

The trade-off is that if the trainer wants to permanently add a new participant, they must go to
the Roster page and edit the saved Roster directly rather than just adding to the active session.
This extra step was accepted as worth the clarity it buys.