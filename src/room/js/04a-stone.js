/* =====================================================================
   STONE & CARPENTRY TOOLS — noise, chiselled rocks with weathering,
   lotus-petal rings, oriented grids and swept beams. Used by the patio.
   ===================================================================== */

/* ---------------- value noise ---------------- */
function hash3(x, y, z, s){
  let h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul(z|0, 1440662683) ^ Math.imul(s|0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y, z, s=0){
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf), w = zf*zf*(3 - 2*zf);
  const L = (a, b, t)=>a + (b - a)*t;
  const c = (i, j, k)=>hash3(xi + i, yi + j, zi + k, s);
  return L(L(L(c(0,0,0), c(1,0,0), u), L(c(0,1,0), c(1,1,0), u), v), L(L(c(0,0,1), c(1,0,1), u), L(c(0,1,1), c(1,1,1), u), v), w)*2 - 1;
}
function fbm(x, y, z, s=0, oct=4){
  let a = .5, f = 1, sum = 0, n = 0;
  for (let i=0;i<oct;i++){ sum += a*vnoise(x*f, y*f, z*f, s + i*17); n += a; a *= .5; f *= 2.03; }
  return sum/n;
}

/* ---------------- geometry plumbing ---------------- */
function mergeVerts(g){
  const p = g.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i=0;i<p.count;i++){
    const k = Math.round(p.getX(i)*1e4) + ',' + Math.round(p.getY(i)*1e4) + ',' + Math.round(p.getZ(i)*1e4);
    let j = map.get(k); if (j === undefined){ j = pos.length/3; map.set(k, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setIndex(idx);
  return out;
}
/* a grid of points → triangles, each one wound to face `out(centroid)`, so normals are always right */
function gridGeo(rows, out, uvf){
  const pos = [], uv = [], idx = [], R = rows.length, C = rows[0].length;
  rows.forEach((row, i)=>row.forEach((p, j)=>{ pos.push(p.x, p.y, p.z); const t = uvf ? uvf(i, j, p) : [j/(C-1), i/(R-1)]; uv.push(t[0], t[1]); }));
  const A = V3(), B = V3(), Cc = V3(), n = V3(), m = V3(), e1 = V3(), e2 = V3();
  const at = (v, k)=>v.set(pos[k*3], pos[k*3+1], pos[k*3+2]);
  const tri = (a, b, c)=>{
    at(A, a); at(B, b); at(Cc, c);
    n.crossVectors(e1.subVectors(B, A), e2.subVectors(Cc, A)); if (n.lengthSq() < 1e-16) return;
    m.copy(A).add(B).add(Cc).multiplyScalar(1/3);
    if (n.dot(out(m)) < 0) idx.push(a, c, b); else idx.push(a, b, c);
  };
  for (let i=0;i<R-1;i++) for (let j=0;j<C-1;j++){ const a = i*C + j, b = a + C; tri(a, b, a+1); tri(b, b+1, a+1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function mergeGeos(list){
  const pos = [], nrm = [], uv = [], col = [], idx = []; let off = 0;
  const hasCol = list.every(g=>g.attributes.color);
  list.forEach(g=>{
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, c = g.attributes.color;
    for (let i=0;i<p.count;i++){ pos.push(p.getX(i), p.getY(i), p.getZ(i)); nrm.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); if (hasCol) col.push(c.getX(i), c.getY(i), c.getZ(i)); }
    if (g.index) g.index.array.forEach(v=>idx.push(v + off)); else for (let i=0;i<p.count;i++) idx.push(i + off);
    off += p.count;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); if (hasCol) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
/* a rectangular section swept along a path (up stays +y): beams, rails, stringers. Hard edges, flat faces */
function beamGeo(pts, w, h, twist=0){
  const n = pts.length, rings = [];
  for (let i=0;i<n;i++){
    const t = V3().subVectors(pts[Math.min(n-1, i+1)], pts[Math.max(0, i-1)]).normalize();
    const s = V3().crossVectors(t, V3(0, 1, 0)); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize();
    const u = V3().crossVectors(s, t).normalize();
    rings.push({ p:pts[i], s, u });
  }
  const corner = (r, a, b)=>r.p.clone().addScaledVector(r.s, a*w/2).addScaledVector(r.u, b*h/2);
  const faces = [[[-1,1],[1,1],'u',1], [[1,1],[1,-1],'s',1], [[1,-1],[-1,-1],'u',-1], [[-1,-1],[-1,1],'s',-1]];
  const parts = faces.map(([c0, c1, ax, sg])=>{
    const rows = rings.map(r=>[corner(r, c0[0], c0[1]), corner(r, c1[0], c1[1])]);
    return gridGeo(rows, m=>{ let best = rings[0], bd = 1e9; for (const r of rings){ const d = r.p.distanceToSquared(m); if (d < bd){ bd = d; best = r; } } return best[ax].clone().multiplyScalar(sg); }, (i, j, p)=>[j, i*.5]);
  });
  // end caps
  [0, n-1].forEach((k, e)=>{
    const r = rings[k], t = V3().subVectors(pts[e ? n-1 : 0], pts[e ? n-2 : 1]).normalize();
    parts.push(gridGeo([[corner(r,-1,1), corner(r,1,1)], [corner(r,-1,-1), corner(r,1,-1)]], ()=>t));
  });
  return mergeGeos(parts);
}
/* a lathe whose radius swells into petals around the ring — lotus bases, jewel cups */
function petalLathe(prof, petals, amp, seg=48, sharp=1.6){
  const rows = prof.map(([r, y], i)=>{
    const v = i/(prof.length - 1), row = [];
    for (let j=0;j<=seg;j++){
      const a = j/seg*Math.PI*2, pet = Math.pow(Math.abs(Math.cos(a*petals/2)), sharp);
      const k = 1 + amp*(pet - .5)*Math.sin(Math.PI*clamp(v*1.1, 0, 1));
      row.push(V3(Math.cos(a)*r*k, y, Math.sin(a)*r*k));
    }
    return row;
  });
  return gridGeo(rows, m=>V3(m.x, 0, m.z).normalize().add(V3(0, .0001, 0)), (i, j)=>[j/seg*petals*.5, i/(prof.length-1)]);
}
/* a faceted lathe for hexagonal stone parts: every band between two profile points is its own flat face,
   wound to face the way that band actually slopes (sides out, ledges up, undersides down) */
function hexLathe(prof, sides=6, rot=0){
  const parts = [];
  for (let i=0;i<prof.length-1;i++){
    const [r0, y0] = prof[i], [r1, y1] = prof[i+1];
    for (let j=0;j<sides;j++){
      const a0 = j/sides*Math.PI*2 + rot, a1 = (j+1)/sides*Math.PI*2 + rot, mid = (a0 + a1)/2;
      const rows = [[V3(Math.cos(a0)*r0, y0, Math.sin(a0)*r0), V3(Math.cos(a1)*r0, y0, Math.sin(a1)*r0)], [V3(Math.cos(a0)*r1, y1, Math.sin(a0)*r1), V3(Math.cos(a1)*r1, y1, Math.sin(a1)*r1)]];
      const dr = r1 - r0, dy = y1 - y0;
      const o = V3(Math.cos(mid)*dy, -dr, Math.sin(mid)*dy); if (o.lengthSq() < 1e-12) continue; o.normalize();   // this band's slope normal
      parts.push(gridGeo(rows, ()=>o, (k, q, p)=>[q + j*1.0, (y0 + (y1 - y0)*k)*5]));
    }
  }
  [[prof[prof.length-1], 1], [prof[0], -1]].forEach(([[r, y], sg])=>{
    if (r < 1e-4) return;
    const rim = [], ctr = []; for (let j=0;j<=sides;j++){ const a = j/sides*Math.PI*2 + rot; rim.push(V3(Math.cos(a)*r, y, Math.sin(a)*r)); ctr.push(V3(0, y, 0)); }
    parts.push(gridGeo([ctr, rim], ()=>V3(0, sg, 0), (i, j, p)=>[p.x*3 + .5, p.z*3 + .5]));
  });
  return mergeGeos(parts);
}

/* ---------------- textures ---------------- */
const texGrain = canvasTex(32, 32, (ctx,w,h)=>{
  const R = mulberry(201);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){ const v = 214 + Math.floor((R() - .5)*60) + (R() < .05 ? 30 : 0) - (R() < .05 ? 45 : 0); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 1, 1); }
}, { mip:true, repeat:[1, 1] });
texGrain.wrapS = texGrain.wrapT = THREE.RepeatWrapping;
/* granite: speckled, with lichen and the dark streaks rain leaves under a ledge */
const texGranite = canvasTex(64, 64, (ctx,w,h)=>{
  const R = mulberry(202);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const n = fbm(x*.09, y*.09, 0, 5, 3), v = 196 + n*28 + (R() - .5)*34;
    const r = v + (R() < .06 ? 40 : 0) - (R() < .08 ? 50 : 0);
    ctx.fillStyle = `rgb(${r|0},${(r - 2)|0},${(r - 8)|0})`; ctx.fillRect(x, y, 1, 1);
  }
  for (let k=0;k<9;k++){ const x = Math.floor(R()*w); for (let y=0;y<h;y++) if (fbm(x*.3, y*.08, 1, 9, 2) > -.1){ ctx.fillStyle = 'rgba(40,38,34,.16)'; ctx.fillRect(x, y, 1 + (R() < .3), 1); } }
  for (let k=0;k<14;k++){ const cx = R()*w, cy = R()*h, rr = 1 + R()*2.5; for (let y=-3;y<=3;y++) for (let x=-3;x<=3;x++) if (x*x + y*y < rr*rr && R() < .8){ ctx.fillStyle = R() < .5 ? '#b5b28c' : '#a3a77e'; ctx.fillRect(Math.floor(cx + x), Math.floor(cy + y), 1, 1); } }
}, { mip:true });
texGranite.wrapS = texGranite.wrapT = THREE.RepeatWrapping;

/* normals that stay smooth across a face but break at a ridge sharper than `deg`: split stone keeps its edges */
function creaseNormals(g, deg=38){
  const ng = g.index ? g.toNonIndexed() : g, p = ng.attributes.position, n = p.count, cosT = Math.cos(deg*Math.PI/180);
  const fn = new Float32Array(n), F = [], A = V3(), B = V3(), C = V3();
  for (let f=0; f<n/3; f++){ A.fromBufferAttribute(p, f*3); B.fromBufferAttribute(p, f*3+1); C.fromBufferAttribute(p, f*3+2);
    const nn = V3().subVectors(B, A).cross(V3().subVectors(C, A)); const area = nn.length(); F.push(area > 0 ? nn.multiplyScalar(1/area) : V3(0,1,0)); }
  const key = i=>Math.round(p.getX(i)*1e4) + ',' + Math.round(p.getY(i)*1e4) + ',' + Math.round(p.getZ(i)*1e4);
  const at = new Map(); for (let i=0;i<n;i++){ const k = key(i); (at.get(k) || at.set(k, []).get(k)).push(i); }
  const out = new Float32Array(n*3), acc = V3();
  for (let i=0;i<n;i++){
    const own = F[Math.floor(i/3)]; acc.set(0, 0, 0);
    for (const j of at.get(key(i))){ const o = F[Math.floor(j/3)]; if (o.dot(own) >= cosT) acc.add(o); }
    acc.normalize(); out[i*3] = acc.x; out[i*3+1] = acc.y; out[i*3+2] = acc.z;
  }
  ng.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return ng;
}

/* ---------------- rocks ---------------- */
const PM_ROCK = toon({ vertexColors:true, map:texGrain });
function rockGeo(R, o={}){
  const g = mergeVerts(new THREE.IcosahedronGeometry(1, o.detail ?? 3));
  const p = g.attributes.position, seed = Math.floor(R()*1e6), sx = o.sx || 1, sy = o.sy || .7, sz = o.sz || 1;
  // a few random planes knock the lump into the flat faces and edges of split stone
  const planes = [], nc = o.cuts ?? (5 + Math.floor(R()*4));
  for (let k=0;k<nc;k++) planes.push([V3(R() - .5, (R() - .5)*1.6, R() - .5).normalize(), .48 + R()*.26, .97]);
  if (o.flatTop !== undefined) planes.push([V3((R()-.5)*.12, 1, (R()-.5)*.12).normalize(), o.flatTop, .97]);
  const d = V3(), q = V3(), disp = new Float32Array(p.count);
  for (let i=0;i<p.count;i++){
    d.fromBufferAttribute(p, i).normalize();
    q.copy(d).multiplyScalar(1 + (o.rough ?? .12)*fbm(d.x*1.5, d.y*1.5, d.z*1.5, seed, 3));
    planes.forEach(([n, off, k])=>{ const e = q.dot(n) - off; if (e > 0) q.addScaledVector(n, -e*k); });
    q.multiplyScalar(1 + .04*fbm(q.x*5.5, q.y*5.5, q.z*5.5, seed + 7, 2));
    if (o.strata){ const b = Math.sin(q.y*o.strata*Math.PI*2); q.x *= 1 + .035*b; q.z *= 1 + .035*b; }
    disp[i] = q.length() - 1;
    q.set(q.x*sx, q.y*sy, q.z*sz);
    if (o.base !== undefined && q.y < o.base) q.y = o.base + (q.y - o.base)*.12;
    p.setXYZ(i, q.x, q.y, q.z);
  }
  // per-vertex displacement has to follow the split into face-vertices
  const flat = creaseNormals(g, o.crease ?? 24), idx0 = g.index.array, dispF = new Float32Array(idx0.length);
  for (let i=0;i<idx0.length;i++) dispF[i] = disp[idx0[i]];
  return colourRock(flat, dispF, seed, o);
}
function colourRock(g, disp, seed, o){
  const p = g.attributes.position;
  const nr = g.attributes.normal, cols = new Float32Array(p.count*3), uv = new Float32Array(p.count*2), c = new THREE.Color(), base = new THREE.Color(o.color || '#7c7a73');
  const moss = new THREE.Color('#596640'), moss2 = new THREE.Color('#6f7b4c'), lichen = new THREE.Color('#bcb894'), wet = new THREE.Color('#35392f');
  for (let i=0;i<p.count;i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = nr.getY(i);
    c.copy(base).multiplyScalar(1 + .18*fbm(x*5, y*5, z*5, seed + 3, 2));
    c.multiplyScalar(clamp(.8 + disp[i]*1.5, .55, 1.12));
    c.multiplyScalar(lerp(.66, 1.1, clamp(ny*.5 + .5, 0, 1)));
    if (o.moss && ny > .35){ const m = fbm(x*3.5, y*3.5, z*3.5, seed + 11, 3) + (ny - .35)*.8 - (o.moss === 'light' ? .5 : .3); if (m > 0) c.lerp(m > .18 ? moss2 : moss, clamp(m*2.4, 0, .85)); }
    if (fbm(x*10, y*10, z*10, seed + 13, 1) > .58) c.lerp(lichen, .45);
    { const k = o.cracks ?? 1; const rn = 1 - Math.abs(vnoise(x*4.2, y*4.2, z*4.2, seed + 21)); if (k && rn > .93) c.multiplyScalar(lerp(1, .5, (rn - .93)/.07)); }
    if (o.wetY !== undefined && y < o.wetY) c.lerp(wet, clamp((o.wetY - y)*10 + .25, 0, .75));
    cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
    uv[i*2] = x*1.7 + z*.9; uv[i*2+1] = y*1.7 + z*.6;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
/* a rock set into the ground (or the pond edge): sized s, its buried part flattened */
function placeRock(R, parent, x, y, z, s, o={}){
  const geo = rockGeo(R, { ...o, base:o.base ?? -.35, wetY:o.wetY !== undefined ? (o.wetY - y)/s : undefined });
  geo.scale(s, s, s);
  const m = new THREE.Mesh(geo, PM_ROCK); m.position.set(x, y, z); m.rotation.y = R()*Math.PI*2;
  m.castShadow = m.receiveShadow = true; m.userData.s = s; parent.add(m);
  return m;
}

/* weathering baked into vertex colours: darker underneath and low down, moss where rain sits, lichen */
function weatherGeo(g, o={}){
  const p = g.attributes.position, n = g.attributes.normal, cols = new Float32Array(p.count*3), c = new THREE.Color();
  const base = new THREE.Color(o.color || '#d6d1c6'), moss = new THREE.Color('#62783d'), moss2 = new THREE.Color('#7d9147'), lichen = new THREE.Color('#d4d0a4');
  const y0 = o.y0 ?? 0, y1 = o.y1 ?? 1, seed = o.seed || 0;
  for (let i=0;i<p.count;i++){
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = n.getY(i);
    c.copy(base).multiplyScalar(1 + .1*fbm(x*7, y*7, z*7, seed, 2));
    c.multiplyScalar(lerp(.68, 1.04, clamp(ny*.5 + .5, 0, 1)));
    c.multiplyScalar(lerp(o.lowDark ?? .82, 1, clamp((y - y0)/Math.max(1e-3, y1 - y0), 0, 1)));
    if (o.moss && ny > .3){ const m = fbm(x*o.mossScale, y*o.mossScale, z*o.mossScale, seed + 5, 3) + (ny - .3)*.7 - o.moss; if (m > 0) c.lerp(m > .2 ? moss2 : moss, clamp(m*2.8, 0, .9)); }
    if (fbm(x*13, y*13, z*13, seed + 9, 1) > .6) c.lerp(lichen, .35);
    cols[i*3] = c.r; cols[i*3+1] = c.g; cols[i*3+2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}
/* a hexagonal roof: concave slopes, corners that sweep up at the eaves, a thick edge, a flat soffit */
function roofGeo(N, R, H, th, lift, rot=0){
  const U = 10, S = 12, C = [];
  for (let k=0;k<=N;k++){ const a = k/N*Math.PI*2 + rot; C.push([Math.cos(a)*R, Math.sin(a)*R]); }
  const parts = [];
  for (let k=0;k<N;k++){
    const pt = (s, u, top)=>{
      const x = lerp(C[k][0], C[k+1][0], u), z = lerp(C[k][1], C[k+1][1], u), c = Math.pow(Math.abs(2*u - 1), 5);
      const sr = s*(1 + .08*c*s*s), up = lift*c*Math.pow(s, 4);
      return V3(x*sr, (top ? th + (H - th)*Math.pow(1 - s, 1.8) : 0) + up, z*sr);
    };
    const top = [], bot = [], band = [];
    for (let i=0;i<=S;i++){ const s = i/S, rt = [], rb = []; for (let j=0;j<=U;j++){ rt.push(pt(s, j/U, true)); rb.push(pt(s, j/U, false)); } top.push(rt); bot.push(rb); }
    band.push(top[S], bot[S]);
    parts.push(gridGeo(top, m=>V3(m.x*.4, 1, m.z*.4)), gridGeo(bot, ()=>V3(0, -1, 0)), gridGeo(band, m=>V3(m.x, 0, m.z)));
  }
  const g = mergeGeos(parts); g.computeVertexNormals();
  return g;
}
