# 이미지 제작 가이드

## 공통 아트 디렉션

- 용도: 판타지 길드 클리커 RPG의 전투용 단일 몬스터 에셋
- 매체: 손으로 그린 듯한 고품질 2D 모바일 게임 일러스트
- 형태: 굵고 깨끗한 외곽선, 덩어리가 큰 실루엣, 밝은 셀 채색
- 구도: 중앙 배치, 전신, 정면에 가까운 3/4 시점, 사방에 충분한 여백
- 분위기: 밝고 유쾌한 라이트 판타지
- 판독성: 작은 화면으로 축소해도 종족과 무기, 전투 역할을 알아볼 수 있어야 함
- 금지 요소: 배경, 지면, 그림자, 반사, 액자, UI, 문자, 로고, 워터마크

## 공통 생성 프롬프트

```text
Use case: stylized-concept
Asset type: production-ready 2D monster asset for a fantasy guild clicker RPG
Style/medium: polished hand-painted mobile RPG illustration, crisp chunky silhouette,
bold dark contour, bright cel shading, friendly expressive proportions
Composition/framing: exactly one creature, centered full-body front three-quarter view,
generous padding, square canvas, readable at small game scale
Lighting/mood: bright whimsical beginner-forest mood
Constraints: no ground, no cast or contact shadow, no scenery, no frame, no UI,
no text, no numbers, no logo, no watermark
```

첫 에셋인 `작은 초록 슬라임`을 이후 이미지의 스타일 참조로 사용했다. 참조 이미지는 선 굵기, 채색, 표정, 구도만 맞추며 슬라임의 신체 형태나 머리의 잎은 다른 몬스터에 복제하지 않는다.

## 투명 배경 처리

기본 이미지 생성 단계에서는 단색 크로마키 배경을 사용하고, 생성 후 알파 채널로 변환했다.

- 녹색이 없는 몬스터: 녹색 키 `#00ff00`
- 녹색이 포함된 몬스터: 분홍 키 `#ff00ff`
- 배경은 색 변화, 질감, 바닥, 그림자 없이 완전히 평평한 단색으로 생성
- 최종 결과에서 네 모서리가 완전 투명한지 확인
- 반투명 외곽선과 잔색이 남는 경우 가장자리를 1픽셀 안쪽으로 정리

## 1단계 시각 지시문

| 스테이지 | 핵심 시각 지시문 | 강함의 표현 |
|---|---|---|
| 1-1 | 둥글고 말랑한 초록 슬라임, 머리의 작은 새싹, 친근한 표정 | 무기와 장비 없음 |
| 1-2 | 크림색·갈색 토끼, 짧고 둥근 뿔, 큰 발 | 빠른 동작을 암시하는 도약 자세 |
| 1-3 | 회갈색 숲쥐, 큰 귀와 앞니, 굽은 꼬리 | 낮게 엎드린 공격 자세와 작은 발톱 |
| 1-4 | 작은 녹색 고블린, 누더기 옷, 나무 몽둥이 | 첫 무장 인간형 적 |
| 1-5 | 노랑·갈색 독침벌, 작은 날개와 꼬리침 | 비행 실루엣과 빠른 공격성 |
| 1-6 | 가시 덩굴과 잎으로 이뤄진 식물 괴물, 노란 눈 | 복잡한 실루엣과 마법 생물 분위기 |
| 1-7 | 후드와 가죽 장비를 착용한 고블린, 돌팔매와 탄환 주머니 | 전문화된 원거리 무기와 전투 자세 |
| 1-8 | 은회색 늑대, 검은 갈기, 호박색 눈, 드러난 송곳니 | 낮은 도약 자세, 큰 발톱과 체격 |
| 1-9 | 거대한 이끼색 오우거, 나무 몽둥이, 통나무 팔 보호대 | 넓은 어깨와 무거운 장비 |
| 1-10 | 고블린 족장, 뼈 왕관, 전리품 목걸이, 대형 돌도끼 | 최대 화면 점유율과 화려한 보스 장식 |

## 단계 상승 규칙

다음 지역 이미지를 제작할 때는 1단계보다 단순히 크기만 키우지 않고 아래 항목을 함께 강화한다.

1. 소재의 희귀도: 나무·가죽에서 금속·수정·마력 소재로 발전
2. 장비의 완성도: 임시 무기에서 제작된 무기와 갑옷으로 발전
3. 색 대비: 지역별 고유 색을 유지하면서 정예와 보스의 명암 대비 강화
4. 자세: 수동적인 대기 자세에서 공격 직전의 역동적인 자세로 발전
5. 보스 장식: 왕관, 문장, 전리품, 대형 무기 등 한눈에 읽히는 상징 추가
