# clipper site: design notes

**Subject.** A personal tool that watches Twitch, Kick and YouTube lives, finds the moments,
cuts them into 9:16 captioned clips and posts them. It is meant for clippers who get paid per
view. **Job of the page:** show, in the first screen, a live turning into a clip, and then prove
how (the signals it listens to, the edit it makes, where it posts). The TikTok reviewers must
also find the terms and the privacy policy without opening a menu.

## Direction: a black edit bay

The product's own world sets the look: an editing suite with the lights off, the tally lights
of a broadcast (red = on air, green = approved), and the burned-in caption that every short
video wears. Nothing is decoration that the product doesn't also use.

| Token | Hex | Role |
|---|---|---|
| bay / deep | `#000000` | page background: true black |
| panel | `#0b0b0b` | surfaces |
| raised | `#151515` | selected rows, hovers |
| line | `#242424` | hairlines, lanes, tile borders |
| ink | `#f5f5f5` | text, primary buttons |
| dim / faint | `#a3a3a3` / `#666666` | secondary text |
| signal | `#ffe500` | **only** the active caption word, icons of a feature, signal data |
| air / go | `#ff5a4f` / `#34d27b` | live, approved |

**Corners.** Square everywhere (`border-radius: 0` on every element), in the site and in the
panel: the frame of a monitor, not a bubble.

**Icons.** Lucide for features, Simple Icons (CC0) for the platforms, both in the text colour,
with the feature icons in the accent.

**Type.**
- **Montserrat Black**, uppercase, with a black outline. It is the exact caption the product
  burns into clips. It is used for display lines only, and the active word turns yellow like
  karaoke.
- **Archivo Variable** for everything else. Its width axis is the one expressive device:
  condensed for timecodes and lane labels, normal for body text.
- No monospace and no all-caps eyebrows.

**Layout.**
- The hero is centered: a caption headline, then a composer (paste a link), then the **stage**.
  The stage is a 16:9 stream with its signal lanes beneath and a 9:16 phone where the clip
  appears.
- Below the hero, sections are left-aligned with a wide visual each. The only numbered
  sequence is "Como funciona", because it is one.

**Motion.**
- **Orchestrated:** one hero sequence (the stage plays: the playhead scans, the lanes light up,
  the clip lifts into the phone, it gets approved and scheduled).
- **Scroll-driven:** one moment in the signals section, where the timeline is scrubbed by the
  scroll.
- **Triggered:** the rest responds to hover or click only.
- Under `prefers-reduced-motion`, everything shows its final state.

**Honesty rules.** No invented testimonials, user counts or view numbers. Every figure on the
page is a real property of the software: 521 sound types, 5-minute blocks, -14 LUFS, 1080×1920,
and the measured speed of the sound model. Streamer footage is never used: the stage is drawn
procedurally (a generic night drive and an abstract streamer).

## Stack

- Vite multi-page (`index`, `terms`, `privacy`), TypeScript, plain CSS with custom properties.
- GSAP 3 with ScrollTrigger (all plugins are free since 2025) and Lenis for smooth scroll.
- Fonts are self-hosted with @fontsource: no requests to Google, which matches the privacy
  policy.
- Deploy: GitHub Actions builds and publishes to GitHub Pages. The `terms.html` and
  `privacy.html` paths stay stable, because the TikTok app points at them.
