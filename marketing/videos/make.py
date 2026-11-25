"""Promo videos for the pre-launch (docs/PRE-LANCAMENTO.md in the clip-pipeline repo).

Each video is a HyperFrames composition (HTML + GSAP, 1080x1920) written once with $placeholders
and filled per language. This script builds one folder per video and language under ./build
(the composition, GSAP, the fonts and the panel prints it shows), lints and renders each one to
./renders/<video>-<lang>.mp4 with the HyperFrames install of clip-pipeline (tools/motion).

    python make.py               # every video, every language
    python make.py live pt-BR    # one
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from string import Template

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]
MOTION = Path(os.environ.get("CLIPPER_MOTION", "D:/DEV/clip-pipeline/tools/motion"))
FONTS = Path(os.environ.get("CLIPPER_FONTS", "D:/DEV/clip-pipeline/tools/fonts"))
BUILD, RENDERS = HERE / "build", HERE / "renders"
LANGS = ("pt-BR", "es", "en")


def texts() -> dict:
    return json.loads((HERE / "texts.json").read_text(encoding="utf-8"))


def build(video: str, lang: str) -> Path:
    folder = BUILD / f"{video}-{lang}"
    shutil.rmtree(folder, ignore_errors=True)
    folder.mkdir(parents=True)
    shutil.copy(MOTION / "node_modules/gsap/dist/gsap.min.js", folder)
    for font in ("Anton-Regular.ttf", "Montserrat-Black.ttf", "Montserrat-ExtraBold.ttf"):
        shutil.copy(FONTS / font, folder)
    for shot in ("clipes", "lives", "agenda", "videos"):
        src = SITE / "public/prints" / lang / f"{shot}.webp"
        shutil.copy(src if src.exists() else SITE / "public/prints/en" / f"{shot}.webp", folder / f"{shot}.webp")
    values = texts()[video][lang]
    html = Template((HERE / f"{video}.html").read_text(encoding="utf-8")).substitute(values)
    (folder / "index.html").write_text(html, encoding="utf-8")
    return folder


def hyperframes() -> str:
    return str(MOTION / "node_modules/.bin" / ("hyperframes.cmd" if os.name == "nt" else "hyperframes"))


def env() -> dict:
    cache = BUILD / ".cache"
    return {**os.environ, "HYPERFRAMES_NO_TELEMETRY": "1", "DO_NOT_TRACK": "1", "HYPERFRAMES_NO_UPDATE_CHECK": "1",
            "HYPERFRAMES_NO_AUTO_INSTALL": "1", "HYPERFRAMES_CACHE_DIR": str(cache)}


def render(folder: Path, out: Path) -> None:
    lint = subprocess.run([hyperframes(), "lint", "--json"], cwd=folder, env=env(), capture_output=True, text=True, encoding="utf-8", errors="replace")
    if lint.returncode != 0:
        raise SystemExit(f"lint {folder.name}:\n{lint.stdout[-3000:]}\n{lint.stderr[-2000:]}")
    out.parent.mkdir(parents=True, exist_ok=True)
    done = subprocess.run(
        [hyperframes(), "render", "--output", str(out), "--fps", "30", "--quality", "high"],
        cwd=folder, env=env(), capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if done.returncode != 0 or not out.exists():
        raise SystemExit(f"render {folder.name}:\n{(done.stdout + done.stderr)[-3000:]}")


def main() -> None:
    table = texts()
    videos = [sys.argv[1]] if len(sys.argv) > 1 else list(table)
    langs = [sys.argv[2]] if len(sys.argv) > 2 else list(LANGS)
    for video in videos:
        for lang in langs:
            folder = build(video, lang)
            render(folder, RENDERS / f"{video}-{lang}.mp4")
            print("ok", video, lang, flush=True)


if __name__ == "__main__":
    main()
