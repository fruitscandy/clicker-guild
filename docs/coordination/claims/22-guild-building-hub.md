# #22: 길드 건물 허브와 연구 해금 구조 개선

- status: active
- owner: @oakdongu-del
- branch: codex/guild-building-hub
- base: e0384f0 (origin/main after PR #25)
- paths-owned: app/guild-hub/**, app/Game.tsx 길드 관리·전투 커서 구간, app/globals.css 길드 시설·커서 스타일, public/assets/guild/forge/**, tests/rendered-html.test.mjs
- paths-readonly: app/stage-map/**, app/game-data.ts, docs/experimental-asset/**
- updated: 2026-08-09T14:21:38+09:00
- acceptance: 시설별 콘텐츠, 본관 연구 잠금, 4방향 연구 지도에 더해 길드 타운용 불꽃 대장간 아트, 15단계 무기 전시·제작 UI, 장착 무기의 전투 포인터 연동, 기존 저장 호환을 제공한다.
- handoff: PR #18과 #25 병합 변경을 보존해 최신 main으로 리베이스했다. lint/test 재검증 후 PR #23을 병합한다.
