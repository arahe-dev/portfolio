import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

/* =====================================================================
   CONTENT
   ===================================================================== */
const LINKS = {
  github:'https://github.com/arahe-dev',
  linkedin:'https://linkedin.com/in/arahe',
  v1:'v1/',
};
const PROJECTS = [
  { name:'BREAD v2', sub:'A from-scratch CUDA inference engine for mixture-of-experts models.', year:'2026', stack:['CUDA','C++','GGUF'], art:'gpu',
    pull:'A 35B-parameter model on an 8 GB laptop GPU.',
    pts:['Ports flash-moe from macOS/Metal to Windows/CUDA, targeting Qwen3.5-35B-A3B on an RTX 4060.',
         'Three-tier weight streaming: VRAM, pinned RAM, NVMe, with an 18-slot LRU expert cache and async prefetch.',
         'Custom GGUF parser and Q4_K / Q6_K dequantisation, verified against ggml-quants.c.',
         'Profiled PCIe x8 at 8-12 GB/s in practice and tuned parallel NVMe reads.'] },
  { name:'MoE KV Routing', sub:'Sparse attention routing with a live dashboard, at a 262K-token context.', year:'2026', stack:['React','WebSocket','Node.js'], art:'heat',
    pull:'8-10x less KV-cache bandwidth.',
    pts:['Predicts which KV blocks each attention head will read and only materialises those.',
         'Real-time dashboard of per-head routing decisions, with recall heatmaps against true attention mass.',
         'Falls back to dense circular KV automatically when accuracy drops.'] },
  { name:'GloveXR', sub:'A wearable IMU glove that captures hand motion for robot teleoperation.', year:'2025', stack:['Embedded C','Java','Sensor fusion'], art:'hand',
    pull:'Every finger tracked. No cameras, no magnetometers.',
    pts:['LSM6DSO32 6-DoF IMUs on each finger joint.',
         'Mahony-style sensor fusion and kinematic-chain maths for per-joint angles from a wrist reference.',
         'Works right next to motors, where optical and magnetic tracking fail.'] },
  { name:'Atelier', sub:'A web browser that runs inside your terminal, written in Rust.', year:'2025', stack:['Rust','Ratatui','Tokio'], art:'term',
    pull:'The web, in about 361 lines of Rust.',
    pts:['Headless Chrome captures the page; it is downscaled to the terminal grid and drawn with Ratatui.',
         'Sixel graphics, with a 256-colour ANSI fallback for older terminals.',
         'Async Tokio event loop and swappable rendering backends.'] },
  { name:'Rail Inspect', sub:'Clip-on track monitoring for trains already in service. Smart India Hackathon 2025.', year:'2025', stack:['Embedded C','PCB','IoT'], art:'rail',
    pull:'70% lower CAPEX than a track-recording car.',
    pts:['Replaces dedicated inspection trains with clip-on IMU units.',
         'On-device FFT / Welch analysis separates defects from normal wear.',
         'KAVACH RFID geotagging that works in tunnels, plus 5G alerts.'] },
  { name:'KP17', sub:'A 17-DOF bipedal humanoid, built by Team Genesis.', year:'2024-now', stack:['C++','SolidWorks','RoboCup'], art:'bot',
    pull:'Seventeen joints. No tether. All compute on board.',
    pts:['6 DOF per leg, 1 at the waist, 2 per arm, 2 in the neck.',
         'Pod-based distributed control; modules talk over I2C and CAN.',
         'Teleoperated through GloveXR. The one on the console is a desk model.'] },
];
const EXPERIENCE = [
  { role:'Co-founder & CTO', org:'Sentrix Robotics', when:'2025-now',
    pts:['V-NEST incubated, DPIIT recognised','Owns hardware, firmware and software','Google AI Day for Startups 2025'] },
  { role:'Co-founder, Head of Ops', org:'Team Genesis', when:'2025-now',
    pts:['VIT Chennai’s first humanoid team','Directs KP17 and GloveXR','Runs a 16-person team'] },
  { role:'Management member', org:'IEEE CompSoc VIT', when:'2025-now',
    pts:['Organised BuildersHut hackathon'] },
];
const SKILLS = [
  { k:'Inference', lv:92, s:'CUDA, MoE, GGUF, llama.cpp' },
  { k:'Languages', lv:88, s:'C/C++, Rust, Python, Java' },
  { k:'Embedded', lv:85, s:'ESP32, IMU fusion, drivers' },
  { k:'Robotics', lv:80, s:'Humanoids, teleoperation' },
  { k:'Backend', lv:70, s:'Node, WebSocket, UDP, MCP' },
  { k:'Frontend', lv:66, s:'React, Ratatui, Sixel' },
];
const HONORS = [
  ['Dept. rank 4','Mechatronics & Automation, AY 2024-25, VIT Chennai'],
  ['SIH 2025','Selected, Smart India Hackathon hardware PS 25020'],
  ['EUREKA!','Shortlisted for zonals, E-Cell IIT Bombay'],
  ['4th place','IEEECS HackHub ’25'],
  ['Fellow','CrftHQ build-in-public founder network'],
  ['Speaker','IEEECS BuildersHut'],
];
const ALBUMS = [
  { id:1146195596, title:'Blonde', artist:'Frank Ocean', year:2016, url:'https://music.apple.com/us/album/blonde/1146195596' },
  { id:1878382378, title:'U', artist:'underscores', year:2026, url:'https://music.apple.com/us/album/u/1878382378' },
  { id:1440745498, title:'Take Care', artist:'Drake', year:2011, url:'https://music.apple.com/us/album/take-care-deluxe-version/1440745498' },
  { id:6804850775, title:'London’s Saviour', artist:'fakemink', year:2023, url:'https://music.apple.com/us/album/londons-saviour/6804850775' },
  { id:1714908584, title:'Trilogy', artist:'The Weeknd', year:2012, url:'https://music.apple.com/us/album/trilogy/1714908584' },
  { id:1297925080, title:'Kokyuu', artist:'Lily Chou-Chou', year:2001, url:'https://music.apple.com/us/album/kokyuu/1297925080' },
  { id:1477895569, title:'So Much Fun', artist:'Young Thug', year:2019, url:'https://music.apple.com/us/album/so-much-fun/1477895569' },
  { id:1440881722, title:'DAMN.', artist:'Kendrick Lamar', year:2017, url:'https://music.apple.com/us/album/damn/1440881722' },
  { id:1440873068, title:'Yeezus', artist:'Kanye West', year:2013, url:'https://music.apple.com/us/album/yeezus/1440873068' },
];

/* =====================================================================
   UTILS
   ===================================================================== */
const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const ease = t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOut = t=>1-Math.pow(1-t,3);
const damp = (a,b,k,dt)=>lerp(a,b,1-Math.exp(-k*dt));
const V3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function mulberry(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hexRGB(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function rgbHex(r,g,b){ return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ const A=hexRGB(a),B=hexRGB(b); return rgbHex(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t)); }
function shade(a,k){ const A=hexRGB(a); return rgbHex(A[0]*k,A[1]*k,A[2]*k); }
function lum(h){ const [r,g,b]=hexRGB(h); return (r*.299+g*.587+b*.114)/255; }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =====================================================================
   PIXEL FONTS
   - FONT: 5x7 monospace capitals (TV, tiny labels)
   - drawP / widthP / wrapP: proportional 5x7 with lowercase + descenders
   - MICRO: 3x5 capitals for very small screens
   ===================================================================== */
const FONT_SRC = {
 A:'01110 10001 10001 11111 10001 10001 10001', B:'11110 10001 10001 11110 10001 10001 11110',
 C:'01110 10001 10000 10000 10000 10001 01110', D:'11110 10001 10001 10001 10001 10001 11110',
 E:'11111 10000 10000 11110 10000 10000 11111', F:'11111 10000 10000 11110 10000 10000 10000',
 G:'01110 10001 10000 10111 10001 10001 01111', H:'10001 10001 10001 11111 10001 10001 10001',
 I:'01110 00100 00100 00100 00100 00100 01110', J:'00111 00010 00010 00010 00010 10010 01100',
 K:'10001 10010 10100 11000 10100 10010 10001', L:'10000 10000 10000 10000 10000 10000 11111',
 M:'10001 11011 10101 10101 10001 10001 10001', N:'10001 10001 11001 10101 10011 10001 10001',
 O:'01110 10001 10001 10001 10001 10001 01110', P:'11110 10001 10001 11110 10000 10000 10000',
 Q:'01110 10001 10001 10001 10101 10010 01101', R:'11110 10001 10001 11110 10100 10010 10001',
 S:'01111 10000 10000 01110 00001 00001 11110', T:'11111 00100 00100 00100 00100 00100 00100',
 U:'10001 10001 10001 10001 10001 10001 01110', V:'10001 10001 10001 10001 10001 01010 00100',
 W:'10001 10001 10001 10101 10101 10101 01010', X:'10001 10001 01010 00100 01010 10001 10001',
 Y:'10001 10001 01010 00100 00100 00100 00100', Z:'11111 00001 00010 00100 01000 10000 11111',
 0:'01110 10001 10011 10101 11001 10001 01110', 1:'00100 01100 00100 00100 00100 00100 01110',
 2:'01110 10001 00001 00010 00100 01000 11111', 3:'11111 00010 00100 00010 00001 10001 01110',
 4:'00010 00110 01010 10010 11111 00010 00010', 5:'11111 10000 11110 00001 00001 10001 01110',
 6:'00110 01000 10000 11110 10001 10001 01110', 7:'11111 00001 00010 00100 01000 01000 01000',
 8:'01110 10001 10001 01110 10001 10001 01110', 9:'01110 10001 10001 01111 00001 00010 01100',
 ' ':'00000 00000 00000 00000 00000 00000 00000', '.':'00000 00000 00000 00000 00000 00000 00100',
 ',':'00000 00000 00000 00000 00000 00100 01000', ':':'00000 00000 00100 00000 00000 00100 00000',
 ';':'00000 00000 00100 00000 00000 00100 01000', '-':'00000 00000 00000 01110 00000 00000 00000',
 '/':'00001 00010 00010 00100 01000 01000 10000', '!':'00100 00100 00100 00100 00100 00000 00100',
 '?':'01110 10001 00001 00010 00100 00000 00100', '>':'01000 00100 00010 00001 00010 00100 01000',
 '<':'00010 00100 01000 10000 01000 00100 00010', '+':'00000 00100 00100 11111 00100 00100 00000',
 "'":'00100 00100 00000 00000 00000 00000 00000', '"':'01010 01010 00000 00000 00000 00000 00000',
 '(':'00010 00100 01000 01000 01000 00100 00010', ')':'01000 00100 00010 00010 00010 00100 01000',
 '_':'00000 00000 00000 00000 00000 00000 11111', '&':'01100 10010 10100 01000 10101 10010 01101',
 '%':'11000 11001 00010 00100 01000 10011 00011', '#':'01010 01010 11111 01010 11111 01010 01010',
 '*':'00000 00100 10101 01110 10101 00100 00000', '=':'00000 00000 11111 00000 11111 00000 00000',
 '|':'00100 00100 00100 00100 00100 00100 00100', '·':'00000 00000 00000 00100 00000 00000 00000',
 '$':'00100 01111 10100 01110 00101 11110 00100', '♥':'00000 01010 11111 11111 01110 00100 00000',
 '▶':'01000 01100 01110 01111 01110 01100 01000', '◀':'00010 00110 01110 11110 01110 00110 00010',
 '▲':'00000 00100 01110 11111 00000 00000 00000', '▼':'00000 00000 11111 01110 00100 00000 00000',
 '→':'00000 00100 00010 11111 00010 00100 00000', '×':'00000 10001 01010 00100 01010 10001 00000',
 '↗':'00000 01111 00011 00101 01001 10000 00000', '█':'11111 11111 11111 11111 11111 11111 11111',
 '@':'01110 10001 10111 10101 10111 10000 01110', '[':'01110 01000 01000 01000 01000 01000 01110',
 ']':'01110 00010 00010 00010 00010 00010 01110',
};
const LOWER_SRC = {
 a:'00000 00000 01110 00001 01111 10001 01111 00000 00000', b:'10000 10000 10110 11001 10001 10001 11110 00000 00000',
 c:'00000 00000 01110 10000 10000 10001 01110 00000 00000', d:'00001 00001 01101 10011 10001 10001 01111 00000 00000',
 e:'00000 00000 01110 10001 11111 10000 01110 00000 00000', f:'00110 01001 01000 11100 01000 01000 01000 00000 00000',
 g:'00000 00000 01111 10001 10001 01111 00001 10001 01110', h:'10000 10000 10110 11001 10001 10001 10001 00000 00000',
 i:'00100 00000 01100 00100 00100 00100 01110 00000 00000', j:'00010 00000 00110 00010 00010 00010 00010 10010 01100',
 k:'10000 10000 10010 10100 11000 10100 10010 00000 00000', l:'01100 00100 00100 00100 00100 00100 01110 00000 00000',
 m:'00000 00000 11010 10101 10101 10001 10001 00000 00000', n:'00000 00000 10110 11001 10001 10001 10001 00000 00000',
 o:'00000 00000 01110 10001 10001 10001 01110 00000 00000', p:'00000 00000 11110 10001 10001 11110 10000 10000 10000',
 q:'00000 00000 01111 10001 10001 01111 00001 00001 00001', r:'00000 00000 10110 11001 10000 10000 10000 00000 00000',
 s:'00000 00000 01111 10000 01110 00001 11110 00000 00000', t:'01000 01000 11100 01000 01000 01001 00110 00000 00000',
 u:'00000 00000 10001 10001 10001 10011 01101 00000 00000', v:'00000 00000 10001 10001 10001 01010 00100 00000 00000',
 w:'00000 00000 10001 10001 10101 10101 01010 00000 00000', x:'00000 00000 10001 01010 00100 01010 10001 00000 00000',
 y:'00000 00000 10001 10001 10001 01111 00001 10001 01110', z:'00000 00000 11111 00010 00100 01000 11111 00000 00000',
};
const FONT = {}; for (const k in FONT_SRC) FONT[k] = FONT_SRC[k].split(' ');
const textW = (s,sc=1)=>s.length*6*sc - sc;
function drawText(ctx, s, x, y, color, sc=1){
  ctx.fillStyle = color; s = String(s).toUpperCase();
  for (const ch of s){
    const g = FONT[ch] || FONT['?'];
    for (let r=0;r<7;r++) for (let c=0;c<5;c++) if (g[r][c]==='1') ctx.fillRect(x+c*sc, y+r*sc, sc, sc);
    x += 6*sc;
  }
}
function drawTextC(ctx, s, cx, y, color, sc=1){ drawText(ctx, s, Math.round(cx - textW(s,sc)/2), y, color, sc); }

/* proportional font: every glyph trimmed to its inked columns */
const PGLYPH = {};
(function(){
  const add = (k, rows)=>{
    while (rows.length < 9) rows.push('00000');
    let mn = 5, mx = -1;
    rows.forEach(r=>{ for (let c=0;c<5;c++) if (r[c]==='1'){ mn = Math.min(mn,c); mx = Math.max(mx,c); } });
    PGLYPH[k] = mx < 0 ? { rows, x0:0, w:2 } : { rows, x0:mn, w:mx-mn+1 };
  };
  for (const k in FONT_SRC) add(k, FONT_SRC[k].split(' '));
  for (const k in LOWER_SRC) add(k, LOWER_SRC[k].split(' '));
})();
const P_ALIAS = { '’':"'", '‘':"'", '“':'"', '”':'"', '–':'-', '—':'-', 'é':'e', 'í':'i', '…':'.' };
function pg(ch){ return PGLYPH[ch] || PGLYPH[P_ALIAS[ch]] || PGLYPH[ch.toUpperCase()] || PGLYPH['?']; }
function widthP(s, sc=1){ let w = 0; for (const ch of String(s)) w += (pg(ch).w + 1)*sc; return Math.max(0, w - sc); }
function drawP(ctx, s, x, y, color, sc=1){
  ctx.fillStyle = color;
  for (const ch of String(s)){
    const g = pg(ch);
    for (let r=0;r<9;r++){ const row = g.rows[r]; for (let c=0;c<g.w;c++) if (row[g.x0+c]==='1') ctx.fillRect(x+c*sc, y+r*sc, sc, sc); }
    x += (g.w+1)*sc;
  }
  return x;
}
function drawPC(ctx, s, cx, y, color, sc=1){ return drawP(ctx, s, Math.round(cx - widthP(s,sc)/2), y, color, sc); }
function wrapP(s, maxW, sc=1){
  const words = String(s).split(/\s+/), lines = []; let cur = '';
  for (const w of words){
    const t = cur ? cur + ' ' + w : w;
    if (widthP(t, sc) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

const MICRO_SRC = {
 A:'010 101 111 101 101', B:'110 101 110 101 110', C:'011 100 100 100 011', D:'110 101 101 101 110', E:'111 100 110 100 111',
 F:'111 100 110 100 100', G:'011 100 101 101 011', H:'101 101 111 101 101', I:'111 010 010 010 111', J:'001 001 001 101 010',
 K:'101 101 110 101 101', L:'100 100 100 100 111', M:'101 111 111 101 101', N:'110 101 101 101 101', O:'010 101 101 101 010',
 P:'110 101 110 100 100', Q:'010 101 101 110 011', R:'110 101 110 101 101', S:'011 100 010 001 110', T:'111 010 010 010 010',
 U:'101 101 101 101 111', V:'101 101 101 101 010', W:'101 101 111 111 101', X:'101 101 010 101 101', Y:'101 101 010 010 010',
 Z:'111 001 010 100 111', 0:'111 101 101 101 111', 1:'010 110 010 010 111', 2:'110 001 010 100 111', 3:'110 001 010 001 110',
 4:'101 101 111 001 001', 5:'111 100 110 001 110', 6:'011 100 111 101 111', 7:'111 001 010 010 010', 8:'111 101 111 101 111',
 9:'111 101 111 001 110', ' ':'000 000 000 000 000', '.':'000 000 000 000 010', ':':'000 010 000 010 000', '-':'000 000 111 000 000',
 '/':'001 001 010 100 100', '%':'101 001 010 100 101', '·':'000 000 010 000 000', '$':'011 110 010 011 110', '>':'100 010 001 010 100',
 '+':'000 010 111 010 000', '!':'010 010 010 000 010', '?':'110 001 010 000 010', '(':'010 100 100 100 010', ')':'010 001 001 001 010',
 '_':'000 000 000 000 111', ',':'000 000 000 010 100', "'":'010 010 000 000 000', '&':'010 101 010 101 011',
};
const MICRO = {}; for (const k in MICRO_SRC) MICRO[k] = MICRO_SRC[k].split(' ');
const microW = s=>s.length*4 - 1;
function drawMicro(ctx, s, x, y, color){
  ctx.fillStyle = color; s = String(s).toUpperCase();
  for (const ch of s){ const g = MICRO[ch] || MICRO['?']; for (let r=0;r<5;r++) for (let c=0;c<3;c++) if (g[r][c]==='1') ctx.fillRect(x+c, y+r, 1, 1); x += 4; }
}
function drawMicroC(ctx, s, cx, y, color){ drawMicro(ctx, s, Math.round(cx - microW(s)/2), y, color); }

/* =====================================================================
   TEXTURES & MATERIALS
   ===================================================================== */
function makeCanvas(w, h, read){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', read ? { willReadFrequently:true } : undefined); ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
function canvasTex(w, h, draw, o={}){
  const [c, ctx] = makeCanvas(w, h, o.read);
  if (draw) draw(ctx,w,h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = o.mip ? THREE.LinearMipmapLinearFilter : (o.linear ? THREE.LinearFilter : THREE.NearestFilter);
  t.generateMipmaps = !!o.mip;
  if (o.repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.userData.ctx = ctx; t.userData.canvas = c;
  return t;
}
/* swap a material's map for a freshly painted canvas (sized to the screen when an item is held) */
function repaint(mat, w, h, draw){
  const old = mat.map;
  const t = canvasTex(Math.max(1,Math.round(w)), Math.max(1,Math.round(h)), draw);
  t.userData.temp = true;
  mat.map = t; if (mat.emissiveMap) mat.emissiveMap = t;
  mat.needsUpdate = true;
  if (old && old.userData.temp) old.dispose();
  return t;
}
const GRADIENT = (()=>{
  const t = new THREE.DataTexture(new Uint8Array([52,112,178,255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
function toon(o){
  if (typeof o === 'string') o = { color:o };
  return new THREE.MeshToonMaterial({ gradientMap:GRADIENT, ...o });
}
function screenMat(map, boost=1){
  const m = new THREE.MeshBasicMaterial({ map, toneMapped:false });
  m.color.setScalar(boost);
  return m;
}
/* paper: lit like everything else, with enough self-light that ink stays legible */
function paperMat(map, glow=.42){ return toon({ map, emissive:'#ffffff', emissiveMap:map, emissiveIntensity:glow }); }

/* =====================================================================
   GEOMETRY HELPERS
   ===================================================================== */
function mesh(geo, mat, p={}, parent){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(p.x||0, p.y||0, p.z||0);
  m.rotation.set(p.rx||0, p.ry||0, p.rz||0);
  if (p.s) m.scale.setScalar(p.s);
  m.castShadow = p.cast !== false; m.receiveShadow = p.receive !== false;
  if (p.name) m.name = p.name;
  if (parent) parent.add(m);
  return m;
}
const Box = (w,h,d)=>new THREE.BoxGeometry(w,h,d);
const Cyl = (rt,rb,h,s=16,open=false)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open);

function roundRectShape(w, d, r){
  const s = new THREE.Shape(), x=-w/2, y=-d/2;
  r = Math.min(r, w/2-1e-4, d/2-1e-4);
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+d-r); s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
  s.lineTo(x+r,y+d); s.quadraticCurveTo(x,y+d,x,y+d-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
/* Rounded slab: footprint w x d, height h. Group 0 = caps (0..1 UV over the footprint, canvas top = far edge), group 1 = sides. */
function slab(w, h, d, r, bevel=0){
  const bw = w-2*bevel, bd = d-2*bevel;
  const uv = {
    generateTopUV(g, v, a, b, c){ return [a,b,c].map(i=>new THREE.Vector2((v[i*3]+w/2)/w, (v[i*3+1]+d/2)/d)); },
    generateSideWallUV(g, v, a, b, c, dd){
      const P = i=>[v[i*3],v[i*3+1],v[i*3+2]];
      const [ax,ay,az]=P(a),[bx,by,bz]=P(b),[cx,cy,cz]=P(c),[dx,dy,dz]=P(dd);
      if (Math.abs(ay-by) < Math.abs(ax-bx)) return [new THREE.Vector2(ax,1-az),new THREE.Vector2(bx,1-bz),new THREE.Vector2(cx,1-cz),new THREE.Vector2(dx,1-dz)];
      return [new THREE.Vector2(ay,1-az),new THREE.Vector2(by,1-bz),new THREE.Vector2(cy,1-cz),new THREE.Vector2(dy,1-dz)];
    }
  };
  const g = new THREE.ExtrudeGeometry(roundRectShape(bw, bd, Math.max(1e-4, r-bevel)), {
    depth: Math.max(1e-4, h-2*bevel), bevelEnabled: bevel>0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments: 5, UVGenerator: uv });
  g.rotateX(-Math.PI/2);
  g.translate(0, bevel, 0);
  g.computeVertexNormals();
  return g;
}
function rod(a, b, r0, r1, mat, parent, seg=6){
  const dir = new THREE.Vector3().subVectors(b,a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg), mat);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(V3(0,1,0), dir.normalize());
  m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function lathe(pts, seg=24){ return new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])), seg); }

/* Layers: 0 solid geometry, 1 effects (particles, light shafts, contact shadows), 2 mask (hover / held) */
const L_FX = 1, L_MASK = 2;
function fx_(o){ o.layers.set(L_FX); return o; }
