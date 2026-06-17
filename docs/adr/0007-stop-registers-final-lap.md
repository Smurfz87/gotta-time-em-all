# Stop registers a final lap in Lap mode

In Lap mode, tapping Stop on a participant automatically records a final lap entry at the moment of stop.
The final lap's `cumulative` equals the participant's total elapsed time; `gap` is the time since their
last recorded lap (or the full elapsed time if no laps were recorded).

We chose this because the trainer's workflow is to tap Lap at each intermediate split and Stop when the
participant finishes. Without an automatic final lap, the result set would be incomplete: the time between
the last split and the finish would exist only as the difference between the last cumulative and the total
elapsed — a calculation the trainer has to do manually. Recording it automatically makes the lap table
self-contained for both display and CSV export.

The trade-off is that Stop is no longer a "freeze only" action in Lap mode — it also writes data. This
is consistent with Heat mode's semantics (Stop = final result), and the final lap is visually indistinct
from any other lap in the table, which is intentional.