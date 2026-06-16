# Mode is fixed for the lifetime of a session

A session's mode (Heat or Lap) is chosen at creation and cannot be changed while a heat is in progress. Switching
modes clears the session history and requires explicit confirmation.

We chose this because the two modes produce incompatible state shapes — Heat mode records one elapsed time per
participant per heat; Lap mode records an ordered list of splits. Allowing a mid-session switch would require either
silently discarding live timer state or translating between the two models, both of which are likely to surprise the
trainer at the worst possible moment (mid-practice). Locking the mode makes the constraint explicit and visible: the
toggle in the top bar is disabled once a heat starts.

The trade-off is that a trainer who picks the wrong mode must start a new session. In practice the mode is known
before practice begins, so this is accepted friction.