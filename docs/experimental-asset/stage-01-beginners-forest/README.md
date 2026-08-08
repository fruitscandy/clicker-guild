# Stage 01: Beginner's Forest — Experimental Assets

길드마스터 클리커 RPG의 1단계 `초보자의 숲`에 사용할 실험용 몬스터 이미지와 관련 기획 문서를 모아 둔 폴더다.

> 상태: 콘셉트 검토용. 게임에 최종 적용하기 전 크기, 색상, 애니메이션 호환성 검토가 필요하다.

## 폴더 구성

```text
stage-01-beginners-forest/
├─ README.md
├─ monster-roster.md
├─ image-generation-guide.md
└─ images/
   ├─ stage-01-monster-preview.png
   ├─ stage-01-01-small-green-slime.png
   ├─ ...
   └─ stage-01-10-goblin-chieftain-grukan.png
```

## 이미지 사양

- 형식: RGBA PNG
- 캔버스: 1254 × 1254px
- 배경: 투명
- 구도: 단일 캐릭터, 전신, 정면에 가까운 3/4 시점
- 스타일: 밝은 모바일 RPG풍의 손그림 2D 일러스트
- 공통 특징: 굵은 외곽선, 선명한 실루엣, 셀 채색, 작은 화면에서도 읽히는 형태
- 제외 요소: 배경, 지면, 그림자, UI, 문자, 숫자, 로고, 워터마크

## 에셋 목록

| 스테이지 | 몬스터 | 역할 | 파일 |
|---|---|---|---|
| 1-1 | 작은 초록 슬라임 | 첫 전투용 최약체 | `images/stage-01-01-small-green-slime.png` |
| 1-2 | 뿔토끼 | 빠른 소형 야수 | `images/stage-01-02-horned-rabbit.png` |
| 1-3 | 숲쥐 | 공격적인 소형 야수 | `images/stage-01-03-forest-rat.png` |
| 1-4 | 어린 고블린 | 첫 인간형 적 | `images/stage-01-04-young-goblin.png` |
| 1-5 | 독침벌 | 비행형 적 | `images/stage-01-05-stinger-bee.png` |
| 1-6 | 덩굴 괴물 | 마법 식물형 적 | `images/stage-01-06-vine-monster.png` |
| 1-7 | 고블린 투척병 | 원거리 공격형 적 | `images/stage-01-07-goblin-thrower.png` |
| 1-8 | 회색늑대 | 빠른 정예 야수 | `images/stage-01-08-gray-wolf.png` |
| 1-9 | 숲 오우거 | 최종 보스 직전의 중량급 적 | `images/stage-01-09-forest-ogre.png` |
| 1-10 | 고블린 족장 그루칸 | 1단계 보스 | `images/stage-01-10-goblin-chieftain-grukan.png` |

전체 스타일은 `images/stage-01-monster-preview.png`에서 한 번에 비교할 수 있다.

## 난이도 표현 원칙

스테이지가 진행될수록 다음 요소가 단계적으로 증가한다.

1. 몸집과 화면 점유율
2. 공격적인 표정과 전투 자세
3. 무기, 방어구, 장신구의 수와 복잡도
4. 외곽 실루엣의 각지고 무거운 정도
5. 보스임을 나타내는 전리품, 왕관, 대형 무기 등의 장식

1-1부터 1-5까지는 친근한 인상을 유지하고, 1-6부터 위협적인 눈빛과 전투 자세를 강화한다. 1-8부터는 정예 적의 체격과 공격성을 드러내며, 1-10은 일반 고블린보다 훨씬 큰 체격과 화려한 장비로 보스임을 구분한다.

## 관련 문서

- `monster-roster.md`: 10단계 × 10스테이지 전체 몬스터 초안
- `image-generation-guide.md`: 공통 아트 디렉션과 1단계 몬스터별 시각 지시문

## 파일명 규칙

```text
stage-{단계 2자리}-{스테이지 2자리}-{영문 식별자}.png
```

예: `stage-01-10-goblin-chieftain-grukan.png`
