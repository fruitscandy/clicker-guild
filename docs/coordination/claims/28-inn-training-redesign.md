# #28: 여관·훈련장 캐릭터 초상화 중심 개편

- status: active
- owner: @oakdongu-del
- branch: codex/inn-training-redesign
- base: b263f37 (origin/main after PR #23)
- paths-owned: app/guild-hub/TavernHall.*, app/guild-hub/TrainingGround.*, app/Game.tsx 여관·훈련장 연동, tests/rendered-html.test.mjs
- paths-readonly: public/assets/guild-members/**, app/game-data.ts, app/stage-map/**, app/monster-assets.ts
- updated: 2026-08-09T15:08:00+09:00
- acceptance: 여관 후보와 훈련 명부를 25종 실제 캐릭터 초상화 중심 반응형 UI로 개편하고, 고용·파티·저장 계약을 유지한 집중 훈련 성장을 제공한다.
- handoff: lint/build/test 완료. 후속 PR에서 모바일 레이아웃과 훈련 비용 밸런스를 리뷰한 뒤 병합한다.
