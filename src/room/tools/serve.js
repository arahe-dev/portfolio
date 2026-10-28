// Shared Playwright setup for the room's test tools: opens .build/test.html with the clock pinned to a chosen hour.
// three.js and the fonts come from tools/cache/ when it exists (fast, offline), otherwise from the network.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BUILD = path.join(__dirname, '..', '.build', 'test.html'), CACHE = path.join(__dirname, 'cache');
async function open(W, H, hour){
  if (!fs.existsSync(BUILD)) throw new Error('run ../build.sh first');
  const b = await chromium.launch({ args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{ width:+W, height:+H } });
  p.on('pageerror', e=>console.log('ERR', e.message));
  const cached = f=>fs.existsSync(path.join(CACHE, f)) ? path.join(CACHE, f) : null;
  await p.route('**/*', r=>{
    const u = r.request().url();
    if (u.startsWith('http://local/')) return r.fulfill({ path:BUILD, contentType:'text/html' });
    if (u.includes('three.module.js') && cached('three.module.js')) return r.fulfill({ path:cached('three.module.js'), contentType:'application/javascript', headers:{ 'access-control-allow-origin':'*' } });
    if (u.startsWith('https://fonts.googleapis.com/') && cached('fonts.css')) return r.fulfill({ body:fs.readFileSync(cached('fonts.css'), 'utf8'), contentType:'text/css' });
    if (u.startsWith('https://fonts.gstatic.com/')){ const f = cached('gstatic/' + u.replace('https://fonts.gstatic.com/', '').replace(/\//g, '_')); if (f) return r.fulfill({ path:f, contentType:'font/woff2', headers:{ 'access-control-allow-origin':'*' } }); }
    return r.continue();
  });
  await p.addInitScript(h=>{ const D = Date, base = new D(); base.setHours(Math.floor(h), Math.round((h % 1)*60), 0, 0); const off = base - D.now();
    window.Date = class extends D { constructor(...a){ if (a.length) super(...a); else super(D.now() + off); } static now(){ return D.now() + off; } }; }, +hour);
  await p.goto('http://local/'); await p.waitForTimeout(3500);
  return { b, p };
}
module.exports = { open };
