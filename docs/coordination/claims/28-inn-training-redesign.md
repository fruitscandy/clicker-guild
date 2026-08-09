# #28: 여관 통합 모집·파티 편성 개편

- status: active
- owner: @oakdongu-del
- branch: codex/inn-training-redesign
- base: b263f37 (origin/main after PR #23)
- paths-owned: app/guild-hub/TavernHall.*, app/guild-hub/GuildBuildingHub.*, app/guild-hub/guild-progression.ts, app/Game.tsx 여관 연동, app/globals.css 훈련장 잔여 스타일, public/assets/guild/tavern/**, tests/rendered-html.test.mjs
- paths-readonly: public/assets/guild-members/**, app/game-data.ts, app/stage-map/**, app/monster-assets.ts
- updated: 2026-08-09T15:30:00+09:00
- acceptance: 토벌 훈련장 콘텐츠와 영지 건물을 제거하고 여관에서 고용·보유 명부·4인 파티 편성을 모두 제공한다. 후보·파티·보유 초상화의 시각 크기를 통일하고 신규 여관 건물 아트와 정돈된 내부 패널 UI를 적용한다.
- handoff: 새 여관 건물 아트를 프로젝트에 연결했다. lint/build/test 및 브라우저에서 후보 크기·파티 편성·훈련장 제거를 검증한 뒤 PR #29를 갱신한다.
