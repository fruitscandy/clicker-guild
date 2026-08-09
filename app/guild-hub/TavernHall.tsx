"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { playGuildRecruitRevealSound } from "../battle-audio";
import { combatTraitFor, RANK_COLORS, RANK_ORDER, type MemberDefinition } from "../game-data";
import {
  formatRecruitRate,
  highRankRecruitChance,
  MEMBER_SALE_PRICES,
  RECRUIT_COSTS,
  recruitRatesForLevel,
  type RecruitResult,
} from "../tavern-gacha";
import styles from "./TavernHall.module.css";

type MemberProgress = { level: number; xp: number; gear: number };

type TavernHallProps = {
  members: MemberDefinition[];
  ownedIds: string[];
  progress: Partial<Record<string, MemberProgress>>;
  partyIds: string[];
  tavernLevel: number;
  gold: number;
  recruitResults: RecruitResult[];
  recruitSequence: number;
  pendingSaleId: string | null;
  formatNumber: (value: number) => string;
  getAttack: (member: MemberDefinition, progress: MemberProgress) => number;
  onRecruit: (count: 1 | 10) => void;
  onToggleParty: (id: string) => void;
  onRequestSale: (id: string) => void;
  onCancelSale: () => void;
  onConfirmSale: () => void;
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

function isRare(member: MemberDefinition) {
  return RANK_ORDER.indexOf(member.rank) >= RANK_ORDER.indexOf("B");
}

const REVEAL_LEAD_MS = 180;
const REVEAL_STAGGER_MS = 175;

type RecruitRevealProps = {
  sequence: number;
  results: RecruitResult[];
  members: MemberDefinition[];
  formatNumber: (value: number) => string;
};

function RecruitReveal({ sequence, results, members, formatNumber }: RecruitRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!results.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setRevealedCount(results.length), 0);
      return () => window.clearTimeout(timer);
    }

    const timers = results.map((result, index) => window.setTimeout(() => {
      const member = members.find((candidate) => candidate.id === result.memberId);
      setRevealedCount(index + 1);
      if (member) playGuildRecruitRevealSound(member.rank, index);
    }, REVEAL_LEAD_MS + index * REVEAL_STAGGER_MS));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [members, results, sequence]);

  if (!results.length) return <div className={styles.emptyResult}>
    <span>♢</span><strong>아직 울리지 않은 계약 종</strong><small>1명 또는 10명 영입을 선택하면 이곳에 카드형 초상화가 펼쳐집니다.</small>
  </div>;

  const visibleResults = results.slice(0, revealedCount);
  const latestResult = visibleResults.at(-1);
  const latestMember = latestResult ? members.find((candidate) => candidate.id === latestResult.memberId) : null;
  const revealing = revealedCount < results.length;

  return <div className={`${styles.resultStage} ${revealing ? styles.revealing : styles.revealComplete}`}>
    {latestMember && <span key={`${sequence}-${revealedCount}`} className={`${styles.revealSlash} ${isRare(latestMember) ? styles.rareRevealSlash : ""}`} aria-hidden="true" />}
    <div className={styles.revealProgress} aria-label={`계약 공개 ${revealedCount}/${results.length}`}>
      <span>{revealing ? "CONTRACT REVEAL" : "ALL CONTRACTS REVEALED"}</span>
      <div>{results.map((result, index) => {
        const member = members.find((candidate) => candidate.id === result.memberId);
        const revealed = index < revealedCount;
        return <i key={`${result.memberId}-${index}`} className={`${revealed ? styles.revealedPip : ""} ${revealed && member && isRare(member) ? styles.rarePip : ""}`} />;
      })}</div>
      <strong>{revealedCount}/{results.length}</strong>
    </div>
    <div className={`${styles.resultGrid} ${results.length === 1 ? styles.singleResult : ""}`}>
      {visibleResults.map((result, index) => {
        const member = members.find((candidate) => candidate.id === result.memberId)!;
        const rare = isRare(member);
        return <article key={`${sequence}-${result.memberId}-${index}`} className={`${styles.resultCard} ${rare ? styles.rareResult : ""} ${rare ? styles[`rank${member.rank}`] : ""}`} style={portraitStyle(member)}>
          {rare && <span className={styles.sparkles} aria-hidden="true">✦ · ✧ · ✦</span>}
          <div className={styles.resultPortrait}>
            <span className={styles.rankRibbon}>{member.rank} RANK</span>
            <Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 영입 결과 초상화`} fill sizes="(max-width: 560px) 42vw, 190px" unoptimized draggable={false} />
          </div>
          <div className={styles.resultCopy}>
            <small>{member.job} · {combatTraitFor(member).title}</small>
            <strong>{member.name}</strong>
            <em className={result.isNew ? styles.newBadge : styles.duplicateBadge}>{result.isNew ? "NEW · 명부 등록" : `중복 정산 +${formatNumber(result.refund)} G`}</em>
          </div>
        </article>;
      })}
    </div>
  </div>;
}

export function TavernHall({ members, ownedIds, progress, partyIds, tavernLevel, gold, recruitResults, recruitSequence, pendingSaleId, formatNumber, getAttack, onRecruit, onToggleParty, onRequestSale, onCancelSale, onConfirmSale }: TavernHallProps) {
  const ownedMembers = ownedIds.map((id) => members.find((member) => member.id === id)).filter((member): member is MemberDefinition => Boolean(member));
  const partyMembers = partyIds.map((id) => members.find((member) => member.id === id)).filter((member): member is MemberDefinition => Boolean(member));
  const pendingSaleMember = members.find((member) => member.id === pendingSaleId) ?? null;
  const rates = recruitRatesForLevel(tavernLevel);
  const highRankChance = highRankRecruitChance(tavernLevel);

  useEffect(() => {
    if (!pendingSaleId) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancelSale();
    };
    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [onCancelSale, pendingSaleId]);

  return <section className={`${styles.tavern} panel facility-first-panel`} aria-label="방랑자의 잔 여관 길드원 영입과 편성">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">THE WANDERING MUG · RANDOM CONTRACTS</span>
        <h3>방랑자의 잔 여관</h3>
        <p>계약 종을 울려 새로운 길드원을 영입하세요. 모든 등급이 등장하며, 여관 증축은 상위 등급을 만날 확률을 높입니다.</p>
      </div>
      <div className={styles.headerStats}>
        <span><small>여관 단계</small><strong>Lv.{tavernLevel}</strong></span>
        <span><small>B 이상 확률</small><strong>{formatRecruitRate(highRankChance)}</strong></span>
        <span><small>길드 명부</small><strong>{ownedIds.length}/{members.length}명</strong></span>
        <span><small>보유 골드</small><strong>{formatNumber(gold)} G</strong></span>
      </div>
    </header>

    <div className={styles.interior}>
      <div className={styles.recruitCounter}>
        <div className={styles.recruitPitch}>
          <span className={styles.contractSeal}>契</span>
          <span className="eyebrow">RANDOM GUILD CONTRACT</span>
          <h4>길드원 영입</h4>
          <p>낮은 등급일수록 자주, 높은 등급일수록 드물게 등장합니다. 이미 보유한 길드원은 등급별 판매가로 즉시 정산됩니다.</p>
          <div className={styles.recruitActions}>
            <button type="button" onClick={() => onRecruit(1)} disabled={gold < RECRUIT_COSTS.single}>
              <small>SINGLE CONTRACT</small><strong>1명 영입</strong><em>{formatNumber(RECRUIT_COSTS.single)} G</em>
            </button>
            <button type="button" className={styles.tenRecruitButton} onClick={() => onRecruit(10)} disabled={gold < RECRUIT_COSTS.ten}>
              <small>10% BUNDLE DISCOUNT</small><strong>10명 영입</strong><em>{formatNumber(RECRUIT_COSTS.ten)} G · 1명당 270 G</em>
            </button>
          </div>
        </div>

        <div className={styles.rateBoard}>
          <div className={styles.rateBoardHeader}>
            <span className={styles.oddsSeal}>%</span>
            <div><small>CONTRACT PROBABILITY</small><strong>등급별 영입 확률</strong><em>여관 Lv.{tavernLevel} 적용 중</em></div>
            <b>B+ {formatRecruitRate(highRankChance)}</b>
          </div>
          <div className={styles.rateLegend}><span>COMMON</span><i /><span>LEGENDARY</span></div>
          <ol>
            {RANK_ORDER.map((rank) => <li key={rank} style={{ "--rank-color": RANK_COLORS[rank] } as CSSProperties}>
              <b><span>{rank}</span><small>RANK</small></b><span><i style={{ width: `${Math.max(5, rates[rank] / 52 * 100)}%` }} /></span><strong>{formatRecruitRate(rates[rank])}</strong>
            </li>)}
          </ol>
          <p><b>모든 등급 등장</b><span>각 계약은 독립 추첨 · B·A·S 등급은 특별 연출</span></p>
        </div>
      </div>

      <section className={styles.resultSection} aria-labelledby="latest-recruit-title" aria-live="polite">
        <div className={styles.resultHeading}>
          <div><span>LATEST CONTRACTS</span><strong id="latest-recruit-title">최신 영입 결과</strong></div>
          {recruitResults.length > 0 && <b>{recruitResults.length} CONTRACTS OPENED</b>}
        </div>
        <RecruitReveal key={recruitSequence} sequence={recruitSequence} results={recruitResults} members={members} formatNumber={formatNumber} />
      </section>
    </div>

    <div className={styles.partySection}>
      <div className={styles.partyHeading}>
        <div><span>GUILD PARTY FORMATION</span><strong>길드원 편성</strong><small>최대 4명을 편성합니다. 판매하려면 먼저 파티에서 해제하세요.</small></div>
        <b>{partyIds.length}/4 IN PARTY</b>
      </div>
      <div className={styles.partySlots} aria-label="현재 토벌 파티">
        {Array.from({ length: 4 }, (_, index) => {
          const member = partyMembers[index];
          if (!member) return <div className={styles.emptySlot} key={`empty-${index}`}><span>{index + 1}</span><strong>빈 패시브 슬롯</strong><small>아래 명부에서 길드원을 편성하세요</small></div>;
          const memberProgress = progress[member.id] ?? fallbackProgress;
          return <button className={styles.partySlot} key={member.id} style={portraitStyle(member)} onClick={() => onToggleParty(member.id)} aria-label={`${member.name} 파티에서 제외`}>
            <span className={styles.partyPortrait}><Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 파티 초상화`} fill sizes="128px" unoptimized draggable={false} /></span>
            <span><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{combatTraitFor(member).title} · 공격 {formatNumber(getAttack(member, memberProgress))}</em></span>
            <b>해제</b>
          </button>;
        })}
      </div>

      <div className={styles.rosterHeading}><span><small>OWNED PASSIVE MEMBERS</small><strong>보유 길드원</strong></span><em>편성 버튼으로 파티를 구성하고, 사용하지 않는 길드원은 등급별 가격으로 판매할 수 있습니다.</em></div>
      <div className={styles.ownedRoster} role="list" aria-label="보유 길드원 목록">
        {ownedMembers.map((member) => {
          const memberProgress = progress[member.id] ?? fallbackProgress;
          const inParty = partyIds.includes(member.id);
          const cannotSell = inParty || ownedMembers.length === 1;
          return <article key={member.id} className={`${styles.rosterCard} ${inParty ? styles.inParty : ""}`} style={portraitStyle(member)} role="listitem">
            <button type="button" className={styles.rosterToggle} onClick={() => onToggleParty(member.id)} aria-pressed={inParty}>
              <span className={styles.rosterPortrait}><Image className={styles.portraitImage} src={portraitSource(member.id)} alt={`${member.name} 보유 초상화`} fill sizes="90px" unoptimized draggable={false} /></span>
              <span><small>{member.rank} RANK · {member.job}</small><strong>{member.name}</strong><em>{combatTraitFor(member).title} · Lv.{memberProgress.level}</em></span>
              <b>{inParty ? "편성 중 ✓" : "편성 +"}</b>
            </button>
            <button type="button" className={styles.sellButton} onClick={() => onRequestSale(member.id)} disabled={cannotSell} title={inParty ? "파티에서 해제한 뒤 판매할 수 있습니다." : ownedMembers.length === 1 ? "마지막 길드원은 판매할 수 없습니다." : `${formatNumber(MEMBER_SALE_PRICES[member.rank])} 골드에 판매`}>
              <span>판매</span><strong>+{formatNumber(MEMBER_SALE_PRICES[member.rank])} G</strong>
            </button>
          </article>;
        })}
      </div>
    </div>

    {pendingSaleMember && <div className={styles.saleDialogBackdrop} onMouseDown={onCancelSale}>
      <div className={styles.saleDialog} role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" onMouseDown={(event) => event.stopPropagation()} style={portraitStyle(pendingSaleMember)}>
        <span className={styles.saleDialogEyebrow}>MEMBER SALE CONFIRMATION</span>
        <div className={styles.saleDialogMember}>
          <span className={styles.saleDialogPortrait}><Image className={styles.portraitImage} src={portraitSource(pendingSaleMember.id)} alt={`${pendingSaleMember.name} 판매 확인 초상화`} fill sizes="92px" unoptimized draggable={false} /></span>
          <span><small>{pendingSaleMember.rank} RANK · {pendingSaleMember.job}</small><strong>{pendingSaleMember.name}</strong><em>판매 금액 {formatNumber(MEMBER_SALE_PRICES[pendingSaleMember.rank])} G</em></span>
        </div>
        <h4 id="sale-dialog-title">정말 판매하시겠습니까?</h4>
        <div className={styles.saleDialogActions}>
          <button type="button" onClick={onCancelSale} autoFocus>취소</button>
          <button type="button" className={styles.confirmSaleButton} onClick={onConfirmSale}>판매하기</button>
        </div>
      </div>
    </div>}

    <div className={styles.collection}>
      <div><span className="eyebrow">GUILD PORTRAIT ARCHIVE</span><h4>길드원 도감</h4><p>현재 보유한 길드원만 등급별 기록에 표시됩니다.</p></div>
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
