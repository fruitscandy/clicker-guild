import { traceGlitchBossBody } from "./boss-silhouette";
import {
  PAGE_FRACTURE_SEED,
  createPageFractureShards,
  pageFractureMotionAt,
  type PageFractureMotion,
  type PageFractureShard,
} from "./fracture-geometry";

export const PAGE_FRACTURE_UNDERLAY_ATTRIBUTE = "data-page-fracture-underlay";

export type PageFractureBossAnchor = Readonly<{
  x: number;
  y: number;
  radius: number;
  clickRadius: number;
  silhouetteScale?: number;
}>;

export type PageFractureClassNames = Readonly<{
  shard?: string;
  content?: string;
  keeper?: string;
}>;

export type MountPageFractureOptions = Readonly<{
  sourceRoot: HTMLElement;
  battleSurface: HTMLElement;
  soundDock?: HTMLElement | null;
  battleCanvas: HTMLCanvasElement;
  battleSnapshot?: HTMLCanvasElement;
  bossSnapshot?: HTMLCanvasElement;
  shardHost: HTMLElement;
  keeperHost?: HTMLElement | null;
  worldWidth: number;
  worldHeight: number;
  boss: PageFractureBossAnchor;
  seed?: number;
  classNames?: PageFractureClassNames;
}>;

export type PageFractureController = Readonly<{
  shards: readonly PageFractureShard[];
  update: (elapsedMs: number, durationMs: number, reducedMotion?: boolean) => readonly PageFractureMotion[];
  settle: () => void;
  restore: () => void;
}>;

type BossMask = Readonly<{
  x: number;
  y: number;
  scale: number;
  silhouetteScale: number;
}>;

type MountedShard = Readonly<{
  element: HTMLDivElement;
  shard: PageFractureShard;
  index: number;
}>;

type MarkerSnapshot = Readonly<{
  element: HTMLElement;
  previous: string | null;
}>;

const CLONE_REFERENCE_ATTRIBUTES = new Set([
  "id",
  "name",
  "for",
  "list",
  "form",
  "headers",
]);

function assertPositiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function addClassName(element: HTMLElement, className: string | undefined) {
  if (!className) return;
  element.classList.add(...className.split(/\s+/).filter(Boolean));
}

function makePointerless(element: Element) {
  if ("style" in element) {
    (element as HTMLElement).style.pointerEvents = "none";
  }
}

/** Remove identity, focus and ID-reference behavior from a visual-only clone. */
export function sanitizePageFractureClone(root: HTMLElement) {
  const elements: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const fragmentReference = (name === "href" || name === "xlink:href") && attribute.value.trim().startsWith("#");
      if (CLONE_REFERENCE_ATTRIBUTES.has(name) || name.startsWith("aria-") || fragmentReference) {
        element.removeAttribute(attribute.name);
      }
    }
    element.removeAttribute(PAGE_FRACTURE_UNDERLAY_ATTRIBUTE);
    if (element.matches("a, button, input, select, textarea, summary, [contenteditable], [tabindex]")) {
      element.setAttribute("tabindex", "-1");
    }
    makePointerless(element);
  }
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("inert", "");
  root.inert = true;
  root.dataset.pageFractureClone = "true";
}

function bossMaskForCanvas(
  canvas: HTMLCanvasElement,
  worldWidth: number,
  worldHeight: number,
  boss: PageFractureBossAnchor,
): BossMask {
  const scale = Math.max(.001, Math.min(canvas.width / worldWidth, canvas.height / worldHeight));
  const offsetX = (canvas.width - worldWidth * scale) / 2;
  const offsetY = (canvas.height - worldHeight * scale) / 2;
  return {
    x: offsetX + boss.x * scale,
    y: offsetY + boss.y * scale,
    scale,
    silhouetteScale: boss.silhouetteScale ?? .98,
  };
}

function bossOriginOnScreen(
  canvas: HTMLCanvasElement,
  worldWidth: number,
  worldHeight: number,
  boss: PageFractureBossAnchor,
) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.max(.001, Math.min(rect.width / worldWidth, rect.height / worldHeight));
  const offsetX = (rect.width - worldWidth * scale) / 2;
  const offsetY = (rect.height - worldHeight * scale) / 2;
  return {
    x: rect.left + offsetX + boss.x * scale,
    y: rect.top + offsetY + boss.y * scale,
  };
}

function eraseBossBody(context: CanvasRenderingContext2D, mask: BossMask) {
  context.save();
  context.globalCompositeOperation = "destination-out";
  context.translate(mask.x, mask.y);
  context.scale(mask.scale * mask.silhouetteScale, mask.scale * mask.silhouetteScale);
  context.fillStyle = "#000";
  context.strokeStyle = "#000";
  context.lineJoin = "round";
  context.lineWidth = 4;
  traceGlitchBossBody(context);
  context.fill();
  context.stroke();
  context.restore();
}

function keepBossSilhouetteOnly(
  context: CanvasRenderingContext2D,
  mask: BossMask,
  silhouetteScale: number,
) {
  const matte = document.createElement("canvas");
  matte.width = context.canvas.width;
  matte.height = context.canvas.height;
  const matteContext = matte.getContext("2d");
  if (!matteContext) return;

  matteContext.save();
  matteContext.translate(mask.x, mask.y);
  matteContext.scale(mask.scale * silhouetteScale, mask.scale * silhouetteScale);
  matteContext.fillStyle = "#000";
  matteContext.strokeStyle = "#000";
  matteContext.lineJoin = "round";
  matteContext.lineWidth = 4;
  traceGlitchBossBody(matteContext);
  matteContext.fill();
  matteContext.stroke();
  matteContext.restore();

  context.save();
  context.globalCompositeOperation = "destination-in";
  context.drawImage(matte, 0, 0);
  context.restore();
}

function copyCanvasPixels(
  sourceRoot: HTMLElement,
  cloneRoot: HTMLElement,
  battleCanvas: HTMLCanvasElement,
  battleSnapshot: HTMLCanvasElement,
  mask: BossMask,
  eraseCapturedBoss: boolean,
) {
  const sources = Array.from(sourceRoot.querySelectorAll<HTMLCanvasElement>("canvas"));
  const clones = Array.from(cloneRoot.querySelectorAll<HTMLCanvasElement>("canvas"));
  sources.forEach((source, index) => {
    const clone = clones[index];
    if (!clone) return;
    clone.width = source.width;
    clone.height = source.height;
    const context = clone.getContext("2d");
    if (!context) return;
    context.drawImage(source === battleCanvas ? battleSnapshot : source, 0, 0);
    if (source === battleCanvas && eraseCapturedBoss) eraseBossBody(context, mask);
  });
}

function cloneVisiblePage(
  sourceRoot: HTMLElement,
  soundDock: HTMLElement | null | undefined,
  battleCanvas: HTMLCanvasElement,
  battleSnapshot: HTMLCanvasElement,
  mask: BossMask,
  eraseCapturedBoss: boolean,
  contentClassName: string | undefined,
) {
  const content = document.createElement("div");
  addClassName(content, contentClassName);
  content.dataset.pageFractureContent = "true";
  content.setAttribute("aria-hidden", "true");
  content.setAttribute("inert", "");
  content.inert = true;
  content.style.position = "absolute";
  content.style.inset = "0";
  content.style.width = "100vw";
  content.style.minHeight = "100vh";
  content.style.overflow = "visible";
  content.style.pointerEvents = "none";
  content.style.userSelect = "none";

  const sourceClone = sourceRoot.cloneNode(true) as HTMLElement;
  sanitizePageFractureClone(sourceClone);
  copyCanvasPixels(sourceRoot, sourceClone, battleCanvas, battleSnapshot, mask, eraseCapturedBoss);
  const sourceRect = sourceRoot.getBoundingClientRect();
  sourceClone.style.position = "fixed";
  sourceClone.style.left = `${sourceRect.left}px`;
  sourceClone.style.top = `${sourceRect.top}px`;
  sourceClone.style.width = `${sourceRect.width}px`;
  sourceClone.style.height = `${sourceRect.height}px`;
  sourceClone.style.margin = "0";
  content.append(sourceClone);

  if (soundDock) {
    const dockClone = soundDock.cloneNode(true) as HTMLElement;
    sanitizePageFractureClone(dockClone);
    const dockRect = soundDock.getBoundingClientRect();
    dockClone.style.position = "fixed";
    dockClone.style.left = `${dockRect.left}px`;
    dockClone.style.top = `${dockRect.top}px`;
    dockClone.style.width = `${dockRect.width}px`;
    dockClone.style.height = `${dockRect.height}px`;
    dockClone.style.margin = "0";
    content.append(dockClone);
  }
  return content;
}

function mountBossKeeper(
  source: HTMLCanvasElement,
  snapshot: HTMLCanvasElement,
  host: HTMLElement,
  mask: BossMask | null,
  silhouetteScale: number,
  className: string | undefined,
) {
  const rect = source.getBoundingClientRect();
  const keeper = document.createElement("canvas");
  addClassName(keeper, className);
  keeper.dataset.pageFractureKeeper = "true";
  keeper.width = snapshot.width;
  keeper.height = snapshot.height;
  keeper.setAttribute("aria-hidden", "true");
  keeper.setAttribute("inert", "");
  keeper.inert = true;
  keeper.style.position = "fixed";
  keeper.style.display = "block";
  keeper.style.pointerEvents = "none";
  keeper.style.left = `${rect.left}px`;
  keeper.style.top = `${rect.top}px`;
  keeper.style.width = `${rect.width}px`;
  keeper.style.height = `${rect.height}px`;
  const context = keeper.getContext("2d");
  if (context) {
    context.drawImage(snapshot, 0, 0);
    if (mask) keepBossSilhouetteOnly(context, mask, silhouetteScale);
  }
  host.replaceChildren(keeper);
}

function markUnderlay(element: HTMLElement | null | undefined, value: "source" | "battle" | "dock") {
  if (!element) return null;
  const snapshot: MarkerSnapshot = {
    element,
    previous: element.getAttribute(PAGE_FRACTURE_UNDERLAY_ATTRIBUTE),
  };
  element.setAttribute(PAGE_FRACTURE_UNDERLAY_ATTRIBUTE, value);
  return snapshot;
}

/**
 * Capture and mount a full-page fracture into caller-owned body portal hosts.
 * The controller never starts work on its own: callers feed the finale engine's
 * collapse elapsed time to update and explicitly settle/restore it.
 */
export function mountPageFracture(options: MountPageFractureOptions): PageFractureController {
  const {
    sourceRoot,
    battleSurface,
    soundDock,
    battleCanvas,
    battleSnapshot: providedBattleSnapshot,
    bossSnapshot,
    shardHost,
    keeperHost,
    worldWidth,
    worldHeight,
    boss,
    seed = PAGE_FRACTURE_SEED,
    classNames = {},
  } = options;
  assertPositiveFinite(worldWidth, "worldWidth");
  assertPositiveFinite(worldHeight, "worldHeight");
  if (!sourceRoot.contains(battleCanvas)) {
    throw new Error("battleCanvas must be contained by sourceRoot.");
  }

  const snapshot = document.createElement("canvas");
  snapshot.width = battleCanvas.width;
  snapshot.height = battleCanvas.height;
  const snapshotContext = snapshot.getContext("2d");
  if (!snapshotContext || snapshot.width < 2 || snapshot.height < 2) {
    throw new Error("The battle canvas is not ready for a fracture capture.");
  }
  snapshotContext.drawImage(providedBattleSnapshot ?? battleCanvas, 0, 0);
  const eraseCapturedBoss = !providedBattleSnapshot;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const origin = bossOriginOnScreen(battleCanvas, worldWidth, worldHeight, boss);
  const shards = createPageFractureShards(viewportWidth, viewportHeight, origin, seed);
  const mask = bossMaskForCanvas(snapshot, worldWidth, worldHeight, boss);
  const mounted: MountedShard[] = [];

  shardHost.replaceChildren();
  keeperHost?.replaceChildren();
  for (const [index, shard] of shards.entries()) {
    const element = document.createElement("div");
    addClassName(element, classNames.shard);
    element.dataset.pageFractureShard = String(index + 1);
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("inert", "");
    element.inert = true;
    element.style.position = "fixed";
    element.style.inset = "0";
    element.style.overflow = "hidden";
    element.style.pointerEvents = "none";
    element.style.opacity = "1";
    element.style.background = "#010204";
    element.style.transformOrigin = `${origin.x}px ${origin.y}px`;
    element.style.clipPath = shard.clipPath;
    element.style.willChange = "translate, rotate, opacity";
    element.append(cloneVisiblePage(
      sourceRoot,
      soundDock,
      battleCanvas,
      snapshot,
      mask,
      eraseCapturedBoss,
      classNames.content,
    ));
    shardHost.append(element);
    mounted.push({ element, shard, index });
  }

  if (keeperHost) {
    mountBossKeeper(
      battleCanvas,
      bossSnapshot ?? snapshot,
      keeperHost,
      bossSnapshot ? null : mask,
      boss.silhouetteScale ?? .98,
      classNames.keeper,
    );
  }

  const markers = [
    markUnderlay(sourceRoot, "source"),
    markUnderlay(battleSurface, "battle"),
    markUnderlay(soundDock, "dock"),
  ].filter((marker): marker is MarkerSnapshot => marker !== null);
  let visualsSettled = false;
  let restored = false;

  const settle = () => {
    if (visualsSettled) return;
    visualsSettled = true;
    for (const { element } of mounted) {
      for (const canvas of element.querySelectorAll("canvas")) {
        canvas.width = 1;
        canvas.height = 1;
      }
      element.replaceChildren();
    }
    mounted.length = 0;
    snapshot.width = 1;
    snapshot.height = 1;
    for (const canvas of keeperHost?.querySelectorAll("canvas") ?? []) {
      canvas.width = 1;
      canvas.height = 1;
    }
    shardHost.replaceChildren();
    keeperHost?.replaceChildren();
  };

  const restore = () => {
    if (restored) return;
    restored = true;
    settle();
    for (const marker of markers) {
      if (marker.previous === null) marker.element.removeAttribute(PAGE_FRACTURE_UNDERLAY_ATTRIBUTE);
      else marker.element.setAttribute(PAGE_FRACTURE_UNDERLAY_ATTRIBUTE, marker.previous);
    }
  };

  const update = (elapsedMs: number, durationMs: number, reducedMotion = false) => {
    const motions = mounted.map(({ element, shard, index }) => {
      const motion = pageFractureMotionAt(
        shard,
        index,
        elapsedMs,
        durationMs,
        viewportHeight,
        reducedMotion,
      );
      if (!visualsSettled) {
        element.dataset.pageFracturePhase = motion.phase;
        element.style.translate = `${motion.x}px ${motion.y}px`;
        element.style.rotate = `${motion.rotation}deg`;
        element.style.opacity = String(motion.opacity);
      }
      return motion;
    });
    return motions;
  };

  return { shards, update, settle, restore };
}
