# #32: 15종 무기 클릭 공격 단계별 사운드

- status: active
- owner: @oakdongu-del
- branch: codex/weapon-attack-audio
- base: ab2964f
- paths-owned: app/WeaponAttackAudio.tsx, app/weapon-audio.ts, app/layout.tsx 오디오 마운트 구간, tests/weapon-audio.test.mjs, docs/coordination/claims/32-weapon-attack-audio.md
- paths-readonly: app/Game.tsx, app/battle-audio.ts, app/battle-loot.ts, app/globals.css, app/guild-hub/**, tests/rendered-html.test.mjs
- updated: 2026-08-09T16:00:00+09:00
- acceptance: 15종 고유 프로필, 단계별 레이어 강화, 전장/수동 클릭 연동, 자동·전리품 사운드 분리, lint/test/build 및 브라우저 검증
- handoff: 전리품 오디오 작업 #31과 경로를 분리해 독립 Web Audio 엔진으로 구현한다.
