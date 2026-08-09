# 두 개발자·두 계정 최초 1회 설정

각 개발자와 PC에서 한 번씩 수행한다. 인증은 공유하지 않고 각자 자신의 GitHub 계정을 사용한다.

## 저장소 권한

1. 저장소 소유자가 두 번째 개발자를 collaborator로 추가하고 초대 수락을 확인한다.
2. Issues, Projects, Actions, Discussions 사용이 켜져 있는지 확인한다.
3. 두 계정 모두 브랜치 push, Issue 댓글·상태 변경, PR 생성이 가능한지 확인한다.
4. 직접 push 권한을 주지 않는 경우 두 번째 계정은 fork 브랜치에서 원본 저장소로 PR을 연다.

## 각 PC의 GitHub CLI

```powershell
gh auth login --web --git-protocol https
gh auth status
gh repo view fruitscandy/clicker-guild
```

기존 인증의 범위가 부족하면 자기 계정으로 다음 권한을 갱신한다.

```powershell
gh auth refresh -h github.com -s repo,project,workflow,read:org
```

Codex의 GitHub 앱 연결과 PC의 `gh` 로그인은 별도일 수 있다. 앱 쓰기가 제한되더라도 해당 PC의 `gh`가 정상 인증되어 있으면 에이전트가 명령줄을 통해 Issue·PR을 처리할 수 있다.

## 로컬 환경

1. 각 PC에서 저장소를 서로 다른 로컬 폴더에 clone한다.
2. Git 사용자 이름과 이메일을 실제 작업 계정에 맞춘다.
3. Node.js 22.13 이상을 설치한다. 최신 안정 버전을 사용해도 된다.
4. `main`에서 다음을 한 번 실행한다.

```powershell
npm ci
npm run lint
npm test
```

두 PC에서 같은 작업 브랜치를 동시에 사용하지 않는다.

## 합격 검사 프롬프트

각 개발자가 자기 GPT Work/Codex에 아래 요청을 한 번 실행한다.

```text
fruitscandy/clicker-guild의 AGENTS.md와 docs/coordination/README.md를 읽고 최초 연결을 점검해줘.
내 GitHub 계정, 저장소 읽기, 열린 Issue와 PR, Actions, Project, Discussion #1 읽기를 확인해줘.
[SETUP-CHECK] 임시 Issue를 생성하고 댓글을 하나 단 뒤 닫아 Issue 쓰기도 확인해줘.
코드와 브랜치는 변경하지 말고 성공/실패한 권한과 필요한 조치만 보고해줘.
```

합격 조건은 저장소·Issue·PR·Actions·Project·Discussion 읽기, Issue 생성·댓글·닫기이다. PR 쓰기는 첫 실제 작업에서 draft PR을 만들며 확인한다.

## 평소 요청 예시

```text
GitHub 현황을 확인해서 진행 중, 리뷰 대기, 차단, 다음 Ready 작업을 요약해줘.
```

```text
열린 Issue와 PR, CI, Discussion을 확인하고 다른 작업과 겹치지 않는 Ready Issue 하나를 선점해서 구현·테스트·draft PR까지 진행해줘.
```

```text
테스트 중 발견한 내용을 GitHub에서 중복 확인하고 재현 정보와 함께 피드백 Issue로 등록해줘.
```
