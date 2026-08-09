"use client";

import type { CSSProperties } from "react";
import { GUILD_FACILITIES, guildHallStage, type GuildFacility } from "./guild-progression";
import styles from "./GuildBuildingHub.module.css";

type GuildBuildingHubProps = {
  activeFacility: GuildFacility;
  hallLevel: number;
  researchCount: number;
  researchTotal: number;
  weaponName: string;
  partyCount: number;
  candidateCount: number;
  pulse: number;
  onSelect: (facility: GuildFacility) => void;
};

const facilityStatus: Record<Exclude<GuildFacility, "hall">, (props: GuildBuildingHubProps) => string> = {
  tavern: (props) => `후보 ${props.candidateCount}명 · 파티 ${props.partyCount}/4`,
  forge: (props) => props.weaponName,
  research: (props) => `연구 ${props.researchCount}/${props.researchTotal}`,
};

export function GuildBuildingHub(props: GuildBuildingHubProps) {
  const hall = guildHallStage(props.hallLevel);
  const spriteIndex = hall.level - 1;
  const spriteColumn = spriteIndex % 3;
  const spriteRow = Math.floor(spriteIndex / 3);
  const sceneStyle = {
    "--hub-sprite-x": `${spriteColumn * 50}%`,
    "--hub-sprite-y": `${spriteRow * 100}%`,
  } as CSSProperties;

  return (
    <section className={styles.hub} aria-label="길드 건물 선택">
      <div className={styles.scene} style={sceneStyle}>
        <div className={styles.sky} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.mountain} aria-hidden="true" />
        <div className={styles.road} aria-hidden="true" />

        <button
          className={`${styles.mainHall} ${props.activeFacility === "hall" ? styles.active : ""}`}
          onClick={() => props.onSelect("hall")}
          aria-pressed={props.activeFacility === "hall"}
        >
          <span key={`${props.hallLevel}-${props.pulse}`} className={`${styles.hallSprite} ${props.pulse ? styles.upgrading : ""}`} aria-hidden="true" />
          <span className={styles.buildingLabel}><b>Lv.{hall.level}</b><strong>{hall.name}</strong><small>본관 승급 · 연구 {hall.researchDepth}단계</small></span>
        </button>

        {GUILD_FACILITIES.filter((facility) => facility.id !== "hall").map((facility) => (
          <button
            key={facility.id}
            className={`${styles.facility} ${styles[facility.id]} ${props.activeFacility === facility.id ? styles.active : ""}`}
            onClick={() => props.onSelect(facility.id)}
            aria-pressed={props.activeFacility === facility.id}
          >
            {facility.id === "tavern"
              ? <span className={`${styles.facilityBuilding} ${styles.tavernBuildingArt}`} aria-hidden="true" />
              : facility.id === "forge"
              ? <span className={`${styles.facilityBuilding} ${styles.forgeBuildingArt}`} aria-hidden="true" />
              : <span className={styles.facilityBuilding} aria-hidden="true"><i>{facility.glyph}</i><b /></span>}
            <span className={styles.buildingLabel}><strong>{facility.title}</strong><small>{facilityStatus[facility.id](props)}</small></span>
          </button>
        ))}

        <div className={styles.sceneHint}><span>건물을 선택하세요</span><strong>{GUILD_FACILITIES.find((facility) => facility.id === props.activeFacility)?.title}</strong><small>선택한 시설의 콘텐츠가 아래에 열립니다.</small></div>
      </div>
    </section>
  );
}
