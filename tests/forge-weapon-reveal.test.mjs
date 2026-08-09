import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the forge reveals only owned weapons and the next silhouette", async () => {
  const [forge, styles] = await Promise.all([
    readFile(new URL("../app/guild-hub/ForgeWorkshop.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.module.css", import.meta.url), "utf8"),
  ]);

  const details = forge.slice(forge.indexOf("<dl>"), forge.indexOf("</dl>") + 5);
  assert.equal((details.match(/<dt>/g) ?? []).length, 1, "weapon details should contain one stat only");
  assert.match(details, /<dt>공격력<\/dt>/);
  assert.doesNotMatch(details, /공격 연출|강화 효과/);
  assert.match(forge, /label="다음 무기 실루엣" locked className=\{styles\.heroWeapon\}/);
  assert.match(forge, /const hidden = weapon\.tier > currentLevel \+ 1;/);
  assert.match(forge, /disabled=\{hidden\}/);
  assert.match(forge, /hidden\s*\? <span className=\{styles\.hiddenCardGlyph\} aria-hidden="true">\?\?\?<\/span>/);
  assert.match(forge, /<strong>\{unlocked \? weapon\.weaponName : craftable \? "다음 무기" : "\?\?\?"\}<\/strong>/);
  assert.match(styles, /\.hiddenCardGlyph \{/);
  assert.doesNotMatch(forge, /PLAYER WEAPON · \+\{current\.tier\}/);
});
