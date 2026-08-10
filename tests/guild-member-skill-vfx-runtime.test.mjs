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
  assert.match(resolverSource, /GUILD_MEMBER_SKILL_VFX_DURATION_MS = 1050/);
});

test("renders dedicated art for skills while retaining generic passive attacks", async () => {
  const [game, css] = await Promise.all([
    readFile(new URL("app/Game.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(game, /effect\.skill \? guildMemberSkillVfxSource\(effect\.memberId\) : null/);
  assert.match(game, /skillVfxSource \? <>/);
  assert.match(game, /className="member-skill-vfx-art"/);
  assert.match(game, /className="member-projectile primary"/);
  assert.match(game, /skill \? GUILD_MEMBER_SKILL_VFX_DURATION_MS : 720/);
  assert.match(css, /\.member-skill-vfx-art/);
  assert.match(css, /@keyframes memberSkillVfxArt/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
