# 외부 에셋·AI 생성물·오픈소스 출처 감사 — dongu-mac

이 문서는 이 macOS 장비의 세션에서 확인된 제작 과정과 2026-08-10 수집 시점의 저장소 기록을 바탕으로 NHN2026 제출용 출처 표를 보강한다. **법률 자문이나 최종 이용 허락 판정이 아니며**, 실제 제출 빌드와 생성 당시 약관을 사람이 다시 확인해야 한다.

## 상태 기준

- **확인:** 저장소에 원본 URL·제작자·표준 라이선스·사용 파일이 연결돼 있다.
- **부분 확인:** 제작 도구나 원본 일부는 확인되지만 파일별 생성 이력, 약관 사본, 참조 입력 또는 권리 검토가 부족하다.
- **미확인:** 출처·제작자·이용 조건을 판단할 저장소 기록이 없다.

## 1. 외부 오디오와 VFX

| 분류 | 제작자·원본 | 이용 조건 | 프로젝트 기록 | 상태 |
|---|---|---|---|---|
| 골드 동전음 | Vinrax, [Coin Drop](https://opengameart.org/content/coin-drop) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | `public/assets/audio/loot/gold-coin-clink-01.mp3`, 같은 폴더 `LICENSE.md`에 편집 내역 기록 | 확인 |
| 골드 동전음 | Kenney, [50 RPG sound effects](https://opengameart.org/node/21999) | CC0 1.0 | `gold-coin-jingle-02.mp3`, 같은 라이선스 파일 | 확인 |
| 무기 공격음 | Kenney, [RPG Audio](https://www.kenney.nl/assets/rpg-audio), [Impact Sounds](https://www.kenney.nl/assets/impact-sounds) | CC0 1.0 | `public/assets/audio/weapons/*.ogg`, 해당 폴더 `LICENSE.md` | 확인 |
| 무기·특수공격 파티클 | Kenney, [Particle Pack](https://www.kenney.nl/assets/particle-pack) | CC0 1.0 | `public/assets/vfx/kenney/*.png`, `public/assets/vfx/special/*.png`, 두 폴더의 `LICENSE.md` | 확인 |
| 전투 VFX | Vivid Motion, [Combat Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-combat-arcana-vol-1), [Elemental Arcana Vol. 1](https://vivid-motion-assets.itch.io/vivid-motion-elemental-arcana-vol-1) | 저장소 기록상 상업·개인 프로젝트 사용과 수정 허용, 원본 시트의 단독 재판매·재배포 금지 | `public/assets/vfx/vivid/*.png`, 해당 폴더 `LICENSE.md` | 부분 확인 |

CC0 에셋은 출처 표시가 필수는 아니지만 제출 추적성을 위해 제작자, 원본 페이지와 로컬 파일 대응을 유지한다. Vivid Motion은 표준 라이선스 식별자와 생성 당시 약관 원문 사본이 저장소에 없어 제출 전에 원본 페이지 캡처 또는 다운로드 동봉 라이선스를 보존해야 한다.

## 2. 프로젝트 자체 생성 오디오

다음 음향은 세션 기록상 외부 샘플을 사용하지 않고 Web Audio 오실레이터·노이즈·필터·gain envelope로 구현됐다.

- 토벌 시작·공세 실패·상단 메뉴·시설 탭·길드원 고용·몬스터 피격
- 일반·보스 스테이지 승리 팡파르
- 무기 제작의 망치·금속 공명과 길드 승급의 석재 충격·짧은 화음
- 골드·재료의 초기 합성 드롭·회수음

이 항목은 외부 에셋 라이선스 대상이 아니지만, 누가 어떤 코드로 생성했는지 추적하기 위해 관련 구현과 테스트를 제출 기준 커밋에 고정해야 한다. 이후 실제 녹음으로 교체된 골드 동전음과 무기음은 위 외부 출처 표를 따른다.

## 3. OpenAI ImageGen 제작물

세션과 저장소에서 ImageGen 사용이 확인되거나 강하게 연결되는 에셋군은 다음과 같다.

| 에셋군 | 경로·수량 | 현재 근거 | 상태 |
|---|---|---|---|
| 길드원 스킬 VFX | `public/assets/vfx/guild-members/` WebP 25개 | 폴더 README에 OpenAI 내장 ImageGen, 프로젝트 소유 참조, 크로마키·가장자리·최적화 기록 | 부분 확인 |
| 특수 비술 그림 | `public/assets/vfx/special/` WebP 3개 | `LICENSE.md`에 OpenAI 이미지 생성, 생성일, 파일 설명 기록 | 부분 확인 |
| 지역 필드 | `public/assets/fields/` WebP 10개 | macOS 세션에 ImageGen 재생성·최적화 기록은 있으나 저장소 파일별 생성 대장 없음 | 부분 확인 |
| 1지역 몬스터 | `public/assets/monsters/stage-01/` PNG 10개 | 저장소에 공통 프롬프트·크로마키 가이드가 있으나 모델·작업 ID·권리 선언 부족 | 부분 확인 |
| 지역 2~10 몬스터 | `public/assets/monsters/region-02`~`region-10` PNG 18개 | macOS 세션에서 필드 참고 원화 생성과 연결을 확인했으나 파일별 프롬프트 기록 없음 | 부분 확인 |
| 길드 성장·시설 | `public/assets/guild/**` | 세션에서 길드 성장, 여관, 사냥터, 대장간 생성 과정을 확인했으나 파일별 대장 없음 | 부분 확인 |
| 길드원 애니메이션 | `public/assets/guild-members/**`, 실험 자료 | 기획·캐릭터 데이터·생성·크로마키·프레임 파이프라인은 있으나 모델·참조 파일별 권리 기록 부족 | 부분 확인 |
| 전리품 아틀라스 | `public/assets/loot/*.png` 2개 | 세션에서 ImageGen 아틀라스와 컷아웃 재생성을 확인했으나 원문 프롬프트·작업 ID 없음 | 부분 확인 |
| 무기·강화·시설 일부 | `public/assets/weapons/**`, `public/assets/upgrades/**`, `public/assets/guild/**` | 세션에서 생성형 제작 또는 기존 아트 확장을 언급하지만 파일별 제작자·도구 대응이 불완전 | 부분 확인 또는 미확인 |

현재 문서가 `부분 확인`으로 남는 이유는 다음 정보가 빠져 있기 때문이다.

- 정확한 모델명과 버전, seed, 생성 작업 ID, 생성 시각
- 파일별 전체 프롬프트와 네거티브 조건
- 참조 이미지 목록, 각 입력의 제작자와 사용 권리
- 크롭·배경 제거·보정·리사이즈·형식 변환의 담당과 도구
- 사람이 수행한 유사성, 상표, 캐릭터 혼입, 품질 검수 결과
- 생성 당시 적용된 OpenAI 서비스 약관 사본과 NHN2026 AI 표시 요건 검토

최종 PDF에는 “AI 생성”이라는 한 줄만 적지 말고, 제출 빌드의 각 파일을 위 항목과 연결한 생성 대장을 부록으로 붙이는 편이 안전하다.

## 4. 출처가 여전히 부족한 이미지군

저장소와 Mac 세션을 함께 봐도 아래 파일군은 제작 출처가 충분하지 않다.

| 에셋군 | 현재 판단 |
|---|---|
| 강화 아이콘 12개 | 이미지 생성 또는 프로젝트 제작 여부를 파일별로 확정할 기록 부족 |
| 무기 VFX WebP 3개 | 제작 도구·프롬프트·참조 입력 기록 부족 |
| favicon·Open Graph 이미지 | 제작자·도구·권리 기록 부족 |
| 일부 길드 시설·배경 | 어느 생성 세션과 파일이 대응하는지 불완전 |
| starter SVG | 원본 템플릿 출처·라이선스 기록 부족 |

AI가 만들었다는 세션 문맥은 외부 출처 고지를 대체하지 않는다. 파일별 근거가 없는 항목은 중앙 취합에서 임의로 `확인`으로 올리면 안 된다.

## 5. 직접 사용하는 오픈소스

버전은 수집 브랜치의 `package.json`과 `package-lock.json`을 기준으로 했다.

| 용도 | 패키지 | 버전 | 저장소 기록상 라이선스 |
|---|---|---:|---|
| 런타임·데이터 | `drizzle-orm` | 0.45.2 | Apache-2.0 |
| 웹 프레임워크 | `next` | 16.2.6 | MIT |
| UI 런타임 | `react`, `react-dom` | 19.2.6 | MIT |
| 빌드·서버 | `vinext`, `vite` | 0.0.50, 8.0.13 | MIT |
| Cloudflare 연동 | `@cloudflare/vite-plugin` | 1.37.1 | MIT |
| Cloudflare 도구 | `wrangler` | 4.92.0 | MIT OR Apache-2.0 |
| CSS 빌드 | `tailwindcss`, `@tailwindcss/postcss` | 4.2.1 | MIT |
| DB 도구 | `drizzle-kit` | 0.31.10 | MIT |
| 코드 검사 | `eslint`, `eslint-config-next` | 9.39.4, 16.2.6 | MIT |
| 타입 검사 | `typescript` | 5.9.3 | Apache-2.0 |
| 타입 정의 | `@types/node`, `@types/react`, `@types/react-dom` | 잠금 버전 사용 | MIT |
| React/Vite 도구 | `@vitejs/plugin-react`, `@vitejs/plugin-rsc`, `react-server-dom-webpack` | 잠금 버전 사용 | MIT |

잠금 파일에는 루트 항목을 제외한 708개의 `node_modules` 항목이 있다. 라이선스 필드에는 MIT, Apache-2.0, ISC, BSD 계열뿐 아니라 MPL-2.0, LGPL-3.0-or-later, CC-BY-4.0 등이 포함된다. 현재 루트에는 프로젝트 `LICENSE`, 통합 `NOTICE`·`ATTRIBUTION`, production SBOM이 없다.

최종 제출·배포 전에는 개발 전용 의존성을 제외한 production SBOM을 만들고, 라이선스 원문 동봉·출처 표시·소스 제공 의무를 패키지별로 검토해야 한다. 잠금 파일의 라이선스 문자열만으로 모든 의무가 충족됐다고 판단하면 안 된다.

## 6. 최종 PDF 작성 전 필수 보완 목록

1. 실제 제출 빌드의 모든 이미지·오디오 파일 목록을 생성하고 출처 표와 1:1 대조한다.
2. ImageGen 파일별 모델·프롬프트·참조·후처리·생성일·검수 결과를 기록한 생성 대장을 만든다.
3. 프로젝트 소유 참조 이미지라는 주장에 파일별 제작자·권리 근거를 붙인다.
4. Vivid Motion 두 팩의 생성 당시 약관 원문 또는 캡처와 확인 날짜를 보존한다.
5. CC0 오디오·VFX의 저장소 라이선스 파일과 실제 사용 파일 해시를 대응시킨다.
6. production SBOM과 OSS 고지를 만들고 프로젝트 자체 라이선스 정책을 정한다.
7. 최종 PDF에서 자체 합성 오디오, 외부 CC0 녹음, AI 생성 이미지, 코드 기반 VFX를 서로 구분한다.
8. 중앙 Windows 취합본의 Flow Music·기타 출처와 합친 뒤 중복·상태 충돌을 사람이 검토한다.

이 목록이 해결되기 전에는 AI 활용 구조와 프롬프트 장은 초안 작성이 가능하지만, **외부 에셋·오픈소스 출처 장은 완결 상태가 아니다.**
