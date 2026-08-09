"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { RANK_COLORS, type MemberDefinition } from "../game-data";
import styles from "./TrainingGround.module.css";

export type TrainingProgress = { level: number; xp: number; gear: number };

type TrainingGroundProps = {
  members: MemberDefinition[];
  progress: Partial<Record<string, TrainingProgress>>;
  partyIds: string[];
  gold: number;
  formatNumber: (value: number) => string;
  getAttack: (member: MemberDefinition, progress: TrainingProgress) => number;
  getTrainingCost: (member: MemberDefinition, progress: TrainingProgress) => number;
  onToggleParty: (id: string) => void;
  onTrain: (id: string) => void;
  onOpenTavern: () => void;
};

function portraitSource(id: string) {
  return `/assets/guild-members/${id}/${id}-idle-preview.webp`;
}

const fallbackProgress: TrainingProgress = { level: 1, xp: 0, gear: 0 };

export function TrainingGround({ members, progress, partyIds, gold, formatNumber, getAttack, getTrainingCost, onToggleParty, onTrain, onOpenTavern }: TrainingGroundProps) {
  const [selectedId, setSelectedId] = useState(partyIds[0] ?? members[0]?.id ?? "");
  const selected = members.find((member) => member.id === selectedId) ?? members[0] ?? null;

  if (!selected) return <section className={`${styles.emptyGround} panel facility-first-panel`} aria-label="훈련장">
    <span>⚔</span><h3>훈련할 길드원이 없습니다</h3><p>여관에서 첫 동료를 고용한 뒤 다시 찾아오세요.</p><button onClick={onOpenTavern}>여관으로 이동</button>
  </section>;

  const selectedProgress = progress[selected.id] ?? fallbackProgress;
  const xpNeed = selectedProgress.level * 55;
  const trainingGain = Math.ceil(xpNeed * .45);
  const trainingCost = getTrainingCost(selected, selectedProgress);
  const selectedInParty = partyIds.includes(selected.id);
  const maxed = selectedProgress.level >= selected.maxLevel;
  const totalLevels = members.reduce((sum, member) => sum + (progress[member.id]?.level ?? 1), 0);

  return <section className={`${styles.ground} panel facility-first-panel`} aria-label="길드 훈련장">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">IRON OATH TRAINING YARD · MEMBER DEVELOPMENT</span>
        <h3>철의 맹세 훈련장</h3>
        <p>길드원 초상화를 선택해 성장 현황을 확인하고, 집중 훈련과 토벌대 편성을 한곳에서 관리하세요.</p>
      </div>
      <div className={styles.summary}>
        <span><small>소속 길드원</small><strong>{members.length}명</strong></span>
        <span><small>출전 대기</small><strong>{partyIds.length}/4명</strong></span>
        <span><small>누적 레벨</small><strong>Lv.{totalLevels}</strong></span>
      </div>
    </header>

    <div className={styles.trainingHall} style={{ "--rank-color": RANK_COLORS[selected.rank], "--member-color": selected.hue } as CSSProperties}>
      <div className={styles.hallDecor} aria-hidden="true"><i /><i /><i /><b /><b /><b /></div>
      <div className={styles.traineeStage}>
        <span className={styles.stageRank}>{selected.rank}</span>
        <Image src={portraitSource(selected.id)} alt={`${selected.name} 훈련 초상화`} fill sizes="(max-width: 720px) 75vw, 360px" priority unoptimized draggable={false} />
        <span className={styles.stageShadow} aria-hidden="true" />
        <div className={styles.coachBubble}><small>교관 바르크</small><strong>{maxed ? "“더 가르칠 것이 없군. 이제 전장에서 증명해라!”" : "“자세를 낮추고, 다음 일격까지 호흡을 놓치지 마라!”"}</strong></div>
      </div>

      <div className={styles.trainingBoard}>
        <div className={styles.identity}>
          <span className={styles.rankBadge}>{selected.rank} RANK</span>
          <span><small>{selected.job} · {selectedInParty ? "토벌대 편성 중" : "훈련 대기"}</small><h4>{selected.name}</h4><p>{selected.description}</p></span>
        </div>

        <div className={styles.levelPanel}>
          <div><span>현재 성장</span><strong>Lv.{selectedProgress.level}<small> / {selected.maxLevel}</small></strong></div>
          <div className={styles.xpTrack}><i style={{ width: `${maxed ? 100 : Math.min(100, selectedProgress.xp / xpNeed * 100)}%` }} /></div>
          <small>{maxed ? "최대 레벨 달성" : `${formatNumber(selectedProgress.xp)} / ${formatNumber(xpNeed)} XP · 훈련 1회 +${formatNumber(trainingGain)} XP`}</small>
        </div>

        <dl className={styles.combatStats}>
          <div><dt>전투 공격력</dt><dd>{formatNumber(getAttack(selected, selectedProgress))}</dd></div>
          <div><dt>장비 강화</dt><dd>+{selectedProgress.gear}</dd></div>
          <div><dt>공격 주기</dt><dd>{selected.interval}초</dd></div>
          <div><dt>성장 계수</dt><dd>+{selected.growth}</dd></div>
        </dl>

        <div className={styles.skillLesson}>
          <span>{selected.glyph}</span><div><small>숙련 기술</small><strong>{selected.skill}</strong><p>{selected.skillCooldown}초마다 기본 공격력의 {selected.skillMultiplier}배 피해</p></div>
        </div>

        <div className={styles.trainingActions}>
          <button className={`${styles.partyButton} ${selectedInParty ? styles.onParty : ""}`} onClick={() => onToggleParty(selected.id)}><span>{selectedInParty ? "토벌대에서 제외" : "토벌대에 편성"}</span><strong>{selectedInParty ? "출전 준비 완료 ✓" : `현재 ${partyIds.length}/4명`}</strong></button>
          <button className={styles.trainButton} onClick={() => onTrain(selected.id)} disabled={maxed}><span>{maxed ? "수련 완성" : gold >= trainingCost ? "집중 훈련 시작" : "훈련비 부족"}</span><strong>{maxed ? "MAX LEVEL" : `${formatNumber(trainingCost)} G · +${formatNumber(trainingGain)} XP`}</strong></button>
        </div>
      </div>
    </div>

    <div className={styles.rosterArea}>
      <div className={styles.rosterHeading}><div><span>MEMBER PORTRAITS</span><strong>훈련 명부</strong><small>길드원을 선택하면 훈련대에 올라갑니다.</small></div><button onClick={onOpenTavern}>새 길드원 찾기 +</button></div>
      <div className={styles.roster} role="list" aria-label="보유 길드원 훈련 명부">
        {members.map((member) => {
          const memberProgress = progress[member.id] ?? fallbackProgress;
          const active = member.id === selected.id;
          const inParty = partyIds.includes(member.id);
          return <button
            key={member.id}
            className={`${styles.memberCard} ${active ? styles.selected : ""} ${inParty ? styles.inParty : ""}`}
            style={{ "--rank-color": RANK_COLORS[member.rank], "--member-color": member.hue } as CSSProperties}
            onClick={() => setSelectedId(member.id)}
            aria-pressed={active}
          >
            <span className={styles.memberPortrait}><Image src={portraitSource(member.id)} alt={`${member.name} 초상화`} fill sizes="96px" unoptimized draggable={false} /></span>
            <span className={styles.memberCopy}><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>Lv.{memberProgress.level} · 공격 {formatNumber(getAttack(member, memberProgress))}</em></span>
            {inParty && <b className={styles.partyMark}>출전</b>}
          </button>;
        })}
        <button className={styles.recruitCard} onClick={onOpenTavern}><span>＋</span><strong>새 동료 영입</strong><small>여관의 오늘 후보 확인</small></button>
      </div>
    </div>
  </section>;
}
