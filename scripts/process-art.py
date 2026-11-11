#!/usr/bin/env python3
"""Turn Youling raw art into the game's public assets.

Usage:
  python scripts/process-art.py

Reads manifests from shots/artgen/{cards,scenes}/manifest.json and writes:
  public/assets/cards/<cardId>.jpg
  public/assets/enemies/<enemyId>.jpg
  public/assets/hero/player-combat.jpg
  public/assets/bg/{title,map}.jpg
  public/assets/scenes/{rest,shop}.jpg
  public/assets/items/<itemId>.png
  public/assets/meta/<upgradeId>.jpg
  public/assets/title-qinglan.png
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
CARDS_MANIFEST = ROOT / "shots/artgen/cards/manifest.json"
SCENES_MANIFEST = ROOT / "shots/artgen/scenes/manifest.json"
META_MANIFEST = ROOT / "shots/artgen/meta/manifest.json"
CARDS_SRC = ROOT / "shots/artgen/cards"
SCENES_SRC = ROOT / "shots/artgen/scenes"
META_SRC = ROOT / "shots/artgen/meta"
LOGO_SRC = ROOT / "shots/artgen/style/logo-test.png"
OUT = ROOT / "public/assets"

CARD_IDS = [
    "qingfeng", "ningqi", "zhenyue", "lianzhan", "gongfeng", "huifeng",
    "jianyi", "jinzhong", "yaoquan", "wulei", "wanjian", "taixu",
    "yujian", "lingxi", "danhuo", "jianzhen", "tayun", "juling",
    "xuezhan", "guiyuan", "hushanzhen", "zhuifeng", "duwu", "shigu",
    "shenfa", "ningshen", "jianyu", "huichun", "taiyi", "qingxin",
    "yinxue", "shouyi", "fentian",
]
ENEMY_IDS = [
    "shanyao", "sanxiu", "yaoshou", "moxiu", "yaowang",
    "huyao", "shikui", "jianling", "xuexiu", "moyan",
]
ITEM_IDS = [
    "relic-seal", "relic-gourd", "relic-swordheart", "relic-jade",
    "potion-healing", "potion-focus", "potion-rage",
]
META_IDS = [
    "meta-zhuifeng", "meta-qingxin", "meta-swordheart",
    "meta-juling", "meta-xueqi",
]


def vignette(im: Image.Image, strength: float, power: float = 2.0) -> Image.Image:
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = (w - 1) / 2, (h - 1) / 2
    dist = np.sqrt(((xx - cx) / (w * 0.62)) ** 2 + ((yy - cy) / (h * 0.62)) ** 2)
    factor = np.clip(1 - strength * np.clip(dist, 0, 1) ** power, 0.65, 1.0)
    arr = np.asarray(im).astype(np.float32) * factor[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def load_manifest(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(f"missing manifest: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    card_manifest = load_manifest(CARDS_MANIFEST)
    scene_manifest = load_manifest(SCENES_MANIFEST)
    meta_manifest = load_manifest(META_MANIFEST)

    for d in ["cards", "enemies", "hero", "bg", "scenes", "items", "meta"]:
        (OUT / d).mkdir(parents=True, exist_ok=True)

    for cid in CARD_IDS:
        rec = card_manifest[f"card-{cid}"]
        im = Image.open(CARDS_SRC / rec["file"]).convert("RGB").resize((512, 512), Image.LANCZOS)
        im = vignette(im, 0.22, 2.2)
        im = ImageEnhance.Contrast(im).enhance(1.035)
        im = ImageEnhance.Color(im).enhance(1.02)
        im.save(OUT / "cards" / f"{cid}.jpg", quality=90, optimize=True)

    for eid in ENEMY_IDS:
        im = Image.open(SCENES_SRC / f"enemy-{eid}.jpg").convert("RGB").resize((1280, 720), Image.LANCZOS)
        im = vignette(im, 0.16, 2.1)
        im = ImageEnhance.Contrast(im).enhance(1.02)
        im.save(OUT / "enemies" / f"{eid}.jpg", quality=88, optimize=True)

    im = Image.open(SCENES_SRC / "player-combat.jpg").convert("RGB").resize((1280, 720), Image.LANCZOS)
    im = ImageOps.mirror(im)
    im = vignette(im, 0.14, 2.0)
    im.save(OUT / "hero" / "player-combat.jpg", quality=90, optimize=True)

    im = Image.open(SCENES_SRC / "bg-title.jpg").convert("RGB").resize((1600, 900), Image.LANCZOS)
    im = vignette(im, 0.20, 2.0)
    im = ImageEnhance.Brightness(im).enhance(0.92)
    im.save(OUT / "bg" / "title.jpg", quality=90, optimize=True)

    im = Image.open(SCENES_SRC / "bg-map.jpg").convert("RGB")
    im = vignette(im, 0.18, 2.0)
    im.save(OUT / "bg" / "map.jpg", quality=90, optimize=True)

    for name in ["rest", "shop"]:
        im = Image.open(SCENES_SRC / f"scene-{name}.jpg").convert("RGB").resize((1280, 720), Image.LANCZOS)
        im = vignette(im, 0.16, 2.0)
        im.save(OUT / "scenes" / f"{name}.jpg", quality=90, optimize=True)

    for name in ITEM_IDS:
        im = Image.open(SCENES_SRC / f"{name}.png").convert("RGBA")
        bbox = im.getchannel("A").getbbox()
        if bbox:
            im = im.crop(bbox)
        im.thumbnail((440, 440), Image.LANCZOS)
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((512 - im.width) // 2, (512 - im.height) // 2))
        canvas.save(OUT / "items" / f"{name}.png", optimize=True)

    for mid in META_IDS:
        rec = meta_manifest[mid]
        im = Image.open(META_SRC / rec["file"]).convert("RGB").resize((1200, 400), Image.LANCZOS)
        im = vignette(im, 0.16, 2.0)
        im = ImageEnhance.Contrast(im).enhance(1.03)
        im = ImageEnhance.Color(im).enhance(1.02)
        im.save(OUT / "meta" / f"{mid}.jpg", quality=88, optimize=True)

    if LOGO_SRC.exists():
        im = Image.open(LOGO_SRC).convert("RGBA")
        bbox = im.getchannel("A").getbbox()
        if bbox:
            im = im.crop(bbox)
        pad = 24
        canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
        canvas.alpha_composite(im, (pad, pad))
        canvas.save(OUT / "title-qinglan.png", optimize=True)

    print(f"cards={len(CARD_IDS)} enemies={len(ENEMY_IDS)} items={len(ITEM_IDS)} meta={len(META_IDS)} -> {OUT}")


if __name__ == "__main__":
    main()
