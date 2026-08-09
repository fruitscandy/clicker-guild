"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import styles from "./HuntingGround.module.css";

type TerritoryHuntingGroundProps = {
  active: boolean;
  stageLabel: string;
  onOpen: () => void;
  children: ReactNode;
};

type HuntingGroundPanelProps = {
  regionName: string;
  localStage: number;
  stageNumber: number;
  unlockedStage: number;
  boss: boolean;
  rewardGold: string;
  rewardXp: string;
  materialName: string;
  materialAmount: number;
  partyCount: number;
  fieldImage: string;
  fieldImagePosition: string;
  onOpenMap: () => void;
  onStart: () => void;
  onClose: () => void;
};

type FieldPreviewStyle = CSSProperties & {
  "--hunting-field-image": string;
  "--hunting-field-position": string;
};

export function TerritoryHuntingGround({ active, stageLabel, onOpen, children }: TerritoryHuntingGroundProps) {
  return (
    <div className={styles.territoryCanvas}>
      {children}
      <button
        type="button"
        className={`${styles.gate} ${active ? styles.active : ""}`}
        onClick={onOpen}
        aria-pressed={active}
        aria-label={`사냥터 열기 · 현재 목표 ${stageLabel}`}
      >
        <span className={styles.gateArt} aria-hidden="true">
          <Image
            src="/assets/guild/hunting/hunting-ground-outpost-v2.png"
            alt=""
            fill
            sizes="(max-width: 720px) 46vw, 240px"
            priority
            unoptimized
            draggable={false}
          />
        </span>
        <span className={styles.gateLabel}>
          <small>EXPEDITION GATE</small>
          <strong>사냥터</strong>
          <em>{stageLabel}</em>
        </span>
      </button>
    </div>
  );
}

export function HuntingGroundPanel(props: HuntingGroundPanelProps) {
  const previewStyle = {
    "--hunting-field-image": `url("${props.fieldImage}")`,
    "--hunting-field-position": props.fieldImagePosition,
  } as FieldPreviewStyle;

  return (
    <section className={`${styles.panel} panel`} aria-label="사냥터 출정 준비">
      <div className={styles.fieldPreview} style={previewStyle}>
        <span className={styles.previewShade} aria-hidden="true" />
        <div className={styles.targetCopy}>
          <span>HUNTING GROUND · WAVE {props.stageNumber}</span>
          <h2>{props.regionName} {props.localStage}웨이브</h2>
          <p>{props.boss ? "지역의 군주가 길목을 지키고 있습니다." : "길드 정찰대가 확보한 다음 토벌 구역입니다."}</p>
        </div>
        <span className={`${styles.targetRank} ${props.boss ? styles.boss : ""}`}>
          {props.boss ? "♛ BOSS" : `W${props.localStage}`}
        </span>
      </div>

      <div className={styles.briefing}>
        <div className={styles.briefingTitle}>
          <div>
            <small>EXPEDITION BRIEFING</small>
            <h3>토벌대 출정 준비</h3>
          </div>
          <button type="button" className={styles.closeButton} onClick={props.onClose}>다른 시설 보기</button>
        </div>

        <div className={styles.stats}>
          <span><small>진행</small><strong>{props.stageNumber}/{props.unlockedStage}</strong></span>
          <span><small>편성 인원</small><strong>{props.partyCount}/4</strong></span>
          <span><small>예상 골드</small><strong>{props.rewardGold} G</strong></span>
          <span><small>경험치</small><strong>{props.rewardXp}</strong></span>
          <span><small>지역 전리품</small><strong>{props.materialName} ×{props.materialAmount}</strong></span>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.mapButton} onClick={props.onOpenMap}>
            <span aria-hidden="true">⌖</span>
            <b>토벌 지도 열기</b>
            <small>해금된 스테이지에서 목표 선택</small>
          </button>
          <button type="button" className={styles.startButton} onClick={props.onStart}>
            <span aria-hidden="true">⚔</span>
            <b>{props.boss ? "군주 토벌 출정" : "이 웨이브 출정"}</b>
            <small>{props.regionName} {props.localStage}웨이브 진입</small>
          </button>
        </div>
      </div>
    </section>
  );
}
