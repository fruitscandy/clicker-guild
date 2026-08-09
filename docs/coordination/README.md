# Clicker Guild 세션 조율 시스템

이 폴더는 서로 다른 Codex 작업과 서로 다른 사용자 계정의 두 PC가 대화 기록을 공유하지 않아도 현재 진행 상황과 파일 소유권을 알 수 있게 하는 저장소 기반 공용 기억이다. 두 계정 사이에는 Codex 세션 기록, 서브에이전트 메시지, 로컬 브랜치가 자동 공유되지 않는다고 가정한다.

## 정보의 우선순위

1. GitHub의 열린 이슈, PR, Actions, Discussions: 두 계정 사이에서 공유되는 최신 원격 상태, 검증 결과와 장기 판단
2. `claims/*.md`: 저장소에 기록된 작업 선점과 파일 소유권
3. `docs/planning/parallel-execution-board.md`: 우선순위와 선행 관계
4. 각 세션의 대화: 해당 세션 안에서만 유효한 임시 맥락

원격과 로컬 정보가 다르면 임의로 덮어쓰지 말고 더 최근인 기준 커밋과 담당자 상태를 확인한다.

## 두 계정의 원격 저장소 운영

권장 방식은 두 GitHub 계정을 같은 저장소의 협업자로 등록하고, 이슈·브랜치·PR을 계정별로 소유하는 것이다.

- 각 사람은 자기 GitHub 계정으로 작업 이슈를 선점한다.
- 동일한 브랜치를 두 사람이 공유하지 않고 계정별 작업 브랜치를 사용한다.
- 이슈 담당자와 PR 작성자가 실제 작업자를 나타내므로 `PC 1`, `PC 2`보다 계정 표시를 우선한다.
- Codex 작업이 바뀌어도 GitHub 계정, 이슈 번호, 브랜치와 claim으로 동일 작업을 추적한다.

두 번째 계정에 저장소 push 권한을 줄 수 없다면 해당 계정은 저장소를 fork하고, 원본 저장소의 이슈를 선점한 뒤 fork 브랜치에서 원본으로 PR을 연다. 이 경우 claim의 `branch`에 `<계정>/<fork>:<branch>`를 기록한다.

## Claim 파일 규칙

작업마다 `claims/<task-id>.md` 파일 하나를 사용한다. 여러 작업이 같은 claim 파일을 수정하지 않도록 작업 ID는 고유하게 만든다.

필수 필드:

```text
# <작업 ID>: <제목>

- status: ready | active | blocked | handed-off | completed
- owner: <PC/세션/담당자>
- branch: <브랜치 이름>
- base: <기준 커밋>
- paths-owned: <수정 가능한 경로>
- paths-readonly: <읽기만 가능한 경로>
- started: <ISO 날짜/시간 또는 미시작>
- updated: <ISO 날짜/시간>
- depends-on: <선행 작업 ID 또는 없음>
- acceptance: <완료 조건>
- handoff: <커밋, 검증, 알려진 문제 또는 없음>
```

## 작업 선점 절차

1. 모든 활성 claim과 열린 이슈/PR을 확인한다.
2. `parallel-execution-board.md`에서 선행 조건을 충족한 작업을 찾는다.
3. 다른 활성 작업과 수정 경로가 겹치지 않는지 확인한다.
4. 자기 claim을 `active`로 작성하고 독립 브랜치/worktree에서 작업한다.
5. 다른 PC가 claim을 볼 필요가 있으면 claim만 먼저 작은 커밋으로 push한다.

두 계정이 동시에 같은 `ready` 작업을 선점하는 경쟁을 피하려면, 먼저 GitHub 이슈를 자기 계정에 할당하고 `status:in-progress`로 바꾼 뒤 claim을 작성한다. 이슈 상태 변경에 실패하면 구현을 시작하지 말고 다른 티켓을 선택한다.

## 충돌 처리

- 동일 경로를 두 활성 claim이 소유하면 나중에 시작한 작업이 멈춘다.
- 누가 먼저인지 불분명하면 양쪽 모두 공용 파일을 수정하지 않고 통합 담당자에게 넘긴다.
- 전투 결과와 비전투 진행의 경계에서는 전투가 결과 근거만 반환하고, 보상·해금은 진행 시스템이 확정한다.
- 루트 설정, 패키지 잠금 파일, 앱 진입점, 공용 타입은 통합 담당자만 병합한다.

## GitHub 권장 라벨

- 상태: `status:ready`, `status:in-progress`, `status:blocked`, `status:review`
- 영역: `area:combat`, `area:graphics`, `area:progression`, `area:save`, `area:ui`, `area:integration`, `area:qa`
- 우선순위: `priority:p0`, `priority:p1`, `priority:p2`
- 실행 위치: `pc:combat`, `pc:foundation`

GitHub 이슈 사용이 불가능한 세션도 claim 파일만으로 안전하게 작업할 수 있다. 단, 두 PC 사이 실시간 동기화는 push/fetch 주기에 의해 결정된다.

## GPT Work 중심 운용

두 개발자가 별도의 관리 도구를 직접 다루지 않아도 각자의 GPT Work에 자연어로 요청하면 된다.

- 피드백 등록: GPT가 중복 이슈를 검색하고 피드백 이슈 댓글 또는 새 이슈로 기록한다.
- 작업 시작: GPT가 열린 이슈·PR·Actions를 읽고 `ready` 작업을 자기 GitHub 계정에 할당한다.
- 작업 종료: GPT가 브랜치와 PR을 연결하고 테스트 결과, 알려진 문제, 다음 작업을 갱신한다.
- 상황 확인: GPT가 상태별 이슈, PR 리뷰 대기, CI 실패, 차단 관계를 요약한다.

GitHub Projects 보드는 사람이 한눈에 보는 화면으로만 사용하고, 에이전트의 실제 판단 근거는 이슈 본문·댓글·담당자·PR·Actions다. Projects를 사용할 수 없는 경우에도 Issues 검색 화면이 동일한 공용 인박스 역할을 한다.

GitHub Discussions는 여러 이슈에 걸친 설계 의견과 장기 작업 중 질문을 교환하는 게시판이다. 즉시 응답을 보장하는 채팅은 아니지만 `@mention`, 알림, Codex Automation의 주기 확인을 조합하면 서로 다른 계정의 에이전트가 작업 사이에 안전하게 의견을 이어갈 수 있다.

## 중앙 검토 에이전트

별도 서버를 구현하지 않고 Codex의 수동 세션 또는 Automation을 중앙 검토 역할로 사용한다.

중앙 검토가 수행할 일:

1. 피드백 수집 이슈의 새 댓글과 새 이슈를 읽는다.
2. 중복을 합치고 P0/P1/P2로 분류한다.
3. 선행 조건과 파일 소유 범위를 확인한다.
4. 독립적으로 실행할 수 있는 항목을 `ready`로 만든다.
5. 진행 중인데 업데이트가 없는 작업, 실패한 CI, 리뷰 대기 PR을 보고한다.

개발 에이전트는 중앙 검토가 정리한 이슈를 선점해 구현한다. 중앙 검토는 직접 기능 파일을 수정하지 않는다.
