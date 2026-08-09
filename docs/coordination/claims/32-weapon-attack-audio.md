# #32: 15종 무기 클릭 공격 단계별 사운드

- status: active
- owner: @oakdongu-del
- branch: codex/weapon-attack-audio
- base: ff8387b
- paths-owned: app/WeaponAttackAudio.tsx, app/weapon-audio.ts, app/layout.tsx 오디오 마운트 구간, public/assets/audio/weapons/**, tests/weapon-audio.test.mjs, docs/coordination/claims/32-weapon-attack-audio.md
- paths-readonly: app/Game.tsx, app/battle-audio.ts, app/battle-loot.ts, app/globals.css, app/guild-hub/**, tests/rendered-html.test.mjs
- updated: 2026-08-09T16:52:00+09:00
- acceptance: 시각 테마와 무관한 15단계 검 타격 성장, CC0 실녹음 기반 칼날·금속·중량·울림 레이어, 빠른 반복 변주와 클리핑 제어, 전장/수동 클릭 연동, 자동·전리품 사운드 분리, lint/test/build 및 브라우저 검증
- handoff: 사용자 피드백에 따라 테마형 합성음을 폐기하고 Kenney CC0 RPG Audio·Impact Sounds 실녹음 15개를 사용하는 단계형 검 타격 엔진으로 전면 교체했다. 오디오·전리품·재료 테스트 13/13, lint, build, 렌더 테스트 5/5를 통과했고 개발자 모드에서 1·5·10·15단계 실재생과 브라우저 오류 0건을 확인했다.
