# Svelte as UI framework

The app started as a vanilla Vite + JS scaffold but has non-trivial reactive state: per-participant running timers, heat
history, pause/resume across modes, and localStorage sync. Hand-rolling that in vanilla JS is feasible but verbose.

We chose Svelte over staying vanilla or using React/Vue because it compiles away entirely at build time (no runtime
overhead), its reactivity model maps directly onto timer state, and the Vite integration is a single plugin line. React
was rejected — its mental model (JSX, hooks) is a steeper curve for a backend developer new to frontend. Vue is a close
second but Svelte's compiled output is simpler to reason about for someone learning as they go.