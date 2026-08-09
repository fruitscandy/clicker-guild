# #67: 번개·토네이도·운석 자동 특수 공격

- status: handed-off
- owner: @oakdongu-del
- branch: codex/special-attack-research
- base: b94fc30
- paths-owned: app/special-attacks.ts, app/special-attack-controller.ts, app/SpecialAttackLayer.tsx, app/SpecialAttackLayer.module.css, app/special-attack-audio.ts, app/guild-hub/SpecialResearchPanel.tsx, app/guild-hub/SpecialResearchPanel.module.css, app/guild-hub/guild-progression.ts (special node support only), app/globals.css (special status selectors only), public/assets/vfx/special/**, tests/special-attacks.test.mjs
- paths-readonly: app/guild-hub/ResearchMap.tsx, app/guild-hub/ResearchMap.module.css, app/game-data.ts, app/game-balance.ts, app/battle-audio.ts
- updated: 2026-08-09T20:26:11+09:00
- acceptance: 특수 연구 노드 3종을 구매할 수 있고, 전투 중 주기적으로 번개·토네이도·운석이 자동 발동해 피해 및 감전·견인·경계 내 넉백 연출을 제공한다.
- handoff: 최신 main 병합 완료. 린트·프로덕션 빌드·전체 55개 테스트와 브라우저 전투 시각 검증을 통과했으며 PR 검토 대기 상태다.
