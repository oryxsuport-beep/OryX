#!/usr/bin/env python3
"""Generate Android launcher icons from assets/icon.png after cap add android."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "assets" / "icon.png"
res = root / "android" / "app" / "src" / "main" / "res"
if not source.is_file():
    raise SystemExit(f"Missing icon source: {source}")
icon = Image.open(source).convert("RGBA")
for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    folder = res / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    scaled = icon.resize((size, size), Image.Resampling.LANCZOS)
    for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
        scaled.save(folder / name)
# Remove Capacitor default adaptive icon XML so the customized PNG icons
# are selected on Android 8+ as well.
for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    path = res / "mipmap-anydpi-v26" / name
    if path.exists():
        path.unlink()
print("OryX launcher icons generated from assets/icon.png")
