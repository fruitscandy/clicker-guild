# Guild member skill VFX

These 25 transparent WebP assets are for the automatic field skills fired when a guild member's skill cooldown completes. They are not wired to the shared passive/basic-attack effect in this asset-only change.

- Canvas: 512×512
- Format: WebP with alpha
- Source: generated with OpenAI built-in ImageGen from project-owned visual references, then locally chroma-keyed, edge-cleaned, normalized, and optimized
- Mapping: `manifest.json`

Runtime integration should select these files only for `skill === true`. The active combat UI files are intentionally left unchanged to avoid overlapping the work owned by issue #109.
