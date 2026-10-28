/* =====================================================================
   PAINTERS — everything that gets read up close is drawn here in the
   pixel fonts, at the resolution the held object occupies on screen.
   ===================================================================== */
const INK = '#16121e', PAPER = '#f1e7cd', PAPER2 = '#e4d4b0', RUST = '#c9573a', MUST = '#e2a83c', TEAL = '#2d5a63', MUTED = '#5a4e61';

/* ---------------- project illustrations ---------------- */
function drawArt(ctx, kind, x, y, w, h, seed=1){
  const R = mulberry(seed*97+3);
  const P = (c, xx, yy, ww=1, hh=1)=>{ ctx.fillStyle = c; ctx.fillRect(x+Math.round(xx), y+Math.round(yy), Math.max(1,Math.round(ww)), Math.max(1,Math.round(hh))); };
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (kind === 'gpu'){
    P('#141a24', 0, 0, w, h);
    for (let i=0;i<w;i+=6) P('#18202c', i, 0, 1, h);
    const cw = w*.62, chh = h*.52, cx = w*.06, cy = h*.24;
    P('#0b0d12', cx+2, cy+3, cw, chh);
    P('#2a2f3a', cx, cy, cw, chh); P('#3a414f', cx, cy, cw, 2);
    for (let i=0;i<cw-4;i+=3) P('#22262f', cx+2+i, cy+chh*.72, 1, chh*.24);
    const fan = (fx, r)=>{ for (let a=0;a<64;a++){ const t=a/64*Math.PI*2; for (let rr=2; rr<r; rr++){ if (((a + rr*2) % 8) < 3) P('#596173', fx+Math.cos(t+rr*.08)*rr, cy+chh*.38+Math.sin(t+rr*.08)*rr, 1, 1); } }
      P('#1a1d24', fx-2, cy+chh*.38-2, 4, 4); P(MUST, fx-1, cy+chh*.38-1, 2, 2); };
    const r = Math.min(chh*.34, cw*.2);
    fan(cx+cw*.27, r); fan(cx+cw*.7, r);
    P('#c9a24a', cx+cw*.12, cy+chh, cw*.6, 3); for (let i=0;i<cw*.6;i+=3) P('#8a6d2c', cx+cw*.12+i, cy+chh, 1, 3);
    const bx = cx+cw+w*.05, bw = w - bx - w*.04;
    [['VRAM','#e2a83c',.95],['RAM','#7ad0a8',.62],['NVME','#7f8cff',.34]].forEach(([k,c,v],i)=>{
      const by = h*.2 + i*h*.22;
      drawMicro(ctx, k, x+bx, y+by, '#9aa3b5');
      P('#232a36', bx, by+7, bw, 5); P(c, bx, by+7, bw*v, 5);
    });
    P('#e2a83c', w*.06, h*.1, 3, 3); drawMicro(ctx, 'RTX 4060 · 8 GB', x+w*.06+6, y+h*.1-1, '#c6ccd8');
  } else if (kind === 'heat'){
    P('#16131d', 0, 0, w, h);
    const cols = 16, rows = 10, cs = Math.floor(Math.min((w-8)/cols, (h-8)/rows));
    const ox = Math.floor((w - cs*cols)/2), oy = Math.floor((h - cs*rows)/2);
    const ramp = ['#1f1a2e','#2d2450','#4a2f6e','#7a3a6e','#b8505a','#e2a83c','#f6e7a8'];
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const band = Math.exp(-Math.pow((c - r*1.5 - 1), 2)/6) + (c < 2 ? .7 : 0) + R()*.18;
      const v = clamp(band, 0, .999);
      P(ramp[Math.floor(v*ramp.length)], ox+c*cs, oy+r*cs, cs-1, cs-1);
      if (band > .75 && R() < .55){ P(MUST, ox+c*cs-1, oy+r*cs-1, cs+1, 1); P(MUST, ox+c*cs-1, oy+r*cs+cs-1, cs+1, 1); P(MUST, ox+c*cs-1, oy+r*cs-1, 1, cs+1); P(MUST, ox+c*cs+cs-1, oy+r*cs-1, 1, cs+1); }
    }
  } else if (kind === 'hand'){
    P('#1d2430', 0, 0, w, h);
    for (let i=0;i<h;i+=4) P('#212938', 0, i, w, 1);
    const s = Math.max(1, Math.floor(Math.min(w/40, h/30)));
    const ox = Math.floor(w/2 - 10*s), oy = Math.floor(h/2 - 13*s);
    const skin = '#e0a77e', sk2 = '#b97f5b';
    const fingers = [[2,5,9],[6,1,13],[10,0,14],[14,2,12]];
    P(skin, ox+2*s, oy+13*s, 16*s, 11*s); P(sk2, ox+2*s, oy+23*s, 16*s, s);
    fingers.forEach(([fx,fy,fl])=>{ P(skin, ox+fx*s, oy+fy*s, 3*s, fl*s); P(sk2, ox+(fx+2)*s, oy+fy*s, s, fl*s); });
    P(skin, ox+17*s, oy+14*s, 3*s, 4*s); P(skin, ox+19*s, oy+11*s, 3*s, 5*s);
    P('#2b3446', ox+4*s, oy+24*s, 12*s, 6*s); P('#3d4a62', ox+5*s, oy+25*s, 10*s, 4*s); P('#7ad0a8', ox+13*s, oy+26*s, s, s);
    const dots = [[3,8],[3,12],[7,4],[7,10],[11,3],[11,9],[15,5],[15,10],[20,13]];
    dots.forEach(([dx,dy])=>{ P('#0f1720', ox+dx*s-1, oy+dy*s-1, s+2, s+2); P('#7ad0a8', ox+dx*s, oy+dy*s, s, s); });
    dots.forEach(([dx,dy],i)=>{ if (i%2===0) for (let yy=dy+1; yy<24; yy+=2) P('#4a8a78', ox+dx*s, oy+yy*s, 1, 1); });
  } else if (kind === 'term'){
    P('#1a1726', 0, 0, w, h);
    const fx = 4, fy = 4, fw = w-8, fh = h-8;
    P('#0d0b14', fx, fy, fw, fh); P('#3a3150', fx, fy, fw, 7);
    [RUST, MUST, '#7ad0a8'].forEach((c,i)=>P(c, fx+3+i*5, fy+2, 3, 3));
    drawMicro(ctx, 'ATELIER', x+fx+fw-32, y+fy+1, '#c8c0d8');
    const ix = fx+4, iy = fy+11, iw = fw-8, ih = fh-15;
    P('#e7e1d2', ix, iy, iw, ih);
    P('#3f7fd1', ix, iy, iw, 6);
    P('#2d5a63', ix+3, iy+9, iw*.42, ih*.45); P('#e2a83c', ix+3+iw*.3, iy+11, 4, 4); P('#7a9a6a', ix+3, iy+9+ih*.3, iw*.42, ih*.15);
    for (let i=0;i<6;i++) P('#8a8296', ix+iw*.5, iy+10+i*4, iw*(.42 - (i%3)*.08), 1);
    for (let yy=iy; yy<iy+ih; yy+=2) P('rgba(0,0,0,.12)', ix, yy, iw, 1);
    P('#7ad0a8', fx+3, fy+fh-4, 3, 1);
  } else if (kind === 'rail'){
    const sky = ['#141634','#1f1f4a','#33285c','#4f3168'];
    sky.forEach((c,i)=>P(c, 0, i*h/8, w, h/8+1));
    P('#1a1528', 0, h*.5, w, h*.5);
    for (let i=0;i<14;i++) P('#e8e4ff', R()*w, R()*h*.4, 1, 1);
    const vx = w*.5, vy = h*.5;
    for (let yy=0; yy<h*.5; yy++){
      const t = yy/(h*.5), half = lerp(2, w*.42, t);
      P('#5b4a3a', vx-half, vy+yy, 1, 1); P('#5b4a3a', vx+half, vy+yy, 1, 1);
      if (Math.floor(Math.pow(t,.5)*14) % 2 === 0) P('#2a2133', vx-half*1.15, vy+yy, half*2.3, 1);
      P('#b8b0c8', vx-half*.55, vy+yy, Math.max(1,t*2), 1); P('#b8b0c8', vx+half*.55, vy+yy, Math.max(1,t*2), 1);
    }
    const tw = w*.22, th = h*.3;
    P('#2a2f3e', vx-tw/2, vy-th*.75, tw, th); P(MUST, vx-tw/2, vy-th*.75, tw, 3);
    P('#9ac7e8', vx-tw*.35, vy-th*.6, tw*.7, th*.3); P('#ffe9a8', vx-tw*.4, vy+th*.08, 3, 2); P('#ffe9a8', vx+tw*.4-3, vy+th*.08, 3, 2);
    P(RUST, vx+tw/2-2, vy-th*.1, 6, 5); P('#7ad0a8', vx+tw/2+1, vy-th*.1+1, 1, 1);
    for (let k=1;k<4;k++){ const r = k*4; for (let a=-5;a<=5;a++){ P('rgba(122,208,168,.75)', vx+tw/2+4+Math.cos(a*.14)*r, vy-th*.1+2+Math.sin(a*.14)*r, 1, 1); } }
  } else if (kind === 'bot'){
    P('#26303b', 0, 0, w, h);
    for (let yy=0;yy<h;yy+=3) P('#2a3541', 0, yy, w, 1);
    P('#1f272f', 0, h*.86, w, h*.14);
    const s = Math.max(1, Math.floor(Math.min(w/34, h/40)));
    const ox = Math.floor(w/2 - 9*s), oy = Math.floor(h*.06);
    const B = '#15151a', G = '#2a2a31', S = '#9aa0a8';
    const blk = (bx, by, bw, bh, c=B)=>P(c, ox+bx*s, oy+by*s, bw*s, bh*s);
    blk(7,0,4,4,G); blk(8,1,2,1,S);
    blk(3,4,12,6,B); blk(5,5,8,4,'#2f7a3c'); blk(6,6,2,1,'#e8e8e8'); blk(10,6,1,2,'#d8c37a');
    blk(0,4,3,3,G); blk(15,4,3,3,G); blk(1,5,1,1,S); blk(16,5,1,1,S);
    blk(0,7,2,6,B); blk(16,7,2,6,B); blk(0,13,2,5,G); blk(16,13,2,5,G); blk(0,18,2,2,B); blk(16,18,2,2,B);
    blk(5,10,8,3,B); blk(11,10,2,2,'#2f62d0');
    blk(4,13,4,6,G); blk(10,13,4,6,G); blk(5,15,1,1,S); blk(12,15,1,1,S);
    blk(4,19,4,6,B); blk(10,19,4,6,B); blk(4,25,4,4,G); blk(10,25,4,4,G);
    blk(2,29,7,2,B); blk(9,29,7,2,B); blk(3,29,1,1,'#3a3a44'); blk(14,29,1,1,'#3a3a44');
  }
  ctx.restore();
}

/* ---------------- magazine ---------------- */
function folio(ctx, W, H, m, n, left){
  const s = 'Arahe · No. 06';
  ctx.fillStyle = INK; ctx.fillRect(m, H-m-10, W-2*m, 1);
  if (left){ drawP(ctx, String(n), m, H-m-7, INK); drawP(ctx, s, W-m-widthP(s), H-m-7, MUTED); }
  else { drawP(ctx, s, m, H-m-7, MUTED); drawP(ctx, String(n), W-m-widthP(String(n)), H-m-7, INK); }
}
function paperBase(ctx, W, H){
  ctx.fillStyle = PAPER; ctx.fillRect(0,0,W,H);
  const R = mulberry(W*7+H);
  for (let i=0;i<W*H*.004;i++){ ctx.fillStyle = R()<.5 ? '#ebdfc3' : '#f2e8d0'; ctx.fillRect(Math.floor(R()*W), Math.floor(R()*H), 1, 1); }
}
function chip(ctx, s, x, y, bg, fg){ const w = widthP(s)+6; ctx.fillStyle = bg; ctx.fillRect(x, y, w, 11); drawP(ctx, s, x+3, y+2, fg); return x + w + 3; }
function paraBlock(ctx, text, x, y, maxW, color, lh=10, sc=1){
  const lines = wrapP(text, maxW, sc);
  lines.forEach((l,i)=>drawP(ctx, l, x, y+i*lh*sc, color, sc));
  return y + lines.length*lh*sc;
}
function bigNum(ctx, s, x, y, color, sc){ drawText(ctx, s, x, y, color, sc); }

const PAGE = {
  cover(ctx, W, H){
    ctx.fillStyle = '#f1e4c4'; ctx.fillRect(0,0,W,H);
    const m = Math.max(6, Math.round(W*.06));
    const sc = Math.max(2, Math.floor((W - 2*m) / textW('ARAHE')));
    drawText(ctx, 'ARA', m, m, INK, sc); drawText(ctx, 'HE', m + textW('ARA',sc) + sc, m, RUST, sc);
    let y = m + 7*sc + 4;
    ctx.fillStyle = INK; ctx.fillRect(m, y, W-2*m, 2); y += 5;
    drawP(ctx, 'No. 06', m, y, INK); const r = 'The Build Issue'; drawP(ctx, r, W-m-widthP(r), y, RUST); y += 13;
    const ah = Math.round(H*.46);
    drawArt(ctx, 'bot', m, y, W-2*m, ah, 6);
    const hl = 'Six things, built from scratch.';
    const hy = y + ah - 26;
    ctx.fillStyle = 'rgba(28,23,38,.82)'; ctx.fillRect(m, hy-3, W-2*m, 26);
    paraBlock(ctx, hl, m+4, hy, W-2*m-8, '#f1e4c4');
    y += ah + 7;
    const list = PROJECTS.map((p,i)=>[String(i+1).padStart(2,'0'), p.name]);
    const colW = Math.floor((W-2*m-6)/2);
    list.forEach(([n,t],i)=>{ const cx = m + (i%2)*(colW+6), cy = y + Math.floor(i/2)*12; drawP(ctx, n, cx, cy, RUST); drawP(ctx, t, cx+14, cy, INK); });
    // barcode
    const bw = 26, bh = 14, bx = W-m-bw, by = H-m-bh;
    ctx.fillStyle = '#fff8e8'; ctx.fillRect(bx-2, by-2, bw+4, bh+4);
    const R = mulberry(5); let xx = bx; while (xx < bx+bw){ const t = R()<.4 ? 2 : 1; ctx.fillStyle = INK; ctx.fillRect(xx, by, t, bh-3); xx += t + (R()<.5?1:2); }
    drawP(ctx, '2026', m, H-m-8, MUTED);
  },
  contents(ctx, W, H){
    paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    drawText(ctx, 'CONTENTS', m, m, INK, 2);
    let y = m + 20; ctx.fillStyle = INK; ctx.fillRect(m, y, W-2*m, 1); y += 7;
    const rowH = Math.max(22, Math.floor((H - y - m - 18) / 7));
    const items = [['About this issue', 'The person behind the projects', 1]].concat(PROJECTS.map((p,i)=>[p.name, p.sub, i+2]));
    items.forEach(([t, sub, n], i)=>{
      const yy = y + i*rowH;
      drawText(ctx, String(i).padStart(2,'0'), m, yy+1, i ? RUST : MUTED, 1);
      drawP(ctx, t, m+18, yy, INK);
      const pg = String(n*2); drawP(ctx, pg, W-m-widthP(pg), yy, INK);
      const sl = wrapP(sub, W-2*m-30);
      if (rowH >= 20) drawP(ctx, sl.length > 1 ? sl[0].replace(/[ ,.;]*$/, '') + '...' : sl[0], m+18, yy+10, MUTED);
    });
    folio(ctx, W, H, m, 2, true);
  },
  about(ctx, W, H){
    paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    drawP(ctx, 'ABOUT THIS ISSUE', m, m, RUST);
    let y = m + 13;
    y = paraBlock(ctx, 'Abdur Raheem Imami', m, y, W-2*m, INK, 10, 2) + 4;
    y = paraBlock(ctx, 'Builds robots, firmware and GPU inference engines. Mechatronics & Automation at VIT Chennai, and co-founder of two robotics efforts.', m, y, W-2*m, INK) + 8;
    const facts = [['Studying','Mechatronics & Automation'],['At','VIT Chennai, 2024-28'],['CGPA','8.82, dept. rank 4'],['Building','Sentrix Robotics, KP17'],['Into','CUDA, Rust, humanoids']];
    facts.forEach(([k,v])=>{ if (y > H - m - 30) return; drawP(ctx, k, m, y, MUTED); const lines = wrapP(v, W-2*m-46); lines.forEach((l,i)=>drawP(ctx, l, m+46, y+i*10, INK)); y += 10*lines.length + 3; });
    y += 6;
    if (y < H - m - 34){ ctx.fillStyle = PAPER2; ctx.fillRect(m, y, W-2*m, 26); paraBlock(ctx, 'Everything here is something he made. Turn the page.', m+5, y+4, W-2*m-10, INK); }
    folio(ctx, W, H, m, 3, false);
  },
  projLeft(ctx, W, H, i){
    const p = PROJECTS[i]; paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    drawP(ctx, 'PROJECT', m, m, MUTED);
    const sc = Math.max(3, Math.floor(H/52));
    bigNum(ctx, String(i+1).padStart(2,'0'), m, m+12, RUST, sc);
    let y = m + 12 + 7*sc + 6;
    y = paraBlock(ctx, p.name, m, y, W-2*m, INK, 10, 2) + 6;
    const ah = Math.max(40, Math.min(Math.round(H*.36), H - y - m - 50));
    drawArt(ctx, p.art, m, y, W-2*m, ah, i+1); y += ah + 8;
    ctx.fillStyle = RUST; ctx.fillRect(m, y, 3, 1);
    const ql = wrapP(p.pull, W-2*m-8);
    ctx.fillStyle = RUST; ctx.fillRect(m, y, 2, ql.length*10+2);
    ql.forEach((l,k)=>drawP(ctx, l, m+7, y+1+k*10, INK));
    folio(ctx, W, H, m, (i+2)*2, true);
  },
  projRight(ctx, W, H, i){
    const p = PROJECTS[i]; paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    let y = m;
    y = paraBlock(ctx, p.sub, m, y, W-2*m, INK) + 6;
    ctx.fillStyle = INK; ctx.fillRect(m, y, W-2*m, 1); y += 6;
    const bottom = H - m - 27;
    let lh = 10, gap = 5;
    const measure = ()=>p.pts.reduce((a,t)=>a + wrapP(t, W-2*m-8).length*lh + gap, 0);
    if (y + measure() > bottom){ lh = 9; gap = 3; }
    for (const t of p.pts){
      const lines = wrapP(t, W-2*m-8);
      if (y + lines.length*lh > bottom) break;
      ctx.fillStyle = RUST; ctx.fillRect(m, y+3, 3, 3);
      lines.forEach((l,k)=>drawP(ctx, l, m+8, y+k*lh, INK));
      y += lines.length*lh + gap;
    }
    let cx = m; const cy = H - m - 26;
    cx = chip(ctx, p.year, cx, cy, MUST, INK);
    for (const s of p.stack){ if (cx + widthP(s) + 6 > W - m) break; cx = chip(ctx, s, cx, cy, INK, PAPER); }
    folio(ctx, W, H, m, (i+2)*2+1, false);
  },
  honours(ctx, W, H){
    paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    drawText(ctx, 'HONOURS', m, m, INK, 2);
    let y = m + 20; ctx.fillStyle = INK; ctx.fillRect(m, y, W-2*m, 1); y += 8;
    for (const [a,b] of HONORS){
      const lines = wrapP(b, W-2*m);
      if (y + 12 + lines.length*10 > H - m - 14) break;
      chip(ctx, a, m, y, INK, PAPER); y += 13;
      lines.forEach((l,k)=>drawP(ctx, l, m, y+k*10, INK)); y += lines.length*10 + 6;
    }
    folio(ctx, W, H, m, 16, true);
  },
  colophon(ctx, W, H){
    paperBase(ctx, W, H); const m = Math.max(8, Math.round(W*.07));
    drawP(ctx, 'COLOPHON', m, m, RUST);
    let y = m + 14;
    y = paraBlock(ctx, 'Made by Abdur Raheem Imami in Chennai.', m, y, W-2*m, INK) + 6;
    y = paraBlock(ctx, 'This room is drawn live in WebGL at about three hundred lines, then outlined, dithered and scaled up with hard pixels.', m, y, W-2*m, INK) + 6;
    y = paraBlock(ctx, 'github.com/arahe-dev', m, y, W-2*m, MUTED) + 1;
    y = paraBlock(ctx, 'linkedin.com/in/arahe', m, y, W-2*m, MUTED) + 10;
    const s = Math.max(1, Math.floor((W-2*m)/48));
    if (y + 20*s < H - m - 16) drawArt(ctx, 'heat', m, y, W-2*m, Math.min(H - m - 16 - y, 40*s), 9);
    folio(ctx, W, H, m, 17, false);
  },
};
/* leaf k: recto / verso painters */
function magPainter(k, side){
  if (k === 0) return side === 'r' ? PAGE.cover : PAGE.contents;
  if (side === 'r') return k === 1 ? PAGE.about : (ctx,W,H)=>PAGE.projRight(ctx,W,H,k-2);
  return k === MAG.N-1 ? PAGE.honours : (ctx,W,H)=>PAGE.projLeft(ctx,W,H,k-1);
}
function magPageText(s){
  if (s === 0) return 'Arahe, No. 06: The Build Issue. Six things, built from scratch.';
  if (s === 1) return 'Contents. About this issue: Abdur Raheem Imami builds robots, firmware and GPU inference engines; Mechatronics & Automation at VIT Chennai.';
  if (s >= 2 && s <= 7){ const p = PROJECTS[s-2]; return `Project ${s-1}: ${p.name}. ${p.sub} ${p.pull} ${p.pts.join(' ')} ${p.year}, ${p.stack.join(', ')}.`; }
  return 'Honours: ' + HONORS.map(h=>h.join(', ')).join('. ') + '. Colophon: made by Abdur Raheem Imami in Chennai.';
}

/* ---------------- phone home screen (after iOS: widget, 4-wide grid, search, dock) ---------------- */
const PHONE_APPS = [
  { id:'github', label:'GitHub', url:LINKS.github },
  { id:'linkedin', label:'LinkedIn', url:LINKS.linkedin },
  { id:'v1', label:'Pocket Dev', url:LINKS.v1 },
];
const PHONE_GRID = [
  ['calendar','Calendar',2,0], ['github','GitHub',3,0],
  ['clock','Clock',2,1], ['linkedin','LinkedIn',3,1],
  ['v1','Pocket Dev',0,2], ['camera','Camera',1,2], ['notes','Notes',2,2], ['maps','Maps',3,2],
  ['news','News',0,3], ['podcasts','Podcasts',1,3], ['appstore','App Store',2,3], ['health','Health',3,3],
  ['settings','Settings',0,4,'1'], ['shortcuts','Shortcuts',1,4], ['mail','Mail',2,4,'6,608'], ['reminders','Reminders',3,4],
];
const PHONE_DOCK = ['phone','safari','messages','music'];
const ICON16 = {
  github: (()=>{ const g = []; for (let y=0;y<16;y++){ let row=''; for (let x=0;x<16;x++){
      const disc = Math.hypot(x-7.5, y-7.5) < 7.2;
      const head = Math.pow((x-7.5)/3.7,2) + Math.pow((y-7.2)/3.1,2) < 1;
      const ears = (y>=3 && y<=5 && (x===4 || x===11)) || (y===4 && (x===5||x===10)) || (y===5 && (x===5||x===10));
      const neck = x>=6 && x<=9 && y>=9;
      const tail = (y===11 && (x===3||x===4)) || (y===12 && (x===4||x===5)) || (y===10 && x===3);
      row += disc && !(head||ears||neck||tail) ? '1' : '0'; } g.push(row); } return g; })(),
  linkedin: ['0000000000000000','0000000000000000','0001100000000000','0001100000000000','0000000000000000','0001100110111000','0001100111111100','0001100110001100','0001100110001100','0001100110001100','0001100110001100','0001100110001100','0001100110001100','0000000000000000','0000000000000000','0000000000000000'],
  v1: ['0000000000000000','0000000000000000','0000111111100000','0000122222100000','0000123332100000','0000123332100000','0000123332100000','0000122222100000','0000111111100000','0000111111100000','0001411111510000','0004441115510000','0000411111100000','0000111111100000','0000011111000000','0000000000000000'],
};
const ICON16_PAL = { github:{ 1:'#f0f6fc' }, linkedin:{ 1:'#ffffff' }, v1:{ 1:'#c9c6bb', 2:'#5c5a6d', 3:'#9bbc0f', 4:'#26252b', 5:'#8b1d47' } };

/* each icon is drawn at 26x26 and blown up by a whole number */
function iconArt(id, d){
  const [c, x] = makeCanvas(26, 26);
  const R = (a,b,w,h,col)=>{ x.fillStyle = col; x.fillRect(a,b,w,h); };
  const vgrad = (top, bot)=>{ for (let y=0;y<26;y++){ x.fillStyle = mix(top, bot, y/25); x.fillRect(0,y,26,1); } };
  const disc = (cx, cy, r, col)=>{ x.fillStyle = col; for (let yy=-r; yy<=r; yy++) for (let xx=-r; xx<=r; xx++) if (xx*xx+yy*yy <= r*r + r*.6) x.fillRect(cx+xx, cy+yy, 1, 1); };
  const line = (x0,y0,x1,y1,col,w=1)=>{ const n = Math.max(Math.abs(x1-x0), Math.abs(y1-y0), 1); x.fillStyle = col; for (let i=0;i<=n;i++) x.fillRect(Math.round(lerp(x0,x1,i/n)-(w-1)/2), Math.round(lerp(y0,y1,i/n)-(w-1)/2), w, w); };
  const bmp16 = (pal)=>{ const g = ICON16[id]; for (let r=0;r<16;r++) for (let q=0;q<16;q++){ const v = g[r][q]; if (v !== '0' && pal[v]) R(5+q, 5+r, 1, 1, pal[v]); } };
  switch (id){
    case 'calendar': { R(0,0,26,26,'#ffffff'); const wd = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()]; drawMicroC(x, wd, 13, 3, '#f0453a'); drawTextC(x, String(d.getDate()), 13, 10, '#111111', 2); break; }
    case 'clock': { R(0,0,26,26,'#111111'); disc(13,13,11,'#ffffff');
      for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; R(Math.round(13+Math.sin(a)*9.5), Math.round(13-Math.cos(a)*9.5), 1, 1, '#111'); }
      const h = d.getHours()%12 + d.getMinutes()/60, m = d.getMinutes();
      line(13,13, 13+Math.sin(h/12*Math.PI*2)*5.5, 13-Math.cos(h/12*Math.PI*2)*5.5, '#111', 2);
      line(13,13, 13+Math.sin(m/60*Math.PI*2)*8.5, 13-Math.cos(m/60*Math.PI*2)*8.5, '#111');
      line(13,13, 13+Math.sin(d.getSeconds()/60*Math.PI*2)*9, 13-Math.cos(d.getSeconds()/60*Math.PI*2)*9, '#ff9500'); R(12,12,2,2,'#ff9500'); break; }
    case 'github': R(0,0,26,26,'#161b22'); bmp16(ICON16_PAL.github); break;
    case 'linkedin': R(0,0,26,26,'#0a66c2'); bmp16(ICON16_PAL.linkedin); break;
    case 'v1': vgrad('#a7c73a','#7c9c0d'); bmp16(ICON16_PAL.v1); break;
    case 'camera': vgrad('#e2e2e6','#8d8d94'); R(4,8,18,12,'#1c1c1e'); R(5,7,18,14,'#1c1c1e'); R(8,6,6,2,'#1c1c1e'); disc(13,14,4,'#5a5a60'); disc(13,14,2,'#111'); R(12,12,1,1,'#9a9aa2'); R(19,9,2,2,'#ffcc00'); break;
    case 'notes': R(0,0,26,26,'#ffffff'); R(0,0,26,7,'#f9d34a'); for (let i=0;i<26;i+=2) R(i,8,1,1,'#bdbdbd'); [12,16,20].forEach(y=>R(2,y,22,1,'#d8d8d8')); break;
    case 'maps': R(0,0,26,26,'#a6dca2'); R(0,0,9,12,'#f7e3a6'); R(17,15,9,11,'#f6c1d0'); line(0,20,26,6,'#ffffff',3); R(9,0,3,26,'#5a95f5'); line(15,0,26,10,'#f5c84a',2);
      disc(11,15,5,'#ffffff'); disc(11,15,4,'#1f6ff0'); line(11,12,9,17,'#fff'); line(11,12,13,17,'#fff'); break;
    case 'news': R(0,0,26,26,'#ffffff'); for (let i=0;i<14;i++){ R(5+Math.round(i*.4),6+i,5,1,'#f63b53'); R(13+Math.round(i*.4),6+i,6,1,'#f63b53'); R(10+Math.round(i*.0),6+i,1,1,'#f8a0ab'); } line(9,6,17,19,'#c1263b',2); break;
    case 'podcasts': vgrad('#d775f7','#8a32d2');
      for (let a=0;a<64;a++){ const t = a/64*Math.PI*1.5 + Math.PI*.75; [9,6].forEach(r=>R(Math.round(13+Math.cos(t)*r), Math.round(12+Math.sin(t)*r),1,1,'#ffffff')); }
      disc(13,12,2,'#ffffff'); R(12,15,3,7,'#ffffff'); break;
    case 'appstore': vgrad('#25b2ff','#1468f2'); line(13,5,7,20,'#fff',2); line(13,5,19,20,'#fff',2); line(6,16,20,16,'#fff',2); break;
    case 'health': R(0,0,26,26,'#ffffff'); ['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((row,r)=>{ for (let q=0;q<7;q++) if (row[q]==='1') R(6+q*2,7+r*2,2,2, r<2 && q<3 ? '#ff5f6d' : '#f42f45'); }); break;
    case 'settings': vgrad('#d0d0d4','#8a8a90'); disc(13,13,10,'#5e5e64'); for (let i=0;i<16;i++){ const a = i/16*Math.PI*2; R(Math.round(13+Math.cos(a)*10)-1, Math.round(13+Math.sin(a)*10)-1, 2, 2, i%2 ? '#5e5e64' : '#bdbdc2'); }
      disc(13,13,7,'#bdbdc2'); disc(13,13,5,'#3a3a40'); for (let i=0;i<3;i++){ const a = i/3*Math.PI*2 - Math.PI/2; line(13,13, 13+Math.cos(a)*5, 13+Math.sin(a)*5, '#bdbdc2'); } disc(13,13,1,'#bdbdc2'); break;
    case 'shortcuts': R(0,0,26,26,'#1f2547'); for (let i=0;i<8;i++){ R(9-i+8, 5+i, i*2+1, 1, mix('#ff4f8b','#ff9f43', i/8)); R(9-i+8, 19-i, i*2+1, 1, mix('#22d3ee','#3b82f6', i/8)); } R(9,12,14,3,mix('#a855f7','#6366f1',.5)); break;
    case 'mail': vgrad('#38b0ff','#1d6ff2'); R(5,8,16,11,'#ffffff'); line(5,8,13,14,'#bcd4f5'); line(21,8,13,14,'#bcd4f5'); line(5,18,11,13,'#dfe9f8'); line(21,18,15,13,'#dfe9f8'); break;
    case 'reminders': R(0,0,26,26,'#ffffff'); [['#2f7cf6',7],['#f2463a',13],['#f7a12a',19]].forEach(([col,y])=>{ disc(6,y,2,col); disc(6,y,1,'#ffffff'); R(11,y,11,1,'#d6d6d6'); }); break;
    case 'phone': vgrad('#6ee07b','#2fbd4f'); line(8,7,8,11,'#fff',3); line(8,11,15,18,'#fff',3); line(15,18,19,18,'#fff',3); R(6,6,4,3,'#fff'); R(17,17,4,4,'#fff'); break;
    case 'safari': R(0,0,26,26,'#ffffff'); disc(13,13,10,'#1e8cf0'); disc(13,13,9,'#4fb3ff'); for (let i=0;i<24;i++){ const a = i/24*Math.PI*2; R(Math.round(13+Math.cos(a)*8), Math.round(13+Math.sin(a)*8),1,1,'#ffffff'); }
      line(17,8,13,13,'#ff3b30',2); line(9,18,13,13,'#ffffff',2); break;
    case 'messages': vgrad('#6ee07b','#2fbd4f'); for (let yy=-6; yy<=6; yy++) for (let xx=-9; xx<=9; xx++) if ((xx*xx)/81 + (yy*yy)/36 <= 1) R(13+xx, 12+yy, 1, 1, '#ffffff'); line(6,18,4,21,'#fff',2); break;
    case 'music': vgrad('#fd6a83','#f52a46'); R(10,6,2,12,'#fff'); R(17,4,2,12,'#fff'); line(10,6,18,4,'#fff',2); line(10,8,18,6,'#fff',2); disc(9,18,2,'#fff'); disc(16,16,2,'#fff'); break;
  }
  // rounded corners
  for (let y=0;y<26;y++) for (let q=0;q<26;q++){
    const cx = q < 6 ? 6 : q > 19 ? 19 : q, cy = y < 6 ? 6 : y > 19 ? 19 : y;
    if ((q - cx)*(q - cx) + (y - cy)*(y - cy) > 36) x.clearRect(q, y, 1, 1);
  }
  return c;
}
function paintPhone(ctx, W, H, hover, pressed){
  const d = new Date();
  // wallpaper: overlapping teal circles on deep blue, worked out per pixel
  const img = ctx.createImageData(W, H), px = img.data;
  const top = hexRGB('#8ccfe2'), midc = hexRGB('#2f74ad'), bot = hexRGB('#0b2557');
  const circles = [
    { x:.56, y:.47, r:.98, c:hexRGB('#2e86b7'), rim:hexRGB('#8fd3e6') },
    { x:.5,  y:.5,  r:.7,  c:hexRGB('#49a8c4'), rim:hexRGB('#a8e0e8') },
    { x:.47, y:.52, r:.46, c:hexRGB('#79c4bd'), rim:hexRGB('#c3ecd9') },
    { x:.45, y:.53, r:.25, c:hexRGB('#9fd4b8'), rim:hexRGB('#d6f2df') },
  ];
  const rimW = W*.012;
  for (let y=0;y<H;y++){
    const t = y/H, base = t < .45 ? top.map((v,i)=>lerp(v, midc[i], t/.45)) : midc.map((v,i)=>lerp(v, bot[i], (t-.45)/.55));
    for (let xx=0; xx<W; xx++){
      let col = base;
      for (const C of circles){
        const dist = Math.hypot(xx - C.x*W, y - C.y*H), r = C.r*W;
        if (dist < r){ const k = .5 + .25*(1 - dist/r); col = col.map((v,i)=>lerp(v, C.c[i], k)); if (r - dist < rimW) col = col.map((v,i)=>lerp(v, C.rim[i], .55)); }
      }
      const o = (y*W + xx)*4; px[o] = col[0]; px[o+1] = col[1]; px[o+2] = col[2]; px[o+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const css = RS / DPR;
  const ls = Math.max(1, Math.round(1 / css));                       // label text scale
  const mx = Math.round(W*.055), colW = (W - 2*mx) / 4;
  const k = Math.max(1, Math.min(Math.floor(colW*.86/26), Math.round(.16*W/26)));
  const I = 26*k;
  const label = (s, cx, y)=>{ drawPC(ctx, s, cx+ls, y+ls, 'rgba(10,20,40,.55)', ls); drawPC(ctx, s, cx, y, '#ffffff', ls); };
  // status bar
  const sy = Math.round(H*.022);
  const time = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  const ts = ls + 1; drawP(ctx, time, mx + 4*ls, sy - ls, '#ffffff', ts);
  const bx = W - mx - 12*ls;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, sy+1*ls, 10*ls, 6*ls); ctx.fillStyle = '#5a9fc8'; ctx.fillRect(bx+ls, sy+2*ls, 8*ls, 4*ls); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx+ls, sy+2*ls, 8*ls, 4*ls); ctx.fillRect(bx+10*ls, sy+3*ls, ls, 2*ls);
  ctx.fillStyle = '#ffffff'; for (let i=0;i<4;i++) ctx.fillRect(bx - 22*ls + i*3*ls, sy + (6-i*1.6|0)*ls, 2*ls, Math.max(1,Math.round((1+i*1.6)*ls)));
  for (let i=0;i<3;i++){ const r = (2+i*2)*ls; for (let a=-.75; a<=.75; a+=.12/(i+1)) ctx.fillRect(Math.round(bx - 8*ls + Math.sin(a)*r), Math.round(sy + 7*ls - Math.cos(a)*r), ls, ls); }
  const gy = sy + 9*ts + Math.round(H*.03);
  const dockTop = H - (I + 2*Math.round(I*.28)) - Math.round(W*.045);
  const rowH = Math.round(Math.max(I + 12*ls, Math.min(I + 9*ls + colW*.75, (dockTop - gy - 22*ls) / 5.35)));
  const rects = [];
  const at = (c, r)=>[Math.round(mx + c*colW + (colW - I)/2), gy + r*rowH];
  const drawApp = (id, lbl, x, y, badge)=>{
    ctx.imageSmoothingEnabled = false; ctx.drawImage(iconArt(id, d), x, y, I, I);
    if (pressed === id || hover === id){ ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x+k, y, I-2*k, I); ctx.fillRect(x, y+k, I, I-2*k); }
    if (lbl) label(lbl, x + I/2, y + I + 3*ls);
    if (badge){
      const bw = Math.max(9*ls, widthP(badge, ls) + 6*ls), bh = 10*ls, bxx = x + I - bw + Math.round(bw*.35), byy = y - Math.round(bh*.35);
      ctx.fillStyle = '#f2332f'; ctx.fillRect(bxx + 2*ls, byy, bw - 4*ls, bh); ctx.fillRect(bxx, byy + 2*ls, bw, bh - 4*ls); ctx.fillRect(bxx+ls, byy+ls, bw-2*ls, bh-2*ls);
      drawPC(ctx, badge, bxx + bw/2, byy + ls*1.5|0, '#ffffff', ls);
    }
    rects.push({ id, url:(PHONE_APPS.find(a=>a.id===id) || {}).url || null, label:lbl, x, y, w:I, h:I + 12*ls });
  };
  // widget: two columns by two rows
  { const [x0, y0] = at(0,0), [x1] = at(1,0), w = x1 + I - x0, h = rowH + I;
    const r = 6*k; ctx.fillStyle = 'rgba(176,228,240,.9)';
    ctx.fillRect(x0 + r, y0, w - 2*r, h); ctx.fillRect(x0, y0 + r, w, h - 2*r);
    for (let yy=0; yy<r; yy++) for (let xx=0; xx<r; xx++) if ((r-xx)*(r-xx) + (r-yy)*(r-yy) <= r*r){ [[x0+xx,y0+yy],[x0+w-1-xx,y0+yy],[x0+xx,y0+h-1-yy],[x0+w-1-xx,y0+h-1-yy]].forEach(([a,b])=>ctx.fillRect(a,b,1,1)); }
    const cx = x0 + Math.round(w*.3), cy = y0 + Math.round(h*.3), R = Math.round(w*.2), th = Math.max(2, Math.round(R*.17));
    for (let yy=-R; yy<=R; yy++) for (let xx=-R; xx<=R; xx++){ const dd = Math.hypot(xx,yy); if (dd <= R && dd > R - th){ ctx.fillStyle = '#4cd964'; ctx.fillRect(cx+xx, cy+yy, 1, 1); } }
    ctx.fillStyle = '#1c1c1e'; const pw = Math.round(R*.42), phh = Math.round(R*.8); ctx.fillRect(cx - pw/2|0, cy - phh/2|0, pw, phh); ctx.fillStyle = 'rgba(176,228,240,1)'; ctx.fillRect((cx - pw/2|0) + k, (cy - phh/2|0) + 2*k, pw - 2*k, phh - 4*k);
    ctx.fillStyle = '#4cd964'; ctx.fillRect(cx + R - 2*k, cy - R - k, 2*k, 3*k);
    const big = Math.max(1, Math.floor((w*.8) / textW('100%')));
    drawText(ctx, '100%', x0 + Math.round(w*.09), y0 + h - 7*big - Math.round(h*.1), '#111111', big);
    label('Batteries', x0 + w/2, y0 + h + 3*ls);
    rects.push({ id:'batteries', url:null, x:x0, y:y0, w, h });
  }
  for (const [id, lbl, c, r, badge] of PHONE_GRID){ const [x, y] = at(c, r); drawApp(id, lbl, x, y, badge); }
  // search pill
  const syy = gy + 5*rowH + Math.round(rowH*.05), sw = widthP('Search', ls) + 18*ls, shh = 12*ls, sxx = Math.round(W/2 - sw/2);
  ctx.fillStyle = 'rgba(120,150,190,.55)'; ctx.fillRect(sxx + 3*ls, syy, sw - 6*ls, shh); ctx.fillRect(sxx, syy + 3*ls, sw, shh - 6*ls); ctx.fillRect(sxx+ls, syy+ls, sw-2*ls, shh-2*ls);
  ctx.fillStyle = '#ffffff'; for (let a=0;a<20;a++){ const t = a/20*Math.PI*2; ctx.fillRect(Math.round(sxx + 7*ls + Math.cos(t)*2.5*ls), Math.round(syy + 5*ls + Math.sin(t)*2.5*ls), ls, ls); } ctx.fillRect(sxx + 9*ls, syy + 7*ls, ls, ls); ctx.fillRect(sxx + 10*ls, syy + 8*ls, ls, ls);
  drawP(ctx, 'Search', sxx + 13*ls, syy + 2*ls, '#ffffff', ls);
  // dock
  const pad = Math.round(I*.28), dh = I + 2*pad, dy = H - dh - Math.round(W*.045), dx = Math.round(mx*.5), dw = W - 2*dx, dr = Math.round(pad*1.3);
  ctx.fillStyle = 'rgba(150,175,215,.38)'; ctx.fillRect(dx + dr, dy, dw - 2*dr, dh); ctx.fillRect(dx, dy + dr, dw, dh - 2*dr);
  for (let yy=0; yy<dr; yy++) for (let xx=0; xx<dr; xx++) if ((dr-xx)*(dr-xx) + (dr-yy)*(dr-yy) <= dr*dr){ [[dx+xx,dy+yy],[dx+dw-1-xx,dy+yy],[dx+xx,dy+dh-1-yy],[dx+dw-1-xx,dy+dh-1-yy]].forEach(([a,b])=>ctx.fillRect(a,b,1,1)); }
  PHONE_DOCK.forEach((id, i)=>{ const x = Math.round(mx + i*colW + (colW - I)/2); drawApp(id, null, x, dy + pad); });
  return rects;
}

/* ---------------- Game Boy OS (160 x 144, four greens) ---------------- */
const DMG = ['#0f380f','#306230','#8bac0f','#9bbc0f'];
const GBOS = { power:false, cart:null, state:'off', t0:0, scroll:0, maxScroll:0, sel:0, regions:[], chimed:false };
function gbPaint(t){
  const ctx = gbLcdTex.userData.ctx, W = 160, H = 144, os = GBOS;
  os.regions = [];
  if (!os.power){ ctx.fillStyle = '#3f4a2a'; ctx.fillRect(0,0,W,H); ctx.fillStyle = '#4a5633'; ctx.fillRect(0,0,W,3); gbLcdTex.needsUpdate = true; return; }
  ctx.fillStyle = DMG[3]; ctx.fillRect(0,0,W,H);
  const el = t - os.t0;
  if (os.state === 'boot'){
    const k = clamp(el/1.4, 0, 1), y = Math.round(lerp(-20, 56, easeOut(k)));
    drawTextC(ctx, 'ARAHE', W/2, y, DMG[0], 2);
    if (k >= 1){ drawPC(ctx, 'pocket dev', W/2, y+19, DMG[1]); if (!os.chimed){ os.chimed = true; sfx.chime(); } }
    if (el > 2.3){ os.state = os.cart || 'nocart'; if (os.state === 'fall') bfReset(); }
    gbLcdTex.needsUpdate = true; return;
  }
  const header = (s)=>{ ctx.fillStyle = DMG[0]; ctx.fillRect(0,0,W,13); drawP(ctx, s, 5, 3, DMG[3]); };
  if (os.state === 'nocart'){
    header('POCKET DEV');
    const cx = W/2, by = 40 + Math.round(Math.sin(t*3)*3);
    ctx.fillStyle = DMG[1]; ctx.fillRect(cx-14, by, 28, 32); ctx.fillStyle = DMG[2]; ctx.fillRect(cx-10, by+10, 20, 16);
    ctx.fillStyle = DMG[1]; for (let i=0;i<4;i++) ctx.fillRect(cx-10+i*6, by+2, 3, 4);
    drawText(ctx, '▼', cx-3, by+38, DMG[1]);
    drawPC(ctx, 'Insert a cartridge', cx, 104, DMG[0]);
  } else if (os.state === 'exp' || os.state === 'skl'){
    header(os.state === 'exp' ? 'EXPERIENCE' : 'SKILLS');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 14, W, H-14); ctx.clip();
    let y = 19 - Math.round(os.scroll);
    if (os.state === 'exp'){
      for (const e of EXPERIENCE){
        drawP(ctx, e.role, 6, y, DMG[0]); y += 10;
        drawP(ctx, e.org + '  ·  ' + e.when, 6, y, DMG[1]); y += 12;
        for (const p of e.pts){ const ls = wrapP(p, W-22); ctx.fillStyle = DMG[1]; ctx.fillRect(7, y+3, 2, 2); ls.forEach((l,i)=>drawP(ctx, l, 12, y+i*10, DMG[0])); y += ls.length*10 + 2; }
        y += 8;
      }
    } else {
      for (const s of SKILLS){
        drawP(ctx, s.k, 6, y, DMG[0]); const lv = 'LV ' + s.lv; drawP(ctx, lv, W-12-widthP(lv), y, DMG[1]); y += 10;
        ctx.fillStyle = DMG[2]; ctx.fillRect(6, y, W-18, 4); ctx.fillStyle = DMG[0]; ctx.fillRect(6, y, Math.round((W-18)*s.lv/100), 4); y += 7;
        drawP(ctx, s.s, 6, y, DMG[1]); y += 14;
      }
    }
    const contentH = y + Math.round(os.scroll) - 19;
    os.maxScroll = Math.max(0, contentH - (H-22));
    ctx.restore();
    if (os.maxScroll > 0){ const th = Math.max(12, (H-16) * (H-22)/contentH); const ty = 15 + (H-16-th) * (os.scroll/os.maxScroll); ctx.fillStyle = DMG[2]; ctx.fillRect(W-4, 15, 2, H-17); ctx.fillStyle = DMG[0]; ctx.fillRect(W-4, ty, 2, th); }
  } else if (os.state === 'fall'){
    bfPaint(ctx, t);
  } else if (os.state === 'time'){
    header('???');
    const h = TIME.warp !== null ? TIME.warp : currentHour();
    drawTextC(ctx, hourLabel(h), W/2, 30, DMG[0], 3);
    drawPC(ctx, periodName(h), W/2, 56, DMG[1]);
    const bx = 14, bw = W-28, by = 78;
    ctx.fillStyle = DMG[2]; ctx.fillRect(bx, by, bw, 4);
    for (let i=0;i<=24;i+=6){ ctx.fillStyle = DMG[1]; ctx.fillRect(bx + Math.round(i/24*bw), by+6, 1, 3); }
    const kx = bx + Math.round(h/24*bw);
    ctx.fillStyle = DMG[0]; ctx.fillRect(kx-2, by-3, 5, 10);
    os.regions.push({ x:bx-4, y:by-10, w:bw+8, h:24, act:'scrub', bx, bw });
    const btn = (label, x, act, on)=>{ const w = widthP(label)+10; ctx.fillStyle = on ? DMG[0] : DMG[1]; ctx.fillRect(x, 104, w, 14); drawP(ctx, label, x+5, 107, DMG[3]); os.regions.push({ x, y:104, w, h:14, act }); return x + w + 6; };
    const live = TIME.warp === null;
    let x = 22; x = btn('◀', x, 'prev'); x = btn(live ? 'live' : 'go live', x, 'live', live); btn('▶', x, 'next');
  }
  gbLcdTex.needsUpdate = true;
}
function gbInput(k){
  const os = GBOS; if (!os.power || os.state === 'boot') return;
  if (os.state === 'fall'){ bfInput(k); return; }
  if (os.state === 'exp' || os.state === 'skl'){
    if (k === 'up') os.scroll = Math.max(0, os.scroll - 20);
    if (k === 'down') os.scroll = Math.min(os.maxScroll, os.scroll + 20);
  } else if (os.state === 'time'){
    const h = TIME.warp !== null ? TIME.warp : currentHour();
    if (k === 'left' || k === 'prev') setWarp((h + 23) % 24);
    if (k === 'right' || k === 'next') setWarp((h + 1) % 24);
    if (k === 'a' || k === 'live') setWarp(TIME.warp === null ? h : null);
  }
  sfx.tick(true);
}
function gbTap(px, py){
  if (GBOS.state === 'fall'){ if (BF.over) bfInput('tap'); else if (px > 82) bfInput('b'); else if (px < 26) bfInput('left'); else if (px > 56) bfInput('right'); else if (py > 110) bfInput('down'); else bfInput('up'); return true; }
  for (const r of GBOS.regions){
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h){
      if (r.act === 'scrub'){ setWarp(clamp((px - r.bx)/r.bw, 0, .999)*24); sfx.tick(true); }
      else gbInput(r.act);
      return true;
    }
  }
  if (GBOS.state === 'exp' || GBOS.state === 'skl'){ gbInput(py < 72 ? 'up' : 'down'); return true; }
  return false;
}

/* ---------------- Game Boy face, painted at the size it is seen ---------------- */
function paintGBFace(ctx, W, H){
  const k = W/64, R = mulberry(12);
  const r = (x,y,w,h,c)=>{ ctx.fillStyle = c; ctx.fillRect(Math.round(x*k), Math.round(y*k), Math.max(1,Math.round(w*k)), Math.max(1,Math.round(h*k))); };
  r(0,0,64,104,'#c9c6bb');
  for (let i=0;i<W*H*.004;i++){ ctx.fillStyle = R()<.5?'#c2bfb3':'#d0cdc2'; ctx.fillRect(Math.floor(R()*W), Math.floor(R()*H), 1, 1); }
  r(0,4,64,.6,'#b3b0a5'); r(9,0,.6,4,'#b3b0a5'); r(54,0,.6,4,'#b3b0a5');
  const s = Math.max(1, Math.floor(k/3.2));
  drawMicro(ctx, '◀ OFF·ON ▶'.replace('◀','<').replace('▶','>'), Math.round(12*k), Math.round(1.2*k), '#9b988d');
  // bezel with the rounded lower-right corner
  r(6,8,52,42,'#5c5a6d');
  for (let i=0;i<7;i++) r(58-7+i, 50-(7-i), 7-i, 1, '#c9c6bb');
  r(9,10.6,4.5,.5,'#8d2a54'); r(9,11.6,4.5,.5,'#2f3a8c');
  const lbl = 'DOT MATRIX WITH STEREO SOUND';
  drawMicro(ctx, lbl, Math.round(15.5*k), Math.round(10.2*k), '#b9b7c8');
  r(43.5+microW(lbl)/k*0+2, 10.6, 10, .5, '#8d2a54');
  r(9,24,2.2,2.2,'#3a1d22'); drawMicro(ctx, 'BATTERY', Math.round(7.4*k), Math.round(28*k), '#9a98aa');
  r(GB_SCREEN.x-1,GB_SCREEN.y-1,GB_SCREEN.w+2,GB_SCREEN.h+2,'#9b9aa6');
  // wordmark
  const ws = Math.max(1, Math.round(k/2.2));
  drawP(ctx, 'Pocket Dev', Math.round(7*k), Math.round(52.5*k), '#2f3a8c', ws);
  drawMicro(ctx, 'TM', Math.round(7*k) + widthP('Pocket Dev', ws) + 2, Math.round(52.5*k), '#2f3a8c');
  // control recesses + labels
  r(6,62,20,20,'#bdbab0');
  for (let i=0;i<12;i++) r(36+i, 70-i*.5, 2, 12, '#bdbab0');
  drawMicro(ctx, 'B', Math.round(41*k), Math.round(81*k), '#2f3a8c'); drawMicro(ctx, 'A', Math.round(52*k), Math.round(75.5*k), '#2f3a8c');
  drawMicro(ctx, 'SELECT', Math.round(20*k), Math.round(94*k), '#2f3a8c'); drawMicro(ctx, 'START', Math.round(31*k), Math.round(94*k), '#2f3a8c');
  for (let sl=0;sl<6;sl++) for (let i=0;i<12;i++) r(44+sl*3+i*.5, 86+i-sl*1.5, .8, .8, '#9a978c');
  for (let i=0;i<10;i++) r(54+i, 103-(9-i), 1, 1, '#b3b0a5');
}

/* ---------------- Blockfall (the old site's game, back on a cartridge) ---------------- */
const BF_SHAPES = { I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[1,0],[0,1],[1,1],[2,1]], S:[[1,0],[2,0],[0,1],[1,1]], Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]] };
const BF_SIZE = { I:4, O:4, T:3, S:3, Z:3, J:3, L:3 };
const BF_TILE = { I:0, O:1, T:2, S:3, Z:1, J:2, L:3 };
const BF = { cols:10, rows:18 };
function bfBag(){ const k = Object.keys(BF_SHAPES); for (let i=k.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [k[i],k[j]] = [k[j],k[i]]; } return k; }
function bfReset(){
  BF.board = Array.from({length:BF.rows}, ()=>new Array(BF.cols).fill(null));
  BF.bag = bfBag(); BF.next = BF.bag.pop(); BF.score = 0; BF.lines = 0; BF.level = 1; BF.over = false; BF.paused = false; BF.clearing = null; BF.acc = 0; BF.last = null;
  try { BF.hi = +localStorage.getItem('arahe-blockfall-hi') || 0; } catch(e){ BF.hi = BF.hi || 0; }
  bfSpawn();
}
function bfCells(p){ const n = BF_SIZE[p.k]; return BF_SHAPES[p.k].map(([x,y])=>{ for (let i=0;i<p.r;i++){ [x,y] = [n-1-y, x]; } return [p.x+x, p.y+y]; }); }
function bfFits(p){ return bfCells(p).every(([x,y])=>x>=0 && x<BF.cols && y<BF.rows && (y<0 || !BF.board[y][x])); }
function bfSpawn(){
  if (!BF.bag.length) BF.bag = bfBag();
  BF.p = { k:BF.next, r:0, x:3, y:-1 }; BF.next = BF.bag.pop();
  if (!bfFits(BF.p)){ BF.over = true; if (BF.score > BF.hi){ BF.hi = BF.score; try { localStorage.setItem('arahe-blockfall-hi', BF.hi); } catch(e){} } sfx.over(); }
}
function bfLock(){
  for (const [x,y] of bfCells(BF.p)){ if (y < 0){ BF.over = true; sfx.over(); return; } BF.board[y][x] = BF.p.k; }
  const full = []; BF.board.forEach((row,y)=>{ if (row.every(Boolean)) full.push(y); });
  if (full.length){ BF.clearing = { rows:full, t:0 }; BF.score += [0,40,100,300,1200][full.length] * BF.level; BF.lines += full.length; BF.level = 1 + Math.floor(BF.lines/10); sfx.line(full.length); }
  else { sfx.tick(true); bfSpawn(); }
}
function bfMove(dx, dy){ const q = { ...BF.p, x:BF.p.x+dx, y:BF.p.y+dy }; if (bfFits(q)){ BF.p = q; return true; } return false; }
function bfInput(k){
  if (BF.over){ if (k === 'a' || k === 'start' || k === 'tap') bfReset(); return; }
  if (k === 'start'){ BF.paused = !BF.paused; return; }
  if (BF.paused || BF.clearing) return;
  if (k === 'left') bfMove(-1, 0) && sfx.tick(true);
  if (k === 'right') bfMove(1, 0) && sfx.tick(true);
  if (k === 'down'){ if (bfMove(0, 1)) BF.score += 1; else bfLock(); BF.acc = 0; }
  if (k === 'up' || k === 'a'){ for (const kick of [0,-1,1,-2,2]){ const q = { ...BF.p, r:(BF.p.r+1)%4, x:BF.p.x+kick }; if (bfFits(q)){ BF.p = q; sfx.blip(); break; } } }
  if (k === 'b'){ let n = 0; while (bfMove(0, 1)) n++; BF.score += n*2; bfLock(); BF.acc = 0; }
}
function bfTile(ctx, x, y, k, s){
  const v = BF_TILE[k];
  ctx.fillStyle = DMG[0]; ctx.fillRect(x, y, s, s);
  ctx.fillStyle = [DMG[3], DMG[2], DMG[1], DMG[2]][v]; ctx.fillRect(x+1, y+1, s-2, s-2);
  ctx.fillStyle = DMG[0];
  if (v === 0){ ctx.fillRect(x+2, y+2, s-4, s-4); ctx.fillStyle = DMG[3]; ctx.fillRect(x+3, y+3, s-6, s-6); }
  if (v === 1){ ctx.fillRect(x+2, y+2, 1, 1); ctx.fillRect(x+s-3, y+s-3, 1, 1); }
  if (v === 2){ ctx.fillStyle = DMG[3]; ctx.fillRect(x+1, y+1, s-2, 1); ctx.fillRect(x+1, y+1, 1, s-2); }
  if (v === 3){ ctx.fillRect(x+2, y+2, s-4, s-4); }
}
function bfPaint(ctx, t){
  if (!BF.board) bfReset();
  const dt = BF.last === null ? 0 : Math.min(.1, t - BF.last); BF.last = t;
  if (!BF.over && !BF.paused){
    if (BF.clearing){ BF.clearing.t += dt; if (BF.clearing.t > .35){ BF.clearing.rows.forEach(y=>{ BF.board.splice(y,1); BF.board.unshift(new Array(BF.cols).fill(null)); }); BF.clearing = null; bfSpawn(); } }
    else { BF.acc += dt; const step = Math.max(.07, .8 - (BF.level-1)*.07); while (BF.acc > step){ BF.acc -= step; if (!bfMove(0,1)){ bfLock(); break; } } }
  }
  const W = 160, H = 144, S = 7, ox = 6, oy = 9;
  ctx.fillStyle = DMG[3]; ctx.fillRect(0,0,W,H);
  // brick walls, like the original
  for (let y=0;y<H;y+=4) for (let x=0;x<4;x++){ ctx.fillStyle = (x + (y>>2)) % 2 ? DMG[1] : DMG[2]; ctx.fillRect(x, y, 1, 3); ctx.fillRect(ox + BF.cols*S + 1 + x, y, 1, 3); }
  ctx.fillStyle = DMG[3]; ctx.fillRect(ox-1, 0, BF.cols*S+2, H);
  ctx.fillStyle = DMG[2]; ctx.fillRect(ox, oy, BF.cols*S, BF.rows*S);
  ctx.fillStyle = DMG[3]; ctx.fillRect(ox, oy, BF.cols*S, BF.rows*S);
  BF.board.forEach((row,y)=>row.forEach((k,x)=>{ if (k){
    const flashing = BF.clearing && BF.clearing.rows.includes(y);
    if (flashing && Math.floor(BF.clearing.t*12) % 2){ ctx.fillStyle = DMG[0]; ctx.fillRect(ox+x*S, oy+y*S, S, S); }
    else bfTile(ctx, ox+x*S, oy+y*S, k, S);
  } }));
  if (!BF.over && !BF.clearing){
    // ghost, then the piece
    let g = { ...BF.p }; while (bfFits({ ...g, y:g.y+1 })) g.y++;
    for (const [x,y] of bfCells(g)) if (y >= 0){ ctx.fillStyle = DMG[2]; ctx.fillRect(ox+x*S+1, oy+y*S+1, S-2, 1); ctx.fillRect(ox+x*S+1, oy+y*S+S-2, S-2, 1); ctx.fillRect(ox+x*S+1, oy+y*S+1, 1, S-2); ctx.fillRect(ox+x*S+S-2, oy+y*S+1, 1, S-2); }
    for (const [x,y] of bfCells(BF.p)) if (y >= 0) bfTile(ctx, ox+x*S, oy+y*S, BF.p.k, S);
  }
  // panel
  const px = ox + BF.cols*S + 10;
  const box = (y, h)=>{ ctx.fillStyle = DMG[0]; ctx.fillRect(px, y, W-px-4, h); ctx.fillStyle = DMG[3]; ctx.fillRect(px+1, y+1, W-px-6, h-2); };
  box(6, 22); drawP(ctx, 'score', px+4, 8, DMG[1]); drawP(ctx, String(BF.score), px+4, 17, DMG[0]);
  box(31, 22); drawP(ctx, 'level', px+4, 33, DMG[1]); drawP(ctx, String(BF.level), px+4, 42, DMG[0]);
  box(56, 22); drawP(ctx, 'lines', px+4, 58, DMG[1]); drawP(ctx, String(BF.lines), px+4, 67, DMG[0]);
  box(81, 34); drawP(ctx, 'next', px+4, 83, DMG[1]);
  const n = BF_SIZE[BF.next]; for (const [x,y] of BF_SHAPES[BF.next]) bfTile(ctx, px + 8 + x*6 + (n === 4 ? -2 : 2), 95 + y*6, BF.next, 6);
  drawP(ctx, 'hi ' + BF.hi, px+2, 121, DMG[1]);
  if (BF.over || BF.paused){
    ctx.fillStyle = DMG[0]; ctx.fillRect(ox+4, 52, BF.cols*S-8, 34); ctx.fillStyle = DMG[3]; ctx.fillRect(ox+5, 53, BF.cols*S-10, 32);
    drawPC(ctx, BF.over ? 'game over' : 'paused', ox + BF.cols*S/2, 58, DMG[0]);
    drawPC(ctx, BF.over ? 'A to retry' : 'P to resume', ox + BF.cols*S/2, 70, DMG[1]);
  }
}

/* ---------------- album back cover ---------------- */
function paintAlbumBack(ctx, W, H, a){
  const { dom, acc } = coverColors(a.id);
  const bg = shade(dom, lum(dom) > .6 ? .94 : 1), fg = lum(bg) > .5 ? '#1c1726' : '#f1e6cc', sub = mix(fg, bg, .4);
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  const m = Math.max(6, Math.round(W*.07));
  const sc = widthP(a.title, 2) <= W-2*m ? 2 : 1;
  drawP(ctx, a.title, m, m, fg, sc);
  let y = m + 10*sc + 2;
  drawP(ctx, a.artist, m, y, fg); y += 10;
  drawP(ctx, String(a.year), m, y, sub); y += 16;
  const colW = Math.floor((W - 2*m - 8)/2), R = mulberry(a.id % 9973);
  ['SIDE A','SIDE B'].forEach((s,ci)=>{
    const x = m + ci*(colW+8); let yy = y;
    drawMicro(ctx, s, x, yy, acc); yy += 9;
    for (let i=0;i<6 && yy < H - m - 26;i++){ ctx.fillStyle = sub; ctx.fillRect(x, yy+2, 4, 1); ctx.fillStyle = fg; ctx.fillRect(x+7, yy+1, Math.round(colW*(.35 + R()*.5)) - 7, 2); yy += 8; }
  });
  const bw = 22, bh = 12, bx = W - m - bw, by = H - m - bh;
  ctx.fillStyle = '#f7f3ea'; ctx.fillRect(bx-2, by-2, bw+4, bh+4);
  let xx = bx; while (xx < bx+bw){ const t = R()<.4 ? 2 : 1; ctx.fillStyle = '#111'; ctx.fillRect(xx, by, t, bh); xx += t + (R()<.5?1:2); }
  drawP(ctx, 'Apple Music ↗', m, H - m - 8, sub);
}
