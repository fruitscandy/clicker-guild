import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const endingPhases = ["aiDefeated", "erasureStopped", "newPaths", "firstGuild"];

test("closes the vanishing-world story in four beats and begins the first guild record", async () => {
  const ending = await readFile(new URL("app/ending/EndingSequence.tsx", root), "utf8");
  const phaseType = ending.match(/type EndingPhase\s*=\s*([\s\S]*?);/);

  assert.ok(phaseType, "EndingPhase should declare the four epilogue beats");
  assert.deepEqual(
    [...phaseType[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    endingPhases,
  );

  assert.match(ending, /세계와 길드들을 지워 온 AI/);
  assert.match(ending, /기록 말소자가[\s\S]*?쓰러졌습니다\./);
  assert.match(ending, /말소 코어가 무너진 뒤/);
  assert.match(ending, /세계는 더 이상[\s\S]*?지워지지 않았습니다\./);
  assert.match(ending, /지워지던 세계 위로/);
  assert.match(ending, /새로운 길이[\s\S]*?다시 열리기 시작했습니다\./);
  assert.match(ending, /세계를 다시 시작하는 첫 불빛/);
  assert.match(ending, /마지막 길드는[\s\S]*?최초의 길드가 되었습니다\./);

  assert.match(
    ending,
    /className=\{styles\.finalRoute\}[\s\S]*?마지막 길드[\s\S]*?세계의 첫 불빛[\s\S]*?최초의 길드/,
  );
  assert.match(ending, /새로운 기록 시작/);
});

test("times each ending beat, plays cues, and offers an accessible skip", async () => {
  const ending = await readFile(new URL("app/ending/EndingSequence.tsx", root), "utf8");
  const cueBlock = ending.match(/const CUE_BY_PHASE[\s\S]*?=\s*\{([\s\S]*?)\n\};/);

  assert.match(ending, /const PHASE_DURATION/);
  assert.match(ending, /aiDefeated:\s*2_400/);
  assert.match(ending, /erasureStopped:\s*2_500/);
  assert.match(ending, /newPaths:\s*2_500/);
  assert.match(ending, /const NEXT_PHASE/);
  assert.match(ending, /aiDefeated:\s*"erasureStopped"/);
  assert.match(ending, /erasureStopped:\s*"newPaths"/);
  assert.match(ending, /newPaths:\s*"firstGuild"/);
  assert.match(ending, /PHASE_DURATION\[phase\]/);
  assert.match(ending, /window\.setTimeout/);
  assert.match(ending, /window\.clearTimeout/);

  assert.ok(cueBlock, "CUE_BY_PHASE should map the ending beats to audio cues");
  for (const phase of endingPhases) {
    assert.match(cueBlock[1], new RegExp(`${phase}\\s*:`));
  }
  assert.match(cueBlock[1], /\.ogg/);
  assert.match(ending, /new Audio\(/);
  assert.match(ending, /effectiveSfxVolume\(readAudioSettings\(\)\)/);
  assert.match(ending, /audio\.pause\(\)/);

  assert.match(ending, /role="dialog"/);
  assert.match(ending, /aria-modal="true"/);
  assert.match(ending, /aria-label=/);
  assert.match(ending, /aria-describedby="ending-phase-announcement"/);
  assert.match(ending, /aria-live="polite"/);
  assert.match(ending, /ANNOUNCEMENT_BY_PHASE\[phase\]/);
  assert.match(ending, /event\.key === "Escape"/);
  assert.match(ending, /if \(completingRef\.current\) return/);
  assert.match(ending, /건너뛰기/);
  assert.match(ending, /<kbd>ESC<\/kbd>/);
});

test("keeps all four phases responsive and motion-safe", async () => {
  const [ending, styles] = await Promise.all([
    readFile(new URL("app/ending/EndingSequence.tsx", root), "utf8"),
    readFile(new URL("app/ending/EndingSequence.module.css", root), "utf8"),
  ]);

  assert.match(ending, /data-phase=\{phase\}/);
  for (const phase of endingPhases) {
    assert.match(ending, new RegExp(`styles\\.${phase}Beat`));
    assert.match(styles, new RegExp(`\\[data-phase="${phase}"\\]\\s+\\.${phase}Beat`));
  }
  assert.match(styles, /\.finalRoute/);
  assert.match(styles, /@media \(max-width: 520px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("does not invent resurrected guilds or a motive for the erasing AI", async () => {
  const ending = await readFile(new URL("app/ending/EndingSequence.tsx", root), "utf8");

  assert.doesNotMatch(
    ending,
    /부활|되살아|사라진 (?:모든 )?길드(?:들)?(?:은|는|이|가)[^<\n]{0,80}돌아왔|모든 길드(?:들)?(?:은|는|이|가)[^<\n]{0,80}돌아왔/,
  );
  assert.doesNotMatch(
    ending,
    /AI의 (?:목적|명령|판단)|AI(?:는|가)[^<\n]{0,80}(?:위해|때문|원했|판단했|명령받)|완벽한 세계|세계를 보호하려|불필요한 길드|창조주의 명령|실험을 위해/,
  );
});

test("plays the ending after the final glitch victory before saving and returning", async () => {
  const [page, gate, events, game] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/ending/EndingGate.tsx", root), "utf8"),
    readFile(new URL("app/ending/ending-events.ts", root), "utf8"),
    readFile(new URL("app/Game.tsx", root), "utf8"),
  ]);
  const completeFinale = game.match(/function completeFinale\(\)\s*\{([\s\S]*?)\n  \}/);

  assert.match(page, /<OpeningGate>[\s\S]*?<EndingGate>[\s\S]*?<BgmController>/);
  assert.match(events, /export const ENDING_START_EVENT = "clicker-guild:ending-start"/);
  assert.match(events, /window\.dispatchEvent\(new CustomEvent<EndingRequest>/);
  assert.match(gate, /window\.addEventListener\(ENDING_START_EVENT, startEnding\)/);
  assert.match(gate, /window\.removeEventListener\(ENDING_START_EVENT, startEnding\)/);
  assert.match(gate, /aria-hidden=\{visible \|\| undefined\}/);
  assert.match(gate, /inert=\{visible \? true : undefined\}/);
  assert.match(gate, /visible && <EndingSequence visible onComplete=\{finishEnding\} \/>/);

  assert.match(game, /import \{ requestEnding \} from "\.\/ending\/ending-events"/);
  assert.match(game, /onVictory=\{completeFinale\}/);
  assert.ok(completeFinale, "completeFinale should hand final victory to the ending gate");
  assert.match(completeFinale[1], /requestEnding\(\{/);
  assert.match(completeFinale[1], /mode: developerMode \? "preview" : "campaign"/);
  assert.match(completeFinale[1], /onComplete: \(\) => \{/);
  assert.match(completeFinale[1], /if \(!developerMode\) setSave\(\(current\) => \(\{ \.\.\.current, finaleCleared: true \}\)\)/);
  assert.match(completeFinale[1], /setFinaleMode\(false\)/);
  assert.match(completeFinale[1], /returnToGuild\(\)/);
  assert.match(completeFinale[1], /requestAnimationFrame\(\(\) => guildHeadingRef\.current\?\.focus\(\{ preventScroll: true \}\)\)/);
  assert.match(
    completeFinale[1],
    /requestEnding\(\{[\s\S]*?onComplete:[\s\S]*?finaleCleared: true[\s\S]*?returnToGuild\(\)[\s\S]*?guildHeadingRef\.current\?\.focus/,
  );
  assert.doesNotMatch(completeFinale[1], /길드의 마지막 기록이 새로 쓰였습니다/);
});

test("keeps the save-isolated preview inside the same client ending gate", async () => {
  const [page, preview] = await Promise.all([
    readFile(new URL("app/ending/preview/page.tsx", root), "utf8"),
    readFile(new URL("app/ending/preview/EndingPreview.tsx", root), "utf8"),
  ]);

  assert.match(page, /return <EndingPreview \/>/);
  assert.doesNotMatch(page, /EndingGate/);
  assert.match(preview, /import EndingGate from "\.\.\/EndingGate"/);
  assert.match(preview, /import \{ requestEnding \} from "\.\.\/ending-events"/);
  assert.match(preview, /<EndingGate>[\s\S]*?<EndingPreviewContent \/>[\s\S]*?<\/EndingGate>/);
  assert.match(preview, /requestAnimationFrame\(\(\) => \{[\s\S]*?launchedRef\.current = true;[\s\S]*?launchEnding\(\)/);
  assert.match(preview, /requestEnding\(\{/);
  assert.doesNotMatch(preview, /localStorage|SaveState|setSave/);
});
