# #32: 15종 무기 클릭 공격 단계별 사운드

- status: active
- owner: @oakdongu-del
- branch: codex/weapon-attack-audio
- base: ff8387b
- paths-owned: app/WeaponAttackAudio.tsx, app/weapon-audio.ts, app/layout.tsx 오디오 마운트 구간, tests/weapon-audio.test.mjs, docs/coordination/claims/32-weapon-attack-audio.md
- paths-readonly: app/Game.tsx, app/battle-audio.ts, app/battle-loot.ts, app/globals.css, app/guild-hub/**, tests/rendered-html.test.mjs
- updated: 2026-08-09T15:46:03+09:00
- acceptance: 15종 고유 프로필, 단계별 레이어 강화, 전장/수동 클릭 연동, 자동·전리품 사운드 분리, lint/test/build 및 브라우저 검증
- handoff: 전리품 오디오 작업 #31과 경로를 분리해 독립 Web Audio 엔진으로 구현했다. PR #29와 #33 병합 후 최신 main으로 리베이스했으며 12개 오디오·재료 테스트, lint, build, 5개 렌더 테스트와 실제 브라우저 6·15단계 재생을 검증했다.
