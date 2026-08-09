export type MemberMotion = "idle" | "attack" | "skill";

export const MEMBER_ANIMATION_SKILLS: Record<string, string> = {
  roan: "heavy-strike",
  mia: "rapid-volley",
  finn: "vital-strike",
  lulu: "magic-bullet",
  ellie: "blessing-light",
  garon: "shield-bash",
  reina: "aimed-shot",
  bruno: "triple-strike",
  sera: "flame-explosion",
  popo: "corrosive-potion",
  kyle: "piercing-charge",
  nera: "shadow-strike",
  iris: "ice-shard",
  rio: "battle-song",
  jade: "rapid-fire",
  ur: "fury-axe",
  adel: "holy-judgment",
  theo: "chain-lightning",
  nabi: "wind-spirit",
  ren: "iaijutsu",
  gray: "magic-bombardment",
  mor: "hands-of-dead",
  aila: "magic-slash",
  drake: "dragon-charge",
  zello: "royal-division",
};

export function memberAnimationSource(memberId: string, motion: MemberMotion) {
  const filenameMotion = motion === "skill"
    ? MEMBER_ANIMATION_SKILLS[memberId]
    : motion;
  return `/assets/guild-members/${memberId}/${memberId}-${filenameMotion}-preview.webp`;
}
