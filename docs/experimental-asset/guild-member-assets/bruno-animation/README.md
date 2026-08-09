# 싸움꾼 브루노 웹게임 애니메이션

## 구성

| 모션 | 프레임 | 루프 | PNG 시트 | 미리보기 |
|---|---:|---|---|---|
| 대기 | 6 | 예 | [PNG](sheets/bruno-idle-256.png) | [WebP](previews/bruno-idle-preview.webp) |
| 이동 | 8 | 예 | [PNG](sheets/bruno-run-256.png) | [WebP](previews/bruno-run-preview.webp) |
| 기본 공격 | 8 | 아니오 | [PNG](sheets/bruno-attack-256.png) | [WebP](previews/bruno-attack-preview.webp) |
| 삼연격 | 10 | 아니오 | [PNG](sheets/bruno-triple-strike-256.png) | [WebP](previews/bruno-triple-strike-preview.webp) |

- [전체 연결 애니메이션](previews/bruno-connected-animation.webp): 대기 → 이동 → 기본 공격 → 대기 → 삼연격 → 대기
- [브라우저 미리보기](preview.html)
- [모션 메타데이터](bruno-animations.json)
- [연결 타임라인](bruno-connected-animation.json)
- [투명 배경 검수 결과](validation.json)

## 웹 적용 규격

- 개별 프레임: 투명 PNG, 256×256px
- 권장 표시 크기: 128–192px
- 캐릭터 기준점: `(0.5, 0.96)`
- 진행 방향: 화면 오른쪽
- 외형 기준: `../character-concepts/images/`
