"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { UPGRADE_CAPS, UPGRADE_KEYS, type UpgradeKey } from "../developer-upgrades";
import BulletHellFinale from "./BulletHellFinale";
import { maximumFinaleLoadout, type FinaleLoadout } from "./engine";

const WEAPON_MIN = 0;
const WEAPON_MAX = 14;
const HALL_MIN = 1;
const HALL_MAX = 6;
const PARTY_MIN = 1;
const PARTY_MAX = 4;
const SEED_MAX = 2_147_483_647;

const UPGRADE_LABELS: Record<UpgradeKey, string> = {
  range: "사격 범위",
  critical: "치명타",
  combo: "연격",
  execution: "처형",
  shockwave: "충격파",
  momentum: "전투 몰입",
  time: "시간 보급",
  scout: "정찰",
  guild: "길드 전술",
  gold: "금고 장갑",
  tavern: "지원 포대",
  loot: "전리품 수리",
};

type HarnessResult = "victory" | "exit" | null;

function clamp(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function cloneMaximumLoadout(): FinaleLoadout {
  const maximum = maximumFinaleLoadout();
  return { ...maximum, upgrades: { ...maximum.upgrades } };
}

function withWeaponLevel(loadout: FinaleLoadout, weaponLevel: number): FinaleLoadout {
  return { ...loadout, weaponLevel: clamp(weaponLevel, WEAPON_MIN, WEAPON_MAX) };
}

function withHallLevel(loadout: FinaleLoadout, hallLevel: number): FinaleLoadout {
  return { ...loadout, hallLevel: clamp(hallLevel, HALL_MIN, HALL_MAX) };
}

function withPartySize(loadout: FinaleLoadout, partySize: number): FinaleLoadout {
  return { ...loadout, partySize: clamp(partySize, PARTY_MIN, PARTY_MAX) };
}

function minimumFinaleLoadout(): FinaleLoadout {
  const zeroUpgrades = UPGRADE_KEYS.reduce((levels, key) => {
    levels[key] = 0;
    return levels;
  }, {} as FinaleLoadout["upgrades"]);
  return {
    upgrades: zeroUpgrades,
    weaponLevel: WEAPON_MIN,
    hallLevel: HALL_MIN,
    partySize: PARTY_MIN,
  };
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "clamp(18px, 4vw, 52px)",
    color: "#e9fbff",
    background: "radial-gradient(circle at 50% 0%, #193c49 0, #081419 42%, #030708 100%)",
    fontFamily: "system-ui, sans-serif",
  },
  panel: {
    width: "min(1100px, 100%)",
    margin: "0 auto",
    padding: "clamp(18px, 3vw, 32px)",
    background: "linear-gradient(145deg, rgba(18,38,45,.96), rgba(5,12,15,.98))",
    border: "1px solid rgba(116,230,242,.45)",
    borderRadius: 18,
    boxShadow: "0 22px 70px rgba(0,0,0,.46), inset 0 1px rgba(255,255,255,.06)",
  },
  heading: { margin: 0, fontSize: "clamp(26px, 4vw, 44px)", letterSpacing: "-.04em" },
  intro: { maxWidth: 720, margin: "8px 0 20px", color: "#a9c8cf", lineHeight: 1.6 },
  presets: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  button: {
    minHeight: 40,
    padding: "9px 15px",
    color: "#ecffff",
    background: "linear-gradient(#235868, #153843)",
    border: "1px solid #58bacc",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryButton: {
    minHeight: 52,
    padding: "12px 22px",
    color: "#071012",
    background: "linear-gradient(135deg, #a8fbff, #57dce9)",
    border: "1px solid #d9feff",
    borderRadius: 10,
    fontWeight: 950,
    cursor: "pointer",
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 24 },
  summaryCard: { display: "grid", gap: 8, padding: 14, background: "rgba(4,15,19,.72)", border: "1px solid rgba(96,194,207,.26)", borderRadius: 10 },
  range: { width: "100%", accentColor: "#67e8f0" },
  upgradeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 },
  upgradeCard: { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10, padding: 12, background: "rgba(8,24,29,.72)", border: "1px solid rgba(117,211,222,.22)", borderRadius: 9 },
  stepper: { display: "grid", gridTemplateColumns: "38px 54px 38px", alignItems: "center", textAlign: "center" },
  stepButton: { width: 36, height: 36, color: "#eaffff", background: "#163b45", border: "1px solid #4b9dab", borderRadius: 7, fontSize: 20, cursor: "pointer" },
  footer: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(119,214,224,.2)" },
  seed: { width: 150, minHeight: 40, padding: "7px 10px", color: "#efffff", background: "#071317", border: "1px solid #397e8b", borderRadius: 7 },
  result: { margin: "0 0 18px", padding: 12, color: "#bdf9ff", background: "rgba(32,113,126,.24)", border: "1px solid rgba(112,233,242,.4)", borderRadius: 8 },
};

export function FinaleDevHarness() {
  const [loadout, setLoadout] = useState<FinaleLoadout>(() => cloneMaximumLoadout());
  const [sessionSeed, setSessionSeed] = useState(20260810);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<HarnessResult>(null);

  const upgrades = useMemo(() => ({ ...loadout.upgrades }), [loadout.upgrades]);
  const weaponLevel = clamp(loadout.weaponLevel, WEAPON_MIN, WEAPON_MAX);
  const hallLevel = clamp(loadout.hallLevel, HALL_MIN, HALL_MAX);
  const partySize = clamp(loadout.partySize, PARTY_MIN, PARTY_MAX);

  function setUpgradeLevel(key: UpgradeKey, level: number) {
    setLoadout((current) => {
      const next = { ...current.upgrades };
      next[key] = clamp(level, 0, UPGRADE_CAPS[key]);
      return { ...current, upgrades: next };
    });
  }

  function applyZeroPreset() {
    setLoadout(minimumFinaleLoadout());
    setResult(null);
  }

  function applyMaximumPreset() {
    setLoadout(cloneMaximumLoadout());
    setResult(null);
  }

  function startSession(useNewSeed = false) {
    if (useNewSeed) setSessionSeed((current) => current >= SEED_MAX ? 1 : current + 1);
    setSessionVersion((current) => current + 1);
    setResult(null);
    setPlaying(true);
  }

  if (playing) {
    return <BulletHellFinale
      key={`bullet-hell-preview-${sessionSeed}-${sessionVersion}`}
      loadout={loadout}
      mode="preview"
      seed={sessionSeed}
      onLoadoutChange={setLoadout}
      onExit={() => {
        setPlaying(false);
        setResult("exit");
      }}
      onVictory={() => {
        setPlaying(false);
        setResult("victory");
      }}
    />;
  }

  return (
    <main style={styles.shell}>
      <section style={styles.panel} aria-labelledby="finale-preview-title">
        <span>DEV · SAVE-ISOLATED FINALE LAB</span>
        <h1 id="finale-preview-title" style={styles.heading}>글리치 탄막 피날레 단독 시험</h1>
        <p style={styles.intro}>마지막 스테이지를 진행하지 않고 피날레만 시작합니다. 이 화면의 값은 브라우저 저장 데이터에 기록되지 않습니다.</p>

        {result && <p style={styles.result} role="status">{result === "victory" ? "피날레 승리 시험을 완료했습니다." : "피날레에서 시험 설정으로 돌아왔습니다."}</p>}

        <div style={styles.presets} role="group" aria-label="피날레 시험 프리셋">
          <button type="button" style={styles.button} onClick={applyZeroPreset}>0 프리셋 · 최소 성장</button>
          <button type="button" style={styles.button} onClick={applyMaximumPreset}>MAX 프리셋 · 모두 최대</button>
        </div>

        <div style={styles.summaryGrid}>
          <label style={styles.summaryCard}>
            <span><strong>무기 단계</strong> · {weaponLevel}/14</span>
            <input data-loadout-control="weapon" style={styles.range} type="range" min={WEAPON_MIN} max={WEAPON_MAX} step={1} value={weaponLevel} onChange={(event) => setLoadout((current) => withWeaponLevel(current, Number(event.target.value)))} />
          </label>
          <label style={styles.summaryCard}>
            <span><strong>길드 본관</strong> · Lv.{hallLevel}/6</span>
            <input data-loadout-control="hall" style={styles.range} type="range" min={HALL_MIN} max={HALL_MAX} step={1} value={hallLevel} onChange={(event) => setLoadout((current) => withHallLevel(current, Number(event.target.value)))} />
          </label>
          <label style={styles.summaryCard}>
            <span><strong>출전 파티</strong> · {partySize}/4</span>
            <input data-loadout-control="party" style={styles.range} type="range" min={PARTY_MIN} max={PARTY_MAX} step={1} value={partySize} onChange={(event) => setLoadout((current) => withPartySize(current, Number(event.target.value)))} />
          </label>
        </div>

        <div style={styles.upgradeGrid} aria-label="12종 피날레 업그레이드 단계 조정">
          {UPGRADE_KEYS.map((key) => (
            <article key={key} data-upgrade-key={key} style={styles.upgradeCard}>
              <span><strong>{UPGRADE_LABELS[key]}</strong><br /><small>{key} · Lv.{upgrades[key]}/{UPGRADE_CAPS[key]}</small></span>
              <div style={styles.stepper} role="group" aria-label={`${UPGRADE_LABELS[key]} 단계 조정`}>
                <button type="button" style={styles.stepButton} aria-label={`${UPGRADE_LABELS[key]} 단계 낮추기`} disabled={upgrades[key] === 0} onClick={() => setUpgradeLevel(key, upgrades[key] - 1)}>−</button>
                <output aria-live="polite">{upgrades[key]}</output>
                <button type="button" style={styles.stepButton} aria-label={`${UPGRADE_LABELS[key]} 단계 높이기`} disabled={upgrades[key] === UPGRADE_CAPS[key]} onClick={() => setUpgradeLevel(key, upgrades[key] + 1)}>＋</button>
              </div>
            </article>
          ))}
        </div>

        <footer style={styles.footer}>
          <label>
            <span>세션 시드 </span>
            <input data-loadout-control="seed" style={styles.seed} type="number" min={1} max={SEED_MAX} value={sessionSeed} onChange={(event) => setSessionSeed(clamp(Number(event.target.value), 1, SEED_MAX))} />
          </label>
          <div style={styles.presets}>
            <button type="button" style={styles.button} onClick={() => startSession(true)}>새 시드로 재시작</button>
            <button type="button" style={styles.primaryButton} onClick={() => startSession(false)}>현재 설정으로 피날레 시작</button>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default FinaleDevHarness;
