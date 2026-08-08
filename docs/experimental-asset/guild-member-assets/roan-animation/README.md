# 견습 전사 로안 웹게임 애니메이션

## 구성

| 모션 | 프레임 | 재생 시간 | 루프 | PNG 시트 | 애니메이션 미리보기 |
|---|---:|---:|---|---|---|
| 대기 | 6 | 840ms | 예 | [PNG](sheets/roan-idle-256.png) | [WebP](previews/roan-idle-preview.webp) |
| 이동 | 8 | 720ms | 예 | [PNG](sheets/roan-run-256.png) | [WebP](previews/roan-run-preview.webp) |
| 기본 공격 | 8 | 680ms | 아니오 | [PNG](sheets/roan-attack-256.png) | [WebP](previews/roan-attack-preview.webp) |
| 강타 | 10 | 1,185ms | 아니오 | [PNG](sheets/roan-heavy-strike-256.png) | [WebP](previews/roan-heavy-strike-preview.webp) |

- [전체 연결 애니메이션](previews/roan-connected-animation.webp): 대기 → 이동 → 기본 공격 → 대기 → 강타 → 대기
- [브라우저 미리보기](preview.html)
- [모션별 메타데이터](roan-animations.json)
- [연결 타임라인](roan-connected-animation.json)
- [투명 배경 검수 결과](validation.json)

## 웹 적용 규격

- 개별 프레임: 투명 PNG, 256×256px
- 권장 표시 크기: 128–192px
- 캐릭터 기준점: `(0.5, 0.96)`
- 진행 방향: 화면 오른쪽
- `frames/`: 모션별 개별 PNG 프레임 32개
- `sheets/`: 가로형 PNG 및 무손실 WebP 스프라이트 시트
- `previews/`: 모션별 애니메이션 WebP 및 전체 연결 애니메이션
- `source/`: 이미지 생성 도구로 만든 고해상도 크로마키 원본

공격처럼 프레임마다 재생 시간이 다른 모션은 `roan-animations.json`의 `durationsMs`를 사용하거나 `preview.html`의 JavaScript 재생 예시를 참고하세요.
