#!/usr/bin/env python3
"""Enable Android resizable activity support for Samsung DeX / multi-window."""
from pathlib import Path
import xml.etree.ElementTree as ET

manifest = Path("android/app/src/main/AndroidManifest.xml")
if not manifest.exists():
    raise SystemExit(f"Manifesto Android não encontrado: {manifest}")
ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
ns = "{http://schemas.android.com/apk/res/android}"
tree = ET.parse(manifest)
root = tree.getroot()
application = root.find("application")
if application is None:
    raise SystemExit("Elemento <application> não encontrado no manifesto.")
activities = application.findall("activity")
main = next((a for a in activities if a.get(ns + "name", "").endswith("MainActivity")), None)
if main is None:
    raise SystemExit("Activity MainActivity não encontrada.")
main.set(ns + "resizeableActivity", "true")
# DeX e Android multi-window podem redimensionar a janela sem recriar o app.
# Mantém os configChanges já declarados pelo template Capacitor.
tree.write(manifest, encoding="utf-8", xml_declaration=True)
print("Samsung DeX: MainActivity marcada como redimensionável.")
