# 외부 에셋·오픈소스 출처 감사

이 문서는 NHN2026 제출용 출처 표를 만들기 위한 중간 감사 자료다. 2026-08-10의 `origin/main` 커밋 `af652c3`과 공개된 원본 페이지를 대조했다. **법률 자문이나 최종 이용 허락 판정이 아니며**, 실제 제출 빌드에 포함된 파일을 기준으로 다시 확인해야 한다.

## 상태 기준

- **확인:** 저장소 안에 원본 URL·제작자·표준 라이선스가 연결되고 공개 원문으로 대조 가능하다.
- **부분 확인:** 원본이나 사용 조건 일부는 확인되지만 라이선스 원문 사본, 생성 이력, 파일별 대응 또는 권리 선언이 부족하다.
- **미확인:** 출처 또는 제출·배포 권한을 판단할 근거가 저장소에 없다.

## 1. 외부 오디오·VFX

| 분류 | 제작자·원본 | 이용 조건 | 프로젝트 사용·증빙 | 상태 |
|---|---|---|---|---|
| 전리품 효과음 | Vinrax, [Coin Drop](https://opengameart.org/content/coin-drop) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `public/assets/audio/loot/gold-coin-clink-01.mp3`, `public/assets/audio/loot/LICENSE.md` | 확인 |
| 전리품 효과음 | Kenney, [50 RPG sound effects](https://opengameart.org/node/21999) | CC0 1.0 | `gold-coin-jingle-02.mp3`, 같은 라이선스 파일 | 확인 |
| 무기 효과음 | Kenney, [RPG Audio](https://www.kenney.nl/assets/rpg-audio), [Impact Sounds](https://www.kenney.nl/assets/impact-sounds) | CC0 1.0 | `public/assets/audio/weapons/*.ogg` 15개, 해당 폴더 `LICENSE.md` | 확인 |
| 파티클 VFX | Kenney, [Particle Pack](https://www.kenney.nl/assets/particle-pack) | CC0 1.0 | `public/assets/vfx/kenney/*.png` 4개와 `public/assets/vfx/special/*.png` 10개, 두 폴더의 `LICENSE.md` | 확인 |
| 전투 VFX | Vivid Motion, [Combat Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-combat-arcana-vol-1), [Elemental Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-elemental-arcana-vol-1) | 상업·개인 프로젝트 사용 및 색·크기 수정 허용, 원본 스프라이트 시트의 단독 재판매·재배포 금지 | `public/assets/vfx/vivid/*.png` 11개, 해당 폴더 `LICENSE.md` | 부분 확인 |

Creative Commons의 공식 CC0 설명은 복사·수정·배포·상업 이용을 허용하지만, 특허·상표·퍼블리시티·개인정보 등 다른 권리까지 해결하지는 않는다고 밝힌다. Kenney의 공식 지원 문서도 게임 에셋이 CC0이며 상업 프로젝트에 사용할 수 있고 출처 표시는 필수가 아니라고 안내한다. 제출 문서에는 의무 여부와 관계없이 제작자와 원본 링크를 표기하는 편이 추적에 유리하다.

Vivid Motion의 두 원본 페이지에는 위 사용 조건이 현재 표시되지만, 저장소에는 확인 날짜가 붙은 약관 원문 사본이나 정식 라이선스 식별자가 없다. 제출 전에 페이지 캡처 또는 구매·다운로드에 동봉된 라이선스 원문을 보존해야 한다.

## 2. AI 생성 음악과 이미지

### Google Flow Music 전투 BGM

다음 네 파일은 `public/assets/audio/bgm/flow-candidates/`에 있고 `app/bgm/tracks.ts`에서 일반전·보스전 음악으로 사용한다. 공개 곡 URL은 저장소 BGM README에 기록돼 있다.

| 프로젝트 파일 | 공개 생성 페이지 | 현재 상태 |
|---|---|---|
| `vanguards-charge.m4a` | [Vanguard's Charge](https://www.flowmusic.app/song/b37e9a5f-132c-415a-841c-3a3e29526ef9) | 생성 출처 확인, 이용 권한 부분 확인 |
| `iron-advance.m4a` | [Iron Advance](https://www.flowmusic.app/song/2485aff6-a9b2-4939-8c33-28c90e6d8f91) | 생성 출처 확인, 이용 권한 부분 확인 |
| `fantasy-boss-battle.m4a` | [Fantasy Boss Battle](https://www.flowmusic.app/song/dcdb6ecf-6a5d-4d18-b719-045646eae3d2) | 생성 출처 확인, 이용 권한 부분 확인 |
| `fantasy-boss-battle-take-2.m4a` | [Fantasy Boss Battle, take 2](https://www.flowmusic.app/song/6560582a-52ed-40eb-b7c5-834f9f8ed4e6) | 생성 출처 확인, 이용 권한 부분 확인 |

[Google Flow 공식 도움말](https://support.google.com/flow/answer/17084348?hl=en)은 텍스트·이미지·오디오 프롬프트로 곡을 만들고 편집·리믹스·공유·다운로드할 수 있다고 설명한다. [Flow 시작 안내](https://support.google.com/flow/answer/16353333?hl=en)는 생성된 원본 콘텐츠에 Google이 소유권을 주장하지 않는다고 설명하면서도, 사용에는 전체 서비스 약관이 적용된다고 명시한다. 이 문구만으로 NHN2026 제출·상업 배포 권한 전체가 자동 확인되는 것은 아니므로 다음을 추가 확보해야 한다.

- 생성 당시 적용된 계정 유형과 서비스 약관 버전
- 곡별 생성·편집 프롬프트, 모델, 생성일과 원본 다운로드 기록
- 입력 오디오나 제3자 참조를 사용하지 않았다는 확인
- NHN2026 규정상 AI 음악 허용 여부와 필요한 표시 문구

### OpenAI ImageGen 제작물

| 에셋군 | 수량·경로 | 현재 증빙 | 상태 |
|---|---|---|---|
| 길드원 스킬 VFX | WebP 25개, `public/assets/vfx/guild-members/` | 폴더 README와 manifest에 ImageGen 및 프로젝트 소유 참조 사용 기록 | 부분 확인 |
| 특수공격 그림 | WebP 3개, `public/assets/vfx/special/` | `LICENSE.md`에 OpenAI 이미지 생성과 제작일 기록 | 부분 확인 |
| 글리치 적·보스 후보 | 세션에서 시안 생성 | 프롬프트 요약은 있으나 최종 런타임 채택 파일과의 대응 없음 | 참고만 가능 |

[OpenAI 이용약관](https://openai.com/policies/row-terms-of-use/)은 OpenAI와 사용자 사이에서는, 법이 허용하는 범위에서 사용자가 입력 권리를 유지하고 출력을 소유한다고 설명한다. 동시에 사용자는 입력에 필요한 권리·허락을 확보해야 하고, 출력은 고유하지 않을 수 있다. 따라서 약관 문구는 저작권 성립, 제3자 권리 침해 없음, 공모전 규정 적합성을 보증하지 않는다.

현재 저장소에는 파일별 정확한 모델 버전, seed, 생성 작업 ID, 입력 참조 목록과 권리 선언이 없다. 최종 제출 전에 각 파일을 프롬프트·모델·생성일·후처리·검수자와 연결한 생성 대장을 만들고, 유사성·상표·제3자 입력 권리를 사람이 확인해야 한다.

### 프로젝트 자체 합성 BGM

`public/assets/audio/bgm/*.wav` 7개는 `scripts/generate-bgm.mjs`의 결정론적 합성으로 만들었고 외부 오디오 샘플을 사용하지 않았다고 BGM README에 기록돼 있다. 실제 런타임은 이 중 `guild-hearth.wav`, `frontier-map.wav` 두 곡과 Flow Music 네 곡을 사용한다. README의 일부 설명은 “네 곡”이라고 적지만 표와 생성 스크립트에는 자체 WAV가 일곱 개이므로 수량 표현을 정정해야 한다.

## 3. 출처가 부족한 이미지군

다음 런타임 또는 배포 에셋은 출처·생성 도구·라이선스 기록이 없거나 불완전하다. **현재 취합 정보만으로는 NHN2026 외부 에셋 출처 항목을 완성할 수 없다.**

| 에셋군 | 수량 | 현재 증빙 상태 |
|---|---:|---|
| 필드 배경 | 10 | 없음 |
| 지역 2~10 몬스터 | 18 | 없음 |
| 1지역 몬스터 | 10 | 상세 프롬프트·후처리 가이드는 있으나 생성 도구와 권리 선언 없음 |
| 길드원 이미지 | 76 | 기획·원본·생성 파이프라인은 있으나 생성 도구와 권리 선언 없음 |
| 길드 시설 이미지 | 6 | 없음 |
| 전리품 아틀라스 | 2 | 없음 |
| 강화 아이콘 | 12 | 없음 |
| 무기 일러스트 | 15 | 없음 |
| 무기 VFX | 3 | 없음 |
| favicon·Open Graph 이미지 | 2 | 없음 |
| 미사용 starter SVG | 3 | 출처·라이선스 없음 |

부분 증빙은 `docs/experimental-asset/guild-member-assets/**`와 `docs/experimental-asset/stage-01-beginners-forest/image-generation-guide.md`에 있다. 배포되는 외부 폰트 파일이나 원격 폰트 로더는 확인되지 않았고, CSS는 시스템에 설치된 글꼴 이름을 대체 목록으로 사용한다.

Issue #104의 OpenGameArt 무기 샘플은 실험 작업이며 현재 `origin/main`에 포함되지 않았으므로 현 제출 빌드의 출처 표에서는 제외한다. 나중에 채택하면 개별 파일별 출처를 다시 추가해야 한다.

## 4. 직접 사용하는 오픈소스

버전과 라이선스는 `package.json` 및 `package-lock.json`을 기준으로 했다.

| 용도 | 패키지 | 라이선스 |
|---|---|---|
| 런타임·데이터 | `drizzle-orm@0.45.2` | Apache-2.0 |
| 웹 프레임워크 | `next@16.2.6` | MIT |
| UI 런타임 | `react@19.2.6`, `react-dom@19.2.6` | MIT |
| 빌드·서버 | `vinext@0.0.50`, `vite@8.0.13` | MIT |
| Cloudflare 연동 | `@cloudflare/vite-plugin@1.37.1` | MIT |
| Cloudflare 도구 | `wrangler@4.92.0` | MIT OR Apache-2.0 |
| CSS 빌드 | `tailwindcss@4.2.1`, `@tailwindcss/postcss@4.2.1` | MIT |
| DB 도구 | `drizzle-kit@0.31.10` | MIT |
| 코드 검사 | `eslint@9.39.4`, `eslint-config-next@16.2.6` | MIT |
| 타입 검사 | `typescript@5.9.3` | Apache-2.0 |
| 타입 정의 | `@types/node`, `@types/react`, `@types/react-dom` | MIT |
| React/Vite 도구 | `@vitejs/plugin-react`, `@vitejs/plugin-rsc`, `react-server-dom-webpack` | MIT |

잠금 파일의 `node_modules` 항목 708개에는 모두 `license` 필드가 있지만, 전이 의존성에는 MPL-2.0, LGPL-3.0-or-later, CC-BY-4.0 등이 포함된다. 루트에 프로젝트 `LICENSE`, 통합 `NOTICE`·`ATTRIBUTION` 또는 SBOM은 확인되지 않았다. 제출·배포 전에 실제 production 의존성만 추린 오픈소스 고지 또는 SBOM을 만들고, 출처 표시·라이선스 원문 동봉·소스 제공 의무가 있는지 별도로 검토해야 한다.

## 5. 최종 PDF 작성 전 필수 보완 목록

1. 출처가 없는 이미지군마다 제작자 또는 생성 도구, 생성일, 대표 프롬프트, 입력 참조, 후처리, 권리 상태를 기록한다.
2. Flow Music 네 곡의 생성 당시 약관과 곡별 생성 대장을 보존한다.
3. ImageGen 28개 런타임 에셋을 정확한 모델·프롬프트·생성 기록과 연결하고 사람의 유사성 검수를 남긴다.
4. Vivid Motion 두 팩의 약관 원문 또는 캡처와 확인 날짜를 보존한다.
5. 실제 제출 빌드 기준으로 에셋 파일 목록과 출처 표를 대조한다.
6. production 의존성 SBOM과 OSS 고지를 만들고 루트 프로젝트 라이선스 정책을 정한다.
7. BGM README의 수량 설명과 프롬프트 보존 주장을 실제 기록에 맞게 정정한다.

이 항목들이 보강되기 전에는 기술 구조와 AI 활용 과정은 작성할 수 있지만, **외부 에셋·오픈소스 출처 장은 완결됐다고 판단하면 안 된다.**
