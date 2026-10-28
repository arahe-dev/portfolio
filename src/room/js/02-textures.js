/* =====================================================================
   PROCEDURAL PIXEL TEXTURES
   ===================================================================== */
const PAL = {
  wall:'#7f927b', wallDeep:'#5f725f', ceiling:'#d8cfbd', trim:'#e9e1cf',
  oak:'#b47b48', oakLight:'#cf9f68', walnut:'#6a4128', walnutDark:'#4a2b19',
  rugIndigo:'#2d3264', rugDeep:'#1b1e3f', rugCream:'#e7d9b9', rugMustard:'#d9a53c', rugRust:'#b4553b',
  curtain:'#c99437', brass:'#c09443', shade:'#efe2c4',
  tv:'#0f0f13', leaf:'#4e7a46', leafDark:'#2f5232',
};

function px(ctx, x, y, c){ ctx.fillStyle=c; ctx.fillRect(x,y,1,1); }

/* Floor: narrow oak strips running toward the vanishing point (along v). 256px = 2m. */
const texFloor = canvasTex(256, 256, (ctx,w,h)=>{
  const R = mulberry(7), pw = 16;
  for (let i=0;i<w/pw;i++){
    let y = Math.floor(R()*200) - 200;
    while (y < h){
      const len = 70 + Math.floor(R()*130);
      const base = mix(PAL.oak, R()<.5? '#8f5a33':'#c48d58', R()*.55);
      for (const yy of [y, y+h, y-h]){
        ctx.fillStyle = base; ctx.fillRect(i*pw, yy, pw, len);
        // grain streaks
        for (let s=0;s<7;s++){
          const gx = i*pw + 1 + Math.floor(R()*(pw-2));
          const gy = yy + Math.floor(R()*len), gl = 6 + Math.floor(R()*30);
          ctx.fillStyle = R()<.6 ? shade(base,.86) : shade(base,1.08);
          ctx.fillRect(gx, gy, 1, Math.min(gl, yy+len-gy));
        }
        // butt joint
        ctx.fillStyle = shade(base,.55); ctx.fillRect(i*pw, yy+len-1, pw, 1);
        ctx.fillStyle = shade(base,1.12); ctx.fillRect(i*pw, yy, pw, 1);
      }
      y += len;
    }
    ctx.fillStyle = 'rgba(40,20,10,.75)'; ctx.fillRect(i*pw, 0, 1, h);
    ctx.fillStyle = 'rgba(255,230,190,.10)'; ctx.fillRect(i*pw+1, 0, 1, h);
  }
}, { mip:true, repeat:[3.5,4.5] });

/* Plaster: grey noise that tints with the material colour. */
const texPlaster = canvasTex(64, 64, (ctx,w,h)=>{
  const R = mulberry(11);
  ctx.fillStyle = '#e4e4e4'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<520;i++){ const v = 214 + Math.floor(R()*40); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(Math.floor(R()*w), Math.floor(R()*h), 1+Math.floor(R()*2), 1); }
}, { mip:true, repeat:[6,3] });

/* Wood grain for furniture (horizontal grain). */
function woodTex(base, seed, w=128, h=64, knots=2){
  return canvasTex(w, h, (ctx)=>{
    const R = mulberry(seed);
    ctx.fillStyle = base; ctx.fillRect(0,0,w,h);
    for (let y=0;y<h;y++){
      const k = .9 + .14*Math.sin(y*.55 + Math.sin(y*.13)*3);
      ctx.fillStyle = shade(base, k); ctx.fillRect(0,y,w,1);
    }
    for (let i=0;i<160;i++){
      const y = Math.floor(R()*h), x = Math.floor(R()*w), l = 8+Math.floor(R()*40);
      ctx.fillStyle = shade(base, R()<.55? .8 : 1.1); ctx.fillRect(x, y, l, 1);
    }
    for (let k=0;k<knots;k++){
      const cx = 10+R()*(w-20), cy = 6+R()*(h-12);
      for (let r=4;r>0;r--){ ctx.fillStyle = shade(base, .6+r*.08); ctx.fillRect(Math.round(cx-r*1.6), Math.round(cy-r*.6), Math.round(r*3.2), Math.max(1,Math.round(r*1.2))); }
    }
  }, { mip:true });
}
const texWalnut = woodTex(PAL.walnut, 21);
const texOak = woodTex(PAL.oakLight, 33, 192, 96, 1);

/* Slatted console doors */
const texSlats = canvasTex(96, 24, (ctx,w,h)=>{
  const R = mulberry(5);
  for (let x=0;x<w;x+=3){
    const c = shade(PAL.walnut, .9 + R()*.2);
    ctx.fillStyle = c; ctx.fillRect(x,0,2,h);
    ctx.fillStyle = shade(PAL.walnut,.42); ctx.fillRect(x+2,0,1,h);
    ctx.fillStyle = shade(c,1.18); ctx.fillRect(x,0,1,h);
  }
}, {});

/* Rug: kilim-ish geometry, cream fringe at the short ends (alpha). 3.2m x 2.2m */
const texRug = canvasTex(200, 136, (ctx,w,h)=>{
  const R = mulberry(3);
  const C = { i:PAL.rugIndigo, d:PAL.rugDeep, c:PAL.rugCream, m:PAL.rugMustard, r:PAL.rugRust };
  const F = 6; // fringe width in px
  ctx.clearRect(0,0,w,h);
  // fringe strands
  for (let y=1;y<h;y+=2){
    const l = F - Math.floor(R()*3);
    ctx.fillStyle = shade(C.c, .85+R()*.15);
    ctx.fillRect(F-l, y, l, 1); ctx.fillRect(w-F, y, l, 1);
  }
  const x0=F, x1=w-F;
  const rect=(x,y,ww,hh,c)=>{ ctx.fillStyle=c; ctx.fillRect(x,y,ww,hh); };
  rect(x0,0,x1-x0,h,C.d);
  rect(x0+3,3,x1-x0-6,h-6,C.c);
  rect(x0+5,5,x1-x0-10,h-10,C.r);
  rect(x0+7,7,x1-x0-14,h-14,C.c);
  // zig-zag border band
  for (let x=x0+7;x<x1-7;x++){ const t=(x%8); const yy = t<4? t : 8-t; px(ctx,x,9+yy,C.i); px(ctx,x,h-10-yy,C.i); }
  for (let y=7;y<h-7;y++){ const t=(y%8); const xx = t<4? t : 8-t; px(ctx,x0+9+xx,y,C.i); px(ctx,x1-10-xx,y,C.i); }
  rect(x0+16,16,x1-x0-32,h-32,C.m);
  rect(x0+18,18,x1-x0-36,h-36,C.i);
  // field: diamond lattice
  const fx0=x0+18, fy0=18, fw=x1-x0-36, fh=h-36;
  for (let y=0;y<fh;y++) for (let x=0;x<fw;x++){
    const gx=(x%22)-11, gy=(y%22)-11, d=Math.abs(gx)+Math.abs(gy);
    if (d===9 || d===10) px(ctx,fx0+x,fy0+y,C.d);
    else if (d<3) px(ctx,fx0+x,fy0+y,C.m);
    else if (d===5) px(ctx,fx0+x,fy0+y,C.r);
  }
  // centre medallion
  const cx=Math.floor(w/2), cy=Math.floor(h/2);
  for (let y=-34;y<=34;y++) for (let x=-46;x<=46;x++){
    const d = Math.abs(x)/1.35 + Math.abs(y);
    let c=null;
    if (d<34){ c = d<6? C.c : d<10? C.r : d<12? C.c : d<20? C.d : d<22? C.m : d<29? C.r : d<31? C.c : C.d; }
    if (c) px(ctx,cx+x,cy+y,c);
  }
  // wear + pile
  for (let i=0;i<1600;i++){
    const x = x0+Math.floor(R()*(x1-x0)), y=Math.floor(R()*h);
    const d = ctx.getImageData(x,y,1,1).data;
    ctx.fillStyle = `rgba(${d[0]},${d[1]},${d[2]},1)`;
    ctx.fillStyle = R()<.5 ? shade(rgbHex(d[0],d[1],d[2]),1.12) : shade(rgbHex(d[0],d[1],d[2]),.88);
    ctx.fillRect(x,y,1,1);
  }
}, { read:true });

/* Curtain fabric: soft vertical weave */
const texCurtain = canvasTex(32, 64, (ctx,w,h)=>{
  const R = mulberry(9);
  for (let x=0;x<w;x++){ ctx.fillStyle = shade('#ffffff', .9 + (x%4===0? -.06:0) + R()*.06); ctx.fillRect(x,0,1,h); }
  for (let y=0;y<h;y+=6){ ctx.fillStyle='rgba(0,0,0,.04)'; ctx.fillRect(0,y,w,1); }
  ctx.fillStyle='rgba(0,0,0,.12)'; ctx.fillRect(0,h-3,w,1);
}, { mip:true });

/* Book spine stripe (tinted) */
const texSpine = canvasTex(8, 32, (ctx,w,h)=>{
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(0,3,w,1); ctx.fillRect(0,h-4,w,1);
  ctx.fillStyle='rgba(255,255,255,.0)';
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(2,10,w-4,10);
  ctx.fillStyle='rgba(0,0,0,.15)'; ctx.fillRect(0,0,1,h);
}, {});

/* Magazine cover — "ARAHE / THE BUILD ISSUE" with a GPU die illustration */
const texMagCover = canvasTex(72, 96, (ctx,w,h)=>{
  ctx.fillStyle = '#efe3c6'; ctx.fillRect(0,0,w,h);
  drawText(ctx, 'ARAHE', 6, 5, '#1c1726', 2);
  ctx.fillStyle = '#d36a45'; ctx.fillRect(4, 21, w-8, 2);
  drawText(ctx, 'NO.06', 4, 25, '#1c1726');
  drawText(ctx, '2026', w-28, 25, '#1c1726');
  // illustration: chip on teal
  ctx.fillStyle = '#2d5a63'; ctx.fillRect(4, 34, w-8, 38);
  const cx = w/2, cy = 53;
  ctx.fillStyle = '#c9a24a';
  for (let i=-3;i<=3;i++){ ctx.fillRect(cx-16, cy+i*3, 4, 1); ctx.fillRect(cx+12, cy+i*3, 4, 1); ctx.fillRect(cx+i*3, cy-16, 1, 4); ctx.fillRect(cx+i*3, cy+12, 1, 4); }
  ctx.fillStyle = '#1a1a22'; ctx.fillRect(cx-12, cy-12, 24, 24);
  ctx.fillStyle = '#3a3a48'; ctx.fillRect(cx-10, cy-10, 20, 20);
  ctx.fillStyle = '#7ad0a8'; ctx.fillRect(cx-6, cy-6, 12, 12);
  ctx.fillStyle = '#1a1a22'; ctx.fillRect(cx-4, cy-4, 8, 8);
  ctx.fillStyle = '#e9b04b'; ctx.fillRect(cx-2, cy-2, 4, 4);
  // cover lines
  drawText(ctx, 'BUILD', 4, 76, '#1c1726');
  drawText(ctx, 'ISSUE', 4, 85, '#d36a45');
  ctx.fillStyle = '#1c1726'; ctx.fillRect(40, 77, 26, 1); ctx.fillRect(40, 80, 22, 1); ctx.fillRect(40, 83, 26, 1); ctx.fillRect(40, 86, 18, 1); ctx.fillRect(40, 89, 24, 1);
}, {});
const texMagCover2 = canvasTex(48, 64, (ctx,w,h)=>{
  ctx.fillStyle = '#b4553b'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = '#f1e6cc'; ctx.fillRect(3,3,w-6,10);
  ctx.fillStyle = '#1c1726'; ctx.fillRect(5,6,22,4);
  ctx.fillStyle = '#e7a63a'; ctx.beginPath(); ctx.arc(w/2, 38, 13, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f1e6cc'; for (let i=0;i<4;i++) ctx.fillRect(4, 54+i*2, 20+((i*7)%14), 1);
}, {});

/* Game Boy face, 64 x 104 (top = far edge = top of device) */
const GB_SCREEN = { x:15, y:13, w:34, h:30 }; // LCD window in face px
const texGBFace = canvasTex(64, 104, (ctx,w,h)=>{
  const R = mulberry(12);
  ctx.fillStyle = '#c9c6bb'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<300;i++){ ctx.fillStyle = R()<.5?'#c2bfb3':'#d0cdc2'; ctx.fillRect(Math.floor(R()*w),Math.floor(R()*h),1,1); }
  ctx.fillStyle = '#b3b0a5'; ctx.fillRect(0,4,w,1);
  // bezel with the iconic rounded lower-right corner
  ctx.fillStyle = '#5c5a6d'; ctx.fillRect(6,8,52,42);
  ctx.fillStyle = '#c9c6bb'; for (let i=0;i<7;i++) ctx.fillRect(58-7+i, 50-(7-i), 7-i, 1);
  ctx.fillStyle = '#8d2a54'; ctx.fillRect(9,10,4,1); ctx.fillStyle='#2f3a8c'; ctx.fillRect(16,10,40,1);
  ctx.fillStyle = '#3a1d22'; ctx.fillRect(9,24,2,2);
  ctx.fillStyle = '#9b9aa6'; ctx.fillRect(GB_SCREEN.x-1,GB_SCREEN.y-1,GB_SCREEN.w+2,GB_SCREEN.h+2);
  // brand
  ctx.fillStyle = '#2f3a8c'; ctx.fillRect(7,53,22,2); ctx.fillRect(31,53,6,2);
  // d-pad recess + A/B recess
  ctx.fillStyle = '#b5b2a6'; ctx.fillRect(6,62,20,20);
  ctx.fillStyle = '#b5b2a6'; for (let i=0;i<12;i++) ctx.fillRect(36+i, 70-Math.floor(i*.5), 2, 12);
  // start / select labels
  ctx.fillStyle = '#2f3a8c'; ctx.fillRect(22,93,6,1); ctx.fillRect(32,93,6,1);
  // speaker grille
  ctx.fillStyle = '#9a978c';
  for (let s=0;s<6;s++) for (let i=0;i<12;i++) ctx.fillRect(44+s*3+Math.floor(i*.5), 86+i-Math.floor(s*1.5), 1, 1);
  // lower-right body curve hint
  ctx.fillStyle = '#b3b0a5'; for (let i=0;i<10;i++) ctx.fillRect(w-10+i, h-1-(9-i), 1, 1);
}, {});

/* Cartridge labels */
function cartTex(bg, fg, word, art){
  return canvasTex(28, 32, (ctx,w,h)=>{
    ctx.fillStyle = '#a9a69d'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#bdbab0'; for (let y=1;y<6;y+=2) ctx.fillRect(2,y,w-4,1);
    ctx.fillStyle = bg; ctx.fillRect(3,8,w-6,h-11);
    ctx.fillStyle = shade(bg,.7); ctx.fillRect(3,h-4,w-6,1);
    art(ctx);
    drawTextC(ctx, word, w/2, h-12, fg);
  }, {});
}
const texCartExp = cartTex('#d4513d', '#f6ead0', 'EXP', ctx=>{ ctx.fillStyle='#f6ead0'; ctx.fillRect(9,11,10,6); ctx.fillStyle='#d4513d'; ctx.fillRect(11,13,6,2); ctx.fillStyle='#f6ead0'; ctx.fillRect(12,10,4,1); });
const texCartSkl = cartTex('#3b78c9', '#f6ead0', 'SKL', ctx=>{ ctx.fillStyle='#f6ead0'; ctx.fillRect(13,10,2,8); ctx.fillRect(10,13,8,2); });
const texCartFall = cartTex('#3e3d48', '#cfd0d8', '', ctx=>{
  const B = (x,y,c)=>{ ctx.fillStyle = c; ctx.fillRect(x,y,3,3); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x,y,3,1); };
  [[8,10],[11,10],[14,10],[11,13]].forEach(([x,y])=>B(x,y,'#e3b23c'));
  [[6,19],[9,19],[9,16],[12,16]].forEach(([x,y])=>B(x,y,'#d4513d'));
  [[15,19],[18,19],[18,16],[18,13]].forEach(([x,y])=>B(x,y,'#3b78c9'));
});
const texCartTime = cartTex('#e3b23c', '#1c1726', '???', ctx=>{ ctx.fillStyle='#1c1726'; ctx.fillRect(10,10,8,8); ctx.fillStyle='#e3b23c'; ctx.fillRect(11,11,6,6); ctx.fillStyle='#1c1726'; ctx.fillRect(13,12,1,3); ctx.fillRect(14,14,2,1); });

/* Clock face */
const texClock = canvasTex(48, 48, (ctx,w,h)=>{
  ctx.fillStyle='#f3ead6'; ctx.beginPath(); ctx.arc(24,24,23,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1c1726';
  for (let i=0;i<12;i++){ const a=i/12*Math.PI*2; const r = i%3===0? 18:19; const x=Math.round(24+Math.sin(a)*r), y=Math.round(24-Math.cos(a)*r); ctx.fillRect(x-(i%3===0?1:0), y-(i%3===0?1:0), i%3===0?2:1, i%3===0?3:1); }
  ctx.fillStyle='#d36a45'; ctx.fillRect(21,31,6,1);
}, {});


/* Album covers decoded from the palette data */
const COVER_TEX = {};
const COVER_PAL = {};
for (const a of ALBUMS){
  const c = COVERS[a.id]; if (!c) continue;
  const pal = []; for (let i=0;i<c.p.length;i+=6) pal.push('#'+c.p.slice(i,i+6));
  COVER_PAL[a.id] = pal;
  COVER_TEX[a.id] = canvasTex(48, 48, (ctx)=>{
    const img = ctx.createImageData(48,48);
    for (let i=0;i<48*48;i++){ const [r,g,b] = hexRGB(pal[parseInt(c.d[i],16)]); img.data[i*4]=r; img.data[i*4+1]=g; img.data[i*4+2]=b; img.data[i*4+3]=255; }
    ctx.putImageData(img,0,0);
  });
}
/* dominant + accent colour of a cover (for spines, labels and back covers) */
function coverColors(id){
  const c = COVERS[id], pal = COVER_PAL[id]; const n = new Array(16).fill(0);
  for (const ch of c.d) n[parseInt(ch,16)]++;
  const order = n.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const dom = pal[order[0]];
  let acc = pal[order[1]];
  for (const i of order.slice(1,8)){ const [r,g,b] = hexRGB(pal[i]); const sat = Math.max(r,g,b)-Math.min(r,g,b); if (sat > 70){ acc = pal[i]; break; } }
  return { dom, acc };
}

/* Record spines for the cube shelf */
const texSpines = canvasTex(64, 32, (ctx,w,h)=>{
  const R = mulberry(61);
  const cols = ['#1d1b22','#e9e1cf','#c9533d','#2f5d7a','#e2c07a','#3e3b5a','#7a9a6a','#d9d0bc','#16151a','#8c3b4a','#4a7d8c'];
  let x = 0;
  while (x < w){ const t = R()<.2 ? 2 : 1; ctx.fillStyle = cols[Math.floor(R()*cols.length)]; ctx.fillRect(x,0,t,h); ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(x+t,0,1,h); x += t+1; }
  ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(0,2,w,1);
}, {});

/* KP17 parts: anodised black with machined screw heads */
const texServo = canvasTex(16, 12, (ctx,w,h)=>{
  ctx.fillStyle='#1b1b1f'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#26262c'; ctx.fillRect(1,1,w-2,1);
  ctx.fillStyle='#8f949c'; [[2,2],[w-3,2],[2,h-3],[w-3,h-3]].forEach(([x,y])=>ctx.fillRect(x,y,1,1));
  ctx.fillStyle='#c0473f'; ctx.fillRect(w-5,h-2,2,1);
}, {});
const texBracket = canvasTex(16, 24, (ctx,w,h)=>{
  ctx.fillStyle='#202024'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#0c0c0e'; [[4,5],[w-6,5],[4,h-7],[w-6,h-7]].forEach(([x,y])=>ctx.fillRect(x,y,2,2));
  ctx.fillStyle='#0c0c0e'; ctx.fillRect(w/2-2,h/2-3,4,6);
  ctx.fillStyle='#9aa0a8'; [[3,1],[w-4,1],[3,h-2],[w-4,h-2]].forEach(([x,y])=>ctx.fillRect(x,y,1,1));
}, {});
const texFoot = canvasTex(24, 40, (ctx,w,h)=>{
  ctx.fillStyle='#1d1d21'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#08080a';
  [[6,8],[17,8],[6,31],[17,31]].forEach(([x,y])=>{ ctx.fillRect(x-3,y-2,6,4); ctx.fillRect(x-2,y-3,4,6); });
  ctx.fillStyle='#2b2b31'; ctx.fillRect(9,14,6,12);
}, {});
const texPCB = canvasTex(24, 16, (ctx,w,h)=>{
  ctx.fillStyle='#2f7a3c'; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#3f9a4e'; for (let i=0;i<8;i++) ctx.fillRect(2+i*2.5|0, 2, 1, h-4);
  ctx.fillStyle='#16161a'; ctx.fillRect(4,5,6,6); ctx.fillRect(14,4,4,3); ctx.fillRect(14,9,6,2);
  ctx.fillStyle='#d8c37a'; for (let i=0;i<10;i++) ctx.fillRect(1+i*2, h-2, 1, 1);
  ctx.fillStyle='#e8e8e8'; ctx.fillRect(19,4,2,2);
}, {});
