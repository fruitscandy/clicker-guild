# Clicker Guild Original BGM

These four looping tracks were composed and rendered specifically for Clicker Guild.
They do not include third-party recordings, samples, or copyrighted compositions.

| File | Scene | BPM | Loop length |
| --- | --- | ---: | ---: |
| `guild-hearth.wav` | Guild management | 84 | 45.71s |
| `frontier-map.wav` | Field selection | 96 | 40.00s |
| `steel-rush.wav` | Normal battle | 136 | 28.24s |
| `banner-and-blade.wav` | Normal battle candidate · medieval expedition | 124 | 30.97s |
| `siege-at-dusk.wav` | Normal battle candidate · siege | 112 | 34.29s |
| `guild-melee.wav` | Normal battle candidate · folk melee | 144 | 26.67s |
| `crown-of-ruin.wav` | Boss battle | 150 | 25.60s |

The source generator is `scripts/generate-bgm.mjs`. It uses deterministic additive synthesis and percussion synthesis, so the checked-in WAV files can be regenerated without external dependencies.
