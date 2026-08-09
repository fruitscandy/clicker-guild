# Clicker Guild

길드원을 모으고 성장시키며 10개 지역을 진행하는 모바일 우선 클릭커 RPG의 웹 MVP입니다.

## 개발 환경

- Node.js 24.14.0 권장 (`.node-version`)
- 최소 Node.js 20.19
- pnpm

```text
pnpm install
pnpm dev
pnpm test
pnpm build
```

이 PC의 시스템 Node.js가 아직 16이면 일반 `pnpm` 스크립트 대신 최신 Node 환경으로 전환해야 합니다. Codex 작업에서는 번들 Node.js 24.14.0으로 전체 검증을 통과했습니다.

## 현재 구현

- Vite + TypeScript 웹 골격
- 1~100 스테이지 ID와 1지역 밸런스 공식
- 길드원 등급, 강화 비용, 성장 배율과 1지역 확정 영입표
- 저장 v1, 값 보정, 버전 마이그레이션, 주 저장·백업 복구
- 비전투 앱과 전투 세션 사이의 타입 계약
- 결정론적 승리·패배·중단 가짜 전투와 결과 중복 방지

아직 실제 전투 화면과 비전투 UI를 연결하지 않았습니다. 다른 사용자 계정의 전투 그래픽·스킬 작업은 별도 브랜치에서 진행 중입니다.

## 새 작업 시작

새 사람 또는 Codex 세션은 사용자 설명을 기다리지 말고 다음 순서로 시작합니다.

1. `AGENTS.md`를 읽습니다.
2. `docs/coordination/claims/`에서 활성·차단·준비 작업을 확인합니다.
3. GitHub 열린 이슈와 PR에서 다른 계정의 진행 경로를 확인합니다.
4. 다른 활성 작업과 겹치지 않는 `ready` 티켓을 자기 계정에 할당합니다.
5. 독립 브랜치/worktree와 새 claim 파일에서 작업합니다.

현재 다음 구현 후보는 `UI-01`입니다. 상세 우선순위는 `docs/planning/parallel-execution-board.md`에 있습니다.

## 주요 문서

- `docs/planning/mvp-gap-audit.md`: MVP 공백과 구현 티켓
- `docs/planning/progression-economy-save.md`: 성장·경제·저장 규칙
- `docs/planning/implementation-integration-blueprint.md`: 전투·에셋 통합 계약
- `docs/coordination/README.md`: 두 계정과 다중 세션 조율 규칙
- `docs/coordination/ONBOARDING.md`: 각 개발자·PC·GitHub·Codex 최초 1회 설정과 검증
