#!/bin/bash
# Build the room from its parts.
#   ../../index.html      the site's home page (what the Worker / Pages serve at /)
#   .build/room.html      the same page without the document skeleton (for the claude.ai artifact)
#   .build/test.html      the home page plus a hook into module scope, for tools/act.js and tools/crop.js
set -e
D=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$D/../.." && pwd)
mkdir -p "$D/.build"
{ cat "$D/shell.html"; echo '<script type="module">'; cat "$D"/js/*.js; echo '</script>'; } > "$D/.build/room.html"
python3 - "$D" "$ROOT" <<'PY'
import sys; D, ROOT = sys.argv[1], sys.argv[2]
s = open(D + '/.build/room.html').read()
i = s.index('<div id="stage"')
page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + s[:i] + '</head>\n<body>\n' + s[i:] + '</body>\n</html>\n')
open(ROOT + '/index.html', 'w').write(page)
hook = ('window.__room = { HOLD, STATE, INTERACT, pick, activate, camera, TRIP, SHI, LANTERN, renderer, scene, PATIO, koi, KOI, PELLETS, feed, clap, POND, '
        'mapleGroup, MAPLE, FALL, koiUpdate, lanternGroup, PADS, padUnder, inPond, goIn, goOut, '
        'pstep:(sec)=>{ for (let i=0;i<sec*30;i++){ STATE.t += 1/30; patioUpdate(1/30, STATE.t); } }, '
        'step:(sec)=>{ for (let i=0;i<sec*30;i++){ STATE.t += 1/30; koiUpdate(1/30, STATE.t); } }, '
        'proj:(x,y,z)=>projectToCss(new THREE.Vector3(x,y,z)), setHour:(h)=>{ TIME.warp = h; TIME.dirty = true; }, '
        'at:(id)=>{ const b = new THREE.Box3().setFromObject(INTERACT[id].obj); return projectToCss(b.getCenter(new THREE.Vector3())); } };\n')
j = page.rindex('</script>')
open(D + '/.build/test.html', 'w').write(page[:j] + hook + page[j:])
PY
wc -c "$ROOT/index.html"
