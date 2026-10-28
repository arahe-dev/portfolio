const CHANNELS = ['ARAHE.TV', 'ABOUT', 'NOW BUILDING', 'TEST CARD'];
const TV_TINT = ['#7f8cff', '#7fd0a8', '#6fe0b0', '#ffd27a'];
function drawTV(t){
  const ctx = tvTex.userData.ctx, W = 112, H = 63;
  const ch = STATE.channel;
  if (STATE.channelFlash > .55){
    const img = ctx.createImageData(W, H), d = img.data;
    for (let i=0;i<d.length;i+=4){ const v = Math.random()*210; d[i]=v; d[i+1]=v; d[i+2]=v+20; d[i+3]=255; }
    ctx.putImageData(img,0,0);
    drawText(ctx, 'CH 0'+(ch+1), W-40, 4, '#7dff9a', 1);
    tvTex.needsUpdate = true; return;
  }
  const shadowText = (s, y, col)=>{ drawTextC(ctx, s, W/2+1, y+1, '#0c0a1c'); drawTextC(ctx, s, W/2, y, col); };
  if (ch === 0){
    const sky = ['#11143a','#191c4c','#262360','#3d296c','#5e3270','#8a3e6a'];
    sky.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(0, i*7, W, 7); });
    for (let i=0;i<sky.length-1;i++) for (let x=(i%2);x<W;x+=2){ ctx.fillStyle = sky[i+1]; ctx.fillRect(x, i*7+6, 1, 1); }
    for (let i=0;i<26;i++){ const x=(i*41+7)%W, y=(i*17)%38; if (y>3 && y<34 && x>4 && x<108) continue; if (Math.sin(t*2+i)>-.3){ ctx.fillStyle='#e8e4ff'; ctx.fillRect(x,y,1,1); } }
    ctx.fillStyle='#ffdca0'; ctx.fillRect(101,2,5,5); ctx.fillRect(100,3,7,3); ctx.fillStyle='#11143a'; ctx.fillRect(104,2,3,3);
    const hill = (base, amp, f, spd, col)=>{ ctx.fillStyle = col; for (let x=0;x<W;x++){ const y = Math.round(base + Math.sin((x + t*spd)*f)*amp + Math.sin((x + t*spd)*f*2.7)*amp*.4); ctx.fillRect(x, y, 1, H-y); } };
    hill(40, 3, .06, 5, '#3a2858'); hill(46, 3, .09, 10, '#271d44');
    ctx.fillStyle = '#16122e'; ctx.fillRect(0, 54, W, H-54);
    ctx.fillStyle = '#4a3d6e'; ctx.fillRect(0, 54, W, 1);
    const tx = Math.round(((t*16) % (W+70)) - 70);
    for (let c=0;c<4;c++){ const x = tx + c*15; ctx.fillStyle = c===0 ? '#e9b04b' : '#c9533d'; ctx.fillRect(x, 48, 14, 5); ctx.fillStyle='#ffe9a8'; for (let w=0;w<3;w++) ctx.fillRect(x+2+w*4, 49, 2, 1); ctx.fillStyle='#0c0a1c'; ctx.fillRect(x+2,53,2,1); ctx.fillRect(x+10,53,2,1); }
    shadowText('ABDUR RAHEEM', 6, '#f6ead0');
    shadowText('IMAMI', 15, '#e9b04b');
    drawMicroC(ctx, 'ROBOTS · CUDA · FIRMWARE', W/2, 27, '#cfd6ff');
  } else if (ch === 1){
    ctx.fillStyle = '#10251c'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#163222'; for (let y=0;y<H;y+=2) ctx.fillRect(0,y,W,1);
    ctx.fillStyle = '#7fd0a8'; ctx.fillRect(0,0,W,10);
    drawText(ctx, 'ABOUT', 3, 2, '#10251c'); drawMicro(ctx, 'CH02', W-18, 3, '#10251c');
    const rows = [['NAME','ABDUR RAHEEM IMAMI'],['STUDY','MECHATRONICS'],['AT','VIT CHENNAI 24-28'],['CGPA','8.82 · DEPT RANK 4'],['ROLE','CTO, SENTRIX'],['TEAM','GENESIS HUMANOIDS']];
    rows.forEach(([k,v],i)=>{ drawMicro(ctx, k, 3, 14+i*8, '#5fa080'); drawMicro(ctx, v, 26, 14+i*8, '#d6ffe8'); });
    if (Math.sin(t*5)>0){ ctx.fillStyle='#d6ffe8'; ctx.fillRect(26 + microW('GENESIS HUMANOIDS') + 2, 14+5*8, 3, 5); }
  } else if (ch === 2){
    ctx.fillStyle = '#0b0d10'; ctx.fillRect(0,0,W,H);
    drawMicro(ctx, '$ ./BREAD --MOE QWEN-35B', 3, 3, '#6fe0b0');
    drawMicro(ctx, 'RTX 4060 · 8 GB VRAM', 3, 11, '#5b6b78');
    const bars = [['VRAM', .92 + .05*Math.sin(t*3)], ['RAM', .58 + .2*Math.sin(t*1.7)], ['NVME', .3 + .25*Math.abs(Math.sin(t*1.1))]];
    bars.forEach(([k,v],i)=>{
      const y = 21 + i*9; drawMicro(ctx, k, 3, y, '#9fb0c0');
      ctx.fillStyle = '#1d2a2a'; ctx.fillRect(22, y, 66, 5);
      ctx.fillStyle = i===0 ? '#e9b04b' : '#6fe0b0'; ctx.fillRect(22, y, Math.round(66*v), 5);
      drawMicro(ctx, Math.round(v*100)+'%', 92, y, '#cfe');
    });
    const toks = (7.2 + Math.sin(t*.7)*.6).toFixed(1);
    drawMicro(ctx, 'EXPERTS 18/18 CACHED', 3, 49, '#9fb0c0');
    drawMicro(ctx, 'TOK/S ' + toks, 3, 56, '#f6ead0');
    if (Math.sin(t*6)>0){ ctx.fillStyle='#6fe0b0'; ctx.fillRect(3 + microW('TOK/S '+toks) + 2, 56, 3, 5); }
  } else {
    const bars = ['#e8e8e8','#e8e05a','#5ae0e0','#5ae05a','#e05ae0','#e05a5a','#5a5ae8'];
    bars.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(Math.floor(i*W/7), 0, Math.ceil(W/7), 42); });
    const low = ['#5a5ae8','#151515','#e05ae0','#151515','#5ae0e0','#151515','#e8e8e8'];
    low.forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(Math.floor(i*W/7), 42, Math.ceil(W/7), 6); });
    ctx.fillStyle = '#101018'; ctx.fillRect(0,48,W,15);
    ctx.fillStyle = '#101018'; ctx.fillRect(26, 14, 60, 13);
    drawTextC(ctx, 'ARAHE TV', W/2, 17, '#f6ead0');
    if (Math.sin(t*3)>0) drawMicroC(ctx, 'CLICK TO CHANGE CHANNEL', W/2, 53, '#e9b04b');
  }
  ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let y=1;y<H;y+=2) ctx.fillRect(0,y,W,1);
  tvTex.needsUpdate = true;
}


/* =====================================================================
   PHONE SCREEN (table: dark with an occasional notification; held: home screen)
   ===================================================================== */
PH.tableTex = PH.mat.map; PH.hover = null; PH.rects = []; PH.minute = -1;
function phoneTick(t){
  if (PH.held){
    if (!PH.pw) return;
    const sec = new Date().getSeconds();
    if (PH.pressed && t - PH.pressT > .22){ PH.pressed = null; PH.dirty = true; }
    if (PH.dirty || sec !== PH.minute){
      PH.dirty = false; PH.minute = sec;
      repaint(PH.mat, PH.pw, PH.ph, (ctx,W,H)=>{ PH.rects = paintPhone(ctx, W, H, PH.hover, PH.pressed); });
    }
    return;
  }
  if (t - (PH.tableAt||0) < .1) return; PH.tableAt = t;
  const ctx = PH.tableTex.userData.ctx, W = 40, H = 84;
  const lit = STATE.hovered === 'phone' || (t % 22) < 3.2;
  if (!lit){ ctx.fillStyle = '#0c0c10'; ctx.fillRect(0,0,W,H); ctx.fillStyle = '#16161c'; ctx.fillRect(4,4,12,30); }
  else {
    const g = ['#2a2550','#3d2d5e','#5b3a6b','#8a4a64','#c06650','#e09058'];
    g.forEach((c,i)=>{ ctx.fillStyle = c; ctx.fillRect(0, Math.floor(i*H/6), W, Math.ceil(H/6)); });
    const d = new Date(); drawTextC(ctx, String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'), W/2, 12, '#f6ead0');
    ctx.fillStyle = 'rgba(16,14,26,.75)'; ctx.fillRect(3, 48, W-6, 10);
    ctx.fillStyle = '#f1e6cc'; ctx.fillRect(5, 50, 6, 6); ctx.fillStyle = '#cfc6dc'; ctx.fillRect(13, 51, 18, 1); ctx.fillRect(13, 54, 12, 1);
  }
  PH.tableTex.needsUpdate = true;
}

/* =====================================================================
   SOUND (tiny synth; only ever after a click)
   ===================================================================== */
const sfx = (()=>{
  let ac = null, on = true;
  try { on = localStorage.getItem('arahe-room-sound') !== 'off'; } catch(e){}
  const ctx = ()=>{ if (!ac){ try { ac = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } return ac; };
  function tone(f, dur=.08, type='square', vol=.04, when=0, slide=0){
    if (!on) return; const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0+dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0+dur+.02);
  }
  function noise(dur=.25, vol=.05, hp=800, lp=12000, when=0){
    if (!on) return; const a = ctx(); if (!a) return;
    const b = a.createBuffer(1, Math.max(1, a.sampleRate*dur), a.sampleRate), d = b.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 1.5);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain();
    f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.value = lp; g.gain.value = vol;
    s.buffer = b; s.connect(f).connect(f2).connect(g).connect(a.destination); s.start(a.currentTime + when);
  }
  return {
    get on(){ return on; },
    set(v){ on = v; try { localStorage.setItem('arahe-room-sound', v?'on':'off'); } catch(e){} },
    unlock(){ const a = ctx(); if (a && a.state === 'suspended') a.resume(); },
    tick(force){ if (ac || force) tone(1400, .022, 'square', .01); },
    pick(){ noise(.16, .05, 900, 5000); tone(330, .14, 'triangle', .035, 0, 520); },
    put(){ tone(420, .12, 'triangle', .03, 0, 260); noise(.06, .05, 200, 1200, .36); },
    page(){ noise(.14, .05, 2200, 9000); },
    channel(){ noise(.3, .045, 1200); },
    chime(){ tone(1046.5, .09, 'square', .035); tone(2093, .4, 'square', .03, .09); },
    power(){ tone(90, .05, 'square', .05); noise(.03, .04, 3000); },
    insert(){ noise(.04, .06, 1500, 6000); noise(.05, .06, 900, 4000, .09); tone(180, .04, 'square', .03, .1); },
    sip(){ noise(.38, .03, 400, 2500, .2); tone(220, .12, 'sine', .03, .5, 160); },
    pour(){ noise(1.0, .035, 300, 1800); },
    water(){ [880,1175,1568].forEach((f,i)=>tone(f, .07, 'triangle', .035, i*.06)); },
    servo(){ tone(140, .3, 'sawtooth', .018, 0, 260); tone(260, .25, 'sawtooth', .015, .5, 140); },
    roomba(){ [523,659,784,1046].forEach((f,i)=>tone(f, .06, 'square', .025, i*.07)); },
    lamp(){ tone(180, .03, 'square', .04); noise(.04, .04, 3000); },
    curtain(){ noise(.55, .035, 1500, 6000); },
    blip(){ tone(880, .04, 'square', .025); },
    slide(){ noise(.7, .03, 120, 700); noise(.1, .03, 1800, 5000, .62); },
    // a hollow knock: a short woody click, the culm's ring, and a low body
    tak(k=1){ noise(.04, .09*k, 1600, 5200); tone(720, .05, 'triangle', .045*k, 0, 640); tone(1460, .03, 'sine', .015*k); tone(205, .12, 'sine', .06*k, 0, 170); },
    gush(){ noise(.55, .03, 400, 2600); noise(.3, .02, 1500, 6000, .08); },
    toss(){ noise(.12, .015, 2500, 7000); },
    plop(){ tone(900 + Math.random()*500, .05, 'sine', .018, 0, 300); },
    gulp(L=.5){ const f = 260/(L*2); tone(f, .06, 'sine', .035, 0, f*.55); noise(.05, .015, 600, 2400, .02); },
    clap(){ noise(.05, .1, 900, 6000); noise(.05, .09, 900, 6000, .19); },
    splash(k=1){ noise(.5*k + .2, .06*k, 300, 5000); noise(.25, .04*k, 1500, 9000, .05); tone(160, .2, 'sine', .04*k, 0, 70); },
    plip(){ tone(1300, .09, 'sine', .04, 0, 380); noise(.08, .02, 2500, 8000, .02); },
    ambient(k, night){
      if (!ac) return;
      if (!on) k = 0;
      if (!this._amb && k > 0){
        const b = ac.createBuffer(1, ac.sampleRate*3, ac.sampleRate), d = b.getChannelData(0);
        let v = 0; for (let i=0;i<d.length;i++){ v = v*.96 + (Math.random()*2-1)*.04; d[i] = v*6 * (.6 + .4*Math.sin(i/ac.sampleRate*2.3)); }
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        s.buffer = b; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = .6; g.gain.value = 0;
        s.connect(f).connect(g).connect(ac.destination); s.start();
        this._amb = g; this._k = 0; this._next = 0;
      }
      if (!this._amb) return;
      if (Math.abs(k - this._k) > .02){ this._k = k; this._amb.gain.setTargetAtTime(k*.06, ac.currentTime, .4); }
      // a bird by day, crickets at night
      if (k > .5 && ac.currentTime > this._next){
        if (night){ for (let i=0;i<3;i++) tone(4300, .03, 'sine', .006, i*.07); this._next = ac.currentTime + .6 + Math.random()*1.4; }
        else { const f = 2200 + Math.random()*1200; tone(f, .08, 'sine', .012, 0, f*1.4); tone(f*1.2, .09, 'sine', .01, .12, f*.9); this._next = ac.currentTime + 4 + Math.random()*7; }
      }
    },
    line(n){ [523,659,784,1046].slice(0, n+1).forEach((f,i)=>tone(f, .07, 'square', .03, i*.06)); },
    over(){ [392,330,262,196].forEach((f,i)=>tone(f, .14, 'square', .03, i*.13)); },
    cheat(){ [523,659,784,1046,784,1046].forEach((f,i)=>tone(f, .09, 'square', .035, i*.09)); },
    click(){ tone(660, .05, 'square', .03); tone(990, .06, 'square', .025, .045); },
  };
})();

/* =====================================================================
   DOM: status for screen readers, link hotspots, info circles
   ===================================================================== */
const $ = s=>document.querySelector(s);
const statusEl = $('#status');
function announce(s){ statusEl.textContent = ''; setTimeout(()=>statusEl.textContent = s, 30); }

/* Real <a href> hotspots laid over held albums and phone apps, so the link is a link */
const hotLayer = $('#hot');
const hots = Array.from({length:3}, ()=>{
  const a = document.createElement('a'); a.className = 'hot'; a.target = '_blank'; a.rel = 'noopener'; a.draggable = false; a.hidden = true;
  a.addEventListener('click', e=>{ if (HOLD.dragged){ e.preventDefault(); return; } sfx.click(); if (HOLD.id) say(HOLD.obj, HOLD.id === 'phone' ? 'opening ' + a.getAttribute('aria-label').split(' (')[0] : 'opening Apple Music'); });
  a.addEventListener('pointerenter', ()=>{ if (HOLD.id === 'phone'){ PH.hover = PHONE_APPS[+a.dataset.i].id; PH.dirty = true; } });
  a.addEventListener('pointerleave', ()=>{ if (HOLD.id === 'phone'){ PH.hover = null; PH.dirty = true; } });
  a.addEventListener('focus', ()=>{ if (HOLD.id === 'phone'){ PH.hover = PHONE_APPS[+a.dataset.i].id; PH.dirty = true; } });
  hotLayer.append(a); return a;
});
function hotHide(){ hots.forEach(a=>{ a.hidden = true; }); }
function hotRefresh(){
  hotHide();
  if (!HOLD.id) return;
  if (HOLD.id.startsWith('album-')){ const al = HOLD.it.album; const a = hots[0]; a.href = al.url; a.setAttribute('aria-label', `${al.title} by ${al.artist} on Apple Music (opens in a new tab)`); a.dataset.i = 0; }
  if (HOLD.id === 'phone') PHONE_APPS.forEach((ap,i)=>{ const a = hots[i]; a.href = ap.url; a.setAttribute('aria-label', `${ap.label} (opens in a new tab)`); a.dataset.i = i; });
}
function cssRect(pts){
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts){ const [x,y] = projectToCss(p); x0 = Math.min(x0,x); y0 = Math.min(y0,y); x1 = Math.max(x1,x); y1 = Math.max(y1,y); }
  return [x0, y0, x1-x0, y1-y0];
}
function placeHot(a, r){ a.hidden = false; a.style.transform = `translate(${Math.round(r[0])}px,${Math.round(r[1])}px)`; a.style.width = Math.round(r[2])+'px'; a.style.height = Math.round(r[3])+'px'; }
function hotUpdate(){
  if (!HOLD.id || HOLD.phase !== 'held'){ if (!hots[0].hidden || !hots[1].hidden || !hots[2].hidden) hotHide(); return; }
  if (HOLD.id.startsWith('album-')){
    const g = HOLD.obj, b = localBox(g, c=>c.geometry.type === 'BoxGeometry');
    const pts = []; for (let i=0;i<8;i++) pts.push(g.localToWorld(V3(i&1?b.max.x:b.min.x, i&2?b.max.y:b.min.y, i&4?b.max.z:b.min.z)));
    placeHot(hots[0], cssRect(pts));
  } else if (HOLD.id === 'phone' && PH.pw && PH.rects.length){
    PH.rects.filter(r=>r.url).forEach((r,i)=>{
      const toW = (x,y)=>PH.screen.localToWorld(V3((x/PH.pw - .5)*PH.sw, (.5 - y/PH.ph)*PH.sh, 0));
      placeHot(hots[i], cssRect([toW(r.x,r.y), toW(r.x+r.w,r.y), toW(r.x,r.y+r.h), toW(r.x+r.w,r.y+r.h)]));
    });
  }
}

/* ---- info: circle everything you can touch, like the sketch this room came from ---- */
const INFO = { on:false, t0:0, cleared:true };
function infoGroups(){
  const groups = {};
  for (const id in INTERACT){
    const it = INTERACT[id]; if (HOLD.id === id || it.secret) continue;
    if (!it.obj.visible) continue;
    const z = it.zone || 'room'; if (z !== 'any' && z !== STATE.zone) continue;
    const label = id === 'door' && STATE.zone === 'patio' ? 'back inside' : id === 'pond' ? 'koi · feed them, or clap' : it.label;
    (groups[label] = groups[label] || []).push(it.obj);
  }
  return groups;
}
/* ---- words in the room: hover names, floating reactions, the held-item plate ---- */
function nameFor(id){
  const it = INTERACT[id]; if (!it) return ['', ''];
  if (id.startsWith('album-')){ const a = it.album; return [a.title, `${a.artist} · ${a.year}`]; }
  const h = currentHour();
  return ({
    magazine:['magazine', 'Arahe No. 06 · projects'], phone:['phone', 'socials'], gameboy:['game boy', 'pocket dev'],
    'cart-exp':['red cartridge', 'experience'], 'cart-fall':['grey cartridge', 'Blockfall'], 'cart-skl':['blue cartridge', 'skills'], 'cart-time':['yellow cartridge', 'no label'],
    coffee:['coffee', coffee.level > .05 ? 'still hot' : 'empty'], succulent:['echeveria', 'low maintenance'],
    kp17:['kp17', '17-dof humanoid · desk model'], tv:['tv', `ch 0${STATE.channel+1} · ${CHANNELS[STATE.channel].toLowerCase()}`],
    lamp:['lamp', STATE.lampOn ? 'on' : 'off'], roomba:['roomba', 'cleaning since 2024'],
    door: STATE.zone === 'room' ? ['sliding door', 'out to the patio'] : ['back inside', 'the living room'],
    pond:(()=>{ const f = STATE.lastHit && koiAt(STATE.lastHit); if (f) return [f.def.name, `${KIND_NAME[f.def.kind]} · ${f.full >= f.def.appetite ? 'full' : f.def.trait}`]; return ['koi pond', koi.every(f=>f.full >= f.def.appetite) ? 'six full koi' : 'six koi']; })(), shishi:['shishi-odoshi', 'bamboo water clapper'],
    lantern:['stone lantern', (LANTERN.on !== null ? LANTERN.on : (TIME.T && TIME.T.lamp > .5)) ? 'lit' : 'unlit'],
  })[id] || [id, ''];
}
function holdHint(){
  const id = HOLD.id; if (!id) return null;
  if (id === 'magazine') return HOLD.mode === 'closed' ? ['magazine', 'click to open · drag to turn it'] : ['magazine:open', 'click a page to turn it'];
  if (id === 'gameboy') return GBOS.state === 'fall' ? ['gameboy:fall', 'arrows move \u00b7 up turns \u00b7 space drops'] : GBOS.power ? ['gameboy:on', 'scroll, or use the arrow keys'] : ['gameboy', 'click to switch it on'];
  if (id.startsWith('cart-')) return ['cart', 'click to put it in the game boy'];
  if (id.startsWith('album-')) return ['album', 'click to play it on Apple Music'];
  return [id, { phone:'tap an app', coffee:'click to take a sip', succulent:'click to water it', kp17:'click and it waves' }[id] || 'drag to turn it'];
}
const SEEN = new Set(), FLOATS = [];
const PLATE = { id:null, t0:0, key:null, hintT0:-9 };
function say(target, text){
  const b = new THREE.Box3().setFromObject(target.isObject3D ? target : INTERACT[target].obj);
  FLOATS.push({ text, pos:V3((b.min.x+b.max.x)/2, b.max.y, (b.min.z+b.max.z)/2), t0:STATE.t });
  if (FLOATS.length > 4) FLOATS.shift();
}
function sayScreen(text){ FLOATS.push({ text, screen:true, t0:STATE.t }); }
function pxPlate(x, y, w, h){
  mctx.fillStyle = 'rgba(14,12,19,.88)'; mctx.fillRect(x+1, y, w-2, h); mctx.fillRect(x, y+1, w, h-2);
  mctx.fillStyle = '#3b3250'; mctx.fillRect(x+1, y, w-2, 1); mctx.fillRect(x+1, y+h-1, w-2, 1); mctx.fillRect(x, y+1, 1, h-2); mctx.fillRect(x+w-1, y+1, 1, h-2);
}
function shadowP(s, x, y, col){ drawP(mctx, s, x+1, y+1, 'rgba(14,12,19,.9)'); drawP(mctx, s, x, y, col); }
function drawWords(t){
  let drew = false;
  // hover: a name by the cursor, mouse only
  const hov = !HOLD.id && !INFO.on ? (STATE.keyHover || STATE.hovered) : null;
  if (hov && (STATE.keyHover || (STATE.pointerIn && STATE.pointerType === 'mouse'))){
    const [a, b] = nameFor(hov), w = Math.max(widthP(a), widthP(b)) + 8, h = b ? 22 : 12;
    let x, y;
    const bb = new THREE.Box3().setFromObject(INTERACT[hov].obj);
    let bx0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let i=0;i<8;i++){ const p = V3(i&1?bb.max.x:bb.min.x, i&2?bb.max.y:bb.min.y, i&4?bb.max.z:bb.min.z).project(camera); const px = (p.x*.5+.5)*MW, py = (-p.y*.5+.5)*MH; bx0 = Math.min(bx0,px); bx1 = Math.max(bx1,px); by1 = Math.max(by1,py); }
    const big = bx1 - bx0 > MW*.2;
    if (big && !STATE.keyHover){ x = (bx0+bx1)/2 - w/2; y = Math.min(by1 + 4, MH - h - 40); }
    else if (STATE.keyHover){ const p = V3((bb.min.x+bb.max.x)/2, bb.max.y, (bb.min.z+bb.max.z)/2).project(camera); x = (p.x*.5+.5)*MW - w/2; y = (-p.y*.5+.5)*MH - h - 4; }
    else { x = (STATE.pointer.x*.5+.5)*MW + 7; y = (-STATE.pointer.y*.5+.5)*MH + 7; if (x + w > MW - 2) x -= w + 12; if (y + h > MH - 2) y -= h + 12; }
    x = Math.round(clamp(x, 2, MW-w-2)); y = Math.round(clamp(y, 2, MH-h-2));
    pxPlate(x, y, w, h); drawP(mctx, a, x+4, y+2, '#f4e9cf'); if (b) drawP(mctx, b, x+4, y+12, '#a197b3');
    drew = true;
  }
  // floating reactions rise off the thing that made them
  for (let i=FLOATS.length-1;i>=0;i--){
    const f = FLOATS[i], age = t - f.t0, life = 1.9;
    if (age > life){ FLOATS.splice(i,1); continue; }
    let x, y;
    if (f.screen){ x = MW/2; y = MH*.32; }
    else { const p = f.pos.clone().project(camera); x = (p.x*.5+.5)*MW; y = (-p.y*.5+.5)*MH - 6; }
    y -= Math.round(easeOut(Math.min(1, age/life)) * 14);
    x = clamp(x, widthP(f.text)/2 + 3, MW - widthP(f.text)/2 - 3); y = clamp(y, 4, MH - 14);
    const fade = age > life - .45 ? (life - age)/.45 : 1;
    mctx.globalAlpha = fade > .66 ? 1 : fade > .33 ? .66 : .33;
    shadowP(f.text, Math.round(x - widthP(f.text)/2), Math.round(y), '#f4e9cf');
    mctx.globalAlpha = 1; drew = true;
  }
  // held item: a name plate under it, and how to use it the first time only
  if (HOLD.id && HOLD.phase !== 'down'){
    if (PLATE.id !== HOLD.id){ PLATE.id = HOLD.id; PLATE.t0 = t; PLATE.key = null; }
    const hint = holdHint();
    if (hint && hint[0] !== PLATE.key){ PLATE.key = hint[0]; PLATE.hint = hint[1]; if (!SEEN.has(hint[0])){ SEEN.add(hint[0]); PLATE.hintT0 = t; PLATE.first = !SEEN.has('any'); SEEN.add('any'); } else PLATE.hintT0 = -9; }
    const expanded = (HOLD.id === 'magazine' && HOLD.mode !== 'closed') || (HOLD.id === 'gameboy' && HOLD.mode === 'lean') || HOLD.id === 'phone';
    const appear = clamp((t - PLATE.t0 - .35)/.25, 0, 1);
    const hintAge = t - PLATE.hintT0, showHint = hintAge < 5;
    const [a, b] = nameFor(HOLD.id);
    const hintText = PLATE.hint + (PLATE.first ? ' · click away to put it back' : '');
    if (appear > 0 && (!expanded || showHint)){
      mctx.globalAlpha = appear > .66 ? 1 : appear > .33 ? .66 : .33;
      if (!expanded){
        const w = Math.max(widthP(a, 1), widthP(b)) + 12, h = 24, x = Math.round(MW/2 - w/2), y = MH - h - 8;
        pxPlate(x, y, w, h); drawPC(mctx, a, MW/2, y+3, '#e9b04b'); drawPC(mctx, b, MW/2, y+13, '#f4e9cf');
      }
      if (showHint){
        const f = hintAge > 4.4 ? (5 - hintAge)/.6 : 1;
        mctx.globalAlpha *= f > .66 ? 1 : f > .33 ? .66 : .33;
        const y = expanded ? 6 : MH - 24 - 8 - 13;
        shadowP(hintText, Math.round(MW/2 - widthP(hintText)/2), y, '#a197b3');
      }
      mctx.globalAlpha = 1; drew = true;
    }
  } else PLATE.id = null;
  return drew;
}
function drawMarks(t){
  mctx.clearRect(0,0,marks.width,marks.height);
  const words = drawWords(t);
  if (!INFO.on) return words;
  const groups = infoGroups(); let gi = 0; const labels = [];
  const box = new THREE.Box3();
  for (const label in groups){
    box.makeEmpty(); groups[label].forEach(o=>box.expandByObject(o));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
    for (let i=0;i<8;i++){
      const p = V3(i&1?box.max.x:box.min.x, i&2?box.max.y:box.min.y, i&4?box.max.z:box.min.z).project(camera);
      if (p.z > 1) behind = true;
      const x = (p.x*.5+.5)*MW, y = (-p.y*.5+.5)*MH; x0 = Math.min(x0,x); y0 = Math.min(y0,y); x1 = Math.max(x1,x); y1 = Math.max(y1,y);
    }
    if (behind || x1 < 0 || y1 < 0 || x0 > MW || y0 > MH) { gi++; continue; }
    const cx = (x0+x1)/2, cy = (y0+y1)/2, rx = Math.max(7, (x1-x0)/2 + 4), ry = Math.max(6, (y1-y0)/2 + 3);
    const prog = clamp((t - INFO.t0)*2.2 - gi*.07, 0, 1); gi++;
    if (prog <= 0) continue;
    const seed = label.length*1.7 + label.charCodeAt(0)*.13, a0 = -2.2 + seed%1;
    const steps = Math.ceil(Math.PI*2*Math.max(rx,ry)*1.6 * 1.08);
    const n = Math.floor(steps * easeOut(prog));
    const pts = [];
    for (let i=0;i<=n;i++){
      const a = a0 + i/steps * Math.PI*2*1.08;
      const j = 1 + .05*Math.sin(a*3 + seed) + .025*Math.sin(a*7 + seed*2) + (i/steps)*.06;
      pts.push([Math.round(cx + Math.cos(a)*rx*j), Math.round(cy + Math.sin(a)*ry*j)]);
    }
    mctx.fillStyle = 'rgba(14,12,19,.85)'; pts.forEach(([x,y])=>mctx.fillRect(x+1, y+1, 1, 1));
    mctx.fillStyle = '#f4e9cf'; pts.forEach(([x,y])=>mctx.fillRect(x, y, 1, 1));
    if (prog > .85) labels.push({ label, cx, cy, rx, ry });
  }
  // place labels where they don't collide, with a leader line back to the circle (like the sketch)
  const placed = [];
  const hits = (r)=>placed.some(p=>r.x < p.x+p.w+3 && r.x+r.w+3 > p.x && r.y < p.y+p.h+2 && r.y+r.h+2 > p.y);
  for (const L of labels){
    const tw = widthP(L.label) + 4, th = 11;
    const cands = [
      [L.cx + L.rx*.6, L.cy + L.ry*.8], [L.cx - L.rx*.6 - tw, L.cy + L.ry*.8], [L.cx - tw/2, L.cy + L.ry + 6],
      [L.cx - tw/2, L.cy - L.ry - th - 6], [L.cx + L.rx + 6, L.cy - th/2], [L.cx - L.rx - tw - 6, L.cy - th/2],
      [L.cx + L.rx*.6, L.cy + L.ry + 16], [L.cx - L.rx*.6 - tw, L.cy + L.ry + 16], [L.cx - tw/2, L.cy + L.ry + 28], [L.cx - tw/2, L.cy - L.ry - th - 20],
    ];
    let r = null;
    for (const [x,y] of cands){ const c = { x:Math.round(clamp(x, 2, MW - tw - 2)), y:Math.round(clamp(y, 2, MH - th - 2)), w:tw, h:th }; if (!hits(c)){ r = c; break; } }
    if (!r) continue;
    placed.push(r);
    const lx = clamp(L.cx, r.x, r.x + r.w), ly = clamp(L.cy, r.y, r.y + r.h);
    const ang = Math.atan2((ly - L.cy)/L.ry, (lx - L.cx)/L.rx);
    const ex = L.cx + Math.cos(ang)*L.rx, ey = L.cy + Math.sin(ang)*L.ry;
    if (Math.hypot(lx - ex, ly - ey) > 4 && Math.hypot(lx - L.cx, ly - L.cy) > Math.hypot(ex - L.cx, ey - L.cy)){
      const n = Math.ceil(Math.hypot(lx - ex, ly - ey));
      for (let i=0;i<=n;i++){ const x = Math.round(lerp(ex, lx, i/n)), y = Math.round(lerp(ey, ly, i/n)); mctx.fillStyle = 'rgba(14,12,19,.85)'; mctx.fillRect(x+1, y+1, 1, 1); mctx.fillStyle = '#f4e9cf'; mctx.fillRect(x, y, 1, 1); }
    }
    mctx.fillStyle = 'rgba(14,12,19,.85)'; mctx.fillRect(r.x, r.y, r.w, r.h);
    drawP(mctx, L.label, r.x + 2, r.y + 1, '#f4e9cf');
  }
  return true;
}
function infoOn(){ INFO.on = true; INFO.t0 = STATE.t; $('#info').setAttribute('aria-pressed', 'true'); sfx.tick(true);
  if (STATE.zone === 'patio'){ announce('Out here: feed the koi in the pond or clap to call them, set off the shishi-odoshi, light the stone lantern, or take the door back inside.'); return; }
  announce('You can pick up: the magazine, the phone, the Game Boy and its three cartridges, the coffee, the succulent, KP17 on the console, and the records on the right wall. The TV, lamp and roomba react to a click.'); }
function infoOff(){ INFO.on = false; $('#info').setAttribute('aria-pressed', 'false'); }

/* =====================================================================
   ACTIONS + INPUT
   ===================================================================== */
const ROOMBA_LINES = ['beep boop', 'mapping the room. again.', 'excuse me', '412 laps and counting'];
function activate(id){
  if (id === 'clap'){ if (STATE.zone === 'patio') clap(); return; }
  const it = INTERACT[id]; if (!it) return;
  if (it.kind === 'hold'){ if (STATE.zone === 'room') pickUp(id); return; }
  if (id === 'tv'){ STATE.channel = (STATE.channel + 1) % CHANNELS.length; STATE.channelFlash = 1; sfx.channel(); say('tv', `ch 0${STATE.channel+1} \u00b7 ${CHANNELS[STATE.channel].toLowerCase()}`); announce('TV, channel ' + (STATE.channel+1) + ': ' + CHANNELS[STATE.channel].toLowerCase()); }
  if (id === 'lamp'){ STATE.lampOverride = !STATE.lampOn; TIME.dirty = true; sfx.lamp(); }
  if (id === 'roomba'){ roombaAI.spin = .9; sfx.roomba(); say('roomba', ROOMBA_LINES[(ROOM.beeps = (ROOM.beeps||0) + 1) % ROOMBA_LINES.length]); }
  if (id === 'door'){ STATE.zone === 'room' ? goOut() : goIn(); return; }
  if (id === 'pond'){
    const p = STATE.lastHit && STATE.zone === 'patio' ? STATE.lastHit : V3(POND.x + (Math.random()-.5)*1.5, 0, POND.z + (Math.random()-.5)*.8);
    feed(p.x, p.z);
    announce(koi.every(f=>f.full >= f.def.appetite) ? 'A pinch of koi food. They\'re full; it drifts.' : 'A pinch of koi food lands on the water.');
  }
  if (id === 'shishi'){ SHI.push = 1; }
  if (id === 'lantern'){ const lit = LANTERN.on !== null ? LANTERN.on : (TIME.T ? TIME.T.lamp > .5 : false); LANTERN.on = !lit; sfx.lamp(); }
}
function setPointer(e){
  const r = canvas.getBoundingClientRect();
  STATE.pointer.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1);
  STATE.pointerIn = true;
  if (e.pointerType) STATE.pointerType = e.pointerType;
}
let down = null;
function onWorld(e){ return e.target === canvas || !!(e.target.closest && e.target.closest('a.hot')); }
addEventListener('pointerdown', e=>{
  sfx.unlock();
  if (INFO.on && !(e.target.closest && e.target.closest('#info'))){ infoOff(); down = { consumed:true }; return; }
  if (!onWorld(e)){ down = null; return; }
  setPointer(e);
  down = { x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, moved:0, hot:!!e.target.closest('a.hot') };
  HOLD.dragged = false;
  if (HOLD.id && HOLD.phase === 'held'){
    const hit = HOLD.id === 'gameboy' && GBOS.power ? holdHit() : null;
    if (hit && hit.object.name === 'gbLCD') down.lcd = true; else HOLD.drag = true;
  }
});
addEventListener('pointermove', e=>{
  if (e.target === canvas || onWorld(e)) setPointer(e);
  if (!down || down.consumed) return;
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
  down.lx = e.clientX; down.ly = e.clientY; down.moved += Math.abs(dx) + Math.abs(dy);
  if (down.moved <= 6) return;
  HOLD.dragged = true;
  if (down.lcd){
    if (GBOS.state === 'time'){ const hit = holdHit(); if (hit && hit.object.name === 'gbLCD') gbTap(hit.uv.x*160, 82); }
    else if (GBOS.state === 'fall'){ down.dy = (down.dy||0) + dy; if (down.dy > 40 && !down.dropped){ down.dropped = true; gbInput('b'); } }
    else GBOS.scroll = clamp(GBOS.scroll - dy*.6, 0, GBOS.maxScroll);
    return;
  }
  if (HOLD.drag) holdDrag(dx, dy);
});
addEventListener('pointerup', e=>{
  const d = down; down = null; HOLD.drag = false;
  if (!d || d.consumed || d.moved > 6 || d.hot) return;
  if (HOLD.busy) return;
  if (HOLD.id){ const hit = holdHit(); if (hit) useHeld(hit); else putDown(); return; }
  const id = pick(); if (id) activate(id);
  else if (STATE.zone === 'patio' && STATE.pointerIn) clap();
});
addEventListener('pointercancel', ()=>{ down = null; HOLD.drag = false; });
canvas.addEventListener('pointerleave', e=>{ if (e.pointerType === 'mouse' && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('a.hot'))) STATE.pointerIn = false; });
addEventListener('wheel', e=>{
  if (HOLD.id === 'gameboy' && GBOS.power && (GBOS.state === 'exp' || GBOS.state === 'skl')){ GBOS.scroll = clamp(GBOS.scroll + e.deltaY*.25, 0, GBOS.maxScroll); }
}, { passive:true });
function updateCursor(){
  let c = 'default';
  if (down && HOLD.dragged && HOLD.drag) c = 'grabbing';
  else if (HOLD.id && HOLD.phase === 'held') c = STATE.pointerIn && holdHit() ? 'pointer' : 'default';
  else if (STATE.hovered) c = 'pointer';
  if (canvas.style.cursor !== c) canvas.style.cursor = c;
}

/* keyboard: a list of the room's objects, visible only while it has focus */
const keyNav = $('#keynav');
const KEY_ITEMS = [['magazine','Magazine: projects'],['phone','Phone: socials'],['gameboy','Game Boy'],['cart-exp','Red cartridge'],['cart-skl','Blue cartridge'],['cart-time','Yellow cartridge'],['coffee','Coffee'],['succulent','Succulent'],['kp17','KP17 robot']]
  .concat(ALBUMS.map((a,i)=>['album-'+i, `${a.title}, ${a.artist}`])).concat([['tv','TV'],['lamp','Lamp'],['roomba','Roomba'],['door','Sliding door: out to the patio']])
  .concat([['pond','Feed the koi','patio'],['clap','Clap to call the koi','patio'],['shishi','Shishi-odoshi','patio'],['lantern','Stone lantern','patio'],['door','Back inside','patio']]);
KEY_ITEMS.forEach(([id,label,zone])=>{
  const b = document.createElement('button'); b.textContent = label; b.dataset.id = id; b.dataset.zone = zone || 'room'; b.hidden = b.dataset.zone !== 'room';
  b.addEventListener('focus', ()=>{ if (!HOLD.id && INTERACT[id]) STATE.keyHover = id; });
  b.addEventListener('blur', ()=>{ STATE.keyHover = null; });
  b.addEventListener('click', ()=>{ sfx.unlock(); STATE.keyHover = null; activate(id); if (HOLD.id === id) HOLD.viaKey = true; if (INTERACT[id] && INTERACT[id].kind === 'hold') setTimeout(()=>{ if (HOLD.id && HOLD.id.startsWith('album-')) hots[0].focus({ preventScroll:true }); else if (HOLD.id === 'phone') hots[0].focus({ preventScroll:true }); }, 650); });
  keyNav.append(b);
});

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kIdx = 0;
addEventListener('keydown', e=>{
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kIdx = key === KONAMI[kIdx] ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
  if (kIdx === KONAMI.length && HOLD.id === 'gameboy' && GBOS.power){ kIdx = 0; if (GBOS.cart && GBOS.cart !== 'fall'){ carts[GBOS.cart].visible = true; if (BLOBS['cart-'+GBOS.cart]) BLOBS['cart-'+GBOS.cart].userData.fade = false; } GBOS.cart = 'fall'; GBOS.state = 'fall'; bfReset(); sfx.cheat(); sayScreen('blockfall'); return; }
  if (kIdx === KONAMI.length){ kIdx = 0; STATE.party = !STATE.party; sfx.unlock(); sfx.cheat(); sayScreen(STATE.party ? 'party mode' : 'party over'); announce(STATE.party ? 'Party mode.' : 'Party over.'); return; }
  if (INFO.on && key !== 'Tab'){ infoOff(); if (key === 'Escape') return; }
  if (key === 'Escape' && STATE.zone === 'patio'){ goIn(); return; }
  if (key === 'Escape'){ if (HOLD.id){ const back = HOLD.viaKey && keyNav.querySelector(`[data-id="${HOLD.id}"]`); putDown(); if (back) back.focus({ preventScroll:true }); else if (document.activeElement && document.activeElement.closest && document.activeElement.closest('a.hot')) document.activeElement.blur(); } return; }
  if (!HOLD.id){ if ((key === 'i' || key === '?') && !(e.target.closest && e.target.closest('button,a'))) infoOn(); return; }
  if (HOLD.busy) return;
  const onLink = e.target.closest && e.target.closest('a.hot');
  if (HOLD.id === 'magazine' && HOLD.mode !== 'closed' && (key === 'ArrowRight' || key === 'ArrowLeft')){ e.preventDefault(); useHeld(null, key === 'ArrowRight' ? 'R' : 'L'); return; }
  if (HOLD.id === 'gameboy' && GBOS.power){
    const m = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', z:'a', x:'b', ' ':'b', p:'start' };
    if (m[key]){ e.preventDefault(); gbInput(m[key]); return; }
  }
  if ((key === 'Enter' || key === ' ') && !onLink && !(e.target.closest && e.target.closest('#keynav,#corner'))){ e.preventDefault(); useHeld(null, HOLD.id === 'magazine' ? 'R' : (HOLD.id === 'gameboy' && GBOS.power ? 'a' : null)); return; }
  const rot = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] }[key];
  if (rot){ e.preventDefault(); holdRotateKey(rot[0], rot[1]); }
});

$('#info').addEventListener('click', ()=>{ INFO.on ? infoOff() : infoOn(); });
$('#back').addEventListener('click', ()=>{ sfx.unlock(); goIn(); });
function syncZoneUI(){
  $('#back').hidden = STATE.zone !== 'patio';
  if (STATE.zone === 'patio'){ koiVisit(); LANTERN.light.shadow.needsUpdate = true; }
  keyNav.querySelectorAll('button').forEach(b=>{ b.hidden = b.dataset.zone !== STATE.zone; });
  if (INFO.on) infoOff();
  hotHide();
}
const soundBtn = $('#sound');
function syncSound(){ soundBtn.setAttribute('aria-pressed', String(sfx.on)); soundBtn.setAttribute('aria-label', sfx.on ? 'Sound on' : 'Sound off'); soundBtn.classList.toggle('off', !sfx.on); }
soundBtn.addEventListener('click', ()=>{ sfx.set(!sfx.on); syncSound(); sfx.unlock(); sfx.click(); });
syncSound();

/* =====================================================================
   BOOT
   ===================================================================== */
function boot(){
  const bar = $('#load-bar');
  if (!renderer || !renderer.capabilities.isWebGL2){
    $('#loader').classList.add('done');
    const f = document.createElement('div'); f.id = 'fallback';
    f.innerHTML = `<div class="box"><h2>This room needs WebGL 2</h2><p><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a> · <a href="${LINKS.linkedin}" target="_blank" rel="noopener">LinkedIn</a> · <a href="${LINKS.v1}" target="_blank" rel="noopener">Pocket Dev</a></p></div>`;
    document.body.append(f); return;
  }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  bar.style.width = '40%';
  resize();
  addEventListener('resize', ()=>{ resize(); MAG.painted = null; if (HOLD.id === 'magazine' && HOLD.mode !== 'closed'){ magPaintPages(); magFrame(); } if (HOLD.id === 'phone') PH.dirty = true; });
  applyTime(currentHour()); TIME.last = currentHour();
  drawSky(TIME.T, TIME.h, 0); drawTV(0); gbPaint(0); phoneTick(0);
  pickRoombaTarget();
  bar.style.width = '75%';
  renderer.compile(scene, camera);
  requestAnimationFrame(t=>{ lastT = t; frame(t); setTimeout(()=>{ bar.style.width = '100%'; setTimeout(()=>$('#loader').classList.add('done'), 200); }, 220); });
}
boot();
