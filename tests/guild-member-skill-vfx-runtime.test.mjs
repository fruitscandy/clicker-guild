import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("connects every guild member skill manifest entry to the runtime resolver", async () => {
  const [manifestText, animationSource, resolverSource] = await Promise.all([
    readFile(new URL("public/assets/vfx/guild-members/manifest.json", root), "utf8"),
    readFile(new URL("app/member-animations.ts", root), "utf8"),
    readFile(new URL("app/guild-member-skill-vfx.ts", root), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.members.length, 25);
  for (const member of manifest.members) {
    const expectedSlug = member.asset.replace(`${member.id}-`, "").replace(/\.webp$/, "");
    assert.match(animationSource, new RegExp(`${member.id}: ["']${expectedSlug}["']`));
  }
  assert.match(resolverSource, /MEMBER_ANIMATION_SKILLS\[memberId\]/);
  assert.match(resolverSource, /\/assets\/vfx\/guild-members/);
  assert.match(resolverSource, /GUILD_MEMBER_BASIC_VFX_DURATION_MS = 520/);
  assert.match(resolverSource, /GUILD_MEMBER_SKILL_VFX_DURATION_MS = 840/);
});

test("renders member-specific art for both basic attacks and skills with a safe fallback", async () => {
  const [game, css] = await Promise.all([
    readFile(new URL("app/Game.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(game, /const memberVfxSource = guildMemberSkillVfxSource\(effect\.memberId\)/);
  assert.match(game, /effect\.skill \? "is-skill" : "is-basic"/);
  assert.match(game, /memberVfxSource \? <>/);
  assert.match(game, /className="member-skill-vfx-art"/);
  assert.match(game, /className="member-skill-vfx-impact"/);
  assert.match(game, /className="member-skill-vfx-trail"/);
  assert.match(game, /className="member-projectile primary"/);
  assert.match(game, /skill \? GUILD_MEMBER_SKILL_VFX_DURATION_MS : GUILD_MEMBER_BASIC_VFX_DURATION_MS/);
  assert.match(css, /\.member-skill-vfx-art/);
  assert.match(css, /\.member-weapon-fx\.is-basic \.member-skill-vfx-art/);
  assert.match(css, /@keyframes memberBasicVfxArt/);
  assert.match(css, /@keyframes memberSkillVfxArt/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
