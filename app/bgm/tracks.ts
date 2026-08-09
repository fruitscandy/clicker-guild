export type BgmTrackId = "guild" | "field-select" | "battle" | "boss";

export type BgmTrack = {
  id: BgmTrackId;
  title: string;
  subtitle: string;
  scene: string;
  bpm: number;
  duration: string;
  source: string;
  palette: string;
};

export const BGM_TRACKS: readonly BgmTrack[] = [
  {
    id: "guild",
    title: "길드의 화롯불",
    subtitle: "Guild Hearth",
    scene: "길드 관리",
    bpm: 84,
    duration: "0:46",
    source: "/assets/audio/bgm/guild-hearth.wav",
    palette: "류트 · 따뜻한 패드 · 작은 종",
  },
  {
    id: "field-select",
    title: "미답의 경계",
    subtitle: "Frontier Map",
    scene: "필드 선택",
    bpm: 96,
    duration: "0:40",
    source: "/assets/audio/bgm/frontier-map.wav",
    palette: "플루트 · 탐험 아르페지오 · 행진 리듬",
  },
  {
    id: "battle",
    title: "강철의 질주",
    subtitle: "Steel Rush",
    scene: "일반 전투",
    bpm: 136,
    duration: "0:28",
    source: "/assets/audio/bgm/steel-rush.wav",
    palette: "현악 오스티나토 · 전투 북 · 브라스",
  },
  {
    id: "boss",
    title: "파멸의 왕관",
    subtitle: "Crown of Ruin",
    scene: "보스 전투",
    bpm: 150,
    duration: "0:26",
    source: "/assets/audio/bgm/crown-of-ruin.wav",
    palette: "저음 합창 · 대형 북 · 불협 브라스",
  },
] as const;

export const BGM_TRACK_BY_ID = Object.fromEntries(
  BGM_TRACKS.map((track) => [track.id, track]),
) as Record<BgmTrackId, BgmTrack>;

export type BattleBgmCandidate = {
  id: string;
  candidate: "A" | "B" | "C" | "D";
  current: boolean;
  title: string;
  subtitle: string;
  bpm: number;
  duration: string;
  source: string;
  palette: string;
  direction: string;
  tradeoff: string;
};

export const BATTLE_BGM_CANDIDATES: readonly BattleBgmCandidate[] = [
  {
    id: "steel-rush",
    candidate: "A",
    current: true,
    title: "강철의 질주",
    subtitle: "Steel Rush",
    bpm: 136,
    duration: "0:28",
    source: "/assets/audio/bgm/steel-rush.wav",
    palette: "현악 오스티나토 · 전투 북 · 브라스",
    direction: "최종 선택 · 액션형",
    tradeoff: "최초 선택안으로 최종 확정했습니다. 빠른 타격감과 속도감을 중심으로 반복 전투의 추진력을 살립니다.",
  },
  {
    id: "banner-and-blade",
    candidate: "B",
    current: false,
    title: "깃발과 검",
    subtitle: "Banner & Blade",
    bpm: 124,
    duration: "0:31",
    source: "/assets/audio/bgm/banner-and-blade.wav",
    palette: "류트 · 허디거디 드론 · 프레임 드럼 · 뿔피리",
    direction: "정통 중세 원정대",
    tradeoff: "중세 정체성과 전투 속도의 균형이 좋아 지역별 변주나 테마 이벤트 후보로 보관합니다.",
  },
  {
    id: "siege-at-dusk",
    candidate: "C",
    current: false,
    title: "황혼의 공성",
    subtitle: "Siege at Dusk",
    bpm: 112,
    duration: "0:34",
    source: "/assets/audio/bgm/siege-at-dusk.wav",
    palette: "저음 현악 · 뿔피리 · 전쟁 쇠북 · 대형 북",
    direction: "무거운 공성전",
    tradeoff: "긴장감과 무게는 강하지만 반복 전투에서는 다소 묵직하게 느껴질 수 있어 보관 후보로 남깁니다.",
  },
  {
    id: "guild-melee",
    candidate: "D",
    current: false,
    title: "길드의 회전",
    subtitle: "Guild Melee",
    bpm: 144,
    duration: "0:27",
    source: "/assets/audio/bgm/guild-melee.wav",
    palette: "민속 춤 리듬 · 류트 · 리코더 · 빠른 손북",
    direction: "경쾌한 중세 난전",
    tradeoff: "클리커의 경쾌함은 살지만 진지한 보스 분위기와는 거리가 있어 축제형 이벤트 후보로 보관합니다.",
  },
] as const;
