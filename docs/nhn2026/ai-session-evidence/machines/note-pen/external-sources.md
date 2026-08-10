# 외부 에셋·AI 생성물·오픈소스 출처 감사 — note-pen

이 문서는 NHN2026 제출용 출처 표를 만들기 위한 중간 감사 자료다. 저장소 기록과 공식 원본 페이지를 근거로 하며 법률 자문이나 최종 이용 허락 판정이 아니다. 실제 제출 빌드에 포함된 파일을 기준으로 다시 확인해야 한다.

## 상태 기준

- **확인:** 저장소 파일과 공식 원본·제작자·표준 라이선스가 연결됨
- **부분 확인:** 원본이나 조건 일부는 확인되지만 약관 사본, 생성 기록 또는 파일별 대응이 부족함
- **미확인:** 출처나 제출·배포 권한을 판단할 기록이 부족함

## 외부 오디오·VFX

| 분류 | 제작자·원본 | 이용 조건 | 프로젝트 기록 | 상태 |
|---|---|---|---|---|
| 전리품 효과음 | Vinrax, [Coin Drop](https://opengameart.org/content/coin-drop) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `public/assets/audio/loot/LICENSE.md` | 확인 |
| 전리품 효과음 | Kenney, [50 RPG sound effects](https://opengameart.org/node/21999) | CC0 1.0 | `public/assets/audio/loot/LICENSE.md` | 확인 |
| 무기 효과음 | Kenney, [RPG Audio](https://www.kenney.nl/assets/rpg-audio), [Impact Sounds](https://www.kenney.nl/assets/impact-sounds) | CC0 1.0 | `public/assets/audio/weapons/LICENSE.md` | 확인 |
| 파티클 VFX | Kenney, [Particle Pack](https://www.kenney.nl/assets/particle-pack) | CC0 1.0 | `public/assets/vfx/kenney/LICENSE.md`, `public/assets/vfx/special/LICENSE.md` | 확인 |
| 전투 VFX | Vivid Motion, [Combat Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-combat-arcana-vol-1), [Elemental Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-elemental-arcana-vol-1) | 원본 페이지에 프로젝트 사용·수정 허용, 원본 팩 단독 재판매·재배포 제한 표시 | `public/assets/vfx/vivid/LICENSE.md` | 부분 확인 |

Vivid Motion은 생성·다운로드 당시의 약관 사본이나 확인 날짜가 저장소에 없어 최종 제출 전에 원문 캡처 또는 동봉 라이선스를 보존해야 한다.

## AI 생성·프로젝트 자체 제작 자산

| 에셋군 | 확인된 제작 방식 | 상태 |
|---|---|---|
| 길드 시설·필드·몬스터·강화 및 전투 이미지 일부 | 자연어 입력을 이용한 이미지 생성, 투명화·크기 조정·런타임 매핑 | 부분 확인 |
| 길드원 스킬 VFX | OpenAI ImageGen과 프로젝트 보유 시각 참조, 로컬 후처리 | 부분 확인 |
| 특수공격 그림 | OpenAI 이미지 생성, 저장소 라이선스 문서에 제작 방식 기록 | 부분 확인 |
| Web Audio 효과음 | 오실레이터·노이즈·필터·gain envelope를 코드로 합성 | 프로젝트 자체 제작 |
| 프로젝트 WAV BGM | 저장소 생성 스크립트로 결정론적 합성 | 프로젝트 자체 제작 |
| 생성형 전투 BGM | 생성형 음악 서비스에서 만든 후보를 사람이 선택·편집·통합 | 부분 확인 |

이미지 생성물은 다수 파일에서 정확한 모델 버전, 원문 프롬프트, 참조 입력, 생성 작업 ID와 사람의 권리 검수 기록이 연결되지 않는다. 생성형 음악도 생성 당시 약관, 곡별 입력·편집 이력과 원본 다운로드 기록을 추가 확보해야 한다.

## 출처 기록이 부족한 이미지군

다음 에셋군은 제작 경로 일부가 세션이나 실험 문서에 있으나 파일별 출처 대장이 완결되지 않았다.

- 필드 배경과 지역별 몬스터
- 길드원 이미지와 길드 시설
- 전리품 아틀라스, 강화 아이콘과 무기 일러스트
- 무기·특수공격 VFX 일부
- favicon과 공유용 이미지

최종 PDF에서는 이를 임의로 외부 에셋 또는 자체 제작으로 단정하지 않고 `미확인` 또는 `부분 확인`으로 표시해야 한다.

## 직접 사용하는 오픈소스

버전은 중앙 브랜치의 `package.json` 선언을 기준으로 했다. 최종 제출 시 잠금 파일과 실제 production 번들을 다시 확인한다.

| 용도 | 패키지 | 선언 버전 | 대표 라이선스 |
|---|---|---:|---|
| 데이터 | `drizzle-orm` | 0.45.2 | Apache-2.0 |
| 웹 프레임워크 | `next` | 16.2.6 | MIT |
| UI 런타임 | `react`, `react-dom` | 19.2.6 | MIT |
| 빌드 | `vinext`, `vite` | 0.0.50 / 8.0.13 | MIT |
| Cloudflare 연동 | `@cloudflare/vite-plugin`, `wrangler` | 1.37.1 / 4.92.0 | MIT 계열 및 패키지별 선언 확인 필요 |
| CSS | `tailwindcss`, `@tailwindcss/postcss` | 4.2.1 | MIT |
| DB·검사·타입 도구 | `drizzle-kit`, `eslint`, `typescript` 등 | `package.json` 참조 | 패키지별 확인 필요 |

루트 프로젝트의 통합 `NOTICE`·`ATTRIBUTION` 또는 production SBOM은 확인되지 않았다. 직접 의존성 표만으로 전이 의존성의 고지·소스 제공 의무를 판단하면 안 된다.

## 최종 PDF 전 필수 보완

1. 실제 제출 빌드의 에셋 파일 목록과 제작·출처 대장을 대조한다.
2. 생성 이미지마다 모델, 생성일, 원문 프롬프트, 참조 입력, 후처리와 사람의 유사성·권리 검수를 기록한다.
3. 생성형 음악의 생성 당시 약관과 곡별 생성·편집 기록을 보존한다.
4. Vivid Motion의 사용 조건 원문 또는 캡처와 확인 날짜를 보존한다.
5. production 의존성 SBOM과 오픈소스 고지를 만든다.
6. NHN2026 규정에서 AI 생성 이미지·음악에 요구하는 표시 문구를 확인한다.

이 보완이 끝나기 전에는 AI 활용 구조와 주요 프롬프트 장은 작성할 수 있지만 외부 에셋·오픈소스 출처 장을 완결됐다고 표시하면 안 된다.

