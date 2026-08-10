import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PUBLIC_ORIGIN = "https://adventurer-guild-clicker.across.chatgpt.site";
const DEVELOPMENT_ROUTES = [
  "/bgm-preview",
  "/bullet-hell/preview",
  "/ending/preview",
  "/stage-map/preview",
];

async function requestBuiltSite(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("public-surface-test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(new URL(pathname, PUBLIC_ORIGIN), { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("keeps the production game public surface free of developer controls", async () => {
  const [response, game] = await Promise.all([
    requestBuiltSite("/"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, />DEV (?:ON|OFF)</);
  assert.doesNotMatch(html, /DEV · 확정곡과 후보곡 검토/);
  assert.match(game, /setDeveloperToolsAvailable\(\["localhost", "127\.0\.0\.1"\]\.includes\(window\.location\.hostname\)\)/);
});

test("returns not found for standalone developer previews in production", async () => {
  const [access, ...layouts] = await Promise.all([
    readFile(new URL("../app/developer-access.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/bgm-preview/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/bullet-hell/preview/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ending/preview/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/stage-map/preview/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(access, /process\.env\.NODE_ENV === "development"/);
  assert.match(access, /notFound\(\)/);
  for (const layout of layouts) assert.match(layout, /requireDeveloperPreviewAccess\(\)/);

  for (const route of DEVELOPMENT_ROUTES) {
    const response = await requestBuiltSite(route);
    assert.equal(response.status, 404, `${route} must not be available in production`);
  }
});
