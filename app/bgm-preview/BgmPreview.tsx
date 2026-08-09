"use client";

import Link from "next/link";
import { useRef } from "react";
import { BATTLE_BGM_CANDIDATES, BGM_TRACKS } from "../bgm/tracks";
import styles from "./BgmPreview.module.css";

export default function BgmPreview() {
  const players = useRef<Record<string, HTMLAudioElement | null>>({});
  const sceneTracks = BGM_TRACKS.filter((track) => track.sceneId === "guild" || track.sceneId === "field-select");

  const playOnly = (activeId: string) => {
    Object.entries(players.current).forEach(([id, player]) => {
      if (player && id !== activeId) player.pause();
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.back} href="/">← 게임으로 돌아가기</Link>
        <header className={styles.header}>
          <span className={styles.eyebrow}>CLICKER GUILD · ORIGINAL SOUNDTRACK</span>
          <h1>장면마다 다른 모험의 박자</h1>
          <p>길드와 필드 테마, 그리고 Flow Music으로 생성한 네 개의 전투곡을 비교할 수 있습니다. 한 곡을 재생하면 다른 곡은 자동으로 멈춥니다.</p>
        </header>
        <div className={styles.sectionHeading}>
          <div><span>SCENE THEMES</span><h2>확정 장면 테마</h2></div>
          <p>길드 관리와 필드 선택에 적용되는 고정 테마입니다.</p>
        </div>
        <section className={styles.grid} aria-label="확정 장면 배경 음악 미리듣기">
          {sceneTracks.map((track, index) => (
            <article className={styles.card} data-track={track.id} key={track.id}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.meta}>
                <div>
                  <small>{track.scene.toUpperCase()}</small>
                  <h2>{track.title}</h2>
                  <p>{track.subtitle} · {track.duration}</p>
                </div>
                <strong className={styles.tempo}>{track.bpm} BPM</strong>
              </div>
              <p className={styles.description}>{track.palette}</p>
              <audio
                ref={(node) => { players.current[track.id] = node; }}
                controls
                loop
                preload="metadata"
                src={track.source}
                onPlay={() => playOnly(track.id)}
              >
                오디오 재생을 지원하지 않는 브라우저입니다.
              </audio>
            </article>
          ))}
        </section>
        <div className={styles.sectionHeading}>
          <div><span>BATTLE THEME ROTATION</span><h2>일반·보스 전투 순환곡</h2></div>
          <p>일반 전투 두 곡과 보스 전투 두 곡이 장면별 풀에서 번갈아 재생됩니다.</p>
        </div>
        <section className={styles.grid} aria-label="일반 전투 배경 음악 최종 선택과 후보 미리듣기">
          {BATTLE_BGM_CANDIDATES.map((track) => (
            <article className={`${styles.card} ${track.current ? styles.currentCandidate : ""}`} data-track={track.id} key={track.id}>
              <div className={styles.candidateTopline}>
                <span className={styles.candidateBadge}>{track.scene} · 순환곡 {track.candidate}</span>
                <strong>{track.direction}</strong>
              </div>
              <div className={styles.meta}>
                <div>
                  <small>{track.scene}</small>
                  <h2>{track.title}</h2>
                  <p>{track.subtitle} · {track.duration}</p>
                </div>
                <strong className={styles.tempo}>{track.bpm} BPM</strong>
              </div>
              <p className={styles.description}>{track.palette}</p>
              <p className={styles.tradeoff}>{track.tradeoff}</p>
              <audio
                ref={(node) => { players.current[`candidate-${track.id}`] = node; }}
                controls
                loop
                preload="metadata"
                src={track.source}
                onPlay={() => playOnly(`candidate-${track.id}`)}
              >
                오디오 재생을 지원하지 않는 브라우저입니다.
              </audio>
            </article>
          ))}
        </section>
        <p className={styles.note}>같은 전투 유형에 다시 진입하면 다음 곡으로 넘어갑니다. 일반 전투와 보스 전투는 서로 다른 풀을 사용하며, 장면 전환에는 기존 크로스페이드가 적용됩니다.</p>
      </div>
    </main>
  );
}
