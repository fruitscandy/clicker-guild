# 로컬 claim 보조 기록

정상 상황에서는 GitHub Issue의 담당자, 상태 라벨과 `CLAIM` 댓글을 사용한다. 이 폴더는 GitHub를 읽거나 쓸 수 없는 일시적 상황에서만 보조로 사용한다.

claim을 사용했다면 다른 PC가 볼 수 있도록 가능한 즉시 push하고, GitHub 연결이 복구되면 동일 내용을 Issue에 옮긴다. 오래된 claim은 현재 상태로 간주하지 않는다.

파일명은 `<issue-number>-<short-name>.md`로 만들고 다음 필드를 기록한다.

```text
# <Issue>: <제목>

- status: active | blocked | handed-off | completed
- owner: <GitHub 계정/세션>
- branch: <브랜치>
- base: <기준 커밋>
- paths-owned: <수정 경로>
- paths-readonly: <읽기 전용 경로>
- updated: <ISO 날짜/시간>
- acceptance: <완료 조건>
- handoff: <커밋, 검증, 알려진 문제>
```
