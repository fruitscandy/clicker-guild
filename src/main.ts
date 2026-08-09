import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app root element was not found");
}

app.innerHTML = `
  <main class="app-shell" aria-labelledby="app-title">
    <section class="placeholder-card">
      <p class="eyebrow">NON-COMBAT FOUNDATION</p>
      <h1 id="app-title">Clicker Guild</h1>
      <p>길드 성장과 스테이지 진행 기반을 준비하고 있습니다.</p>
    </section>
  </main>
`;
