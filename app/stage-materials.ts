export type GoldLootSoundProfile = "coin" | "coin-pouch" | "cash-bundle";

export type MaterialLootSoundProfile =
  | "seed-amber"
  | "sun-glass"
  | "toxic-spore"
  | "black-iron"
  | "frost-heart"
  | "magma-core"
  | "soul-pearl"
  | "storm-prism"
  | "blood-obsidian"
  | "dragon-scale";

export type LootSoundProfile = GoldLootSoundProfile | MaterialLootSoundProfile;

export type StageMaterial = {
  id: string;
  stage: number;
  region: number;
  localStage: number;
  name: string;
  familyName: string;
  description: string;
  iconIndex: number;
  variant: number;
  accent: string;
  soundProfile: MaterialLootSoundProfile;
  rewardAmount: number;
  boss: boolean;
};

const MATERIAL_FAMILIES = [
  { familyName: "새싹 호박", accent: "#aee856", soundProfile: "seed-amber" as const, description: "초목의 생명력이 굳어 만들어진 수림 촉매" },
  { familyName: "태양 유리", accent: "#ffd25e", soundProfile: "sun-glass" as const, description: "메마른 모래와 햇빛이 고열로 융합된 결정" },
  { familyName: "독무 포자옥", accent: "#b878ff", soundProfile: "toxic-spore" as const, description: "늪의 독기와 포자가 층층이 응결된 연금 재료" },
  { familyName: "흑철 수정", accent: "#e4a56f", soundProfile: "black-iron" as const, description: "폐광의 흑철과 구리 맥이 함께 자란 광석" },
  { familyName: "빙결 심장석", accent: "#79e8ff", soundProfile: "frost-heart" as const, description: "혹한의 마력이 심장 모양으로 얼어붙은 결정" },
  { familyName: "용암 화핵", accent: "#ff7a38", soundProfile: "magma-core" as const, description: "식지 않는 마그마를 검은 화산각이 감싼 핵" },
  { familyName: "망자의 혼주", accent: "#b9eeff", soundProfile: "soul-pearl" as const, description: "떠도는 혼과 은빛 재가 고요히 뭉친 영혼구" },
  { familyName: "뇌운 마나석", accent: "#8d83ff", soundProfile: "storm-prism" as const, description: "마나 폭풍의 번개를 내부에 가둔 프리즘" },
  { familyName: "마혈 흑요석", accent: "#ff5e67", soundProfile: "blood-obsidian" as const, description: "마군의 피와 저주가 흑요석에 스며든 파편" },
  { familyName: "고룡 비늘", accent: "#69d9dd", soundProfile: "dragon-scale" as const, description: "고대 용의 마력이 무지갯빛으로 남은 비늘" },
] as const;

const STAGE_GRADES = [
  "거친",
  "폭주하는",
  "군주의",
] as const;

function clampStage(stage: number) {
  return Math.min(30, Math.max(1, Math.round(stage)));
}

export function stageMaterialFor(stage: number): StageMaterial {
  const safeStage = clampStage(stage);
  const region = Math.ceil(safeStage / 3);
  const localStage = (safeStage - 1) % 3 + 1;
  const family = MATERIAL_FAMILIES[region - 1];
  const boss = localStage === 3;
  return {
    id: `stage-material-${String(safeStage).padStart(3, "0")}`,
    stage: safeStage,
    region,
    localStage,
    name: `${STAGE_GRADES[localStage - 1]} ${family.familyName}`,
    familyName: family.familyName,
    description: `${family.description}. ${region}지역 ${localStage}웨이브에서만 획득할 수 있습니다.`,
    iconIndex: region - 1,
    variant: localStage - 1,
    accent: family.accent,
    soundProfile: family.soundProfile,
    rewardAmount: boss ? 18 + region * 2 : 7 + region + localStage * 2,
    boss,
  };
}

export function stageMaterialById(id: string) {
  const match = /^stage-material-(\d{3})$/.exec(id);
  if (!match) return null;
  const stage = Number(match[1]);
  if (stage < 1 || stage > 30) return null;
  return stageMaterialFor(stage);
}

export function materialIconVars(material: StageMaterial) {
  return {
    "--material-column": material.iconIndex % 5,
    "--material-row": Math.floor(material.iconIndex / 5),
    "--material-rune": `"${material.localStage}"`,
    "--material-accent": material.accent,
    "--material-hue": `${(material.variant - 4.5) * 2.25}deg`,
  };
}
