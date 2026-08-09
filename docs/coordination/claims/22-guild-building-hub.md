# #22: 길드 건물 허브와 연구 해금 구조 개선

- status: active
- owner: @oakdongu-del
- branch: codex/guild-building-hub
- base: 9ddab46
- paths-owned: app/guild-hub/**, app/Game.tsx 길드 관리 구간, app/globals.css 길드 시설 스타일, tests/rendered-html.test.mjs
- paths-readonly: app/stage-map/**, app/game-data.ts, docs/experimental-asset/**
- updated: 2026-08-09T00:00:00+09:00
- acceptance: 길드 건물을 선택하면 해당 콘텐츠만 아래에 열리고, 본관 레벨이 연구 깊이를 제한하며, 연구 지도가 중앙에서 네 방향으로 확장되고, 기존 저장 데이터가 보존된다.
- handoff: GitHub 연결 복구 시 Issue #22의 CLAIM 댓글에 확장 소유 경로와 검증 결과를 반영한다. PR #18의 app/Game.tsx 통합 변경과 최신 main을 재확인한 뒤 PR을 생성한다.
