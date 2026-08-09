"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { RANK_COLORS, RANK_ORDER, type MemberDefinition } from "../game-data";
import styles from "./TavernHall.module.css";

type TavernHallProps = {
  candidates: MemberDefinition[];
  members: MemberDefinition[];
  ownedIds: string[];
  tavernLevel: number;
  gold: number;
  refreshCost: number;
  formatNumber: (value: number) => string;
  onRefresh: () => void;
  onRandomHire: () => void;
  onHire: (id: string) => void;
};

function portraitSource(id: string) {
  return `/assets/guild-members/${id}/${id}-idle-preview.webp`;
}

export function TavernHall({ candidates, members, ownedIds, tavernLevel, gold, refreshCost, formatNumber, onRefresh, onRandomHire, onHire }: TavernHallProps) {
  const [selectedId, setSelectedId] = useState(candidates[0]?.id ?? "");
  const selected = candidates.find((member) => member.id === selectedId) ?? candidates[0] ?? null;
  const maxRank = RANK_ORDER[Math.min(RANK_ORDER.length - 1, 1 + tavernLevel)];

  return <section className={`${styles.tavern} panel facility-first-panel`} aria-label="방랑자의 잔 여관 길드원 모집">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">THE WANDERING MUG · ADVENTURER RECRUITMENT</span>
        <h3>방랑자의 잔 여관</h3>
        <p>벽난로 곁에 모인 모험가를 직접 살펴보고 길드의 다음 얼굴을 영입하세요.</p>
      </div>
      <div className={styles.headerStats}>
        <span><small>모집 허가</small><strong>{maxRank} RANK</strong></span>
        <span><small>길드 명부</small><strong>{ownedIds.length}/{members.length}명</strong></span>
        <span><small>보유 골드</small><strong>{formatNumber(gold)} G</strong></span>
      </div>
    </header>

    <div className={styles.commonRoom}>
      <div className={styles.roomDecor} aria-hidden="true"><i /><i /><i /><b /><b /></div>
      <div className={styles.innkeeperNote}>
        <span>여관주인 마르타</span>
        <strong>“좋은 동료는 능력보다 눈빛에서 먼저 알아보는 법이죠.”</strong>
        <small>후보를 선택하면 초상화와 전투 정보를 자세히 확인할 수 있습니다.</small>
      </div>

      {selected ? <div className={styles.recruitDesk} style={{ "--rank-color": RANK_COLORS[selected.rank], "--member-color": selected.hue } as CSSProperties}>
        <div className={styles.heroPortrait}>
          <span className={styles.rankRibbon}>{selected.rank} RANK</span>
          <Image src={portraitSource(selected.id)} alt={`${selected.name} 초상화`} fill sizes="(max-width: 720px) 72vw, 310px" priority unoptimized draggable={false} />
          <i className={styles.portraitGlow} aria-hidden="true" />
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
          <div className={styles.skillCard}><span>고유 스킬</span><strong>{selected.skill}</strong><small>{selected.skillCooldown}초마다 공격력 {selected.skillMultiplier}배</small></div>
          <button className={styles.hireButton} onClick={() => onHire(selected.id)} disabled={gold < selected.cost}>
            <span>{gold >= selected.cost ? "길드 계약서 서명" : "고용 자금 부족"}</span>
            <strong>{formatNumber(selected.cost)} G로 고용</strong>
          </button>
        </div>
      </div> : <div className={styles.completeRoster}>
        <span>♛</span><strong>현재 모집 가능한 모든 모험가가 합류했습니다</strong><small>길드 강화에서 여관을 증축하면 더 높은 등급의 영웅이 방문합니다.</small>
      </div>}
    </div>

    {candidates.length > 0 && <div className={styles.candidateSection}>
      <div className={styles.sectionTitle}><div><span>TONIGHT&apos;S GUESTS</span><strong>오늘 머무는 모험가</strong><small>초상화를 눌러 상세 계약서를 확인하세요.</small></div><div className={styles.actions}><button onClick={onRefresh}>후보 갱신 <b>{formatNumber(refreshCost)} G</b></button><button onClick={onRandomHire}>운명의 계약 <b>260 G</b></button></div></div>
      <div className={styles.candidateRail} role="list" aria-label="고용 후보 목록">
        {candidates.map((member) => {
          const active = selected?.id === member.id;
          return <button
            key={member.id}
            className={`${styles.candidateCard} ${active ? styles.selected : ""}`}
            style={{ "--rank-color": RANK_COLORS[member.rank], "--member-color": member.hue } as CSSProperties}
            onClick={() => setSelectedId(member.id)}
            aria-pressed={active}
          >
            <span className={styles.cardPortrait}><Image src={portraitSource(member.id)} alt={`${member.name} 초상화`} fill sizes="116px" unoptimized draggable={false} /></span>
            <span className={styles.cardCopy}><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{member.skill}</em></span>
            <b className={styles.cardCost}>{formatNumber(member.cost)} G</b>
          </button>;
        })}
      </div>
    </div>}

    <div className={styles.collection}>
      <div><span className="eyebrow">GUILD PORTRAIT ARCHIVE</span><h4>길드원 초상화 도감</h4><p>영입한 길드원은 등급별 초상화 기록에 영구 등록됩니다.</p></div>
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
