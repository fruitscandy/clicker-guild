# 도적 핀 웹게임 애니메이션

## 구성

| 모션 | 프레임 | 루프 | PNG 시트 | 미리보기 |
|---|---:|---|---|---|
| 대기 | 6 | 예 | [PNG](sheets/finn-idle-256.png) | [WebP](previews/finn-idle-preview.webp) |
| 이동 | 8 | 예 | [PNG](sheets/finn-run-256.png) | [WebP](previews/finn-run-preview.webp) |
| 기본 공격 | 8 | 아니오 | [PNG](sheets/finn-attack-256.png) | [WebP](previews/finn-attack-preview.webp) |
| 급소 찌르기 | 10 | 아니오 | [PNG](sheets/finn-vital-strike-256.png) | [WebP](previews/finn-vital-strike-preview.webp) |

- [전체 연결 애니메이션](previews/finn-connected-animation.webp): 대기 → 이동 → 기본 공격 → 대기 → 급소 찌르기 → 대기
- [브라우저 미리보기](preview.html)
- [모션 메타데이터](finn-animations.json)
- [연결 타임라인](finn-connected-animation.json)
- [투명 배경 검수 결과](validation.json)

## 웹 적용 규격

- 개별 프레임: 투명 PNG, 256×256px
- 권장 표시 크기: 128–192px
- 캐릭터 기준점: `(0.5, 0.96)`
- 진행 방향: 화면 오른쪽
- 외형 기준: `../character-concepts/images/`
