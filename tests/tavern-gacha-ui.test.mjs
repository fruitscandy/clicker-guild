import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses discounted one and ten contract recruitment with transparent rank odds", async () => {
  const [balance, tavern, styles, game, audio] = await Promise.all([
    readFile(new URL("../app/tavern-gacha.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/TavernHall.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/TavernHall.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/battle-audio.ts", import.meta.url), "utf8"),
  ]);

  const singleCost = Number(balance.match(/single:\s*([\d_]+)/)?.[1].replaceAll("_", ""));
  const tenCost = Number(balance.match(/ten:\s*([\d_]+)/)?.[1].replaceAll("_", ""));
  assert.ok(singleCost > 0);
  assert.ok(tenCost < singleCost * 10);

  const rateRows = [...balance.matchAll(/\{ F: ([\d.]+), E: ([\d.]+), D: ([\d.]+), C: ([\d.]+), B: ([\d.]+), A: ([\d.]+), S: ([\d.]+) \}/g)];
  assert.equal(rateRows.length, 4);
  for (const row of rateRows) {
    const rates = row.slice(1).map(Number);
    assert.equal(rates.reduce((sum, rate) => sum + rate, 0), 100);
    for (let index = 1; index < rates.length; index += 1) assert.ok(rates[index - 1] > rates[index]);
  }

  assert.match(tavern, /onRecruit\(1\)/);
  assert.match(tavern, /onRecruit\(10\)/);
  assert.match(tavern, /등급별 영입 확률/);
  assert.match(tavern, /중복 정산/);
  assert.match(tavern, /REVEAL_STAGGER_MS/);
  assert.match(tavern, /playGuildRecruitRevealSound/);
  assert.match(tavern, /role="dialog"/);
  assert.match(tavern, /정말 판매하시겠습니까/);
  assert.match(tavern, /onRequestSale/);
  assert.doesNotMatch(tavern, /여관주인 마르타|innkeeperBar/);
  const saleFlow = game.slice(game.indexOf("function requestMemberSale"), game.indexOf("function selectGuildFacility"));
  assert.doesNotMatch(saleFlow, /window\.confirm|장비/);
  assert.match(audio, /playGuildRecruitRevealSound/);
  assert.match(audio, /guild-recruit-reveal:/);
  assert.match(styles, /\.rareResult/);
  assert.match(styles, /\.rankB/);
  assert.match(styles, /\.rankA/);
  assert.match(styles, /\.rankS/);
  assert.match(styles, /\.revealSlash/);
  assert.match(styles, /\.saleDialogBackdrop/);
  assert.match(styles, /\.rateBoardHeader/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("assigns a strictly higher sale price to every higher member rank", async () => {
  const balance = await readFile(new URL("../app/tavern-gacha.ts", import.meta.url), "utf8");
  const saleBlock = balance.match(/MEMBER_SALE_PRICES[\s\S]*?= \{([\s\S]*?)\};/)?.[1] ?? "";
  const prices = ["F", "E", "D", "C", "B", "A", "S"].map((rank) => Number(saleBlock.match(new RegExp(`${rank}:\\s*([\\d_]+)`))?.[1].replaceAll("_", "")));
  for (let index = 1; index < prices.length; index += 1) assert.ok(prices[index] > prices[index - 1]);
});
