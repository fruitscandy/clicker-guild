"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { combatTraitFor, RANK_COLORS, RANK_ORDER, type MemberDefinition } from "../game-data";
import styles from "./TavernHall.module.css";

type MemberProgress = { level: number; xp: number; gear: number };

type TavernHallProps = {
  candidates: MemberDefinition[];
  members: MemberDefinition[];
  ownedIds: string[];
  progress: Partial<Record<string, MemberProgress>>;
  partyIds: string[];
  tavernLevel: number;
  gold: number;
  refreshCost: number;
  formatNumber: (value: number) => string;
  getAttack: (member: MemberDefinition, progress: MemberProgress) => number;
  onRefresh: () => void;
  onRandomHire: () => void;
  onHire: (id: string) => void;
  onToggleParty: (id: string) => void;
};

const fallbackProgress: MemberProgress = { level: 1, xp: 0, gear: 0 };

function portraitSource(id: string) {
  return `/assets/guild-members/${id}/${id}-idle-preview.webp`;
}

function portraitStyle(member: MemberDefinition) {
  const finnCorrection = member.id === "finn";
  return {
    "--rank-color": RANK_COLORS[member.rank],
    "--member-color": member.hue,
    "--portrait-scale": finnCorrection ? 2.12 : 1,
    "--portrait-shift-y": finnCorrection ? "1%" : "0%",
  } as CSSProperties;
}

export function TavernHall({ candidates, members, ownedIds, progress, partyIds, tavernLevel, gold, refreshCost, formatNumber, getAttack, onRefresh, onRandomHire, onHire, onToggleParty }: TavernHallProps) {
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? "");
  const selected = candidates.find((member) => member.id === selectedId) ?? candidates[0] ?? null;
  const ownedMembers = ownedIds.map((id) => members.find((member) => member.id === id)).filter((member): member is MemberDefinition => Boolean(member));
  const partyMembers = partyIds.map((id) => members.find((member) => member.id === id)).filter((member): member is MemberDefinition => Boolean(member));
  const maxRank = RANK_ORDER[Math.min(RANK_ORDER.length - 1, 1 + tavernLevel)];
  const selectedTrait = selected ? combatTraitFor(selected) : null;

  return <section className={`${styles.tavern} panel facility-first-panel`} aria-label="방랑자의 잔 여관 고용과 파티 편성">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">THE WANDERING MUG · BUILD YOUR SWARM</span>
        <h3>방랑자의 잔 여관</h3>
        <p>새 동료를 고용할 때마다 전장의 공격 규칙이 바뀝니다. 서로 다른 전투 개입 효과로 나만의 길드 조합을 완성하세요.</p>
      </div>
      <div className={styles.headerStats}>
        <span><small>모집 허가</small><strong>{maxRank} RANK</strong></span>
        <span><small>길드 명부</small><strong>{ownedIds.length}/{members.length}명</strong></span>
        <span><small>출전 파티</small><strong>{partyIds.length}/4명</strong></span>
        <span><small>보유 골드</small><strong>{formatNumber(gold)} G</strong></span>
      </div>
    </header>

    <div className={styles.interior}>
      <div className={styles.innkeeperBar}>
        <span className={styles.innkeeperSeal}>M</span>
        <span><small>여관주인 마르타</small><strong>오늘 도착한 모험가의 계약서와 길드 명부를 준비했습니다.</strong></span>
        <em>후보 선택 → 상세 확인 → 고용</em>
      </div>

      {selected ? <div className={styles.recruitDesk} style={portraitStyle(selected)}>
        <div className={styles.heroPortrait}>
          <span className={styles.rankRibbon}>{selected.rank} RANK</span>
          <Image className={styles.portraitImage} src={portraitSource(selected.id)} alt={`${selected.name} 초상화`} fill sizes="(max-width: 720px) 76vw, 300px" priority unoptimized draggable={false} />
        </div>
        <div className={styles.recruitProfile}>
          <span className={styles.jobLabel}>{selected.job} · 신규 고용 후보</span>
          <h4>{selected.name}</h4>
          <p>{selected.description}</p>
          <dl>
            <div><dt>기본 공격</dt><dd>{formatNumber(selected.attack)}</dd></div>
            <div><dt>성장 계수</dt><dd>+{selected.growth}</dd></div>
            <div><dt>공격 주기</dt><dd>{selected.interval}초</dd></div>
            <div><dt>최대 레벨</dt><dd>Lv.{selected.maxLevel}</dd></div>
          </dl>
          {selectedTrait && <div className={styles.skillCard}><span>{selected.glyph}</span><div><small>고용 즉시 적용되는 전투 개입</small><strong>{selectedTrait.title}</strong><em>{selectedTrait.description}</em></div></div>}
          <button className={styles.hireButton} onClick={() => onHire(selected.id)} disabled={gold < selected.cost}>
            <span>{gold >= selected.cost ? "길드 계약서 서명" : "고용 자금 부족"}</span>
            <strong>{formatNumber(selected.cost)} G로 고용</strong>
          </button>
        </div>
      </div> : <div className={styles.completeRoster}>
        <span>♛</span><strong>현재 모집 가능한 모든 모험가가 합류했습니다</strong><small>길드 강화에서 여관을 증축하면 더 높은 등급의 영웅이 방문합니다.</small>
      </div>}

      {candidates.length > 0 && <div className={styles.candidateSection}>
        <div className={styles.sectionTitle}><div><span>TONIGHT&apos;S GUESTS</span><strong>오늘의 고용 후보</strong><small>모든 후보 초상화는 같은 키와 시선 높이로 맞췄습니다.</small></div><div className={styles.actions}><button onClick={onRefresh}>후보 갱신 <b>{formatNumber(refreshCost)} G</b></button><button onClick={onRandomHire}>운명의 계약 <b>260 G</b></button></div></div>
        <div className={styles.candidateRail} role="list" aria-label="고용 후보 목록">
          {candidates.map((member) => {
            const active = selected?.id === member.id;
            return <button key={member.id} className={`${styles.candidateCard} ${active ? styles.selected : ""}`} style={portraitStyle(member)} onClick={() => setSelectedId(member.id)} aria-pressed={active}>
              <span className={styles.cardPortrait}><Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 초상화`} fill sizes="102px" unoptimized draggable={false} /></span>
              <span className={styles.cardCopy}><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{combatTraitFor(member).title}</em></span>
              <b className={styles.cardCost}>{formatNumber(member.cost)} G</b>
            </button>;
          })}
        </div>
      </div>}
    </div>

    <div className={styles.partySection}>
      <div className={styles.partyHeading}>
        <div><span>GUILD SURVIVOR SQUAD</span><strong>전투 개입 조합</strong><small>최대 4명의 전투 효과가 클릭 공격과 대규모 웨이브에 동시에 적용됩니다.</small></div>
        <b>{partyIds.length}/4 READY</b>
      </div>
      <div className={styles.partySlots} aria-label="현재 토벌 파티">
        {Array.from({ length: 4 }, (_, index) => {
          const member = partyMembers[index];
          if (!member) return <div className={styles.emptySlot} key={`empty-${index}`}><span>{index + 1}</span><strong>빈 파티 슬롯</strong><small>아래 명부에서 길드원을 선택하세요</small></div>;
          const memberProgress = progress[member.id] ?? fallbackProgress;
          return <button className={styles.partySlot} key={member.id} style={portraitStyle(member)} onClick={() => onToggleParty(member.id)} aria-label={`${member.name} 파티에서 제외`}>
            <span className={styles.partyPortrait}><Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 파티 초상화`} fill sizes="128px" unoptimized draggable={false} /></span>
            <span><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{combatTraitFor(member).title} · 공격 {formatNumber(getAttack(member, memberProgress))}</em></span>
            <b>제외</b>
          </button>;
        })}
      </div>

      <div className={styles.rosterHeading}><span><small>OWNED MEMBERS</small><strong>보유 길드원 명부</strong></span><em>초상화를 눌러 파티에 편성하거나 제외합니다.</em></div>
      <div className={styles.ownedRoster} role="list" aria-label="보유 길드원 목록">
        {ownedMembers.map((member) => {
          const memberProgress = progress[member.id] ?? fallbackProgress;
          const inParty = partyIds.includes(member.id);
          return <button key={member.id} className={`${styles.rosterCard} ${inParty ? styles.inParty : ""}`} style={portraitStyle(member)} onClick={() => onToggleParty(member.id)} aria-pressed={inParty}>
            <span className={styles.rosterPortrait}><Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 보유 초상화`} fill sizes="90px" unoptimized draggable={false} /></span>
            <span><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{combatTraitFor(member).title} · Lv.{memberProgress.level}</em></span>
            <b>{inParty ? "출전 중 ✓" : "편성 +"}</b>
          </button>;
        })}
      </div>
    </div>

    <div className={styles.collection}>
      <div><span className="eyebrow">GUILD PORTRAIT ARCHIVE</span><h4>길드원 도감</h4><p>영입한 길드원만 등급별 기록에 표시됩니다.</p></div>
      <div className={styles.rankProgress}>
        {RANK_ORDER.map((rank) => {
          const rankMembers = members.filter((member) => member.rank === rank);
          const owned = rankMembers.filter((member) => ownedIds.includes(member.id)).length;
          return <span key={rank} style={{ "--rank-color": RANK_COLORS[rank] } as CSSProperties}><b>{rank}</b><i><em style={{ width: `${rankMembers.length ? owned / rankMembers.length * 100 : 0}%` }} /></i><small>{owned}/{rankMembers.length}</small></span>;
        })}
      </div>
    </div>
  </section>;
}
