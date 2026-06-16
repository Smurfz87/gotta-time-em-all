# SvelteKit over hash routing

The app needed multi-page navigation (timer, history, settings) and was initially a plain Vite + Svelte SPA with no
router. Two options were evaluated: a lightweight hash-based router (~20 lines of glue code) or migrating to
SvelteKit.

We chose SvelteKit because a backend is a realistic near-term plan (login, server-side history). SvelteKit's
server-side route guards and form actions are the right model for auth flows; bolting auth onto a pure client SPA
is awkward. Co-located API routes (`src/routes/api/`) also remove the need for a separate server repo and CORS
configuration. The migration cost from Vite + Svelte to SvelteKit is low when done early — primarily restructuring
files into `src/routes/` and swapping the Vite plugin — and increases as more hash-routing glue accumulates.

Hash routing was rejected because it would need to be unwound before adding any server-rendered or
server-authenticated routes, and it provides no path to co-located backend code.