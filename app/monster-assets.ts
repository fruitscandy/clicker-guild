export type MonsterMotion = "idle" | "hit" | "death";

type MonsterAsset = {
  id: string;
  name: string;
  source: string;
  scale?: number;
};

const BEGINNERS_FOREST_MONSTERS: MonsterAsset[] = [
  { id: "small-green-slime", name: "작은 초록 슬라임", source: "/assets/monsters/stage-01/stage-01-01-small-green-slime.png", scale: 0.88 },
  { id: "horned-rabbit", name: "뿔토끼", source: "/assets/monsters/stage-01/stage-01-02-horned-rabbit.png", scale: 0.9 },
  { id: "forest-rat", name: "숲쥐", source: "/assets/monsters/stage-01/stage-01-03-forest-rat.png", scale: 0.92 },
  { id: "young-goblin", name: "어린 고블린", source: "/assets/monsters/stage-01/stage-01-04-young-goblin.png" },
  { id: "stinger-bee", name: "독침벌", source: "/assets/monsters/stage-01/stage-01-05-stinger-bee.png", scale: 0.92 },
  { id: "vine-monster", name: "덩굴 괴물", source: "/assets/monsters/stage-01/stage-01-06-vine-monster.png", scale: 0.96 },
  { id: "goblin-thrower", name: "고블린 투척병", source: "/assets/monsters/stage-01/stage-01-07-goblin-thrower.png" },
  { id: "gray-wolf", name: "회색늑대", source: "/assets/monsters/stage-01/stage-01-08-gray-wolf.png", scale: 0.95 },
  { id: "forest-ogre", name: "숲 오우거", source: "/assets/monsters/stage-01/stage-01-09-forest-ogre.png", scale: 1.04 },
  { id: "goblin-chieftain-grukan", name: "고블린 족장 그루칸", source: "/assets/monsters/stage-01/stage-01-10-goblin-chieftain-grukan.png", scale: 1.08 },
];

export function monsterAssetForStage(stage: number) {
  if (stage < 1 || stage > 10) return null;
  return BEGINNERS_FOREST_MONSTERS[stage - 1];
}

export function beginnerForestMonsterName(localStage: number) {
  return BEGINNERS_FOREST_MONSTERS[Math.max(0, Math.min(9, localStage - 1))].name;
}
