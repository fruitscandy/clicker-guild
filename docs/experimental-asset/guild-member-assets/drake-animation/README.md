# 용기사 드라크 웹게임 애니메이션

## 구성

| 모션 | 프레임 | 루프 | PNG 시트 | 미리보기 |
|---|---:|---|---|---|
| 대기 | 6 | 예 | [PNG](sheets/drake-idle-256.png) | [WebP](previews/drake-idle-preview.webp) |
| 이동 | 8 | 예 | [PNG](sheets/drake-run-256.png) | [WebP](previews/drake-run-preview.webp) |
| 기본 공격 | 8 | 아니오 | [PNG](sheets/drake-attack-256.png) | [WebP](previews/drake-attack-preview.webp) |
| 용의 돌진 | 10 | 아니오 | [PNG](sheets/drake-dragon-charge-256.png) | [WebP](previews/drake-dragon-charge-preview.webp) |

- [전체 연결 애니메이션](previews/drake-connected-animation.webp): 대기 → 이동 → 기본 공격 → 대기 → 용의 돌진 → 대기
- [브라우저 미리보기](preview.html)
- [모션 메타데이터](drake-animations.json)
- [연결 타임라인](drake-connected-animation.json)
- [투명 배경 검수 결과](validation.json)

## 웹 적용 규격

- 개별 프레임: 투명 PNG, 256×256px
- 권장 표시 크기: 128–192px
- 캐릭터 기준점: `(0.5, 0.96)`
- 진행 방향: 화면 오른쪽
- 외형 기준: `../character-concepts/images/`
