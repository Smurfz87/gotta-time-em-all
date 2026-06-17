# gotta-time-em-all

A mobile-first sports timing SPA for coaches and trainers to record time across multiple participants.

## Language

**Participant**:
A person whose time is being recorded in a session. Can be added at any time, including mid-session. Can only be removed when no timer is running.
_Avoid_: Athlete, player, user, person

**Session**:
The current in-progress timing activity. Has a mode (Heat or Lap), a participant roster, and an active timer state. Mode is fixed for the lifetime of the session. "New session" resets the timer state and commits any in-progress results to the Archive, but keeps the participant roster. "Clear roster" removes all participants and clears the Archive. Mode switching also commits the in-progress state to the Archive before resetting.
_Avoid_: Event, workout, round

**Archive**:
The persistent cross-session list of all committed results. Each entry is either a Heat Session or a Run, tagged with a timestamp. Survives mode switches and new sessions. Displayed on the History page as a numbered list ordered by time. Entries can be deleted individually or all at once, exported as JSON or CSV, and restored via JSON import.
_Avoid_: History (as a variable name — conflicts with browser History API), log, record list

**Run**:
A committed Lap-mode result — one continuous Lap-mode session, containing all participants and their full set of lap splits. The Lap-mode counterpart to a Heat.
_Avoid_: Lap session, lap run, session result

**Heat mode**:
A timing mode where all participants start simultaneously and each stops individually when they finish. Produces one elapsed time per participant per heat. Results are displayed as a cross-participant grid (rows = heats, columns = participants), horizontally scrollable on mobile.
_Avoid_: Race mode, exercise mode, swim mode

**Lap mode**:
A timing mode where a continuous timer runs and splits are recorded independently per participant at any moment. Each participant has a Lap button (record split) and a Stop button (freeze their timer). The session timer continues until Pause all or session end.
_Avoid_: Split mode, continuous mode

**Lap**:
A split recorded for a participant in Lap mode, capturing cumulative time and the gap since the previous lap.
_Avoid_: Split, interval, record

**Elapsed time**:
Time displayed as `mm:ss.hh` (minutes, seconds, hundredths). The standard display format throughout the app.
_Avoid_: Duration, timestamp

**Heat**:
A single run within a Heat mode session — one start event followed by each participant's individual finish. Per-participant state is one-way: `running → stopped`. Multiple heats can occur within one session; the trainer advances explicitly via "New Heat".
_Avoid_: Exercise, race, round

**Heat Session**:
A group of one or more Heats committed together as a single Archive entry when a session ends or the mode is switched. Displayed in the History list as one row ("Heat Session N — X heats") and in the detail view as a grid (rows = heats, columns = participants). Pending heats accumulate in memory during a session and are only written to the Archive on commit.
_Avoid_: Heat group, session batch, heat set

**History**:
The page that lists all Archive entries, ordered newest-first. Provides navigation to individual entry detail views, and archive-level actions: JSON export, JSON import, and delete all.
_Avoid_: Log, records, results list
