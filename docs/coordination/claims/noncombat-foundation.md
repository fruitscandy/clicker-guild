# FOUNDATION-01: 비전투 웹 기반·성장·저장·전투 계약

- status: completed
- owner: 현재 사용자 계정의 메인 세션과 서브에이전트 3개
- branch: `codex/noncombat-foundation`
- base: `2bcc651`
- paths-owned: 루트 웹 골격, `src/domain/**`, `src/content/**`, `src/services/save/**`, `src/integration/combat/**`, 해당 테스트, `docs/planning/**`, `docs/coordination/**`
- paths-readonly: `docs/experimental-asset/**`, 다른 PC가 인계할 전투 화면·그래픽·스킬 경로
- started: 2026-08-09
- updated: 2026-08-09 11:03 +09:00
- depends-on: 다른 PC 전투 결과물은 최종 연결 단계에서만 필요
- acceptance: 웹 골격 빌드, 성장 계산·저장 복구·가짜 전투 계약 테스트 통과, 전투 PC 인계 기준 확정
- handoff: Vite+TypeScript 골격, 성장·경제 계산, 1지역 영입표, 저장 v1·백업 복구, 전투 계약·가짜 전투 구현 완료. 번들 Node 24.14.0에서 TypeScript 검사, Vitest 78개, Vite 프로덕션 빌드 통과. 다음 작업은 `UI-01`.
