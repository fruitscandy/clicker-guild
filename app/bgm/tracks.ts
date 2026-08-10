export type BgmSceneId = "guild" | "field-select" | "battle" | "boss";

export type BgmTrackId =
  | "guild-hearth"
  | "frontier-map"
  | "vanguards-charge"
  | "iron-advance"
  | "fantasy-boss-battle"
  | "fantasy-boss-battle-take-2";

export type BgmTrack = {
  id: BgmTrackId;
  sceneId: BgmSceneId;
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
    id: "guild-hearth",
    sceneId: "guild",
    title: "길드의 화롯불",
    subtitle: "Guild Hearth",
    scene: "길드 영지",
    bpm: 84,
    duration: "0:46",
    source: "/assets/audio/bgm/guild-hearth.wav",
    palette: "류트 · 따뜻한 패드 · 작은 종",
  },
  {
    id: "frontier-map",
    sceneId: "field-select",
    title: "미답의 경계",
    subtitle: "Frontier Map",
    scene: "필드 선택",
    bpm: 96,
    duration: "0:40",
    source: "/assets/audio/bgm/frontier-map.wav",
    palette: "플루트 · 탐험 아르페지오 · 행진 리듬",
  },
  {
    id: "vanguards-charge",
    sceneId: "battle",
    title: "선봉대의 돌격",
    subtitle: "Vanguard's Charge",
    scene: "일반 전투",
    bpm: 110,
    duration: "2:52",
    source: "/assets/audio/bgm/flow-candidates/vanguards-charge.m4a",
    palette: "절제된 전투 북 · 현악 오스티나토 · 영웅적 브라스",
  },
  {
    id: "iron-advance",
    sceneId: "battle",
    title: "강철의 진군",
    subtitle: "Iron Advance",
    scene: "일반 전투",
    bpm: 110,
    duration: "2:57",
    source: "/assets/audio/bgm/flow-candidates/iron-advance.m4a",
    palette: "묵직한 행진 리듬 · 리듬 현악 · 모험적 선율",
  },
  {
    id: "fantasy-boss-battle",
    sceneId: "boss",
    title: "환상 보스 전투",
    subtitle: "Fantasy Boss Battle",
    scene: "보스 전투",
    bpm: 140,
    duration: "3:00",
    source: "/assets/audio/bgm/flow-candidates/fantasy-boss-battle.m4a",
    palette: "긴박한 현악 · 시네마틱 전쟁 북 · 강렬한 브라스",
  },
  {
    id: "fantasy-boss-battle-take-2",
    sceneId: "boss",
    title: "환상 보스 전투 II",
    subtitle: "Fantasy Boss Battle (Take 2)",
    scene: "보스 전투",
    bpm: 140,
    duration: "2:52",
    source: "/assets/audio/bgm/flow-candidates/fantasy-boss-battle-take-2.m4a",
    palette: "어두운 상승 긴장 · 대형 북 · 승리의 브라스",
  },
] as const;

export const BGM_TRACK_BY_ID = Object.fromEntries(
  BGM_TRACKS.map((track) => [track.id, track]),
) as Record<BgmTrackId, BgmTrack>;

export type BgmTrackPool = readonly [BgmTrack, ...BgmTrack[]];

export const BGM_TRACKS_BY_SCENE = Object.fromEntries(
  (["guild", "field-select", "battle", "boss"] as const).map((sceneId) => {
    const tracks = BGM_TRACKS.filter((track) => track.sceneId === sceneId);
    if (tracks.length === 0) throw new Error(`BGM scene has no tracks: ${sceneId}`);
    return [sceneId, tracks as unknown as BgmTrackPool];
  }),
) as unknown as Record<BgmSceneId, BgmTrackPool>;

export type BattleBgmCandidate = {
  id: string;
  candidate: "A" | "B" | "C" | "D";
  current: boolean;
  title: string;
  subtitle: string;
  scene: "일반 전투" | "보스 전투";
  bpm: number;
  duration: string;
  source: string;
  palette: string;
  direction: string;
  tradeoff: string;
};

export const BATTLE_BGM_CANDIDATES: readonly BattleBgmCandidate[] = BGM_TRACKS
  .filter((track) => track.sceneId === "battle" || track.sceneId === "boss")
  .map((track, index) => ({
    ...track,
    candidate: (["A", "B", "C", "D"] as const)[index],
    current: true,
    scene: track.sceneId === "boss" ? "보스 전투" as const : "일반 전투" as const,
    direction: track.sceneId === "boss" ? "보스 전투 순환곡" : "일반 전투 순환곡",
    tradeoff: track.sceneId === "boss"
      ? "보스 전투에 진입할 때 두 보스 테마를 번갈아 재생합니다."
      : "일반 전투에 진입할 때 두 일반 전투 테마를 번갈아 재생합니다.",
  }));
