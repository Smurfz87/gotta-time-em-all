# gotta-time-em-all

A mobile-first sports timing app for coaches and trainers. Time multiple participants simultaneously, record splits, and review results — all from a phone, no account required.

**Live:** https://smurfz87.github.io/gotta-time-em-all/

---

## Timing modes

**Heat mode** — All participants start together and stop individually when they finish. Run multiple heats in one session; results are saved as a grouped entry in the archive with a per-participant best-time grid.

**Lap mode** — A continuous timer runs while you record splits independently per participant at any moment. Each participant has a Lap button (record split) and a Stop button (freeze their timer).

**Interval mode** — Participants are split into pace groups, each with a rolling countdown (send-off). Tap a participant when they finish each rep. Overflow behaviour when someone misses their send-off is configurable: rejoin the group, get a fresh send-off, or get a fresh send-off with extra rest.

**Rest mode** — All participants start together. Tap each participant when they finish a rep — a personal rest countdown begins, then their next rep starts automatically.

---

## Features

- **Saved rosters** — Create named participant lists and load them before a session. Changes to the active session don't affect the saved roster (template model).
- **QR roster transfer** — Share a participant list as a QR code; scan it on another device to import.
- **Session persistence** — Timer state survives page refresh. Resume exactly where you left off.
- **Archive** — Every committed session is stored locally. Browse history, export individual results as CSV, or export/import the full archive as JSON.
- **Works offline** — No server, no account. Everything lives in localStorage.

---

## Development

```bash
npm install
npm run dev       # dev server at localhost:5173
npm test          # unit tests (vitest)
npm run build     # production build → dist/
```

### Project structure

```
src/
├── lib/          # shared components and utilities
│   ├── storage.js       # localStorage read/write
│   ├── sessionLogic.js  # pure session state machine (no Svelte, fully unit-tested)
│   ├── session.svelte.js # reactive session store (wraps sessionLogic)
│   ├── timer.js         # pure timer arithmetic
│   ├── csv.js           # CSV export logic
│   ├── time.js          # elapsed time formatting
│   ├── utils.js         # getInitials, avatarColor etc.
│   └── *.svelte         # shared UI components
└── routes/
    ├── +page.svelte          # main timer screen
    ├── settings/             # settings + QR share/scan
    ├── rosters/              # saved roster management
    └── history/              # archive list + detail view
```

### Docs

- `CONTEXT.md` — domain glossary (canonical terms for the codebase)
- `docs/adr/` — architecture decision records

---

## License

PolyForm Noncommercial 1.0.0 — free for non-commercial use with attribution.
Commercial use requires a separate licence. See [LICENCE](LICENSE) and [NOTICE](NOTICE) for details.