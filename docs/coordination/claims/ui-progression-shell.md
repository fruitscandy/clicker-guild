# UI-01: 비전투 화면과 진행 흐름 연결

- status: ready
- owner: 미지정 — 새 세션이 GitHub 이슈를 선점한 뒤 기록
- branch: `codex/ui-progression-shell` 권장
- base: `codex/noncombat-foundation`의 인계 커밋
- paths-owned: `src/ui/**`, `src/features/guild/**`, `src/features/stage/**`, `src/features/settings/**`, `tests/ui/**`, `tests/features/**`
- paths-readonly: `src/integration/combat/**`, `src/domain/**`, `src/services/save/**`, `docs/experimental-asset/**`, 다른 계정의 전투 경로
- started: 미시작
- updated: 2026-08-09
- depends-on: `FOUNDATION-01` completed
- acceptance: 새 게임/이어하기, 로비, 길드원 목록·강화·최대 4인 편성, 스테이지 선택, 가짜 전투 승패 결과와 1회 보상·해금, 설정·초기화를 하나의 흐름으로 실행하고 관련 테스트와 빌드를 통과한다.
- handoff: 없음
