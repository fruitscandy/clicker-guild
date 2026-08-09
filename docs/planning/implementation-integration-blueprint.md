# 클릭커 길드 웹 MVP 구현·통합 청사진

> 목적: 다른 PC에서 진행 중인 **전투 그래픽·전투 스킬 작업을 중단시키지 않고**, 이 저장소에 아직 없는 웹 실행 골격과 비전투 기능을 병렬 개발한 뒤 안전하게 합치는 기준을 고정한다. 시간 제한이 크므로 아래의 `MVP 필수`가 완료되기 전에는 확장 기능을 추가하지 않는다.

## 1. 현재 상태와 전제

2026-08-09 기준 저장소에는 애플리케이션 코드, 패키지 설정, 테스트, 배포 설정이 없고 `docs/experimental-asset/` 아래의 실험용 원본만 있다.

- 1단계 몬스터 10종: RGBA PNG, 1254×1254, 투명 배경, 정지 이미지
- 길드원 콘셉트 25종: 전신 PNG, 프로덕션 확정본 아님
- 로안 애니메이션: 256×256 투명 PNG 프레임과 가로형 시트
  - `idle` 6프레임, `run` 8프레임, `attack` 8프레임, `heavy-strike` 10프레임
  - 화면 오른쪽을 향함, 기준점 `(0.5, 0.96)`
  - 모션별·프레임별 재생 시간이 `roan-animations.json`에 정의됨
- 게임 전제: 플레이어 직접 클릭 공격 + 최대 4명의 길드원 자동 공격 + 보상·성장·스테이지 진행

`docs/experimental-asset/`은 **원본과 참고자료**로 취급한다. 게임 코드는 이 경로를 직접 참조하지 않으며, 승인된 파일만 런타임 에셋 폴더로 복사·변환한다. 다른 PC가 이 폴더를 수정 중이어도 구현 세션은 손대지 않는다.

## 2. 범위 고정

### MVP 필수

1. 브라우저에서 바로 시작되는 단일 화면
2. 1-1부터 1-10까지 몬스터 순차 진행
3. 클릭 피해, 길드원 자동 피해, 몬스터 HP, 처치, 골드 보상
4. 로안 1명 고용·레벨업·편성, 기본 공격과 강타 1종
5. 새로고침 후 골드·로안 레벨·현재 스테이지 복원
6. 음소거, 저장 초기화, 기본 오류 화면
7. 모바일 360×800과 데스크톱 1280×720에서 플레이 가능
8. 정적 웹 빌드 생성 및 하나의 배포 주소에서 실행

### MVP에서 제외

- 2단계 이후 지역, 25명 전원의 애니메이션, 계정/서버, 결제, 광고
- 오프라인 보상, 가챠, 장비, 업적, 퀘스트, 다국어
- 복잡한 상태이상 조합, PvP, 실시간 동기화
- 편집기·CMS·서버 DB

빠른 완성을 위해 제외 항목은 데이터 필드나 빈 버튼도 미리 만들지 않는다. MVP 승인 뒤 티켓으로 추가한다.

## 3. 기술 스택 결정

### 권장: Vite + TypeScript + DOM/CSS + Canvas 2D

- **Vite/TypeScript**: 초기 설정과 정적 빌드가 작고, 데이터 계약 오류를 컴파일 시점에 잡기 쉽다.
- **DOM/CSS**: HP, 골드, 강화 버튼, 설정처럼 접근성과 반응형 배치가 필요한 UI를 담당한다.
- **Canvas 2D**: 배경, 캐릭터·몬스터 스프라이트, 타격 이펙트와 데미지 숫자만 그린다.
- **Web Audio API 또는 `<audio>`**: MVP 사운드. 사운드 라이브러리는 도입하지 않는다.
- **localStorage**: 단일 버전 저장 데이터. 서버는 사용하지 않는다.
- **Vitest**: 피해 계산, 진행, 저장 마이그레이션 같은 순수 로직 테스트에만 사용한다.

외부 상태 관리 라이브러리와 UI 프레임워크는 넣지 않는다. 화면이 하나인 MVP에서는 작은 이벤트 기반 스토어가 더 빠르고 병합 경계도 명확하다.

### 대안과 선택 조건

| 선택지 | 채택 조건 | 장점 | 비용/위험 |
|---|---|---|---|
| React + TypeScript + Canvas | 담당자가 이미 React에 매우 익숙하고 상점·도감 등 화면이 즉시 늘어날 때 | UI 구성과 패널 확장 용이 | 초기 구조와 렌더 경계가 커짐 |
| PixiJS + DOM UI | 파티클, 다수 스프라이트, 화면 효과가 Canvas 2D 구현량을 실제로 초과할 때 | 스프라이트·필터·텍스처 관리 편리 | 새 런타임 의존성과 학습/번들 비용 |
| Phaser | 전투를 좌표·충돌·씬 중심의 게임으로 확대할 때 | 게임 루프 기능 풍부 | 클릭커 MVP에는 과한 추상화 가능성 |
| 순수 JS/HTML/CSS | 패키지 설치조차 불가능한 긴급 데모 | 가장 적은 도구 | 데이터 계약·리팩터링 안정성이 낮음 |

**결정 시한:** 최초 구현 시작 후 30분 안에 권장안을 채택한다. Canvas 2D로 로안 시트 1개가 재생되는 스파이크가 실패할 때만 PixiJS로 전환한다. 한번 전투 PC가 구현을 시작한 뒤에는 통합 브랜치에서 렌더러를 바꾸지 않는다.

## 4. 추천 저장소 구조와 소유권

```text
clicker-guild/
├─ docs/
│  ├─ experimental-asset/          # 원본/참고, 런타임 직접 참조 금지
│  └─ planning/                    # 계약·계획
├─ public/
│  └─ assets/
│     ├─ manifests/                # 배포되는 JSON manifest
│     ├─ battle/
│     │  ├─ backgrounds/
│     │  ├─ characters/
│     │  ├─ monsters/
│     │  └─ effects/
│     ├─ ui/
│     └─ audio/
├─ scripts/
│  ├─ validate-assets.mjs
│  └─ validate-content.mjs
├─ src/
│  ├─ app/                         # bootstrap, 전역 조립, 라우팅 없는 shell
│  ├─ core/                        # 이벤트, clock, RNG, 공용 타입
│  ├─ content/                     # stages, members, skills의 정적 데이터
│  ├─ features/
│  │  ├─ battle/                   # 다른 PC 소유
│  │  │  ├─ domain/                # 전투 계산/상태 전이
│  │  │  ├─ presentation/          # Canvas renderer, animation, effects
│  │  │  └─ index.ts               # 외부 공개 API
│  │  ├─ progression/              # 보상, 고용, 레벨업
│  │  ├─ stage/                    # 스테이지 잠금/진행
│  │  ├─ save/                     # 저장/복원/마이그레이션
│  │  └─ settings/                 # 음소거·초기화
│  ├─ ui/                          # DOM HUD, 패널, 공용 CSS
│  └─ main.ts
├─ tests/
│  ├─ unit/
│  └─ smoke/
├─ index.html
├─ package.json
└─ vite.config.ts
```

### 세션별 쓰기 권한

| 작업 세션 | 단독 소유 경로 | 읽기만 가능한 경로 |
|---|---|---|
| 전투 그래픽·스킬 PC | `src/features/battle/**`, `public/assets/battle/**`, 전투 manifest 조각 | 비전투 기능 전체 |
| 웹 골격·통합 | `src/app/**`, `src/core/**`, `src/main.ts`, 루트 설정 | 전투 구현 |
| 진행·저장 | `src/features/progression/**`, `stage/**`, `save/**`, `settings/**` | 전투 공개 API |
| UI·QA | `src/ui/**`, `tests/**`, 검증 스크립트 | 전투 구현과 에셋 |
| 통합 담당자 | 공용 manifest 조립, 충돌 해결, 빌드·배포 설정 | 전체 |

`package.json`, lockfile, `src/core/` 공용 타입, manifest 스키마는 통합 담당자만 변경한다. 새 의존성이 필요하면 작업 브랜치에서 바로 설치하지 말고 먼저 “패키지명/버전/필요 이유/대안”을 전달한다.

## 5. 런타임 에셋 계약

### 원칙

- 경로는 `/assets/...`로 시작하는 URL이며 대소문자를 구분한다.
- ID는 영문 소문자 `kebab-case`, 영구적이며 표시 이름과 분리한다.
- 원본 PNG는 보존하고, 런타임에는 화면에 필요한 최대 크기로 변환한 PNG/WebP를 둔다.
- 투명 애니메이션 시트는 PNG를 기준 포맷으로 한다. 정지 배경과 불투명 이미지에는 WebP를 우선한다.
- 시트의 모든 프레임은 동일 크기이며 좌→우 순서다. 가변 프레임 시간은 배열로 보존한다.
- 기준점은 좌상단 `(0,0)`, 우하단 `(1,1)`인 정규화 좌표다.
- `facing: "right"` 에셋의 반대 방향 표시는 런타임 수평 반전으로 처리한다. 별도 좌향 파일을 요구하지 않는다.
- manifest에 없는 파일은 프로덕션 빌드에서 사용하지 않는다.

### 권장 manifest

파일: `public/assets/manifests/battle-assets.v1.json`

```json
{
  "schemaVersion": 1,
  "contentVersion": "2026.08.09.1",
  "characters": {
    "roan": {
      "displayName": "견습 전사 로안",
      "facing": "right",
      "anchor": { "x": 0.5, "y": 0.96 },
      "recommendedDisplayPx": { "min": 128, "max": 192 },
      "animations": {
        "idle": {
          "src": "/assets/battle/characters/roan/roan-idle-256.png",
          "frameWidth": 256,
          "frameHeight": 256,
          "frameCount": 6,
          "durationsMs": [140, 140, 140, 140, 140, 140],
          "loop": true,
          "events": []
        },
        "attack": {
          "src": "/assets/battle/characters/roan/roan-attack-256.png",
          "frameWidth": 256,
          "frameHeight": 256,
          "frameCount": 8,
          "durationsMs": [110, 90, 70, 55, 55, 80, 100, 120],
          "loop": false,
          "events": [{ "frame": 4, "name": "hit" }]
        }
      }
    }
  },
  "monsters": {
    "stage-01-01-small-green-slime": {
      "displayName": "작은 초록 슬라임",
      "src": "/assets/battle/monsters/stage-01-01-small-green-slime.webp",
      "fallbackSrc": "/assets/battle/monsters/stage-01-01-small-green-slime.png",
      "anchor": { "x": 0.5, "y": 0.94 },
      "recommendedDisplayPx": { "min": 160, "max": 256 }
    }
  },
  "effects": {},
  "backgrounds": {}
}
```

`events`는 시각 타이밍일 뿐 피해 판정의 진실 공급원이 아니다. 전투 로직이 피해를 확정해 `damageApplied`를 발행하고, 표현 계층은 가장 가까운 `hit` 프레임에 숫자·효과음을 맞춘다. 애니메이션 누락이나 저사양 모드에서도 피해 계산이 멈추면 안 된다.

### 로더 API 계약

```ts
type AssetId = string;

interface AssetLoader {
  loadManifest(url: string): Promise<BattleAssetManifest>;
  preload(ids: AssetId[], signal?: AbortSignal): Promise<PreloadReport>;
  getImage(id: AssetId): CanvasImageSource | null;
  release(ids: AssetId[]): void;
}

interface PreloadReport {
  loaded: AssetId[];
  failed: Array<{ id: AssetId; reason: string }>;
}
```

- 필수 에셋 실패: 해당 ID와 경로가 보이는 오류 패널 + 재시도 버튼을 표시한다.
- 선택 이펙트 실패: 기본 번쩍임/색상 오버레이로 폴백하고 전투는 계속한다.
- 이미지 디코딩 완료 후 로드 성공으로 간주한다(`img.decode()` 또는 동등 처리).
- 최초 로드는 1-1 배경, 현재 몬스터, 로안 `idle/attack`, UI 필수 아이콘만 포함한다. 나머지는 첫 입력 후 유휴 시간에 불러온다.

### 전달 전 자동 검증 항목

1. JSON 파싱 및 `schemaVersion === 1`
2. manifest가 가리키는 모든 파일 존재
3. `frameCount === durationsMs.length`
4. 실제 시트 폭 `=== frameWidth × frameCount`, 높이 `=== frameHeight`
5. 각 시간은 16~2000ms, anchor는 0~1 범위
6. 파일명·ID 중복 없음, 경로 대소문자 일치
7. PNG 네 모서리 알파 0, 녹색/분홍 크로마키 잔색 허용치 이하
8. 개별 런타임 파일 2MB 이하 권장, 최초 로드 합계 10MB 이하

## 6. 전투와 비전투 모듈 경계

### 전투 모듈이 소유하는 것

- 전투 중 HP, 공격 타이머, 쿨다운, 살아 있음/처치 상태
- 클릭 공격과 길드원 공격의 피해 계산
- 스킬 발동 조건과 효과 적용
- 전투 시작/일시정지/종료
- Canvas 장면, 애니메이션, 전투 이펙트

### 비전투 모듈이 소유하는 것

- 골드 총액, 길드원 보유·레벨·편성
- 현재/최고 스테이지와 해금
- 저장 버전과 localStorage 입출력
- 설정과 DOM 기반 HUD/패널
- 보상 계산 테이블과 성장 비용 테이블

전투는 localStorage, DOM 요소, 강화 비용 테이블에 직접 접근하지 않는다. 비전투 코드는 Canvas 내부 객체나 애니메이션 프레임을 직접 조작하지 않는다.

### 전투 공개 API

```ts
export interface BattleStartInput {
  battleId: string;
  stageId: string;
  monster: { id: string; maxHp: number; rewardGold: number };
  party: Array<{
    memberId: string;
    attack: number;
    attackIntervalMs: number;
    skill?: { id: string; cooldownMs: number };
  }>;
  playerClickDamage: number;
}

export interface BattleController {
  start(input: BattleStartInput): void;
  clickAttack(): void;
  pause(): void;
  resume(): void;
  dispose(): void;
  subscribe(listener: (event: BattleEvent) => void): () => void;
}

export type BattleEvent =
  | { type: "battleStarted"; battleId: string; monsterMaxHp: number }
  | { type: "damageApplied"; battleId: string; sourceId: string; amount: number; hpAfter: number; critical: boolean }
  | { type: "skillTriggered"; battleId: string; memberId: string; skillId: string }
  | { type: "battleWon"; battleId: string; stageId: string; rewardGold: number };
```

모든 이벤트에는 현재 `battleId`가 있어야 한다. 화면 전환 직전에 도착한 이전 전투 이벤트는 앱 계층에서 폐기한다. `battleWon`은 전투당 정확히 한 번만 발행하며, 골드 지급과 다음 스테이지 해금은 이를 받은 비전투 계층이 한 번만 처리한다.

### 스킬 데이터 계약

```ts
interface SkillDefinition {
  id: string;
  displayName: string;
  cooldownMs: number;
  animationId: string;
  effects: Array<
    | { type: "damage"; multiplier: number; hitIndex?: number }
    | { type: "buffAttack"; multiplier: number; durationMs: number }
    | { type: "debuffDefense"; multiplier: number; durationMs: number }
  >;
}
```

MVP에서는 로안의 `heavy-strike`를 단일 `damage` 효과로만 구현한다. 그래픽 PC가 이펙트를 추가하더라도 계산 필드(`multiplier`, `cooldownMs`)와 표현 필드(`animationId`)를 섞지 않는다. 랜덤 피해는 주입된 RNG를 통해 계산해 테스트에서 고정 가능해야 한다.

## 7. 저장 데이터 계약

키는 `clicker-guild:save`, 설정은 `clicker-guild:settings`를 사용한다.

```ts
interface SaveV1 {
  version: 1;
  savedAt: string;
  gold: number;
  currentStageId: string;
  highestClearedStageId: string | null;
  members: Record<string, { owned: boolean; level: number }>;
  party: string[];
}
```

- 로드 시 파싱·스키마 검증에 실패하면 손상 데이터를 별도 키에 백업하고 새 게임을 제안한다.
- 저장은 보상 지급, 강화, 스테이지 변경 직후와 페이지 숨김 시 수행한다.
- `battleId`, 현재 프레임, 공격 타이머는 저장하지 않는다. 복원 시 현재 스테이지 전투를 새로 시작한다.
- `party`는 최대 4개, 중복 및 미보유 ID를 제거한다.
- 골드·레벨·피해 값은 유한한 0 이상의 수인지 경계에서 검증한다.

## 8. Git 브랜치·worktree 전달 규칙

### 브랜치 제안

```text
codex/integration-shell       # 앱 골격 및 최종 통합
codex/battle-polish           # 다른 PC: 전투 그래픽·스킬
codex/progression-save        # 비전투 로직
codex/ui-qa                   # DOM UI·테스트·검증
```

각 PC와 각 세션은 **서로 다른 worktree와 브랜치**를 사용한다. 네트워크 공유 폴더의 같은 작업 사본을 동시에 열지 않는다.

### 전달 순서

1. 통합 담당자가 계약·공용 타입·빈 전투 어댑터를 먼저 커밋하고 push한다.
2. 각 작업 브랜치는 이 기준 커밋에서 생성하며 소유 경로만 수정한다.
3. 작업자는 전달 전에 자기 브랜치에서 `install → test → build → smoke`를 수행한다.
4. 작업자는 커밋 해시와 아래 전달 패킷을 통합 담당자에게 보낸다.
5. 통합 담당자는 최신 통합 브랜치에서 작업 브랜치를 merge하고 전체 게이트를 다시 실행한다.
6. 충돌은 해당 파일 소유자와 통합 담당자가 함께 해결한다. 바이너리 충돌은 한쪽을 선택하며 자동 병합하지 않는다.
7. 전달 후 작업 브랜치를 강제 push하거나 커밋을 재작성하지 않는다. 후속 수정은 새 커밋으로 보낸다.

### 전달 패킷 템플릿

```text
브랜치/커밋:
소유 범위:
변경 파일:
실행·검증 결과:
새 의존성/설정 변경:
추가·변경 manifest ID:
미완료/폴백 항목:
통합 시 수동 확인:
```

큰 에셋은 작업 단위별 작은 커밋으로 나눈다. 예: `Add Roan runtime sheets`, `Add stage-01 monster manifest`, `Wire heavy-strike hit event`. 코드·기획 문서·수십 개 바이너리를 한 커밋에 섞지 않는다. Git LFS는 이미 팀 전체에 설치·설정된 경우에만 사용하며, 마감 직전에 도입하지 않는다.

## 9. 통합 검수 게이트

| 게이트 | 필수 조건 | 실패 시 처리 |
|---|---|---|
| G0 계약 | 소유 경로 준수, manifest/schema 호환, 새 의존성 사전 승인 | 병합 보류 |
| G1 정적 검사 | 타입 검사·lint·에셋 검증 통과 | 작성자가 수정 |
| G2 단위 테스트 | 피해/보상/강화/저장 테스트 통과 | 로직 병합 보류 |
| G3 빌드 | 깨끗한 환경에서 프로덕션 빌드 성공 | lockfile·경로 수정 |
| G4 기능 스모크 | 1-1 시작→클릭/자동 공격→처치→보상→1-2→저장 복원 | 릴리스 차단 |
| G5 시각 검수 | 360×800, 1280×720에서 잘림 없음; 공격 hit와 피해 표시 일치 | 표현 계층 수정 |
| G6 성능 | 최초 로드 10MB 이하, 일반 전투 중 장시간 멈춤 없음, 탭 비활성 시 타이머 폭주 없음 | 에셋 축소/루프 수정 |
| G7 배포 | 새 브라우저에서 직접 URL 접속·새로고침·자산 로드 성공 | base path/캐시 수정 |

전투 그래픽이 완성되지 않았더라도 G4는 플레이스홀더로 먼저 통과해야 한다. 최종 그래픽 병합은 계산 결과를 바꾸지 않는 G5 작업으로 취급한다.

## 10. 테스트 체크리스트

### 자동 테스트

- 같은 입력과 고정 RNG에서 피해·치명타 결과가 재현됨
- HP가 0 아래로 내려가도 `battleWon`은 한 번만 발생
- 클릭 연타와 자동 공격이 같은 프레임에 발생해도 보상은 한 번만 지급
- 강타 쿨다운 전 재발동 불가, 전투 재시작 시 정책대로 초기화
- 보상 지급 후 골드와 해금 상태가 함께 저장됨
- 강화 비용 부족 시 골드·레벨 모두 바뀌지 않음
- 저장 V1 round-trip, 손상 JSON, 누락 필드, 중복 파티 복구
- manifest 누락 파일·잘못된 프레임 수를 검증기가 실패 처리
- `dispose()` 후 타이머와 이벤트 리스너가 남지 않음

### 수동 스모크

- 새 게임에서 로안과 1-1이 보이며 클릭 공격 가능
- 로안 `idle → attack → idle`, 강타 애니메이션이 끊김 없이 끝남
- 애니메이션 `hit`와 HP/데미지 숫자의 체감 지연이 없음
- 1-10 처치 후 범위 종료 메시지가 표시되고 잘못된 2-1로 넘어가지 않음
- 음소거가 즉시 적용되고 새로고침 후 유지
- 화면 회전·크기 변경 후 버튼과 전투 대상이 클릭 가능
- 빠른 연타, 백그라운드 30초, 복귀 후 전투가 중복 가속되지 않음
- 에셋 하나를 의도적으로 누락했을 때 필수/선택 폴백이 계약대로 동작

## 11. 빌드·배포 체크리스트

### 빌드 전

- 지원 Node 버전 고정 및 lockfile 커밋
- 개발자 전원이 같은 설치 명령 사용
- 타입 검사, 테스트, manifest·에셋 검증 성공
- 실험 원본이 빌드 산출물에 포함되지 않는지 확인
- 소스맵 공개 여부와 `base` 경로 확인

### 배포 전

- 프로덕션 모드에서 초기화·디버그 버튼 숨김 또는 안전장치 적용
- 캐시 가능한 에셋은 content version 또는 해시 파일명 사용
- `index.html`은 짧은 캐시, 해시 에셋은 긴 캐시
- 정적 호스트의 404/새로고침 동작 확인(단일 화면이므로 별도 라우트 금지)
- HTTPS 주소에서 오디오가 첫 사용자 입력 후 정상 재생

### 배포 후 5분 검증

- 캐시 없는 모바일 브라우저와 데스크톱 브라우저에서 접속
- 1-1 처치, 강화, 새로고침 복원
- 개발자 도구에 404·JSON 파싱·CORS 오류 없음
- 배포 커밋·주소·검증 시각 기록
- 문제 발생 시 직전 정상 배포로 즉시 되돌릴 수 있음

## 12. 병렬 구현 티켓과 완료 조건

티켓은 소유 경로가 겹치지 않도록 배치했다. `P0`만으로 데모가 가능하며, P1은 P0 통합 후 수행한다.

### P0-01 웹 골격 및 공용 계약 — 통합 세션

**작업:** Vite TypeScript 앱, 공용 이벤트/타입, 전투 어댑터 인터페이스, 기본 오류 경계 구성.

**완료 조건:** 개발 서버와 프로덕션 빌드가 열리고, 플레이스홀더 전투가 `battleStarted/damageApplied/battleWon` 이벤트를 발생시키며 전투 구현 없이도 UI가 이를 수신한다.

### P0-02 콘텐츠 데이터 — 통합 또는 별도 데이터 세션

**작업:** 1-1~1-10의 ID, HP, 보상과 로안 기본 능력·강타 정의. 숫자는 한 파일에서만 관리.

**완료 조건:** 모든 ID가 manifest와 일치하고, 10개 스테이지의 HP·보상이 양수이며, 1-10 이후 진행 대상이 없다는 테스트가 통과한다.

### P0-03 진행·보상·강화 — 비전투 세션

**작업:** `battleWon` 수신, 골드 지급, 다음 스테이지 해금, 로안 레벨업과 비용 계산.

**완료 조건:** 중복 승리 이벤트로 보상이 중복 지급되지 않고, 골드 부족 강화는 원자적으로 거절되며 단위 테스트가 통과한다.

### P0-04 저장·설정 — 비전투 세션

**작업:** SaveV1 검증, 자동 저장, 복원, 초기화, 음소거 저장.

**완료 조건:** 새로고침 후 필수 상태가 복원되고 손상 저장이 앱을 중단시키지 않으며, 전투 임시 상태는 저장되지 않는다.

### P0-05 DOM HUD·반응형 셸 — UI 세션

**작업:** 스테이지/HP/골드, 클릭 영역, 로안 강화, 설정과 오류 패널.

**완료 조건:** 360×800과 1280×720에서 겹침·가로 스크롤 없이 핵심 조작이 가능하고 키보드 포커스와 버튼 라벨이 존재한다.

### P0-06 전투 결과물 어댑터 — 전투 PC와 통합 담당 공동

**작업:** 다른 PC의 전투 컨트롤러를 공개 API에 맞추고 Canvas를 앱 셸에 장착.

**완료 조건:** 비전투 모듈 수정 없이 플레이스홀더 구현을 실제 전투 구현으로 교체할 수 있고 `dispose()` 뒤 타이머·리스너가 남지 않는다.

### P0-07 에셋 인입·manifest — 전투 PC 소유, 통합 담당 검수

**작업:** 승인된 로안/몬스터를 런타임 폴더에 배치, manifest 생성, 검증 실행.

**완료 조건:** 실험 원본 경로 직접 참조가 없고, 시트 치수·타이밍·anchor 검증이 통과하며, 필수 에셋 실패 폴백을 재현한다.

### P0-08 스모크·릴리스 — QA/통합 세션

**작업:** 단위 테스트와 핵심 스모크 자동화, 정적 호스트 배포, 배포 후 검증.

**완료 조건:** G0~G7이 모두 통과하고 배포 URL·커밋·알려진 제한이 기록된다.

### P1-01 피드백과 접근성

**작업:** 피격 플래시, 데미지 숫자, 선택적 진동, reduced-motion 대응, 색상 외 HP 정보.

**완료 조건:** 효과가 없어도 상태를 이해할 수 있고 `prefers-reduced-motion`에서 큰 흔들림·번쩍임이 줄어든다.

### P1-02 성능·메모리

**작업:** 유휴 프리로드, 이미지 해제, 백그라운드 일시정지, 큰 정지 이미지 변환.

**완료 조건:** 최초 로드 예산을 만족하고 1-1~1-10 반복 진행 후 이미지·타이머가 계속 누적되지 않는다.

## 13. 지금 즉시 실행할 병렬 순서

1. **통합 세션:** P0-01과 공용 계약을 먼저 60~90분 내 고정한다.
2. **비전투 세션:** 계약 커밋 기준으로 P0-03과 P0-04를 구현한다.
3. **UI·QA 세션:** 전투 플레이스홀더를 사용해 P0-05와 테스트 골격을 만든다.
4. **다른 PC:** 현재 전투 그래픽·스킬을 P0-06/P0-07 계약에 맞추되 소유 경로 밖은 수정하지 않는다.
5. **첫 통합:** 그래픽 완성 전 플레이스홀더로 1-1 한 판의 G4를 통과한다.
6. **두 번째 통합:** 실제 전투와 에셋을 교체하고 1-1~1-10, 저장 복원, G5~G7만 닫는다.

마감 직전에는 새 기능보다 “한 판 완료 → 보상 → 강화 → 다음 판 → 새로고침 복원”의 끊기지 않는 경로를 우선한다. 전투 그래픽과 스킬 결과물은 이 경로에 꽂히는 교체 가능한 모듈이어야 하며, 비전투 시스템의 완료를 기다리지 않고 독립적으로 검수할 수 있어야 한다.
