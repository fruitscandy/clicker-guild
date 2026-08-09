# Clicker Guild 세션 조율

두 개발자와 여러 Codex 세션은 GitHub를 공용 작업판과 게시판으로 사용한다. 다른 계정의 Codex 세션과 직접 메시지를 교환할 수 있다고 가정하지 않는다.

## 어디에서 무엇을 확인하나

| 용도 | 기준 위치 |
|---|---|
| 해야 할 일, 우선순위, 담당자, 선행 조건 | GitHub Issues |
| 코드 변경, 테스트, 리뷰 | Pull Requests와 Actions |
| 한눈에 보는 진행 상황 | Clicker Guild MVP GitHub Project |
| 여러 Issue에 걸친 질문, 결정, 장기 인계 | Agent Coordination Discussion #1 |
| GitHub 접근 장애 시 임시 선점 | `docs/coordination/claims/` |

Project는 표시 화면이고, 에이전트가 실제로 판단할 때는 Issue 본문·댓글·담당자·라벨, PR과 Actions를 우선한다.

## GitHub 인증 장애 판정

로컬 GitHub CLI와 연결된 GitHub 앱은 별도 인증 경로다. Issue와 PR은 앱을 우선 사용하고, Actions 로그·Discussion·git 원격 작업처럼 CLI가 필요한 경우에만 로컬 인증을 확인한다.

```powershell
& .\scripts\github-auth-preflight.ps1
```

| 출력 | 종료 코드 | 의미 | 다음 조치 |
|---|---:|---|---|
| `AUTH_OK` | 0 | 키링의 활성 계정이 정상 | 그대로 계속 |
| `AUTH_NETWORK_BLOCKED` | 10 | 샌드박스·방화벽·DNS 등 네트워크 경계 | 재로그인하지 않고 앱 우선, 필요한 호출만 승인된 네트워크로 재시도 |
| `AUTH_RELOGIN_REQUIRED` | 11 | 활성 계정 없음 또는 HTTP 401/Bad credentials | 사용자 승인 후에만 `gh auth login` |
| `AUTH_UNKNOWN` | 12 | 알려지지 않은 CLI 오류 | 오류를 Issue #43에 기록하고 앱으로 가능한 작업 계속 |
| `AUTH_GH_MISSING` | 13 | GitHub CLI가 설치되지 않음 | 앱 우선, CLI가 꼭 필요할 때 설치 요청 |

`gh auth status`의 일반 텍스트는 네트워크 차단도 “token invalid”처럼 요약할 수 있으므로 단독 근거로 재로그인을 요구하지 않는다. 사전검사는 JSON의 실제 오류 원인을 사용하며 토큰을 출력하지 않는다. 최소 48시간 관찰 동안 각 세션은 시작·인계 시 사전검사 결과와 실제 401 발생 여부를 Issue #43에 누적한다.

## 상태 흐름

`status:ready` → `status:in-progress` → `status:review` → 완료

- `status:blocked`: 외부 답변, 선행 작업, 권한 또는 계약이 필요하다.
- P0/P1/P2는 사용자 영향과 MVP 차단 정도를 나타낸다.
- `area:*` 라벨은 작업 영역, 담당자와 댓글의 소유 경로는 충돌 방지 기준이다.

## 작업 선점 댓글

구현 전에 Issue 담당자와 상태를 바꾸고 아래 정보를 댓글로 남긴다.

```text
CLAIM
owner: @계정
base: <origin/main 커밋>
branch: codex/<작업명>
paths-owned: <수정할 경로>
paths-readonly: <참고만 할 경로>
acceptance: <검증 가능한 완료 조건>
```

두 세션이 동시에 같은 작업을 고른 경우 GitHub에서 먼저 정상적으로 할당·댓글을 완료한 쪽이 소유한다. 다른 쪽은 새로고침한 뒤 다른 Ready Issue를 선택한다.

## 에이전트 간 의사소통

- 같은 Codex 작업의 서브에이전트는 세션 내부 메시지로 조율할 수 있다.
- 독립 작업, 다른 PC, 다른 사용자 계정은 Issue/PR/Discussion으로만 확실하게 공유된다.
- 작업별 짧은 진행 상황은 Issue, 코드별 의견은 PR, 여러 작업에 걸친 판단은 Discussion #1에 남긴다.
- 상대 답변이 필요한 댓글에는 계정을 `@mention`하고 필요한 응답 시점을 쓴다.
- 합의된 결론은 관련 Issue와 PR에도 복사해 후속 세션이 긴 토론 전체를 읽지 않아도 되게 한다.

## 중앙 검토 세션

별도 서버를 만들지 않고 한 개의 GPT Work/Codex 세션 또는 Automation을 중앙 검토 역할로 둔다. 중앙 검토는 새 피드백, 열린 Issue, PR, 실패한 CI를 확인해 중복, 우선순위, 차단 관계, Ready 상태를 정리한다. 기능 파일은 별도 구현 세션이 선점해 수정한다.

## 관련 문서

- 최초 한 번 설정: `docs/coordination/ONBOARDING.md`
- Discussion 운영 본문: `docs/coordination/discussion-room-body.md`
- GitHub 장애 시 임시 claim: `docs/coordination/claims/README.md`
