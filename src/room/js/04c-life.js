/* =====================================================================
   GARDEN LIFE — the maple, the pruned shrubs, grass, and six koi with
   their own temperaments. Foliage is thousands of small leaf cards
   (one draw per kind), so it reads at the same pixel density as the room.
   ===================================================================== */

/* ---------------- leaf shapes ---------------- */
function leafGeo(kind){
  const s = new THREE.Shape();
  if (kind === 'maple'){
    // palmate, seven pointed lobes, a notch for the stem
    const N = 7, pts = [];
    for (let i=0;i<=N*2;i++){
      const a = -Math.PI*.8 + (i/(N*2))*Math.PI*1.6, tip = i % 2 === 1, li = Math.abs(i - N)/N;
      const r = tip ? 1 - li*li*.42 : .34 + (1 - li)*.06;
      pts.push([Math.sin(a)*r, Math.cos(a)*r]);
    }
    s.moveTo(0, -.08); pts.forEach(([x,y])=>s.lineTo(x, y)); s.lineTo(0, -.08);
  } else if (kind === 'shrub'){
    s.moveTo(0, -.5); s.lineTo(.24, -.22); s.lineTo(.26, .12); s.lineTo(0, .5); s.lineTo(-.26, .12); s.lineTo(-.24, -.22); s.lineTo(0, -.5);
  } else if (kind === 'bamboo'){
    s.moveTo(0, 0); s.lineTo(.075, .12); s.lineTo(.06, .62); s.lineTo(0, 1); s.lineTo(-.06, .62); s.lineTo(-.075, .12); s.lineTo(0, 0);
  }
  const g = new THREE.ShapeGeometry(s);
  const n = g.attributes.normal; for (let i=0;i<n.count;i++) n.setXYZ(i, 0, 0, 1);
  return g;
}

/* ---------------- a foliage batch: collect leaves, then build one instanced mesh ---------------- */
const _fq = new THREE.Quaternion(), _fq2 = new THREE.Quaternion(), _fm = new THREE.Matrix4(), _fz = V3(0, 0, 1), _fc = new THREE.Color();
function foliage(){ return { m:[], c:[] }; }
function leafAt(F, p, nrm, size, col, spin){
  _fq.setFromUnitVectors(_fz, nrm);
  _fq2.setFromAxisAngle(nrm, spin); _fq.premultiply(_fq2);
  _fm.compose(p, _fq, V3(size, size, size));
  F.m.push(_fm.clone()); F.c.push(col);
}
function foliageMesh(F, geo, mat, o={}){
  const im = new THREE.InstancedMesh(geo, mat, F.m.length);
  F.m.forEach((m,i)=>{ im.setMatrixAt(i, m); im.setColorAt(i, _fc.set(F.c[i])); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = !!o.cast; im.receiveShadow = true;
  im.computeBoundingSphere();
  PATIO.g.add(im);
  return im;
}
/* leaves over the skin of an ellipsoid; colour darkens underneath and deeper in */
function leafDome(F, R, c, r, n, pal, o={}){
  const minY = o.minY !== undefined ? o.minY : -1, size = o.size || .05, jit = o.jit !== undefined ? o.jit : .55;
  const dark = o.dark || '#10180e', top = o.top || null;
  let made = 0, guard = 0;
  while (made < n && guard++ < n*6){
    const u = R()*2 - 1, a = R()*Math.PI*2, q = Math.sqrt(1 - u*u);
    const d = V3(q*Math.cos(a), u, q*Math.sin(a));
    if (d.y < minY) continue;
    const k = .86 + Math.pow(R(), .6)*.16;
    const p = V3(c.x + d.x*r.x*k, c.y + d.y*r.y*k, c.z + d.z*r.z*k);
    if (o.clip && !o.clip(p)) continue;
    const nrm = V3(d.x/r.x, d.y/r.y, d.z/r.z).normalize();
    nrm.add(V3(R()-.5, R()-.5, R()-.5).multiplyScalar(jit*2)).normalize();
    let col = pal[Math.floor(R()*pal.length)];
    const under = clamp(.5 - d.y*.7, 0, 1) * .55, deep = (1.02 - k) * 2.6;
    col = mix(col, dark, clamp(under + deep, 0, .75));
    if (top && d.y > .55 && R() < .22) col = mix(col, top, .5 + R()*.4);
    leafAt(F, p, nrm, size*(.75 + R()*.5), col, R()*Math.PI*2);
    made++;
  }
}
const ellArea = (a,b,c)=>4*Math.PI*Math.pow((Math.pow(a*b,1.6) + Math.pow(a*c,1.6) + Math.pow(b*c,1.6))/3, 1/1.6);

/* ---------------- textures: bark ---------------- */
const texBark = canvasTex(16, 64, (ctx,w,h)=>{
  const R = mulberry(91);
  ctx.fillStyle = '#5a4b45'; ctx.fillRect(0,0,w,h);
  for (let x=0;x<w;x++){ const c = mix('#4b3d38', '#6e5f57', R()); for (let y=0;y<h;y++) if (R() < .7){ ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); } }
  for (let k=0;k<26;k++){ ctx.fillStyle = R()<.5 ? '#7d6d63' : '#3a2e2a'; ctx.fillRect(Math.floor(R()*w), Math.floor(R()*h), 1, 3 + Math.floor(R()*9)); }
  for (let k=0;k<5;k++){ ctx.fillStyle = '#82766a'; ctx.fillRect(Math.floor(R()*w), Math.floor(R()*h), 2, 1); }
}, { mip:true });
texBark.wrapS = texBark.wrapT = THREE.RepeatWrapping;

/* a tapered tube along a curve, bark wrapped around it */
function limb(points, r0, r1, mat, parent, radial=7){
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const len = curve.getLength(), seg = Math.max(3, Math.ceil(len/.12));
  const fr = curve.computeFrenetFrames(seg, false);
  const pos = [], uv = [], idx = [];
  for (let i=0;i<=seg;i++){
    const t = i/seg, P = curve.getPointAt(t), r = lerp(r0, r1, Math.pow(t, .85)) * (1 + .06*Math.sin(t*17 + r0*40));
    for (let j=0;j<=radial;j++){
      const a = j/radial*Math.PI*2, N = fr.normals[i], B = fr.binormals[i];
      pos.push(P.x + (N.x*Math.cos(a) + B.x*Math.sin(a))*r, P.y + (N.y*Math.cos(a) + B.y*Math.sin(a))*r, P.z + (N.z*Math.cos(a) + B.z*Math.sin(a))*r);
      uv.push(j/radial * Math.max(1, Math.round(r0*30)), t*len*1.6);
    }
  }
  for (let i=0;i<seg;i++) for (let j=0;j<radial;j++){ const a = i*(radial+1)+j, b = a + radial + 1; idx.push(a, b, a+1, b, b+1, a+1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; parent.add(m);
  return curve;
}

/* =====================================================================
   THE MAPLE — a low, spreading momiji in full autumn colour
   ===================================================================== */
const mapleGroup = new THREE.Group(); PATIO.g.add(mapleGroup);
const MAPLE = { pads:[], leafGeo:leafGeo('maple') };
(function buildMaple(){
  mapleGroup.position.set(-12.1, PATIO.y, -3.9);
  const R = mulberry(185);
  const bark = toon({ map:texBark }), twig = toon({ map:texBark, color:'#c9a59a' });
  const tips = [];
  // trunk: leans, kinks once, then splits
  const trunk = limb([V3(0,0,0), V3(.06,.35,.02), V3(.02,.7,.08), V3(.16,1.02,.14)], .15, .1, bark, mapleGroup, 9);
  // root flare
  for (let k=0;k<5;k++){ const a = k/5*Math.PI*2 + R()*.5; limb([V3(Math.cos(a)*.05, .16, Math.sin(a)*.05), V3(Math.cos(a)*.16, .04, Math.sin(a)*.16), V3(Math.cos(a)*.3, -.03, Math.sin(a)*.3)], .07, .02, bark, mapleGroup, 5); }
  function grow(p0, dir, len, r, depth){
    const pts = [p0.clone()]; let p = p0.clone(); const d = dir.clone();
    for (let k=0;k<3;k++){
      d.add(V3((R()-.5)*.35, (R()-.5)*.2 + (depth <= 1 ? .06 : -.02), (R()-.5)*.35)).normalize();
      p = p.clone().addScaledVector(d, len/3); pts.push(p);
    }
    limb(pts, r, r*.66, depth >= 2 ? bark : twig, mapleGroup, depth >= 2 ? 7 : 5);
    if (depth === 0){ tips.push({ p, d:d.clone(), big:false }); return; }
    const kids = depth >= 2 ? 3 : 2;
    for (let k=0;k<kids;k++){
      const az = Math.atan2(d.z, d.x) + (k - (kids-1)/2) * (depth >= 2 ? 1.05 : .8) + (R()-.5)*.4;
      const lift = depth >= 2 ? .38 + R()*.25 : .22 + R()*.25;
      const nd = V3(Math.cos(az), lift, Math.sin(az)).normalize();
      grow(p, nd, len*(.66 + R()*.12), r*.62, depth - 1);
    }
    if (depth === 1) tips.push({ p, d:d.clone(), big:true });
  }
  [[.35, .6], [2.35, .55], [4.3, .5]].forEach(([az, lift], i)=>grow(V3(.16,1.02,.14), V3(Math.cos(az), lift + .2, Math.sin(az)).normalize(), 1.3 - i*.1, .085, 2));

  // foliage pads: flattened domes over every tip, layered as the tree is pruned
  const F = foliage();
  const pal = ['#8f1b22','#a8232a','#bd2f2c','#cf3d2c','#d9502f','#e2672f','#b52a2e','#c8352b'];
  tips.forEach(t=>{
    const rx = t.big ? .5 + R()*.12 : .4 + R()*.1, ry = t.big ? .22 : .17 + R()*.04;
    const c = t.p.clone().add(V3(t.d.x*.12, ry*.55, t.d.z*.12));
    MAPLE.pads.push({ c, rx, ry });
    leafDome(F, R, c, V3(rx, ry, rx*(.85 + R()*.25)), Math.round(ellArea(rx, ry, rx)*230), pal, { size:.094, jit:.5, dark:'#3a0b12', top:'#ee8a3a', minY:-.7 });
    const core = mesh(new THREE.SphereGeometry(1, 10, 6), toon({ color:'#5a1218' }), { x:c.x, y:c.y, z:c.z, cast:false }, mapleGroup);
    core.scale.set(rx*.82, ry*.72, rx*.78);
  });
  const im = foliageMesh(F, MAPLE.leafGeo, toon({ side:THREE.DoubleSide }), { cast:true });
  PATIO.g.remove(im); mapleGroup.add(im);     // pads were built in tree space
  MAPLE.canopy = im; PATIO.heavy = [im];
  // a few leaves already down: on the moss, the gravel, a couple on the bridge path
  const G = foliage();
  for (let i=0;i<150;i++){
    const a = R()*Math.PI*2, d = Math.pow(R(), .7)*2.6;
    const x = Math.cos(a)*d, z = Math.sin(a)*d + .2;
    const wx = mapleGroup.position.x + x, wz = mapleGroup.position.z + z;
    if (inPond(wx, wz, 1.05)) continue;
    const nrm = V3((R()-.5)*.5, 1, (R()-.5)*.5).normalize();
    leafAt(G, V3(x, .012 + R()*.006, z), nrm, .06 + R()*.025, mix(pal[Math.floor(R()*pal.length)], '#6a3a24', R()*.45), R()*6.28);
  }
  const ground = foliageMesh(G, MAPLE.leafGeo, toon({ side:THREE.DoubleSide })); PATIO.heavy.push(ground);
  PATIO.g.remove(ground); mapleGroup.add(ground);
  mapleGroup.updateMatrixWorld(true);
  PATIO.mapleTop = mapleGroup.localToWorld(V3(.4, 2.1, .4));
  MAPLE.span = 1.9;
})();

/* falling leaves: real leaves that tumble, land on the gravel or float on the pond */
const FALL = { n:26, im:null, p:[] };
(function(){
  FALL.im = new THREE.InstancedMesh(MAPLE.leafGeo, toon({ side:THREE.DoubleSide }), FALL.n);
  FALL.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const pal = ['#b8282a','#cf3b2b','#e0552f','#9e1f24','#ea7a35'];
  for (let i=0;i<FALL.n;i++){
    FALL.im.setColorAt(i, _fc.set(pal[i % pal.length]));
    const onWater = i < 8;
    const p = { s:onWater ? 'water' : 'fall', x:0, y:0, z:0, vx:0, vz:0, ph:Math.random()*6, rx:Math.random()*6, ry:Math.random()*6, t:Math.random()*30, life:0, size:.065 + Math.random()*.02 };
    if (onWater){ const [x, z] = pondPoint(Math.random()*Math.PI*2, Math.random()*.75); p.x = x; p.z = z; p.y = PATIO.waterY + .004; }
    else resetLeaf(p, true);
    FALL.p.push(p);
  }
  FALL.im.instanceColor.needsUpdate = true;
  FALL.im.castShadow = false; FALL.im.frustumCulled = false; PATIO.g.add(FALL.im); PATIO.heavy.push(FALL.im);
})();
function resetLeaf(p, anyHeight){
  const pad = MAPLE.pads[Math.floor(Math.random()*MAPLE.pads.length)];
  const w = mapleGroup.localToWorld(pad.c.clone());
  p.x = w.x + (Math.random()-.5)*pad.rx*1.6; p.z = w.z + (Math.random()-.5)*pad.rx*1.6;
  p.y = anyHeight ? PATIO.y + .2 + Math.random()*(w.y - PATIO.y) : w.y - pad.ry*.5;
  p.vx = .12 + Math.random()*.1; p.vz = .05 + (Math.random()-.5)*.12;    // a light breeze toward the house
  p.s = 'fall'; p.life = 0;
}

/* =====================================================================
   PRUNED SHRUBS — tamamono domes and a cloud-pruned pair by the fence
   ===================================================================== */
(function buildShrubs(){
  const R = mulberry(186);
  const F = foliage();
  const pals = {
    azalea:['#2f5a2c','#38652f','#2a4f28','#41703a','#33602d'],
    box:['#41632f','#4c7036','#3a5a2a','#56793c','#47692f'],
    pine:['#2c4a33','#34573a','#264232','#3b6040'],
  };
  const dome = (x, y, z, rx, ry, rz, kind='azalea')=>{
    const c = V3(x, y, z);
    leafDome(F, R, c, V3(rx, ry, rz), Math.round(ellArea(rx, ry, rz)*720), pals[kind], { size:.058, jit:.6, dark:'#0b1509', top:kind === 'box' ? '#8aa85a' : '#6f9a4e', minY:(PATIO.y - y)/ry - .05,
      clip:p=>p.y > PATIO.y - .01 });
    const core = mesh(new THREE.SphereGeometry(1, 12, 8), toon({ color:kind === 'pine' ? '#16241a' : '#18291a' }), { x, y, z, cast:true }, PATIO.g);
    core.scale.set(rx*.86, ry*.84, rz*.86);
  };
  // by the lantern: two azalea mounds, one tucked behind the other
  const L = lanternGroup.position;
  dome(L.x + .55, PATIO.y + .14, L.z - .3, .5, .3, .42);
  dome(L.x + .92, PATIO.y + .1, L.z - .02, .3, .2, .28);
  dome(L.x - .52, PATIO.y + .1, L.z - .45, .38, .25, .33);
  // along the fence
  [[-13.2, 2.8, .7], [-13.1, -5.6, .6], [-6.6, 5.6, .55], [-12.7, 4.4, .45]].forEach(([x,z,s], i)=>{
    dome(x, PATIO.y + s*.26, z, s, s*.56, s*.78, i % 2 ? 'box' : 'azalea');
    if (i === 0){ dome(x + .35, PATIO.y + s*.12, z + .62, s*.55, s*.36, s*.5, 'box'); }
  });
  // a small cloud-pruned pine: a crooked trunk carrying three flat pads
  const pine = new THREE.Group(); pine.position.set(-6.75, PATIO.y, -4.6); PATIO.g.add(pine);
  const bark = toon({ map:texBark, color:'#a08f86' });
  limb([V3(0,0,0), V3(.12,.35,.04), V3(-.06,.7,.1), V3(.1,1.05,0)], .07, .035, bark, pine, 6);
  limb([V3(-.04,.62,.08), V3(-.3,.7,.12), V3(-.52,.66,.1)], .03, .016, bark, pine, 5);
  limb([V3(.06,.42,.03), V3(.32,.46,-.06), V3(.48,.44,-.12)], .03, .016, bark, pine, 5);
  pine.updateMatrixWorld(true);
  [[.1,1.1,0,.34,.13,.3],[-.52,.72,.1,.28,.11,.24],[.5,.5,-.12,.26,.1,.22]].forEach(([x,y,z,rx,ry,rz])=>{
    const w = pine.localToWorld(V3(x, y, z));
    leafDome(F, R, w, V3(rx, ry, rz), Math.round(ellArea(rx, ry, rz)*1100), pals.pine, { size:.045, jit:.7, dark:'#08110a', top:'#5d7f4c', minY:-.35 });
    const core = mesh(new THREE.SphereGeometry(1, 10, 6), toon({ color:'#122017' }), { x:w.x, y:w.y, z:w.z }, PATIO.g); core.scale.set(rx*.8, ry*.7, rz*.8);
  });
  PATIO.heavy.push(foliageMesh(F, leafGeo('shrub'), toon({ side:THREE.DoubleSide }), { cast:false }));
})();

/* ---------------- mondo grass tufts at the feet of things ---------------- */
(function buildGrass(){
  const R = mulberry(187);
  const blade = (()=>{
    const pos = [], n = 9;
    for (let i=0;i<n;i++){
      const a = i/n*Math.PI*2 + R()*.4, lean = .35 + R()*.5, h = .13 + R()*.08, w = .006;
      const ox = Math.cos(a), oz = Math.sin(a), px = -oz*w, pz = ox*w;
      const m1 = [ox*lean*h*.35, h*.55, oz*lean*h*.35], tip = [ox*lean*h*.95, h*.82, oz*lean*h*.95];
      pos.push(px,0,pz, -px,0,-pz, m1[0]+px*.6,m1[1],m1[2]+pz*.6);
      pos.push(-px,0,-pz, m1[0]-px*.6,m1[1],m1[2]-pz*.6, m1[0]+px*.6,m1[1],m1[2]+pz*.6);
      pos.push(m1[0]+px*.6,m1[1],m1[2]+pz*.6, m1[0]-px*.6,m1[1],m1[2]-pz*.6, tip[0],tip[1],tip[2]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const nr = []; for (let i=0;i<pos.length/3;i++) nr.push(0, 1, 0); g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
    return g;
  })();
  const spots = [];
  const ring = (cx, cz, r, n)=>{ for (let i=0;i<n;i++){ const a = R()*Math.PI*2, d = r*(.8 + R()*.4); spots.push([cx + Math.cos(a)*d, cz + Math.sin(a)*d]); } };
  const L = lanternGroup.position;
  ring(L.x, L.z, .38, 12);
  PATIO.bigRocks.forEach(r=>ring(r.position.x, r.position.z, (r.userData.s || r.scale.x)*1.05, 7));
  ring(shishiGroup.position.x, shishiGroup.position.z, .35, 8);
  for (let i=0;i<12;i++) spots.push([-5.98 - R()*.22, -2.4 + R()*4.4]);    // along the deck edge
  const F = foliage(); const pal = ['#2f4d2a','#3a5c31','#29432a','#46683a'];
  spots.forEach(([x,z])=>{ if (inPond(x, z, 1.02)) return; leafAt(F, V3(x, PATIO.y, z), V3(0, 0, 1), .8 + R()*.5, pal[Math.floor(R()*pal.length)], 0); });
  // tufts stand up: the leafAt orientation is for flat cards, so rebuild their matrices upright
  F.m.forEach((m, i)=>{ const p = V3().setFromMatrixPosition(m); const s = V3().setFromMatrixScale(m); F.m[i] = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(V3(0,1,0), R()*6.28), s); });
  PATIO.heavy.push(foliageMesh(F, blade, toon({ side:THREE.DoubleSide })));
})();

/* =====================================================================
   KOI — six fish, each with a name, a temperament and an appetite.
   Click the water to toss food; click anywhere else out here to clap,
   and the ones who trust you come to the edge with their mouths open.
   ===================================================================== */
const KOI_DEF = [
  { name:'Kin',   kind:'ogon',   L:.66, bold:1,   appetite:14, speed:1,    trait:'greedy', leaper:true },
  { name:'Hana',  kind:'kohaku', L:.56, bold:.8,  appetite:10, speed:1.06, trait:'first in line' },
  { name:'Sumi',  kind:'showa',  L:.6,  bold:.55, appetite:7, speed:.72,  trait:'the old one', old:true },
  { name:'Mochi', kind:'sanke',  L:.5,  bold:.66, appetite:9, speed:1,    trait:'easily distracted', fickle:true },
  { name:'Ao',    kind:'asagi',  L:.5,  bold:.42, appetite:8, speed:.9,   trait:'likes the shade', shade:true },
  { name:'Yuki',  kind:'tancho', L:.42, bold:.14, appetite:6, speed:1.12, trait:'shy', shy:true },
];
/* body profile along the length (0 nose, .9 the narrow wrist before the tail) */
const KOI_PROF = (()=>{
  const c = new THREE.SplineCurve([[0,0],[.012,.4],[.045,.64],[.12,.86],[.24,1],[.38,.97],[.52,.83],[.66,.6],[.78,.36],[.86,.21],[.9,.17]].map(p=>new THREE.Vector2(p[0], p[1])));
  const T = c.getPoints(240);
  return u=>{ u = clamp(u, 0, .9); let i = 1; while (i < T.length - 1 && T[i].x < u) i++; const a = T[i-1], b = T[i]; return a.y + (b.y - a.y) * clamp((u - a.x)/Math.max(1e-6, b.x - a.x), 0, 1); };
})();
const koiHump = u=>1 + .1*Math.sin(Math.PI*clamp(u/.62, 0, 1));

function koiSkin(kind, R){
  return canvasTex(64, 32, (ctx,w,h)=>{
    const px = (x,y,c)=>{ ctx.fillStyle = c; ctx.fillRect(((Math.round(x)%w)+w)%w, ((Math.round(y)%h)+h)%h, 1, 1); };
    // blobs wrap around the body: v 8 is the spine, 24 the belly, 0/16 the flanks
    const blob = (cu, cv, ru, rv, c, rough=.45)=>{
      const ph = R()*6;
      for (let y=-rv-2;y<=rv+2;y++) for (let x=-ru-2;x<=ru+2;x++){
        const a = Math.atan2(y/rv, x/ru), edge = 1 + rough*(.5*Math.sin(a*3 + ph) + .3*Math.sin(a*5 + ph*2)) + (R()-.5)*.18;
        if ((x*x)/(ru*ru) + (y*y)/(rv*rv) < edge) px(cu + x, cv + y, c);
      }
    };
    const fill = (c)=>{ ctx.fillStyle = c; ctx.fillRect(0,0,w,h); };
    const belly = (c)=>{ for (let x=0;x<w;x++) for (let y=19;y<=29;y++) px(x, y, c); };
    const scales = (lite, dark, every=3)=>{ for (let y=0;y<h;y+=2) for (let x=(y/2)%2 ? 1 : 2;x<w;x+=every){ px(x, y, dark); px(x+1, y+1, lite); } };
    if (kind === 'kohaku' || kind === 'sanke'){
      fill('#f1ebe0'); belly('#f6f2ea');
      blob(7, 8, 5, 5, '#d23f27'); blob(22, 8, 8, 6, '#d6452b'); blob(38, 7, 6, 5, '#cf3c26'); blob(50, 9, 3, 3, '#d23f27');
      scales('rgba(255,255,255,.18)', 'rgba(120,60,40,.08)');
      if (kind === 'sanke'){ blob(27, 4, 2, 2, '#19171b', .3); blob(43, 11, 2, 2, '#19171b', .3); blob(33, 8, 1, 1, '#19171b', .2); blob(18, 12, 1, 2, '#19171b', .2); }
    } else if (kind === 'showa'){
      fill('#1b191d'); belly('#2a2629');
      blob(24, 1, 6, 3, '#eee8de'); blob(36, 15, 5, 3, '#eee8de'); blob(14, 14, 3, 2, '#eee8de');
      blob(6, 8, 4, 5, '#cf3b26'); blob(26, 8, 7, 5, '#d4402a'); blob(42, 8, 5, 4, '#cc3925');
      for (let y=3;y<=13;y++) px(9, y, '#1b191d');                                     // the black line across the head
      scales('rgba(255,255,255,.08)', 'rgba(0,0,0,.2)');
    } else if (kind === 'ogon'){
      fill('#dca63c'); belly('#ebc874');
      for (let x=0;x<w;x++) for (let y=4;y<=12;y++) if (Math.abs(y-8) < 3 + Math.sin(x*.3)) px(x, y, '#c48c27');
      for (let x=0;x<10;x++) for (let y=0;y<h;y++) if (R() < .5) px(x, y, '#efc65e');
      scales('#f7dd8c', '#b47d22');
    } else if (kind === 'asagi'){
      fill('#6f8ba4'); belly('#e9e2d6');
      for (let x=0;x<w;x++) for (let y=0;y<h;y++){ const fl = Math.min(Math.abs(y - 0), Math.abs(y - 16), Math.abs(y - 32)); if (fl < 2.5 + R()*.8 && x > 6) px(x, y, '#d96a2e'); }
      for (let x=0;x<8;x++) for (let y=0;y<h;y++) px(x, y, (y < 4 || (y > 12 && y < 20) || y > 28) ? '#de7a3a' : '#d9dfe2');
      for (let y=0;y<h;y+=3) for (let x=8 + (y/3)%2*2;x<w;x+=4){ px(x, y, '#b6c6d3'); px(x+1, y, '#b6c6d3'); px(x+2, y+1, '#4d6782'); }
    } else {                                                                          // tancho: one red sun on the head
      fill('#f4f0e8'); belly('#f8f5ef');
      for (let y=-4;y<=4;y++) for (let x=-4;x<=4;x++) if (x*x + y*y <= 14) px(7 + x, 8 + y, '#cc2f26');
      scales('rgba(255,255,255,.2)', 'rgba(110,90,80,.08)');
    }
    // a paler nose and lips
    for (let y=0;y<h;y++){ px(0, y, '#e9d8c8'); if (R() < .6) px(1, y, '#e2cdbb'); }
  });
}
function koiFinTex(kind){
  const base = { kohaku:'#f0e6da', sanke:'#efe5d8', showa:'#1e1b1f', ogon:'#e7b852', asagi:'#d9b898', tancho:'#f3ede3' }[kind];
  return canvasTex(16, 16, (ctx,w,h)=>{
    for (let x=0;x<w;x++) for (let y=0;y<h;y++){
      const t = x/(w-1);
      let c = mix(base, kind === 'showa' ? '#e8e0d4' : '#ffffff', t*t*.55);
      if (kind === 'asagi' && t < .35) c = '#d8733a';
      if (kind === 'showa' && t > .45) c = mix('#e8e0d4', '#ffffff', t*.4);
      if (kind === 'sanke' && y % 7 === 3 && t < .6) c = '#29262a';
      if (y % 2 === 0) c = shade(c, .9);
      ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1);
    }
  });
}
function koiGeometry(L){
  const W = .1*L, H = .125*L, NU = 26, NV = 14;
  // body
  const pos = [], uv = [], sv = [], idx = [];
  for (let i=0;i<=NU;i++){
    const u = i/NU*.9, s = KOI_PROF(u), x = L*(.5 - u), hu = koiHump(u);
    for (let j=0;j<=NV;j++){
      const th = j/NV*Math.PI*2, c = Math.cos(th), sn = Math.sin(th);
      pos.push(x, sn*H*s*(sn > 0 ? hu : .8), c*W*s); uv.push(u/.9, 1 - j/NV); sv.push(u);
    }
  }
  for (let i=0;i<NU;i++) for (let j=0;j<NV;j++){ const a = i*(NV+1)+j, b = a + NV + 1; idx.push(a, a+1, b, b, a+1, b+1); }
  const ci = pos.length/3; pos.push(L*(.5 - .9), 0, 0); uv.push(1, .5); sv.push(.9);
  for (let j=0;j<NV;j++){ const a = NU*(NV+1)+j; idx.push(a, a+1, ci); }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  body.setIndex(idx); body.computeVertexNormals();
  body.userData.s = new Float32Array(sv); body.userData.rest = new Float32Array(pos);
  // fins: each a flat shape in its own 2D frame (a: out from the base, b: across), mapped onto the body
  const fp = [], fu = [], fs = [];
  const fin = (pts, place)=>{
    const sh = new THREE.Shape(); pts.forEach(([a,b],i)=>i ? sh.lineTo(a, b) : sh.moveTo(a, b));
    const g = new THREE.ShapeGeometry(sh), p = g.attributes.position, ix = g.index.array;
    let amax = 0; pts.forEach(([a])=>amax = Math.max(amax, a));
    for (let k=0;k<ix.length;k++){ const a = p.getX(ix[k]), b = p.getY(ix[k]); const v = place(a, b); fp.push(v[0], v[1], v[2]); fu.push(a/amax, b/(amax*1.2) + .5); fs.push(.5 - v[0]/L); }
  };
  const top = u=>H*KOI_PROF(u)*koiHump(u)*.95, bot = u=>-H*KOI_PROF(u)*.78, side = u=>W*KOI_PROF(u);
  // tail: vertical, forked, flowing
  const xp = L*(.5 - .88);
  fin([[0,.035],[.09,.105],[.2,.16],[.26,.15],[.2,.06],[.17,.0],[.2,-.06],[.26,-.15],[.2,-.16],[.09,-.105],[0,-.035]].map(([a,b])=>[a*L, b*L]), (a,b)=>[xp - a, b, 0]);
  // dorsal: a long sail along the back
  fin([[0,0],[.025,.085],[.07,.082],[.2,.06],[.3,.036],[.33,0]].map(([a,b])=>[a*L, b*L]), (a,b)=>{ const u = .3 + a/L; return [L*(.5 - u), top(u)*.96 + b, 0]; });
  // anal
  fin([[0,0],[.02,.05],[.07,.045],[.09,0]].map(([a,b])=>[a*L, b*L]), (a,b)=>{ const u = .7 + a/L; return [L*(.5 - u), bot(u)*.95 - b, 0]; });
  // pectorals and pelvics: broad paddles that sweep back and down
  [[.2, 1, .38], [.5, .55, .5]].forEach(([u0, sc, droop])=>{
    [-1, 1].forEach(sd=>{
      const x0 = L*(.5 - u0), y0 = bot(u0)*.55, z0 = sd*side(u0)*.78;
      fin([[0,0],[.03,-.025],[.12,.0],[.175,.07],[.16,.13],[.09,.13],[.02,.06]].map(([a,b])=>[a*L*sc, b*L*sc]), (a,b)=>[x0 - b, y0 - a*Math.sin(droop), z0 + sd*a*Math.cos(droop)]);
    });
  });
  const fins = new THREE.BufferGeometry();
  fins.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fins.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2));
  fins.computeVertexNormals();
  fins.userData.s = new Float32Array(fs); fins.userData.rest = new Float32Array(fp);
  return { body, fins, W, H };
}

const koi = [];
const KOI = { trust:0, store:{ visits:0, fed:0, last:0 }, leapt:false, call:null, gapeAt:0 };
try { Object.assign(KOI.store, JSON.parse(localStorage.getItem('arahe-koi') || '{}')); } catch(e){}
function koiSave(){ try { localStorage.setItem('arahe-koi', JSON.stringify(KOI.store)); } catch(e){} }
function koiTrust(){ KOI.trust = clamp(KOI.store.visits + Math.floor(KOI.store.fed/24), 0, 6); return KOI.trust; }
/* a visit counts once every ten minutes; a long absence makes them warier */
function koiVisit(){
  const now = Date.now(), S = KOI.store;
  if (S.last && now - S.last > 14*864e5) S.visits = Math.max(0, S.visits - 2);
  if (!S.last || now - S.last > 6e5) S.visits++;
  S.last = now; koiSave(); koiTrust();
}
koiTrust();

(function buildKoi(){
  const R = mulberry(184);
  const eyeMat = toon({ color:'#0d0b0f' }), mouthMat = new THREE.MeshBasicMaterial({ color:'#2c1418' });
  KOI_DEF.forEach((def, i)=>{
    const L = def.L, G = koiGeometry(L);
    const group = new THREE.Group(); group.rotation.order = 'YZX';
    const skin = toon({ map:koiSkin(def.kind, R) });
    const finMat = toon({ map:koiFinTex(def.kind), side:THREE.DoubleSide, emissive:'#ffffff', emissiveIntensity:.08 });
    const body = new THREE.Mesh(G.body, skin), fins = new THREE.Mesh(G.fins, finMat);
    body.castShadow = fins.castShadow = true; body.receiveShadow = true;
    body.frustumCulled = fins.frustumCulled = false;
    group.add(body, fins);
    const u = .075, ex = L*(.5 - u), ey = G.H*KOI_PROF(u)*.3, ez = G.W*KOI_PROF(u)*.86;
    [-1, 1].forEach(sd=>mesh(new THREE.SphereGeometry(.018*L, 6, 4), eyeMat, { x:ex, y:ey, z:sd*ez, cast:false }, group));
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(.032*L, 8), mouthMat); mouth.position.set(L*.5 - .003, -.012*L, 0); mouth.rotation.y = Math.PI/2; group.add(mouth);
    PATIO.g.add(group); PATIO.heavy.push(group);
    const [x, z] = pondPoint(i/KOI_DEF.length*Math.PI*2 + .3, .45);
    koi.push({ def, i, group, body, fins, mouth, L, x, z, h:R()*Math.PI*2, v:.08, turn:0, depth:.12 + R()*.08, d0:.1 + R()*.1, pitch:0,
      ph:R()*6, mode:'cruise', goal:null, goalT:0, full:0, gape:0, gulp:0, startle:0, rest:0, leap:null, target:null });
  });
})();

/* ---------------- food: pellets tossed from where you stand ---------------- */
const PELLETS = [];
const pelletPts = makePoints(64, '#b9843f', .026);
const splashPts = makePoints(64, '#e2f2f6', .014);
const sparkPts = makePoints(24, '#ffe28a', .018);
const DROPS = [], SPARKS = [];
function splash(x, z, n, power=1){
  for (let k=0;k<n;k++){ const a = Math.random()*Math.PI*2, s = (.3 + Math.random()*.6)*power; DROPS.push({ x, y:PATIO.waterY + .01, z, vx:Math.cos(a)*s*.6, vy:(.6 + Math.random()*.9)*power, vz:Math.sin(a)*s*.6, t:0 }); }
  while (DROPS.length > 64) DROPS.shift();
}
function feed(x, z){
  // a pinch: six to nine pellets, scattered a little, arcing in from just below the view
  const from = camera.position.clone().add(V3(0, -.5, 0)).addScaledVector(camera.getWorldDirection(V3()), .6);
  const n = 6 + Math.floor(Math.random()*4);
  for (let k=0;k<n;k++){
    const a = Math.random()*Math.PI*2, d = Math.sqrt(Math.random())*.26;
    let tx = x + Math.cos(a)*d, tz = z + Math.sin(a)*d;
    if (!inPond(tx, tz, .94)){ tx = lerp(tx, POND.x, .25); tz = lerp(tz, POND.z, .25); }
    PELLETS.push({ s:'air', fx:from.x, fy:from.y, fz:from.z, x:tx, y:from.y, z:tz, tx, tz, t:-k*.035, dur:.5 + Math.random()*.12, age:0, vx:0, vz:0, by:null });
  }
  while (PELLETS.length > 64) PELLETS.shift();
  KOI.store.fed++; koiSave(); koiTrust();
  sfx.toss && sfx.toss();
}
/* a clap: the edge of the pond nearest you becomes a meeting point */
function clap(){
  let best = null, bd = 1e9;
  for (let k=0;k<48;k++){ const [x, z] = pondPoint(k/48*Math.PI*2, .78); const d = Math.hypot(x - camera.position.x, z - camera.position.z); if (d < bd){ bd = d; best = [x, z]; } }
  KOI.call = { x:best[0], z:best[1], t:STATE.t };
  sfx.clap && sfx.clap();
  const came = koi.filter(f=>koiAnswers(f));
  announce(came.length ? `You clap. ${came.length === 6 ? 'All six koi' : came.map(f=>f.def.name).join(', ')} come${came.length === 1 ? 's' : ''} to the edge.` : 'You clap. The koi keep their distance; they don\'t know you yet.');
}
function koiAnswers(f){
  if (f.leap) return false;
  const need = f.def.shy ? 3 : f.def.bold > .6 ? 0 : 1;
  return KOI.trust >= need && f.full < f.def.appetite;
}
function koiAt(p){
  let best = null, bd = 1e9;
  koi.forEach(f=>{ const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < f.L*.62 && d < bd){ bd = d; best = f; } });
  return best;
}
const KIND_NAME = { kohaku:'kohaku', sanke:'sanke', showa:'showa', ogon:'ogon', asagi:'asagi', tancho:'tancho' };

/* ---------------- swimming: bend the body along a travelling wave ---------------- */
function koiBend(f, t){
  const amp = clamp(.035 + f.v*.32, .03, .13), k = 5.4, w = f.ph;
  const turnK = clamp(f.turn, -2.5, 2.5) * .06;
  [f.body.geometry, f.fins.geometry].forEach(g=>{
    const P = g.attributes.position.array, S = g.userData.s, rest = g.userData.rest, L = f.L;
    for (let i=0, n=S.length; i<n; i++){
      const s = S[i], e = Math.max(0, s - .12);
      P[i*3+2] = rest[i*3+2] + L*(amp*e*e*Math.sin(w - k*s) - turnK*s*s);
      P[i*3] = rest[i*3]; P[i*3+1] = rest[i*3+1];
    }
    g.attributes.position.needsUpdate = true;
  });
}

const _kv = V3();
/* lily pads: fish at the surface go around them, fish passing under dive deep enough to clear them */
const PADS = lilies.map(l=>({ x:l.m.position.x, z:l.m.position.z, r:l.m.geometry.parameters.radius, l, nudge:0 }));
function padUnder(f){
  // distance from each pad to the fish's spine (tail to nose), less the body's half-width
  const hx = Math.cos(f.h)*f.L*.5, hz = Math.sin(f.h)*f.L*.5;
  let best = null, bd = 1e9;
  PADS.forEach(p=>{
    const ax = f.x - hx*1.2, az = f.z - hz*1.2, bx = f.x + hx*.8, bz = f.z + hz*.8;
    const vx = bx - ax, vz = bz - az, k = clamp(((p.x - ax)*vx + (p.z - az)*vz)/(vx*vx + vz*vz), 0, 1);
    const d = Math.hypot(p.x - (ax + vx*k), p.z - (az + vz*k)) - p.r - f.L*.085;
    if (d < bd){ bd = d; best = p; }
  });
  return [best, bd];
}
function koiUpdate(dt, t){
  const trust = KOI.trust, dawn = (()=>{ const h = TIME.h || 12; return h > 5 && h < 7.5; })();
  // pellets: fly, plop, float, drift, sink
  for (let i=PELLETS.length-1;i>=0;i--){
    const p = PELLETS[i]; p.t += dt;
    if (p.s === 'air'){
      if (p.t < 0) { p.y = -99; continue; }
      const k = clamp(p.t/p.dur, 0, 1);
      p.x = lerp(p.fx, p.tx, k); p.z = lerp(p.fz, p.tz, k); p.y = lerp(p.fy, PATIO.waterY, k) + Math.sin(k*Math.PI)*.45;
      if (k >= 1){ p.s = 'float'; p.age = 0; p.y = PATIO.waterY + .004; ripple(p.x, p.z, .22); if (i % 3 === 0) sfx.plop && sfx.plop();
        koi.forEach(f=>{ if (f.def.shy && Math.hypot(f.x - p.x, f.z - p.z) < .3 && trust < 4){ f.startle = 1.2; f.h = Math.atan2(f.z - p.z, f.x - p.x); } }); }
    } else {
      p.age += dt;
      p.vx = damp(p.vx, Math.sin(t*.3 + i)*.012, 1, dt); p.vz = damp(p.vz, Math.cos(t*.27 + i*1.3)*.012, 1, dt);
      p.x += p.vx*dt; p.z += p.vz*dt;
      PADS.forEach(q=>{ const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz); if (d < q.r + .06){ const k = (q.r + .06)/Math.max(d, 1e-3); p.x = q.x + dx*k; p.z = q.z + dz*k; } });
      if (!inPond(p.x, p.z, .93)){ p.x = lerp(p.x, POND.x, dt*.5); p.z = lerp(p.z, POND.z, dt*.5); }
      p.y = PATIO.waterY + .004 - Math.max(0, p.age - 22)*.01;
      if (p.age > 30) PELLETS.splice(i, 1);
    }
  }
  const floating = PELLETS.filter(p=>p.s === 'float' && p.age < 22);
  floating.forEach(p=>p.by = null);
  const callOn = KOI.call && STATE.t - KOI.call.t < 10;
  if (KOI.call && !callOn) KOI.call = null;
  let ate = false;

  // who goes for which pellet: the bold choose first
  const order = koi.slice().sort((a,b)=>b.def.bold - a.def.bold);
  order.forEach(f=>{
    f.target = null;
    if (f.leap || f.startle > 0 || f.chew > 0 || f.full >= f.def.appetite) return;
    const sense = 1.4 + trust*.35 + f.def.bold*.9;
    let best = null, bd = 1e9;
    floating.forEach(p=>{
      if (p.by && p.by !== f) return;
      const d = Math.hypot(p.x - f.x, p.z - f.z); if (d > sense) return;
      if (f.def.shy && trust < 4){ if (koi.some(o=>o !== f && Math.hypot(o.x - p.x, o.z - p.z) < .5)) return; }
      const score = d - f.def.bold*.35 + (f.def.fickle ? Math.sin(t*1.7 + p.x*9)*.3 : 0);
      if (score < bd){ bd = score; best = p; }
    });
    if (best){ best.by = f; f.target = best; }
  });

  koi.forEach((f, i)=>{
    const D = f.def;
    f.full = Math.max(0, f.full - dt/40);
    f.startle = Math.max(0, f.startle - dt); f.chew = Math.max(0, (f.chew || 0) - dt);
    f.gulp = Math.max(0, f.gulp - dt*3.2);

    // the dragon gate: Kin jumps once, when he's had his fill and trusts you (or at dawn)
    if (f.leap){
      const L = f.leap; L.t += dt/1.25;
      const k = clamp(L.t, 0, 1);
      f.x = lerp(L.x0, L.x1, k); f.z = lerp(L.z0, L.z1, k);
      const y = PATIO.waterY - .05 + Math.sin(k*Math.PI)*.62;
      f.pitch = Math.cos(k*Math.PI)*1.05; f.v = .35; f.ph += dt*16; f.turn = 0;
      f.group.position.set(f.x, y, f.z); f.group.rotation.set(0, -f.h, f.pitch);
      if (k > .08 && k < .92 && Math.random() < dt*30){ SPARKS.push({ x:f.x + (Math.random()-.5)*.2, y:y + (Math.random()-.5)*.1, z:f.z + (Math.random()-.5)*.2, t:0 }); if (SPARKS.length > 24) SPARKS.shift(); }
      if (k >= 1){ splash(f.x, f.z, 22, 1.25); ripple(f.x, f.z, 1.6); sfx.splash && sfx.splash(1); f.leap = null; f.depth = .25; f.pitch = 0; f.full = D.appetite; }
      koiBend(f, t);
      return;
    }

    // what does it want?
    let gx, gz, speed = .07*D.speed, surf = false, face = null;
    if (f.startle > 0){
      gx = f.x + Math.cos(f.h)*1; gz = f.z + Math.sin(f.h)*1; speed = .34;
    } else if (f.target){
      const p = f.target, mouthX = f.x + Math.cos(f.h)*f.L*.5, mouthZ = f.z + Math.sin(f.h)*f.L*.5;
      gx = p.x; gz = p.z;
      const d = Math.hypot(p.x - mouthX, p.z - mouthZ);
      const off = Math.abs(Math.atan2(Math.sin(Math.atan2(p.z - f.z, p.x - f.x) - f.h), Math.cos(Math.atan2(p.z - f.z, p.x - f.x) - f.h)));
      speed = (.12 + D.bold*.12 + trust*.012) * D.speed * clamp(d*2.4 + .2, .2, 1) * (d < .7 ? clamp(1.15 - off*.8, .04, 1) : 1);
      surf = d < .6;
      // suction: once the mouth is close and pointed at it, the pellet is drawn in
      if (d < .16 && off < .8 && f.depth < .08){ const k = Math.min(1, dt*3.5); p.x = lerp(p.x, mouthX, k); p.z = lerp(p.z, mouthZ, k); }
      if (d < .035 + f.L*.05 && f.depth < .06){
        PELLETS.splice(PELLETS.indexOf(p), 1); f.target = null; f.gulp = 1; f.full += 1; f.bites = (f.bites || 0) + 1; f.chew = .5 + (1 - D.bold)*.9 + Math.random()*.4; ate = true;
        ripple(mouthX, mouthZ, .3); splash(mouthX, mouthZ, 2, .35); sfx.gulp && sfx.gulp(f.L);
        if (D.leaper && !KOI.leapt && f.bites >= 6 && (trust >= 3 || dawn)){
          const x1 = f.x + Math.cos(f.h)*.95, z1 = f.z + Math.sin(f.h)*.95;
          let clear = Math.sign(f.x - POND.x) === Math.sign(x1 - POND.x) && Math.min(Math.abs(f.x - POND.x), Math.abs(x1 - POND.x)) > .5;
          for (let k=0;k<=8 && clear;k++){ const qx = lerp(f.x, x1, k/8), qz = lerp(f.z, z1, k/8); if (PADS.some(p=>Math.hypot(qx - p.x, qz - p.z) < p.r + .14)) clear = false; }
          if (inPond(x1, z1, .72) && clear){ KOI.leapt = true; f.leap = { t:0, x0:f.x, z0:f.z, x1, z1 }; splash(f.x, f.z, 16, 1); ripple(f.x, f.z, 1.3); sfx.splash && sfx.splash(.8);
            announce('Kin, the golden koi, leaps clean out of the water.'); }
        }
      }
    } else if (f.chew > 0){
      gx = f.x + Math.cos(f.h)*.3; gz = f.z + Math.sin(f.h)*.3; speed = .03; surf = f.chew > .3;
    } else if (KOI.call && koiAnswers(f)){
      // gather at the edge, a slot each, noses toward you, mouths working
      const C = KOI.call, slot = koi.filter(o=>koiAnswers(o)).indexOf(f), n = Math.max(1, koi.filter(o=>koiAnswers(o)).length);
      const toC = Math.atan2(C.z - POND.z, C.x - POND.x), spread = (slot - (n-1)/2) * .26;
      const back = .25 + (slot % 2)*.22;
      gx = C.x - Math.cos(toC)*back + Math.cos(toC + Math.PI/2)*spread; gz = C.z - Math.sin(toC)*back + Math.sin(toC + Math.PI/2)*spread;
      const d = Math.hypot(gx - f.x, gz - f.z);
      speed = (.1 + D.bold*.08 + trust*.01) * D.speed * clamp(d*1.6, .15, 1);
      if (d < .35){ surf = true; face = Math.atan2(C.z - f.z, C.x - f.x); f.gape = 1; }
    } else {
      // cruising: wander between quiet points; the old one rests under the bridge; Ao keeps to the shade of the lilies
      f.goalT -= dt;
      if (!f.goal || f.goalT < 0 || Math.hypot(f.goal[0] - f.x, f.goal[1] - f.z) < .3){
        if (D.old && Math.random() < .35){ f.goal = [POND.x + (Math.random()-.5)*.4, POND.z + (Math.random()-.5)*.6]; f.rest = 8 + Math.random()*10; }
        else if (D.shade && Math.random() < .6){ const l = lilies[Math.floor(Math.random()*lilies.length)].m.position; f.goal = [l.x, l.z]; }
        else { let q; do { q = pondPoint(Math.random()*Math.PI*2, .2 + Math.random()*.55); } while (!inPond(q[0], q[1], .8)); f.goal = q; }
        f.goalT = 9 + Math.random()*8;
      }
      gx = f.goal[0]; gz = f.goal[1];
      const atRest = D.old && f.rest > 0 && Math.hypot(gx - f.x, gz - f.z) < .4;
      if (atRest){ f.rest -= dt; speed = .012; } else speed = (.06 + .02*Math.sin(f.ph*.21 + i)) * D.speed;
      if (f.full >= D.appetite) speed *= .7;
    }

    // steering: toward the goal, away from the walls and from each other
    let want = Math.atan2(gz - f.z, gx - f.x);
    if (face !== null && Math.hypot(gx - f.x, gz - f.z) < .2) want = face;
    let ax = Math.cos(want), az = Math.sin(want);
    koi.forEach(o=>{ if (o === f) return; const dx = f.x - o.x, dz = f.z - o.z, d = Math.hypot(dx, dz), r = (f.L + o.L)*(f.target || f.chew > 0 ? .24 : .45); if (d < r && d > 1e-4){ const k = (1 - d/r)*1.4*(f.target ? .3 : 1)*clamp(o.L/f.L, .5, 1.6); ax += dx/d*k; az += dz/d*k; } });
    const shallow = surf || f.target || f.depth < f.L*.22 + .03;
    if (shallow) PADS.forEach(p=>{
      // the narrow mouth may reach the rim; the body (and a look ahead) keeps off it
      const closeFood = f.target && Math.hypot(f.target.x - f.x, f.target.z - f.z) < f.L + .3;
      [[.5, .025], [.85, closeFood ? -1 : .05], [0, f.L*.1 + .03], [-.4, f.L*.08 + .02]].forEach(([ahead, pad])=>{
        if (pad < 0) return;
        const px = f.x + Math.cos(f.h)*f.L*ahead, pz = f.z + Math.sin(f.h)*f.L*ahead;
        const dx = px - p.x, dz = pz - p.z, d = Math.hypot(dx, dz), R2 = p.r + pad;
        if (d < R2 && d > 1e-4){ const k = (1 - d/R2)*2.4; ax += dx/d*k; az += dz/d*k; }
      });
    });
    // the bridge piers go all the way down: steer around them at any depth
    (PATIO.posts || []).forEach(p=>{ [.5, .9].forEach(ahead=>{
      const px = f.x + Math.cos(f.h)*f.L*ahead, pz = f.z + Math.sin(f.h)*f.L*ahead, dx = px - p.x, dz = pz - p.z, d = Math.hypot(dx, dz), R2 = p.r + f.L*.15 + .05;
      if (d < R2 && d > 1e-4){ const k = (1 - d/R2)*2.6; ax += dx/d*k; az += dz/d*k; } }); });
    const lx = f.x + Math.cos(f.h)*.45, lz = f.z + Math.sin(f.h)*.45;
    if (!inPond(lx, lz, .84)){ const k = 1.6; ax += (POND.x - f.x)*k; az += (POND.z - f.z)*k; }
    want = Math.atan2(az, ax);
    const dh = Math.atan2(Math.sin(want - f.h), Math.cos(want - f.h));
    const maxTurn = 1.1 + speed*6 + (f.target ? 1.2 : 0);
    const turn = clamp(dh*2.2, -maxTurn, maxTurn);
    f.turn = damp(f.turn, turn, 6, dt);
    f.h += f.turn*dt;
    f.v = damp(f.v, speed, 2.2, dt);
    f.x += Math.cos(f.h)*f.v*dt; f.z += Math.sin(f.h)*f.v*dt;
    if (!inPond(f.x, f.z, .9)){ f.x = lerp(f.x, POND.x, .03); f.z = lerp(f.z, POND.z, .03); }

    // depth and posture: rise to eat or to beg, cruise lower, rest on the bottom
    const wantDepth = surf ? .012 : (D.old && f.rest > 0 ? .3 : f.d0 + .04*Math.sin(f.ph*.13 + i*2));
    const [pad, gap] = padUnder(f), clearDepth = f.L*.24 + .025;
    let wd = wantDepth;
    const diving = !surf && gap < .12;               // cruising toward a pad: go under it
    const underPad = gap < .02 && f.depth >= clearDepth - .006;   // already beneath one: swim out before rising
    if (diving || underPad) wd = Math.max(wd, clearDepth);
    f.depth = damp(f.depth, wd, diving ? 6 : (surf ? 2.4 : .8), dt);
    if (underPad){ f.depth = Math.max(f.depth, clearDepth); if (gap < 0) pad.nudge = Math.min(1, pad.nudge + dt*2); }
    // one solver for everything solid: piers at every depth, pads only for a fish too shallow to pass under them
    { const c = Math.cos(f.h), sn = Math.sin(f.h), shallowNow = !underPad && f.depth < clearDepth - .004;
      const push = (p, w)=>{ for (let a = .45; a >= -.61; a -= .07){ const px = f.x + c*f.L*a, pz = f.z + sn*f.L*a, dx = px - p.x, dz = pz - p.z, d = Math.hypot(dx, dz), R2 = p.r + f.L*w;
        if (d < R2){ const k = (R2 - d)/Math.max(d, 1e-4); f.x += dx*k; f.z += dz*k; } } };
      for (let it=0;it<4;it++){ (PATIO.posts || []).forEach(p=>push(p, .095)); if (shallowNow) PADS.forEach(p=>push(p, .092)); }
      // squeezed between a pad and something else and still touching it: duck under rather than clip it
      if (shallowNow && padUnder(f)[1] < -.004) f.depth = clearDepth;
    }
    if (!(KOI.call && koiAnswers(f))) f.gape = Math.max(0, f.gape - dt*.8);
    const begging = surf && (f.gape > .2 || f.target);
    f.pitch = damp(f.pitch, begging ? .32 : (f.depth - wantDepth)*-1.2, 3, dt);
    f.ph += dt*(3 + f.v*34);
    f.group.position.set(f.x, PATIO.waterY - f.depth - f.L*.02 + (begging ? .012 : 0), f.z);
    f.group.rotation.set(0, -f.h, f.pitch);
    // mouth: paku-paku when begging, a snap when gulping
    const pk = begging ? .5 + .5*Math.sin(t*9 + i*1.7) : 0;
    const open = Math.max(pk, f.gulp);
    f.mouth.scale.setScalar(.18 + open*.85);
    if (begging && Math.random() < dt*1.2) ripple(f.x + Math.cos(f.h)*f.L*.5, f.z + Math.sin(f.h)*f.L*.5, .18);
    koiBend(f, t);
  });
  if (ate) KOI.lastAte = STATE.t;

  // render pellets, droplets and the golden sparks
  const pp = pelletPts.geometry.attributes.position, pa = pelletPts.geometry.attributes.alpha;
  for (let i=0;i<64;i++){ const p = PELLETS[i]; if (p && p.y > -50){ pp.setXYZ(i, p.x, p.y, p.z); pa.setX(i, p.s === 'float' ? clamp(1 - (p.age - 22)/8, 0, 1) : 1); } else pa.setX(i, 0); }
  pp.needsUpdate = pa.needsUpdate = true;
  const dp = splashPts.geometry.attributes.position, da = splashPts.geometry.attributes.alpha;
  for (let i=DROPS.length-1;i>=0;i--){ const d = DROPS[i]; d.t += dt; d.vy -= 3.2*dt; d.x += d.vx*dt; d.y += d.vy*dt; d.z += d.vz*dt; if (d.y < PATIO.waterY){ if (Math.random() < .3) ripple(d.x, d.z, .12); DROPS.splice(i, 1); } }
  for (let i=0;i<64;i++){ const d = DROPS[i]; if (d){ dp.setXYZ(i, d.x, d.y, d.z); da.setX(i, .9); } else da.setX(i, 0); }
  dp.needsUpdate = da.needsUpdate = true;
  const sp = sparkPts.geometry.attributes.position, sa = sparkPts.geometry.attributes.alpha;
  for (let i=SPARKS.length-1;i>=0;i--){ const s = SPARKS[i]; s.t += dt; s.y += dt*.12; if (s.t > .9) SPARKS.splice(i, 1); }
  for (let i=0;i<24;i++){ const s = SPARKS[i]; if (s){ sp.setXYZ(i, s.x, s.y, s.z); sa.setX(i, (1 - s.t/.9) * (Math.sin(s.t*40 + i) > 0 ? 1 : .4)); } else sa.setX(i, 0); }
  sp.needsUpdate = sa.needsUpdate = true;
}

/* ---------------- falling leaves ---------------- */
const _lm = new THREE.Matrix4(), _lq = new THREE.Quaternion(), _le = new THREE.Euler();
function leavesUpdate(dt, t){
  FALL.p.forEach((p, i)=>{
    p.t += dt;
    if (p.s === 'fall'){
      p.ph += dt*(2.2 + (i % 3)*.4);
      p.y -= dt*(.32 + .12*Math.sin(p.ph*.7));
      p.x += (p.vx + Math.sin(p.ph)*.35)*dt; p.z += (p.vz + Math.cos(p.ph*.8)*.25)*dt;
      p.rx += dt*2.6; p.ry += dt*1.3;
      const onWater = inPond(p.x, p.z, .98);
      const floor = onWater ? PATIO.waterY + .004 : PATIO.y + .012;
      if (p.y <= floor){ p.y = floor; p.s = onWater ? 'water' : 'ground'; p.life = 0; if (onWater) ripple(p.x, p.z, .25); }
      _le.set(Math.sin(p.rx)*1.1, p.ry, Math.cos(p.rx*.7)*.9);
    } else if (p.s === 'water'){
      p.life += dt;
      p.x += Math.sin(t*.21 + i)*.02*dt; p.z += Math.cos(t*.17 + i*2)*.02*dt;
      koi.forEach(f=>{ const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < .3 && f.depth < .1){ p.x += (p.x - f.x)/d*dt*.06; p.z += (p.z - f.z)/d*dt*.06; } });
      if (!inPond(p.x, p.z, .95)){ p.x = lerp(p.x, POND.x, dt*.2); p.z = lerp(p.z, POND.z, dt*.2); }
      p.y = PATIO.waterY + .004 + Math.sin(t*1.1 + i)*.0015;
      _le.set(-Math.PI/2 + Math.sin(t*.9 + i)*.05, 0, p.ry);
      if (p.life > 70) resetLeaf(p, false);
    } else {
      p.life += dt;
      _le.set(-Math.PI/2, 0, p.ry);
      if (p.life > 26) resetLeaf(p, false);
    }
    _lq.setFromEuler(_le);
    const s = p.s === 'ground' ? p.size*clamp((26 - p.life)/4, 0, 1) : p.size;
    _lm.compose(V3(p.x, p.y, p.z), _lq, V3(s, s, s));
    FALL.im.setMatrixAt(i, _lm);
  });
  FALL.im.instanceMatrix.needsUpdate = true;
  // the canopy breathes a little
  MAPLE.canopy.rotation.y = Math.sin(t*.35)*.004;
  MAPLE.canopy.position.x = Math.sin(t*.5)*.006;
}
