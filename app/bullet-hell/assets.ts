export type FinaleBulletAssetKind = "upgrade" | "weapon" | "boss";

export type FinaleBulletAsset = Readonly<{
  id: string;
  kind: FinaleBulletAssetKind;
  label: string;
  source: string;
  radius: number;
  scale: number;
}>;

export const FINALE_UPGRADE_BULLET_ASSETS = [
  { id: "upgrade-range", kind: "upgrade", label: "참격 범위", source: "/assets/upgrades/range.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-critical", kind: "upgrade", label: "치명타", source: "/assets/upgrades/critical.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-combo", kind: "upgrade", label: "연격 리듬", source: "/assets/upgrades/combo.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-execution", kind: "upgrade", label: "처형술", source: "/assets/upgrades/execution.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-shockwave", kind: "upgrade", label: "충격파", source: "/assets/upgrades/shockwave.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-momentum", kind: "upgrade", label: "전투 몰입", source: "/assets/upgrades/momentum.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-time", kind: "upgrade", label: "원정 보급", source: "/assets/upgrades/time.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-scout", kind: "upgrade", label: "전장 정찰", source: "/assets/upgrades/scout.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-guild", kind: "upgrade", label: "길드 전술", source: "/assets/upgrades/guild.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-gold", kind: "upgrade", label: "행운의 금고", source: "/assets/upgrades/gold.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-tavern", kind: "upgrade", label: "여관 증축", source: "/assets/upgrades/tavern.webp", radius: 10, scale: 0.72 },
  { id: "upgrade-loot", kind: "upgrade", label: "전리품 감정", source: "/assets/upgrades/loot.webp", radius: 10, scale: 0.72 },
] as const satisfies readonly FinaleBulletAsset[];

export const FINALE_WEAPON_BULLET_ASSETS = [
  { id: "weapon-01-training-longsword", kind: "weapon", label: "훈련용 장검", source: "/assets/weapons/tier-01-training-longsword.webp", radius: 8, scale: 0.48 },
  { id: "weapon-02-crescent-saber", kind: "weapon", label: "초승달 도", source: "/assets/weapons/tier-02-crescent-saber.webp", radius: 8, scale: 0.48 },
  { id: "weapon-03-twin-blades", kind: "weapon", label: "쌍날검", source: "/assets/weapons/tier-03-twin-blades.webp", radius: 8, scale: 0.46 },
  { id: "weapon-04-rune-breaker", kind: "weapon", label: "룬 파쇄검", source: "/assets/weapons/tier-04-rune-breaker.webp", radius: 9, scale: 0.48 },
  { id: "weapon-05-sky-sword", kind: "weapon", label: "천공검", source: "/assets/weapons/tier-05-sky-sword.webp", radius: 9, scale: 0.48 },
  { id: "weapon-06-nebula-saber", kind: "weapon", label: "성운도", source: "/assets/weapons/tier-06-nebula-saber.webp", radius: 9, scale: 0.48 },
  { id: "weapon-07-dragon-vein", kind: "weapon", label: "용맥검", source: "/assets/weapons/tier-07-dragon-vein.webp", radius: 9, scale: 0.48 },
  { id: "weapon-08-celestial-sword", kind: "weapon", label: "천상검", source: "/assets/weapons/tier-08-celestial-sword.webp", radius: 9, scale: 0.48 },
  { id: "weapon-09-blood-moon", kind: "weapon", label: "혈월도", source: "/assets/weapons/tier-09-blood-moon.webp", radius: 9, scale: 0.48 },
  { id: "weapon-10-storm-twin-blades", kind: "weapon", label: "폭풍쌍검", source: "/assets/weapons/tier-10-storm-twin-blades.webp", radius: 9, scale: 0.46 },
  { id: "weapon-11-radiant-greatsword", kind: "weapon", label: "성휘 대검", source: "/assets/weapons/tier-11-radiant-greatsword.webp", radius: 10, scale: 0.5 },
  { id: "weapon-12-abyss-sword", kind: "weapon", label: "심연검", source: "/assets/weapons/tier-12-abyss-sword.webp", radius: 9, scale: 0.48 },
  { id: "weapon-13-time-cutter", kind: "weapon", label: "시간절단검", source: "/assets/weapons/tier-13-time-cutter.webp", radius: 9, scale: 0.48 },
  { id: "weapon-14-world-tree", kind: "weapon", label: "세계수 성검", source: "/assets/weapons/tier-14-world-tree.webp", radius: 10, scale: 0.5 },
  { id: "weapon-15-guildmaster-divine", kind: "weapon", label: "길드마스터 신검", source: "/assets/weapons/tier-15-guildmaster-divine.webp", radius: 10, scale: 0.5 },
] as const satisfies readonly FinaleBulletAsset[];

export const FINALE_BOSS_BULLET_ASSETS = [
  { id: "boss-01-goblin-chieftain", kind: "boss", label: "고블린 족장 그루칸", source: "/assets/monsters/stage-01/stage-01-10-goblin-chieftain-grukan.png", radius: 14, scale: 0.36 },
  { id: "boss-02-desert-tyrant", kind: "boss", label: "사막의 폭군", source: "/assets/monsters/region-02/region-02-boss-desert-tyrant.png", radius: 14, scale: 0.36 },
  { id: "boss-03-swamp-witch", kind: "boss", label: "늪의 마녀", source: "/assets/monsters/region-03/region-03-boss-swamp-witch.png", radius: 14, scale: 0.36 },
  { id: "boss-04-ironclad-excavator", kind: "boss", label: "철갑 굴착수", source: "/assets/monsters/region-04/region-04-boss-ironclad-excavator.png", radius: 15, scale: 0.38 },
  { id: "boss-05-icewall-giant", kind: "boss", label: "빙벽 거인", source: "/assets/monsters/region-05/region-05-boss-icewall-giant.png", radius: 15, scale: 0.38 },
  { id: "boss-06-heart-of-volcano", kind: "boss", label: "화산의 심장", source: "/assets/monsters/region-06/region-06-boss-heart-of-volcano.png", radius: 15, scale: 0.38 },
  { id: "boss-07-graveyard-lord", kind: "boss", label: "묘지의 군주", source: "/assets/monsters/region-07/region-07-boss-graveyard-lord.png", radius: 14, scale: 0.36 },
  { id: "boss-08-storm-spirit-king", kind: "boss", label: "폭풍 정령왕", source: "/assets/monsters/region-08/region-08-boss-storm-spirit-king.png", radius: 14, scale: 0.36 },
  { id: "boss-09-demon-army-commander", kind: "boss", label: "마왕군 사령관", source: "/assets/monsters/region-09/region-09-boss-demon-army-commander.png", radius: 15, scale: 0.38 },
  { id: "boss-10-ancient-sky-dragon", kind: "boss", label: "태고의 천공룡", source: "/assets/monsters/region-10/region-10-boss-ancient-sky-dragon.png", radius: 16, scale: 0.4 },
] as const satisfies readonly FinaleBulletAsset[];

/**
 * Stable sprite table used by the simulation. Bullet sprite IDs are indices
 * into this array, keeping render data out of the deterministic engine state.
 */
export const FINALE_BULLET_ASSETS: readonly FinaleBulletAsset[] = [
  ...FINALE_UPGRADE_BULLET_ASSETS,
  ...FINALE_WEAPON_BULLET_ASSETS,
  ...FINALE_BOSS_BULLET_ASSETS,
];

export function finaleBulletAsset(index: number): FinaleBulletAsset {
  const integer = Number.isFinite(index) ? Math.trunc(index) : 0;
  const wrappedIndex = ((integer % FINALE_BULLET_ASSETS.length) + FINALE_BULLET_ASSETS.length) % FINALE_BULLET_ASSETS.length;
  return FINALE_BULLET_ASSETS[wrappedIndex];
}

export const FINALE_GUILD_ATLAS = {
  source: "/assets/guild/guild-growth-sprites-v1.png",
  width: 1536,
  height: 1024,
  columns: 3,
  rows: 2,
  frameWidth: 512,
  frameHeight: 512,
} as const;

export const FINALE_VFX_ASSETS = {
  impactFlash: "/assets/vfx/special/impact-flash.png",
  impactRing: "/assets/vfx/special/impact-ring.png",
  lightningSpark: "/assets/vfx/special/lightning-spark.png",
  meteorExplosion: "/assets/vfx/special/meteor-explosion.png",
  smokeWisp: "/assets/vfx/special/smoke-wisp.png",
  tornadoTwirl: "/assets/vfx/special/tornado-twirl.png",
  steelSlash: "/assets/vfx/weapon/steel-slash.webp",
  spark: "/assets/vfx/kenney/spark_05.png",
} as const;
