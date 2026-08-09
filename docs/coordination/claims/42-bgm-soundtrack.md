# Issue #42 · Scene BGM soundtrack

- owner: `@fruitscandy`
- base: `abab196b80aa73d0881e1f70cbaeb8663d389369`
- branch: `codex/bgm-soundtrack`
- worktree: `.codex-worktrees/bgm-soundtrack`
- owned: `app/page.tsx`, `app/audio-settings.ts`, `app/battle-audio.ts`, `app/bgm/**`, `app/bgm-preview/**`, `public/assets/audio/bgm/**`, `scripts/generate-bgm.mjs`
- readonly: `app/Game.tsx`, `app/globals.css`, `app/stage-map/**`, `app/layout.tsx`, `app/weapon-audio.ts`, `public/assets/audio/weapons/**`, `tests/**`
- acceptance: four original loopable tracks, finalized `Steel Rush` battle theme, scene-aware crossfades, persistent BGM/SFX controls, preview page, lint/build/browser playback validation
- integration: PR #34 owns `app/weapon-audio.ts`; connect weapon sounds to the shared settings event after that PR merges.
