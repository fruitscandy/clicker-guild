# ASSET-01: 전투 에셋 manifest 인입

- status: blocked
- owner: 미지정
- branch: `codex/asset-manifest-ingest` 권장
- base: 전투 계정의 인계 커밋과 `FOUNDATION-01` 인계 커밋
- paths-owned: `public/assets/**`, `src/assets/**`, `tests/assets/**`, `docs/asset-register.md`
- paths-readonly: `docs/experimental-asset/**`, `src/integration/combat/**`, 전투 계정의 원본 작업 경로
- started: 미시작
- updated: 2026-08-09
- depends-on: `COMBAT-01`의 브랜치·런타임 에셋·manifest 인계
- acceptance: 모든 런타임 에셋이 ID로 로드되고 경로·크기·anchor·facing·프레임 durations를 검증하며, 누락 에셋은 대체 이미지로 처리한다.
- handoff: 다른 계정의 전투 결과가 아직 로컬 또는 원격 브랜치로 전달되지 않아 시작 금지
