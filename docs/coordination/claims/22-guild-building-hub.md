# #22: 길드 건물 허브와 연구 해금 구조 개선

- status: active
- owner: @oakdongu-del
- branch: codex/inn-training-redesign
- base: b263f37 (origin/main after PR #23)
- paths-owned: app/guild-hub/**, app/Game.tsx 길드 관리·전투 커서 구간, app/globals.css 길드 시설·커서 스타일, public/assets/guild/forge/**, tests/rendered-html.test.mjs
- paths-readonly: app/stage-map/**, app/game-data.ts, docs/experimental-asset/**
- updated: 2026-08-09T15:05:00+09:00
- acceptance: 시설별 콘텐츠, 본관 연구 잠금, 4방향 연구 지도, 불꽃 대장간·15단계 무기 연동에 더해 여관 후보와 훈련 명부를 25종 실제 캐릭터 초상화 중심 UI로 개편하고, 고용·파티·저장 계약을 유지한 집중 훈련 성장을 제공한다.
- handoff: PR #23 병합 후 최신 main 위에 후속 브랜치를 분리했다. 여관·훈련장 반응형 화면과 집중 훈련 밸런스를 후속 PR에서 리뷰한 뒤 병합한다.
