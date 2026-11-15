#!/usr/bin/env python3
"""Install and register OryXSystemVolume in a freshly generated Capacitor Android project."""
from pathlib import Path
import re

root = Path('android/app/src/main')
java = root / 'java'
activities = list(java.rglob('MainActivity.java')) + list(java.rglob('MainActivity.kt'))
if len(activities) != 1:
    raise SystemExit(f'Expected one MainActivity, found {len(activities)}')
activity = activities[0]
source = activity.read_text()
match = re.search(r'^package\s+([\w.]+)\s*;?', source, re.M)
if not match:
    raise SystemExit('Cannot determine MainActivity package')
package = match.group(1)
plugin = Path('android-native/OryXSystemVolumePlugin.java').read_text()
plugin = re.sub(r'^package\s+[\w.]+\s*;', f'package {package};', plugin, count=1, flags=re.M)
(activity.parent / 'OryXSystemVolumePlugin.java').write_text(plugin)
if 'registerPlugin(OryXSystemVolumePlugin.class)' not in source and 'registerPlugin(OryXSystemVolumePlugin::class.java)' not in source:
    if activity.suffix == '.java':
        method = '''\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(OryXSystemVolumePlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n'''
    else:
        method = '''\n    override fun onCreate(savedInstanceState: android.os.Bundle?) {\n        registerPlugin(OryXSystemVolumePlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }\n'''
    pos = source.rfind('}')
    if pos < 0:
        raise SystemExit('MainActivity class closing brace missing')
    source = source[:pos] + method + source[pos:]
    activity.write_text(source)
print(f'Native volume plugin installed and registered in {activity} ({package})')
