"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { WeaponView } from "../guild-hub/WeaponArt";
import BulletHellFinale from "./BulletHellFinale";
import type { FinaleLoadout } from "./engine";

const HALL_MIN = 1;
const HALL_MAX = 6;
const SEED_MAX = 2_147_483_647;
const PREVIEW_CURSOR_WEAPON: WeaponView = {
  key: "myriad-blades-one",
  weaponName: "길드마스터 신검",
  title: "만검귀일",
  subtitle: "장착 무기 커서 미리보기",
  glyph: "神",
  tier: 14,
  visualHits: 25,
  variants: 4,
  duration: 2_200,
  cost: 0,
  damageScale: 1,
};

type HarnessResult = "victory" | "exit" | null;

function clamp(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "clamp(18px, 4vw, 52px)",
    color: "#eef9f8",
    background: "radial-gradient(circle at 50% 0%, #3c3026 0, #171411 42%, #080807 100%)",
    fontFamily: "system-ui, sans-serif",
  },
  panel: {
    width: "min(920px, 100%)",
    margin: "0 auto",
    padding: "clamp(20px, 4vw, 38px)",
    background: "linear-gradient(145deg, rgba(35,29,24,.97), rgba(12,11,10,.99))",
    border: "1px solid rgba(215,181,111,.46)",
    borderRadius: 18,
    boxShadow: "0 22px 70px rgba(0,0,0,.5), inset 0 1px rgba(255,255,255,.05)",
  },
  eyebrow: { color: "#d9b76d", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 },
  heading: { margin: "8px 0 0", fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "-.045em" },
  intro: { maxWidth: 720, margin: "12px 0 22px", color: "#c7beb0", lineHeight: 1.7 },
  notice: {
    margin: "0 0 22px",
    padding: "14px 16px",
    color: "#bff8fb",
    background: "rgba(24,87,93,.22)",
    border: "1px solid rgba(99,220,226,.32)",
    borderRadius: 10,
    lineHeight: 1.55,
  },
  presets: { display: "flex", flexWrap: "wrap", gap: 10 },
  button: {
    minHeight: 42,
    padding: "9px 16px",
    color: "#fff7e5",
    background: "linear-gradient(#5a4630, #33271d)",
    border: "1px solid #a98955",
    borderRadius: 8,
    fontWeight: 850,
    cursor: "pointer",
  },
  primaryButton: {
    minHeight: 54,
    padding: "13px 24px",
    color: "#10100e",
    background: "linear-gradient(135deg, #fff1ba, #d7ad58)",
    border: "1px solid #fff4cf",
    borderRadius: 10,
    fontWeight: 950,
    cursor: "pointer",
  },
  controlGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, margin: "24px 0" },
  card: { display: "grid", gap: 10, padding: 16, background: "rgba(8,12,12,.68)", border: "1px solid rgba(206,176,111,.22)", borderRadius: 10 },
  range: { width: "100%", accentColor: "#d6ad5e" },
  seed: { width: "100%", minHeight: 42, padding: "8px 11px", color: "#f6f1e8", background: "#0d0d0c", border: "1px solid #74603d", borderRadius: 7 },
  contract: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginBottom: 24 },
  contractCard: { padding: 14, background: "rgba(13,35,37,.55)", border: "1px solid rgba(82,193,199,.22)", borderRadius: 9, lineHeight: 1.5 },
  footer: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, paddingTop: 20, borderTop: "1px solid rgba(211,177,107,.2)" },
  result: { margin: "18px 0 0", padding: 12, color: "#d9fcff", background: "rgba(29,113,121,.22)", border: "1px solid rgba(96,224,231,.34)", borderRadius: 8 },
};

export function FinaleDevHarness() {
  const [hallLevel, setHallLevel] = useState(HALL_MAX);
  const [sessionSeed, setSessionSeed] = useState(20260810);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<HarnessResult>(null);
  const loadout = useMemo<FinaleLoadout>(() => ({ hallLevel }), [hallLevel]);

  function startSession(useNewSeed = false) {
    if (useNewSeed) setSessionSeed((current) => current >= SEED_MAX ? 1 : current + 1);
    setSessionVersion((current) => current + 1);
    setResult(null);
    setPlaying(true);
  }

  if (playing) {
    return <BulletHellFinale
      key={`finale-event-preview-${hallLevel}-${sessionSeed}-${sessionVersion}`}
      loadout={loadout}
      mode="preview"
      cursorWeapon={PREVIEW_CURSOR_WEAPON}
      seed={sessionSeed}
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
        <span style={styles.eyebrow}>DEV · SAVE-ISOLATED ENDING LAB</span>
        <h1 id="finale-preview-title" style={styles.heading}>최종 결전 2페이즈 단독 시험</h1>
        <p style={styles.intro}>Stage 10-3을 다시 진행하지 않고, 필드 클릭 전투부터 붕괴·검은 탄막·보스 파괴·백색 엔딩까지 바로 시험합니다. 이 화면의 값은 저장 데이터에 기록되지 않습니다.</p>
        <p style={styles.notice}><strong>결전 규칙</strong><br />무기·파티·연구·강화 데이터는 모두 초기화됩니다. 오직 길드 본관 레벨만 클릭 피해에 제한적으로 반영되며, 자동공격은 없습니다.</p>

        {result && <p style={styles.result} role="status">{result === "victory" ? "최종 보스 격파와 백색 엔딩 시험을 완료했습니다." : "결전 시험을 종료하고 설정으로 돌아왔습니다."}</p>}

        <div style={styles.presets} role="group" aria-label="길드 본관 시험 프리셋">
          <button type="button" style={styles.button} onClick={() => setHallLevel(HALL_MIN)}>Lv.1 최소 본관</button>
          <button type="button" style={styles.button} onClick={() => setHallLevel(HALL_MAX)}>Lv.6 최대 본관</button>
        </div>

        <div style={styles.controlGrid}>
          <label style={styles.card}>
            <span><strong>길드 본관</strong> · Lv.{hallLevel}/{HALL_MAX}</span>
            <input data-finale-control="hall" aria-label={`길드 본관 Lv.${hallLevel}`} style={styles.range} type="range" min={HALL_MIN} max={HALL_MAX} step={1} value={hallLevel} onChange={(event) => setHallLevel(clamp(Number(event.currentTarget.value), HALL_MIN, HALL_MAX))} />
          </label>
          <label style={styles.card}>
            <span><strong>결정론적 패턴 시드</strong></span>
            <input data-finale-control="seed" aria-label="결정론적 패턴 시드" style={styles.seed} type="number" min={1} max={SEED_MAX} value={sessionSeed} onChange={(event) => setSessionSeed(clamp(Number(event.currentTarget.value), 1, SEED_MAX))} />
          </label>
        </div>

        <div style={styles.contract} aria-label="새 피날레 전투 규칙">
          <div style={styles.contractCard}><strong>PHASE 1</strong><br />기존 필드에서 보스를 직접 클릭</div>
          <div style={styles.contractCard}><strong>PHASE 2</strong><br />WASD 회피와 보스 직접 클릭</div>
          <div style={styles.contractCard}><strong>ENDING</strong><br />파괴 연출 뒤 승리 전용 백색 전환</div>
        </div>

        <footer style={styles.footer}>
          <button type="button" style={styles.button} onClick={() => startSession(true)}>새 시드로 처음부터</button>
          <button type="button" style={styles.primaryButton} onClick={() => startSession(false)}>현재 본관으로 결전 시작</button>
        </footer>
      </section>
    </main>
  );
}

export default FinaleDevHarness;
