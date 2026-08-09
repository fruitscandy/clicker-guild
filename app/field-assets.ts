export const FIELD_REGION_HUES = [
  "forest",
  "desert",
  "swamp",
  "mine",
  "ice",
  "volcano",
  "grave",
  "storm",
  "fort",
  "dragon",
] as const;

export type FieldRegionHue = (typeof FIELD_REGION_HUES)[number];

export type FieldAsset = {
  id: FieldRegionHue;
  name: string;
  source: string;
  width: 1536;
  height: 1024;
  objectPosition: string;
  tone: "bright" | "dark" | "vivid";
};

export const FIELD_ASSET_MANIFEST = {
  forest: {
    id: "forest",
    name: "초보자의 숲",
    source: "/assets/fields/field-01-beginners-forest-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "bright",
  },
  desert: {
    id: "desert",
    name: "메마른 황야",
    source: "/assets/fields/field-02-parched-wilds-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 52%",
    tone: "bright",
  },
  swamp: {
    id: "swamp",
    name: "독안개 늪지",
    source: "/assets/fields/field-03-poison-mist-swamp-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "dark",
  },
  mine: {
    id: "mine",
    name: "버려진 광산",
    source: "/assets/fields/field-04-abandoned-mine-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "dark",
  },
  ice: {
    id: "ice",
    name: "얼어붙은 협곡",
    source: "/assets/fields/field-05-frozen-canyon-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 52%",
    tone: "bright",
  },
  volcano: {
    id: "volcano",
    name: "불타는 산맥",
    source: "/assets/fields/field-06-burning-mountains-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 48%",
    tone: "vivid",
  },
  grave: {
    id: "grave",
    name: "망자의 묘지",
    source: "/assets/fields/field-07-graveyard-of-the-dead-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "dark",
  },
  storm: {
    id: "storm",
    name: "마력 폭풍 지대",
    source: "/assets/fields/field-08-mana-storm-zone-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "vivid",
  },
  fort: {
    id: "fort",
    name: "마왕군 요새",
    source: "/assets/fields/field-09-demon-army-fort-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 48%",
    tone: "dark",
  },
  dragon: {
    id: "dragon",
    name: "고대 용의 성역",
    source: "/assets/fields/field-10-ancient-dragon-sanctuary-hq.webp",
    width: 1536,
    height: 1024,
    objectPosition: "50% 50%",
    tone: "bright",
  },
} as const satisfies Record<FieldRegionHue, FieldAsset>;

export function fieldAssetForRegion(hue: string | null | undefined): FieldAsset {
  if (hue && Object.hasOwn(FIELD_ASSET_MANIFEST, hue)) {
    return FIELD_ASSET_MANIFEST[hue as FieldRegionHue];
  }

  return FIELD_ASSET_MANIFEST.forest;
}
