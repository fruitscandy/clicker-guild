# QA-01: 전체 흐름·릴리스 스모크

- status: blocked
- owner: 미지정
- branch: `codex/release-smoke` 권장
- base: UI-01과 실제 전투 통합 커밋
- paths-owned: `tests/e2e/**`, `docs/release/**`, 테스트 실행 설정
- paths-readonly: 기능 구현 경로 전체
- started: 미시작
- updated: 2026-08-09
- depends-on: `UI-01` completed, `ASSET-01` completed, 실제 전투 어댑터 연결
- acceptance: 새 게임부터 1-1 승리·강화·저장 복원까지 스모크가 반복 통과하고, 같은 battleId 보상 중복이 없으며, 대상 환경 프로덕션 빌드와 수동 체크리스트가 통과한다.
- handoff: 없음
