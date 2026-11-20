[![Make.fun bounty](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119)
[![Rank](https://make.fun/badge/news-image-20261119/calebakinjomo/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119)
[![Reward](https://make.fun/badge/news-image-20261119/calebakinjomo/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119)

# The World in One Picture — Thursday 19 November 2026

A newspaper front page that sums up Thursday 19 November 2026's world news
in a single 1024×1024 image, built for the
[make.fun](https://make.fun/bounty/news-image-20261119) bounty
"Sum up 19 November's world news in one image" ($250 in USDC).

## The stories

- **Lead — World court: Myanmar guilty of genocide.** The International
  Court of Justice in The Hague ruled that Myanmar committed genocide
  against the Rohingya in 2017 — the first time the world court has found
  a state guilty of genocide. The Gambia brought the case in 2019; the
  court ordered reparations and the safe return of refugees.
- **Three powers, one "peace declaration".** Donald Trump, Xi Jinping and
  Vladimir Putin held the first-ever trilateral summit in Shenzhen and
  issued a four-point peace declaration: a nuclear war "cannot be won and
  must never be fought". It said nothing about Ukraine or the war with Iran.
- **Tankers hit in the Strait of Hormuz.** Iran's navy said two oil tankers
  struck mines and exploded; an ADNOC vessel was attacked, 11 crew injured
  and one missing. Brent crude rose to about $92.72 a barrel.
- **Anthropic's record debut.** The AI developer priced its IPO at $83 a
  share (about a $1.5 trillion valuation), the largest IPO on record;
  shares rose as much as 39% to $115.10 and closed up 17%.
- **Bangladesh in turmoil.** Violence spread across 28 districts after
  Sheikh Hasina was sentenced to death; Muhammad Yunus's ancestral home
  was set on fire.
- **Jeffries to lead the House.** House Democrats nominated Hakeem Jeffries
  as Speaker by 251 votes to 11 — set to become the first African-American
  Speaker.

## How to run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes one 1024×1024 PNG to `out/entry.png` (at most 1 MiB).
Node 22+ is all you need — standard library only, nothing to install,
no network at run time, no files read at run time.

## How it is drawn

Everything in the image is drawn by the program itself: a hand-written
5×7 bitmap font (upper- and lowercase, digits and punctuation), a small
canvas of drawing primitives (rectangles, lines, discs, triangles), and a
from-scratch PNG encoder (zlib deflate plus hand-rolled CRC32). The
illustrations — the scales of justice at the ICJ, three summit flags, a
tanker on the waves, a rising IPO chart, a flame and the Capitol dome —
are all drawn in code. No images or assets are fetched from anywhere.

## Determinism

The program uses no clock, no randomness and no input files, and iterates
in a fixed order, so two runs write byte-identical PNGs. Verified:

```sh
mkdir -p out1 out2
MAKEFUN_OUTPUT_DIR=out1 node main.ts
MAKEFUN_OUTPUT_DIR=out2 node main.ts
sha256sum out1/entry.png out2/entry.png   # identical hashes
```

## Links

- Bounty: https://make.fun/bounty/news-image-20261119
- Try make.fun: https://make.fun/r/hdavhdvz
