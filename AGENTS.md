# Clicker Guild 병렬 작업 규칙

이 파일은 저장소 전체에 적용된다. 새 Codex 세션은 별도 설명이 없어도 작업 전에 이 파일과 `docs/coordination/README.md`를 끝까지 읽고 따른다.

## 공용 기억

- 서로 다른 사용자 계정과 PC의 Codex 대화 기록은 자동 공유되지 않는다.
- GitHub Issue, Pull Request, Actions, Project, Discussion을 세션 간 공용 기억으로 사용한다.
- 현재 상태는 대화나 오래된 문서보다 GitHub의 열린 Issue/PR과 최신 `origin/main`을 우선한다.
- Issue는 작업·담당·상태, PR은 코드와 검토, Discussion #1은 여러 작업에 걸친 질문·결정·인계에 사용한다.
- `docs/coordination/claims/`는 GitHub 접근이 일시적으로 불가능할 때 쓰는 보조 기록이며, 원격 상태보다 우선하지 않는다.

## 새 세션 시작 프로토콜

파일을 수정하기 전에 반드시 다음을 수행한다.

1. 이 파일과 `docs/coordination/README.md`를 읽는다.
2. `git status --short --branch`, 현재 브랜치, 최신 커밋과 `origin/main`을 확인한다. 사용자 변경은 덮어쓰거나 되돌리지 않는다.
3. GitHub의 열린 Issue, PR, 실패한 Actions, Discussion #1의 최신 질문과 인계를 확인한다.
4. `status:in-progress` 작업과 열린 PR의 수정 경로를 파악한다.
5. 사용자가 특정 작업을 지정하지 않았다면, 선행 조건이 끝난 `status:ready` 작업 중 경로가 겹치지 않는 가장 높은 우선순위 하나를 고른다.
6. 구현 전에 Issue를 자기 계정에 할당하고 `status:in-progress`로 바꾼 뒤, 기준 커밋·브랜치·수정 경로를 댓글로 남긴다.
7. 최신 `origin/main`에서 작업별 `codex/<짧은-작업명>` 브랜치 또는 별도 worktree를 만든다.

이슈를 선점할 GitHub 쓰기 권한이 없거나 소유 경로가 겹치면 임의 구현을 시작하지 않는다. 대신 읽기 전용 조사·재현·검토를 수행하고 필요한 권한 또는 인계를 보고한다.

## 병렬 작업 원칙

1. 하나의 Issue는 하나의 브랜치와 한 명의 명시적 담당자를 가진다.
2. 두 활성 작업이 같은 파일을 동시에 수정하지 않는다.
3. `package.json`, 잠금 파일, 앱 진입점, 공용 타입·스키마, 배포 설정은 통합 작업으로 취급한다.
4. 범위가 넓어지면 먼저 Issue의 소유 경로를 갱신하고 충돌 여부를 다시 확인한다.
5. `docs/experimental-asset/**`의 원본과 다른 작업자가 생성 중인 그래픽·애니메이션은 명시적 인계 없이 덮어쓰지 않는다.
6. 다른 작업 결과가 필요하면 관련 Issue를 `status:blocked`로 바꾸고 Discussion #1에서 상대 계정을 멘션한다. 기다리는 동안 겹치지 않는 Ready 작업만 진행한다.
7. 긴 작업은 시작, 설계 변경, 차단, 테스트 완료, 인계 시점에 Issue/Discussion을 다시 확인하고 상태를 갱신한다.
8. 메인 브랜치에는 검증되지 않은 중간 상태를 직접 올리지 않고 PR로 통합한다.

## GPT Work 요청 처리

- 버그·개선 제보: 중복을 검색한 뒤 피드백 Issue 또는 기존 Issue 댓글로 기록한다.
- 다음 작업 요청: Issue·PR·CI·Discussion을 확인하고 충돌 없는 Ready Issue를 선점한다.
- 상황 확인 요청: 진행 중, 리뷰 대기, 차단, CI 실패, 다음 Ready 작업을 요약한다.
- 검토 요청: 해당 PR의 변경, 테스트, 리뷰 댓글과 미해결 항목을 확인한다.
- 장기 설계 질문: Discussion #1에 관련 Issue/PR, 기준 커밋, 선택지, 추천안을 남긴다.

## 작업 종료 프로토콜

1. 변경 위험에 맞춰 `npm run lint`, `npm test`, `npm run build` 중 필요한 검증을 실행한다.
2. PR에 Issue, 기준 커밋, 수정 경로, 검증 결과, 알려진 문제와 인계 내용을 적는다.
3. Issue 상태를 `status:review`로 바꾸고 PR을 연결한다.
4. 병합 후 Issue를 닫거나 `status:done`으로 정리한다.
5. 후속 작업이 있으면 별도 Ready Issue로 만들고, 대화에만 남기지 않는다.

## 완료 보고 형식

- 담당 Issue와 목표
- 변경 경로
- 실행한 검증과 결과
- 통합 또는 인계 시 필요한 조치
- 알려진 문제와 다음 Ready 작업
