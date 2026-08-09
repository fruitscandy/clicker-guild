"use client";

import Link from "next/link";
import { useRef } from "react";
import { BATTLE_BGM_CANDIDATES, BGM_TRACKS } from "../bgm/tracks";
import styles from "./BgmPreview.module.css";

export default function BgmPreview() {
  const players = useRef<Record<string, HTMLAudioElement | null>>({});
  const sceneTracks = BGM_TRACKS.filter((track) => track.id !== "battle");

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
          <p>외부 음원 없이 직접 합성·편곡한 일곱 개의 루프입니다. 한 곡을 재생하면 다른 곡은 자동으로 멈추므로 장면별 분위기를 바로 비교할 수 있습니다.</p>
        </header>
        <div className={styles.sectionHeading}>
          <div><span>SCENE THEMES</span><h2>확정 장면 테마</h2></div>
          <p>길드 관리·필드 선택·보스 전투에 적용되는 현재 테마입니다.</p>
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
          <div><span>BATTLE THEME DECISION</span><h2>일반 전투 최종 선택과 후보군</h2></div>
          <p>최초 선택곡인 후보 A ‘Steel Rush’를 최종 확정했습니다. 중세풍 제안곡 B·C·D는 비교 가능한 후보군으로 보관합니다.</p>
        </div>
        <section className={styles.grid} aria-label="일반 전투 배경 음악 최종 선택과 후보 미리듣기">
          {BATTLE_BGM_CANDIDATES.map((track) => (
            <article className={`${styles.card} ${track.current ? styles.currentCandidate : ""}`} data-track={track.id} key={track.id}>
              <div className={styles.candidateTopline}>
                <span className={styles.candidateBadge}>{track.current ? "최종 선택 · 후보 A" : `보관 후보 ${track.candidate}`}</span>
                <strong>{track.direction}</strong>
              </div>
              <div className={styles.meta}>
                <div>
                  <small>일반 전투</small>
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
        <p className={styles.note}>일반 전투곡은 후보 A ‘Steel Rush’로 최종 확정되어 게임 화면 전환에 연결됩니다. 나머지 중세풍 후보는 이후 테마 이벤트나 지역별 변주를 검토할 때 재사용할 수 있습니다. 모든 곡은 16마디 루프와 짧은 경계 페이드를 사용합니다.</p>
      </div>
    </main>
  );
}
