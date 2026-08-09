# LOCAL: 길드 강화 체계 단순화

- status: completed
- owner: Codex session
- branch: codex/guild-upgrade-simplification
- base: 31dc634
- paths-owned: app/guild-hub/** (강화 정의·UI), app/Game.tsx (강화 효과 연결부), app/game-data.ts, app/game-balance.ts, app/special-attacks.ts, tests/** (강화 관련 테스트)
- paths-readonly: 여관 영입·길드원 판매 UI, 무기 VFX·오디오 자산
- updated: 2026-08-10T03:29:29+09:00
- acceptance: 기존 성장과 저장 데이터를 안전하게 이관하면서 공격 범위·치명타·주기 광역·제한 시간·영입 운·토벌 골드·길드원 공격력·플레이어 자동 공격·3종 특수 공격의 9개 계열만 명확하게 강화할 수 있고, 실제 전투·경제 효과와 비용·상한이 테스트로 검증된다.
- handoff: 핵심 강화 8종(각 5단계)과 특수 공격 3종으로 개편 완료. 삭제 연구는 구매 골드를 환급하고 기존 장비 수치는 길드원 경험치로 전환한다. 최대 자동 공격은 2.6초 주기로 제한했으며 핵심 무기·본관·연구 비용 합계 280,570 G가 30웨이브 1회 수입 292,660 G 안에 들도록 검증했다. ESLint, 79개 테스트, 프로덕션 빌드와 데스크톱·모바일 브라우저 점검 통과.
