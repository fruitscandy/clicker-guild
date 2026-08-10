# note-pen AI 활용 세션 취합본

이 디렉터리는 NHN2026 제출용 AI 활용 기술문서 작성을 위해 `note-pen`에서 확인한 Clicker Guild 관련 대화를 개인정보가 드러나지 않는 요약형 자료로 정리한 것이다. 원문 대화는 포함하지 않으며, Issue #141에서 다른 장비 자료와 병합할 수 있도록 `desk64`와 `macos-codex`가 사용한 공통 스키마를 따른다.

## 범위

- 장비 별명: `note-pen`
- 원천 기간: 2026-08-07~2026-08-10
- 수집 컷오프: 2026-08-10 20:45:28 KST
- 선별한 원천 세션: 36개
- 논리 요약 레코드: 10개
- 사용자 요청: 190개
- 사용자에게 표시된 assistant 메시지: 729개
- 현재 증빙 취합 세션과 원문 대화: 제외

## 파일

- `summary.md`: 전체 AI 활용 과정과 사람의 결정 요약
- `technical-notes.md`: 구조, 이미지·오디오·코드·검증 파이프라인
- `prompt-catalog.md`: 주요 프롬프트와 반복 지시를 비식별 재구성한 목록
- `external-sources.md`: 외부 에셋, AI 생성물, 오픈소스 출처 감사
- `session-summaries.jsonl`: 장비 간 병합용 논리 세션 요약
- `manifest.json`: 범위, 통계, 제외 원칙과 파일 목록
- `validation-report.md`: 개인정보·형식·무결성 검사 결과
- `note-pen-ai-session-evidence.zip`: 위 문서와 이 README의 전달용 압축본
- `SHA256SUMS.txt`: 텍스트·JSONL·ZIP 무결성 확인값

## 병합 방법

1. `SHA256SUMS.txt`로 파일 손상 여부를 확인한다.
2. `validation-report.md`의 제외 항목과 한계를 검토한다.
3. 다른 장비의 `session-summaries.jsonl`과 줄 단위로 합친다.
4. `machine_alias`와 `session_id` 조합을 중복 제거 키로 사용한다.
5. 장비 간에 같은 기능이나 PR을 다룬 내용은 인간 피드백은 보존하되 최종 PDF의 기능 설명에서는 중복 제거한다.
6. `summary.md`와 `technical-notes.md`는 구조 설명에, `prompt-catalog.md`는 주요 프롬프트에, `external-sources.md`는 출처 장과 보완 체크리스트에 사용한다.

## 개인정보 보호

- 원문 발화, system/developer 지시, 내부 추론, 도구 호출 인수·출력, 첨부 바이너리는 포함하지 않았다.
- 원본 세션 ID, 로컬 경로, 실제 사용자·PC·계정 이름, 연락처, 인증정보, 개인 공유 URL은 포함하지 않았다.
- 프로젝트의 공개 Issue·PR 번호, 저장소 상대경로, 공식 에셋·라이선스 URL만 재현성 근거로 보존했다.
- 자동 검사는 문맥상 식별 정보를 완전히 찾을 수 없으므로 최종 제출 전 사람이 다시 검토해야 한다.

