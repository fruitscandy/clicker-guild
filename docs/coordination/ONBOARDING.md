# 두 개발자·두 계정 최초 1회 설정

이 절차는 각 개발자와 PC에서 한 번만 수행한다. 완료 후에는 각자 GPT Work에 자연어로 요청하면 에이전트가 GitHub 이슈·PR·Actions를 읽고 작업을 진행한다.

## 1. 저장소 소유자가 할 일

1. GitHub 저장소 `fruitscandy/clicker-guild`의 협업자 설정에서 다른 개발자의 GitHub 계정을 추가한다.
2. 다른 개발자가 초대를 수락했는지 확인한다.
3. 저장소의 Issues, Projects, Actions, Discussions가 활성화되어 있는지 확인한다.
4. 두 계정 모두 브랜치 push와 PR 생성이 가능한지 확인한다.

현재 공개 메타데이터 확인 결과 Issues와 Projects는 활성화되어 있으며, 2026-08-09에 Discussions도 활성화했다.

직접 push 권한을 주지 않을 경우 다른 개발자는 fork 후 PR 방식으로 작업한다. 빠른 병렬 개발에는 동일 저장소 협업자 방식이 권장된다.

## 2. 각 개발자의 Codex GitHub 연결

각 개발자는 자기 Codex 계정에서 자기 GitHub 계정을 연결한다. 다른 개발자의 인증을 공유하지 않는다.

1. Codex의 플러그인/앱/연결 설정에서 GitHub 연결을 연다.
2. 현재 연결이 다른 계정이면 연결을 해제하고 올바른 GitHub 계정으로 다시 승인한다.
3. 저장소 접근 범위에 `fruitscandy/clicker-guild`를 포함한다.
4. 승인 화면에 세부 권한이 표시되면 다음 작업을 허용한다.
   - 저장소 메타데이터 읽기
   - Contents 읽기/쓰기
   - Issues 읽기/쓰기
   - Pull requests 읽기/쓰기
   - Discussions 읽기/쓰기
   - Actions와 checks 읽기
   - 필요 시 실패한 Actions 재실행
5. GitHub 쪽 설치/승인 설정에서도 해당 저장소가 선택되어 있는지 확인한다.
6. 권한 변경 뒤 Codex가 요구하면 앱을 새로고침하거나 새 작업을 연다.

현재 계정의 연결은 저장소와 열린 이슈·PR 읽기는 성공하지만 이슈 생성이 `403 Resource not accessible by integration`으로 실패했다. Issues 쓰기 권한을 포함해 연결을 다시 승인해야 한다.

## 3. GitHub 연결 합격 검사

각 개발자는 자기 GPT Work에 다음을 한 번 요청한다.

```text
fruitscandy/clicker-guild GitHub 연결을 최초 점검해줘.
저장소 메타데이터, 열린 이슈, 열린 PR을 읽고,
[SETUP-CHECK] 제목의 임시 이슈를 생성한 뒤 댓글을 하나 추가하고 닫아줘.
Agent Coordination Discussion을 읽고 테스트 댓글을 하나 남긴 뒤 그 댓글 URL을 보고해줘.
브랜치나 코드는 변경하지 말고 성공/실패한 권한을 보고해줘.
```

합격 조건:

- 저장소 조회 성공
- 이슈 목록 조회 성공
- 임시 이슈 생성 성공
- 이슈 댓글 작성 성공
- 이슈 종료 성공
- Discussion 조회와 댓글 작성 성공

PR 쓰기 권한은 첫 실제 작업 브랜치에서 draft PR을 열 때 추가 확인한다. Actions 조회는 CI가 포함된 브랜치가 원격에 게시된 후 확인한다.

## 4. 각 PC의 로컬 개발 환경

1. 각자 저장소를 별도 폴더에 clone한다.
2. Git 사용자 이름과 이메일을 자기 GitHub 계정에 맞게 설정한다.
3. Node.js 24.14.0을 설치하거나 `.node-version`을 지원하는 버전 관리 도구로 선택한다.
4. pnpm 11.16.0을 준비한다.
5. 다음 검사를 실행한다.

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

6. 같은 브랜치를 두 PC에서 동시에 사용하지 않는다.

이 PC에는 시스템 Node.js 16이 남아 있지만 Codex 번들 Node.js 24.14.0으로 전체 검증을 통과했다. 일반 터미널에서 명령을 실행하려면 시스템 Node.js를 24.14.0으로 갱신하는 것이 좋다.

## 5. GitHub 현황판 최초 설정

저장소의 Projects에서 보드 하나를 만든다.

- 이름: `Clicker Guild MVP`
- 상태: Inbox, Ready, In progress, Review, Blocked, Done
- 권장 보기:
  - 전체 현황: 상태별 보드
  - 내 작업: 담당자별 필터
  - 피드백: `[FEEDBACK]` 제목 또는 feedback 라벨
  - 차단 작업: Blocked 상태
- 검토 대기: 열린 PR과 Review 상태
- 에이전트 토론: Agent Coordination Discussion 링크

가능하면 저장소에서 생성되는 새 Issue와 PR을 프로젝트에 자동 추가하는 GitHub Projects workflow를 켠다. 프로젝트 생성·자동 추가는 GitHub 웹 UI에서 최초 한 번만 설정하면 된다.

## 6. 중앙 검토 담당

두 계정 중 한 계정만 중앙 검토 담당으로 정한다. 두 계정이 동시에 티켓을 재분류하거나 배정하면 중복 작업이 생길 수 있다.

중앙 검토 담당의 GPT Work 또는 Codex Automation은 다음을 수행한다.

- 새 피드백과 이슈의 중복 확인
- P0/P1/P2 우선순위 분류
- 선행 조건과 파일 소유 범위 확인
- Ready/Blocked 상태 갱신
- 멈춘 작업, 실패한 CI, 리뷰 대기 PR 보고
- 독립 실행 가능한 이슈를 작업자 계정에 배정

중앙 검토 에이전트는 기능 코드를 직접 수정하지 않는다. 구현은 각 개발자의 별도 작업 세션이 이슈를 선점해 수행한다.

## 7. 평소 GPT Work 요청 예시

상황 확인:

```text
Clicker Guild GitHub 현황을 확인해서 진행 중, 검토 대기, 차단, 다음 Ready 작업을 요약해줘.
```

테스트 피드백:

```text
방금 테스트에서 1-2 클리어 뒤 보상이 두 번 지급됐어. GitHub에서 중복을 확인하고 재현 정보와 함께 P0 버그로 올려줘.
```

다음 작업:

```text
GitHub 이슈와 PR, CI를 확인하고 다른 계정의 작업과 겹치지 않는 Ready 이슈 하나를 선점해서 구현·테스트·draft PR까지 진행해줘.
```

중앙 검토:

```text
새 피드백, 열린 이슈, PR, 실패한 CI를 검토해 중복을 정리하고 우선순위와 차단 관계를 갱신해줘. 구현은 하지 마.
```

에이전트 간 질문:

```text
현재 작업 중 다른 계정의 판단이 필요한 내용을 Agent Coordination Discussion에 이슈·브랜치·선택지와 함께 질문하고 상대 계정을 멘션해줘. 답을 기다리는 동안 겹치지 않는 Ready 작업을 진행해.
```
