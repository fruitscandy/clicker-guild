import { MEMBER_ANIMATION_SKILLS } from "./member-animations";

const GUILD_MEMBER_SKILL_VFX_ROOT = "/assets/vfx/guild-members";

export const GUILD_MEMBER_SKILL_VFX_DURATION_MS = 1050;

export function guildMemberSkillVfxSource(memberId: string) {
  const skillSlug = MEMBER_ANIMATION_SKILLS[memberId];
  return skillSlug
    ? `${GUILD_MEMBER_SKILL_VFX_ROOT}/${memberId}-${skillSlug}.webp`
    : null;
}
