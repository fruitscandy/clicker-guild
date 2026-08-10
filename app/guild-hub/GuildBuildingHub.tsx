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

const HALL_SETTLED_SPRITES = [0, 2, 4, 5] as const;
const HALL_TRANSITION_SPRITES = [0, 1, 3, 4] as const;

function hallSpritePosition(spriteIndex: number) {
  return {
    x: `${(spriteIndex % 3) * 50}%`,
    y: `${Math.floor(spriteIndex / 3) * 100}%`,
  };
}

export function GuildBuildingHub(props: GuildBuildingHubProps) {
  const hall = guildHallStage(props.hallLevel);
  const settledSprite = hallSpritePosition(HALL_SETTLED_SPRITES[hall.level - 1] ?? HALL_SETTLED_SPRITES.at(-1)!);
  const transitionSprite = hallSpritePosition(HALL_TRANSITION_SPRITES[hall.level - 1] ?? HALL_TRANSITION_SPRITES.at(-1)!);
  const sceneStyle = {
    "--hub-sprite-x": settledSprite.x,
    "--hub-sprite-y": settledSprite.y,
    "--hub-transition-x": transitionSprite.x,
    "--hub-transition-y": transitionSprite.y,
  } as CSSProperties;

  return (
    <section className={styles.hub} aria-label="길드 건물 선택">
      <div className={styles.scene} style={sceneStyle}>
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
            data-tutorial={facility.id === "tavern" ? "facility-tavern" : facility.id === "forge" ? "facility-forge" : undefined}
            aria-pressed={props.activeFacility === facility.id}
          >
            {facility.id === "tavern"
              ? <span className={`${styles.facilityBuilding} ${styles.tavernBuildingArt}`} aria-hidden="true" />
              : facility.id === "forge"
              ? <span className={`${styles.facilityBuilding} ${styles.forgeBuildingArt}`} aria-hidden="true" />
              : facility.id === "research"
              ? <span className={`${styles.facilityBuilding} ${styles.researchBuildingArt}`} aria-hidden="true" />
              : <span className={styles.facilityBuilding} aria-hidden="true"><i>{facility.glyph}</i><b /></span>}
            <span className={styles.buildingLabel}><strong>{facility.title}</strong><small>{facilityStatus[facility.id](props)}</small></span>
          </button>
        ))}

      </div>
    </section>
  );
}
