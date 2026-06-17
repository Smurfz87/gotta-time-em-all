# Heat session grouping via pendingHeats

Multiple heats within one session are accumulated in a `pendingHeats[]` array in memory and committed as a
single grouped Archive entry (a Heat Session) when the session ends, the mode switches, or "New session" is
tapped. The Archive entry has shape `{ type: 'heat', heats: [...], participants: [...], ... }`.

We chose this because the trainer mental model is "I ran a session with N heats, not N separate sessions".
Grouping makes the History list readable (one row per session, not one row per heat) and the detail view
meaningful (cross-heat grid showing every participant's progression). The alternative — one archive entry
per heat — produced a flat list that could not distinguish heats within a session from heats across sessions.

The trade-off is that results are only persisted when a session boundary is crossed. If the app crashes
mid-session, in-progress heat results are lost. This was accepted because `pendingHeats` is written to
localStorage on every state change via the session `$effect`, so only the current live heat (not yet
committed via "New Heat") is vulnerable to a crash.