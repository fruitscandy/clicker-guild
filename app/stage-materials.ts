export type LootSoundProfile = "coin" | "organic" | "crystal" | "stone" | "molten" | "ethereal" | "scale";

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
  soundProfile: Exclude<LootSoundProfile, "coin">;
  rewardAmount: number;
  boss: boolean;
};

export type WeaponMaterialRecipe = {
  weaponTier: number;
  material: StageMaterial;
  amount: number;
};

const MATERIAL_FAMILIES = [
  { familyName: "새싹 호박", accent: "#aee856", soundProfile: "organic" as const, description: "초목의 생명력이 굳어 만들어진 수림 촉매" },
  { familyName: "태양 유리", accent: "#ffd25e", soundProfile: "crystal" as const, description: "메마른 모래와 햇빛이 고열로 융합된 결정" },
  { familyName: "독무 포자옥", accent: "#b878ff", soundProfile: "organic" as const, description: "늪의 독기와 포자가 층층이 응결된 연금 재료" },
  { familyName: "흑철 수정", accent: "#e4a56f", soundProfile: "stone" as const, description: "폐광의 흑철과 구리 맥이 함께 자란 광석" },
  { familyName: "빙결 심장석", accent: "#79e8ff", soundProfile: "crystal" as const, description: "혹한의 마력이 심장 모양으로 얼어붙은 결정" },
  { familyName: "용암 화핵", accent: "#ff7a38", soundProfile: "molten" as const, description: "식지 않는 마그마를 검은 화산각이 감싼 핵" },
  { familyName: "망자의 혼주", accent: "#b9eeff", soundProfile: "ethereal" as const, description: "떠도는 혼과 은빛 재가 고요히 뭉친 영혼구" },
  { familyName: "뇌운 마나석", accent: "#8d83ff", soundProfile: "crystal" as const, description: "마나 폭풍의 번개를 내부에 가둔 프리즘" },
  { familyName: "마혈 흑요석", accent: "#ff5e67", soundProfile: "molten" as const, description: "마군의 피와 저주가 흑요석에 스며든 파편" },
  { familyName: "고룡 비늘", accent: "#69d9dd", soundProfile: "scale" as const, description: "고대 용의 마력이 무지갯빛으로 남은 비늘" },
] as const;

const STAGE_GRADES = [
  "거친",
  "이슬 맺힌",
  "맥동하는",
  "정제된",
  "빛나는",
  "공명하는",
  "각인된",
  "찬란한",
  "왕실",
  "군주의",
] as const;

const WEAPON_RECIPE_STAGES = [1, 3, 5, 10, 14, 20, 28, 38, 48, 58, 68, 78, 88, 98] as const;
const WEAPON_RECIPE_AMOUNTS = [4, 6, 8, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32] as const;

function clampStage(stage: number) {
  return Math.min(100, Math.max(1, Math.round(stage)));
}

export function stageMaterialFor(stage: number): StageMaterial {
  const safeStage = clampStage(stage);
  const region = Math.ceil(safeStage / 10);
  const localStage = (safeStage - 1) % 10 + 1;
  const family = MATERIAL_FAMILIES[region - 1];
  const boss = localStage === 10;
  return {
    id: `stage-material-${String(safeStage).padStart(3, "0")}`,
    stage: safeStage,
    region,
    localStage,
    name: `${STAGE_GRADES[localStage - 1]} ${family.familyName}`,
    familyName: family.familyName,
    description: `${family.description}. ${region}지역 ${localStage}구역에서만 획득할 수 있습니다.`,
    iconIndex: region - 1,
    variant: localStage - 1,
    accent: family.accent,
    soundProfile: family.soundProfile,
    rewardAmount: (boss ? 16 : 5) + region + Math.ceil(localStage / 2) + (boss ? region : 0),
    boss,
  };
}

export function stageMaterialById(id: string) {
  const match = /^stage-material-(\d{3})$/.exec(id);
  if (!match) return null;
  const stage = Number(match[1]);
  if (stage < 1 || stage > 100) return null;
  return stageMaterialFor(stage);
}

export function weaponMaterialRecipe(weaponTier: number): WeaponMaterialRecipe | null {
  if (weaponTier < 1 || weaponTier > WEAPON_RECIPE_STAGES.length) return null;
  const index = weaponTier - 1;
  return {
    weaponTier,
    material: stageMaterialFor(WEAPON_RECIPE_STAGES[index]),
    amount: WEAPON_RECIPE_AMOUNTS[index],
  };
}

export function canAffordWeaponRecipe(inventory: Readonly<Record<string, number>>, recipe: WeaponMaterialRecipe | null) {
  if (!recipe) return true;
  return (inventory[recipe.material.id] ?? 0) >= recipe.amount;
}

export function consumeWeaponRecipe(inventory: Readonly<Record<string, number>>, recipe: WeaponMaterialRecipe | null) {
  if (!recipe) return { ...inventory };
  const owned = inventory[recipe.material.id] ?? 0;
  if (owned < recipe.amount) return null;
  return { ...inventory, [recipe.material.id]: owned - recipe.amount };
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
