/* =====================================================================
   THE PATIO — through the sliding door: a deck, raked gravel, a koi
   pond with a little arched bridge, a shishi-odoshi, a stone lantern,
   a maple, and bamboo behind a low fence.
   ===================================================================== */
const PATIO = { g:new THREE.Group(), y:-.22, waterY:-.29 };
scene.add(PATIO.g);
const POND = { x:-9.2, z:-1.45, rx:2.75, rz:1.62 };

/* pond outline: an ellipse pinched at the middle, where the bridge crosses */
function pondPoint(a, k=1){
  const c = Math.cos(a), sn = Math.sin(a);
  const pinch = 1 - .34*Math.exp(-(c*c)/.07);
  const wob = 1 + .045*Math.sin(a*3 + .7) + .03*Math.sin(a*5 + 2.1);
  return [POND.x + c*POND.rx*wob*k, POND.z + sn*POND.rz*pinch*wob*k];
}
function inPond(x, z, k=1){
  const a = Math.atan2((z - POND.z)/POND.rz, (x - POND.x)/POND.rx);
  const [ex, ez] = pondPoint(a, k);
  return Math.hypot(x - POND.x, z - POND.z) < Math.hypot(ex - POND.x, ez - POND.z);
}
const PN = 72;

/* ---------------- textures ---------------- */
const texGravel = canvasTex(128, 128, (ctx,w,h)=>{
  const R = mulberry(71);
  ctx.fillStyle = '#9d978a'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<1600;i++){ ctx.fillStyle = R()<.5 ? '#8c8578' : '#aea89b'; ctx.fillRect(Math.floor(R()*w), Math.floor(R()*h), 1, 1); }
  for (let y=0;y<h;y+=6){ for (let x=0;x<w;x++){ const yy = y + Math.round(Math.sin(x*.05)*1); ctx.fillStyle = '#7d766a'; ctx.fillRect(x, yy, 1, 1); ctx.fillStyle = '#b8b2a5'; ctx.fillRect(x, yy+1, 1, 1); } }
}, { mip:true, repeat:[8,8] });
const texDeck = canvasTex(128, 128, (ctx,w,h)=>{
  const R = mulberry(72);
  for (let i=0;i<8;i++){
    const base = mix('#8c7460', R()<.5 ? '#6f5a49' : '#9c8470', R()*.6);
    ctx.fillStyle = base; ctx.fillRect(0, i*16, w, 16);
    for (let k=0;k<14;k++){ ctx.fillStyle = shade(base, R()<.6 ? .85 : 1.1); ctx.fillRect(Math.floor(R()*w), i*16 + 1 + Math.floor(R()*14), 10 + Math.floor(R()*40), 1); }
    ctx.fillStyle = shade(base, .5); ctx.fillRect(0, i*16+15, w, 1);
    const j = Math.floor(R()*w); ctx.fillRect(j, i*16, 1, 15);
    ctx.fillStyle = '#4b4f55'; ctx.fillRect((j+20)%w, i*16+4, 1, 1); ctx.fillRect((j+20)%w, i*16+11, 1, 1);
  }
}, { mip:true });
const texSiding = canvasTex(64, 128, (ctx,w,h)=>{
  const R = mulberry(73);
  for (let x=0;x<w;x+=8){ const c = mix('#2d2724', '#3d3430', R()); ctx.fillStyle = c; ctx.fillRect(x,0,8,h); for (let k=0;k<20;k++){ ctx.fillStyle = shade(c, R()<.5 ? .8 : 1.25); ctx.fillRect(x+1+Math.floor(R()*6), Math.floor(R()*h), 1, 4+Math.floor(R()*14)); } ctx.fillStyle = '#1a1614'; ctx.fillRect(x+7,0,1,h); }
}, { mip:true });
const texStone = canvasTex(32, 32, (ctx,w,h)=>{
  const R = mulberry(74);
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0,0,w,h);
  for (let i=0;i<260;i++){ const v = 180 + Math.floor(R()*70); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(Math.floor(R()*w), Math.floor(R()*h), 1+Math.floor(R()*2), 1); }
}, { mip:true });
const texMoss = canvasTex(32, 32, (ctx,w,h)=>{
  const R = mulberry(75);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const d = Math.hypot(x-w/2+.5, y-h/2+.5)/(w/2) + (R()-.5)*.35;
    if (d < .95){ ctx.fillStyle = R()<.5 ? '#5f7f3a' : (R()<.5 ? '#4f6e31' : '#76944a'); ctx.fillRect(x,y,1,1); }
  }
}, {});
const texBambooFence = canvasTex(8, 32, (ctx,w,h)=>{
  ctx.fillStyle = '#b9a36a'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#d1bd85'; ctx.fillRect(1,0,2,h);
  ctx.fillStyle = '#8f7c4c'; ctx.fillRect(0,9,w,1); ctx.fillRect(0,23,w,1); ctx.fillStyle = '#7d6b40'; ctx.fillRect(w-1,0,1,h);
}, {});
const texBamboo = canvasTex(8, 64, (ctx,w,h)=>{
  ctx.fillStyle = '#7f9b47'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#9ab55e'; ctx.fillRect(2,0,2,h); ctx.fillStyle = '#617a33'; ctx.fillRect(w-2,0,2,h);
  for (let y=6;y<h;y+=14){ ctx.fillStyle = '#c9cf8a'; ctx.fillRect(0,y,w,1); ctx.fillStyle = '#4f6528'; ctx.fillRect(0,y+1,w,1); }
}, {});

const PM = {
  gravel: toon({ map:texGravel }), deck: toon({ map:texDeck }), deckSide: toon({ color:'#5b4a3c' }),
  siding: toon({ map:texSiding }), stone: toon({ color:'#8f8c84', map:texStone }), stoneDark: toon({ color:'#6f6d68', map:texStone }),
  moss: toon({ map:texMoss, alphaTest:.5 }), bamboo: toon({ map:texBamboo }), fence: toon({ map:texBambooFence }),
  rope: toon({ color:'#3b2a1e' }), bambooNode: toon({ color:'#b7bf73' }), bambooIn: toon({ color:'#c9c59a', side:THREE.DoubleSide }), vermilion: toon({ color:'#c4452c' }), bridgeWood: toon({ color:'#8a6a4b' }),
  leaf: toon({ side:THREE.DoubleSide }), mud: toon({ color:'#1d2a22' }),
};
PM.gravel.map.repeat.set(5, 5);
PM.siding.map.wrapS = PM.siding.map.wrapT = THREE.RepeatWrapping; PM.siding.map.repeat.set(5, 1.6);

/* ---------------- the house from outside ---------------- */
(function buildExterior(){
  const W = ROOM.win, xo = ROOM.xl - .205;
  const plane = (w, h, x, y, z, ry, mat)=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; PATIO.g.add(m); return m; };
  const H = 3.4, top = H + PATIO.y;
  plane(W.z0 - (-3.4), H, xo, PATIO.y + H/2, (W.z0 - 3.4)/2, -Math.PI/2, PM.siding);
  plane(7.5 - W.z1, H, xo, PATIO.y + H/2, (W.z1 + 7.5)/2, -Math.PI/2, PM.siding);
  plane(W.z1 - W.z0, H - (W.y1 - PATIO.y), xo, (W.y1 + top)/2, (W.z0 + W.z1)/2, -Math.PI/2, PM.siding);
  plane(6.6, H, 0, PATIO.y + H/2, ROOM.back - .205, Math.PI, PM.siding);
  // eave
  mesh(Box(1.5, .14, 11.4), toon({ color:'#2a2522' }), { x:ROOM.xl - .55, y:top + .07, z:2.0 }, PATIO.g);
  mesh(Box(.06, .2, 11.4), toon({ color:'#3a332f' }), { x:ROOM.xl - 1.28, y:top - .03, z:2.0 }, PATIO.g);
  // outside of the door frame
  mesh(Box(.05, W.y1 - PATIO.y + .1, .08), toon({ color:'#2f2b28' }), { x:xo - .02, y:(W.y1 + PATIO.y)/2, z:W.z0 - .04 }, PATIO.g);
  mesh(Box(.05, W.y1 - PATIO.y + .1, .08), toon({ color:'#2f2b28' }), { x:xo - .02, y:(W.y1 + PATIO.y)/2, z:W.z1 + .04 }, PATIO.g);
  mesh(Box(.05, .08, W.z1 - W.z0 + .16), toon({ color:'#2f2b28' }), { x:xo - .02, y:W.y1 + .04, z:(W.z0 + W.z1)/2 }, PATIO.g);
  // warm light spilling out of the room at night
  PATIO.spill = new THREE.PointLight('#ffbd78', 0, 7, 1.8); PATIO.spill.position.set(ROOM.xl - .6, 1.3, DOOR.gap.z); scene.add(PATIO.spill);
})();

/* ---------------- deck + steps ---------------- */
(function buildDeck(){
  const x0 = ROOM.xl - .2, x1 = -5.6, z0 = -3.6, z1 = 1.4, top = -.02;
  const d = mesh(Box(x0 - x1, .12, z1 - z0), [PM.deckSide, PM.deckSide, PM.deck, PM.deckSide, PM.deckSide, PM.deckSide], { x:(x0+x1)/2, y:top - .06, z:(z0+z1)/2 }, PATIO.g);
  texDeck.wrapS = texDeck.wrapT = THREE.RepeatWrapping; texDeck.repeat.set(1.6, 3.5);
  mesh(Box(.36, .1, 2.0), PM.deck, { x:x1 - .18, y:PATIO.y + .05, z:-.6 }, PATIO.g);
  for (let z=z0+.2; z<z1; z+=1.1) mesh(Box(.1, .22, .1), PM.deckSide, { x:x1 + .05, y:PATIO.y + .1, z }, PATIO.g);
  PATIO.deckTop = top;
})();

/* ---------------- ground with a pond-shaped hole, basin, bottom ---------------- */
(function buildGround(){
  const shape = new THREE.Shape(); shape.moveTo(-3.2, 9); shape.lineTo(-18, 9); shape.lineTo(-18, -10); shape.lineTo(-3.2, -10); shape.lineTo(-3.2, 9);
  const hole = new THREE.Path();
  for (let i=0;i<=PN;i++){ const [x,z] = pondPoint(-i/PN*Math.PI*2); i ? hole.lineTo(x, -z) : hole.moveTo(x, -z); }
  shape.holes.push(hole);
  const g = new THREE.ShapeGeometry(shape, 1);
  g.rotateX(-Math.PI/2);
  const uv = g.attributes.uv, p = g.attributes.position;
  for (let i=0;i<p.count;i++) uv.setXY(i, p.getX(i)/3, p.getZ(i)/3);
  const ground = new THREE.Mesh(g, PM.gravel); ground.position.y = PATIO.y; ground.receiveShadow = true; PATIO.g.add(ground);
  PM.gravel.map.repeat.set(1, 1);
  // basin wall + bottom
  const pos = [], idx = [];
  for (let i=0;i<PN;i++){ const a = i/PN*Math.PI*2; const [x0,z0] = pondPoint(a), [x1,z1] = pondPoint(a, .92); pos.push(x0, PATIO.y, z0, x1, -.62, z1); }
  for (let i=0;i<PN;i++){ const a = i*2, b = ((i+1)%PN)*2; idx.push(a, a+1, b, b, a+1, b+1); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setIndex(idx); wg.computeVertexNormals();
  const wall = new THREE.Mesh(wg, toon({ color:'#2a2f26', side:THREE.DoubleSide })); PATIO.g.add(wall);
  const bs = new THREE.Shape(); for (let i=0;i<=PN;i++){ const [x,z] = pondPoint(i/PN*Math.PI*2, .93); i ? bs.lineTo(x, -z) : bs.moveTo(x, -z); }
  const bg = new THREE.ShapeGeometry(bs); bg.rotateX(-Math.PI/2);
  const bottom = new THREE.Mesh(bg, PM.mud); bottom.position.y = -.6; PATIO.g.add(bottom);
  // pebbles on the bottom
  const R = mulberry(81);
  for (let i=0;i<40;i++){ const a = R()*Math.PI*2, k = Math.sqrt(R())*.85; const [x,z] = pondPoint(a, k);
    const pb = placeRock(R, PATIO.g, x, -.585, z, .04 + R()*.06, { sy:.45, detail:1, color:mix('#3c4a3a', '#5c6650', R()), base:-.2 }); pb.castShadow = false; }
})();

/* ---------------- water ---------------- */
const RIPPLES = Array.from({length:10}, ()=>new THREE.Vector4(0, 0, -99, 0));
let rippleAt = 0;
function ripple(x, z, amp=1){ RIPPLES[rippleAt].set(x, z, STATE.t, amp); rippleAt = (rippleAt + 1) % RIPPLES.length; }
const waterMat = new THREE.ShaderMaterial({
  transparent:true, side:THREE.DoubleSide,
  uniforms:{ time:{ value:0 }, rip:{ value:RIPPLES }, deep:{ value:new THREE.Color('#16392f') }, shallow:{ value:new THREE.Color('#3f6a4f') }, sky:{ value:new THREE.Color('#9fc6e0') }, night:{ value:0 }, glow:{ value:new THREE.Color('#000000') } },
  vertexShader:`attribute float edge; varying float vEdge; varying vec3 vW;
    void main(){ vEdge = edge; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform float time, night; uniform vec3 deep, shallow, sky, glow; uniform vec4 rip[10];
    varying float vEdge; varying vec3 vW;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec3 col = mix(shallow, deep, smoothstep(0.0, .8, vEdge));
      float r = 0.0;
      for (int i=0;i<10;i++){
        vec4 R = rip[i]; float age = time - R.z;
        if (age < 0.0 || age > 3.2) continue;
        float d = distance(vW.xz, R.xy), front = age*.5;
        r += sin((d - front)*30.0) * exp(-abs(d - front)*7.0) * (1.0 - age/3.2) * R.w;
      }
      float s = n(vW.xz*2.5 + vec2(time*.12, time*.07))*.6 + n(vW.xz*6.0 - time*.18)*.4;
      col = mix(col, sky, .14 + .16*s*(1.0 - vEdge*.5));
      col += vec3(.85,.92,1.0) * step(.35, r) * .22;
      col -= vec3(.06) * step(.35, -r);
      col += step(.988, n(vW.xz*36.0 + time*.5)) * (1.0 - night) * .5;
      col += glow * (1.0 - smoothstep(0.0, 1.6, distance(vW.xz, vec2(${(-7.2).toFixed(1)}, ${(-3.6).toFixed(1)})))) * .5;
      gl_FragColor = vec4(col, mix(.5, .82, vEdge));
    }`,
});
const pondWater = (()=>{
  const rings = 6, pos = [POND.x, PATIO.waterY, POND.z], edge = [1], idx = [];
  for (let r=1;r<=rings;r++) for (let i=0;i<PN;i++){ const [x,z] = pondPoint(i/PN*Math.PI*2, r/rings); pos.push(x, PATIO.waterY, z); edge.push(1 - r/rings); }
  for (let i=0;i<PN;i++) idx.push(0, 1 + (i+1)%PN, 1 + i);
  for (let r=1;r<rings;r++) for (let i=0;i<PN;i++){ const a = 1 + (r-1)*PN + i, b = 1 + (r-1)*PN + (i+1)%PN, c = 1 + r*PN + i, d = 1 + r*PN + (i+1)%PN; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('edge', new THREE.Float32BufferAttribute(edge, 1)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, waterMat); m.renderOrder = 2; PATIO.g.add(m);
  return m;
})();

/* ---------------- rocks around the edge, a few big ones ---------------- */
(function buildRocks(){
  const R = mulberry(82);
  const greys = ['#8a877e','#7a7870','#918c80','#6f6e6a','#83817b','#7b756a','#8d8676'];
  const pick = ()=>greys[Math.floor(R()*greys.length)];
  // the edge: walk round the pond setting stones of mixed sizes shoulder to shoulder, a big one now and then
  const dP = a=>{ const [x0, z0] = pondPoint(a - .01), [x1, z1] = pondPoint(a + .01); return Math.hypot(x1 - x0, z1 - z0)/.02; };
  let a = 0, prev = .14;
  while (true){
    const t = R(), s2 = t < .16 ? .26 + R()*.12 : t < .6 ? .15 + R()*.08 : .08 + R()*.05;
    a += (prev*.78 + s2*.78)/dP(a);
    if (a >= Math.PI*2 - .03) break;
    if (Math.abs(Math.cos(a)) < .16){ prev = .04; continue; }            // the bridge abutments stand here
    const [x, z] = pondPoint(a, 1 + s2*.2 + (R() - .5)*.03);
    const tall = R() < .22, sy = tall ? .95 + R()*.35 : .55 + R()*.35;
    placeRock(R, PATIO.g, x, PATIO.y - s2*.18 - .02 + (tall ? s2*.15 : 0), z, s2, { sx:.85 + R()*.4, sy, sz:.75 + R()*.35, color:pick(), detail:s2 > .2 ? 3 : 2,
      moss:R() < .3 ? (R() < .7 ? 'light' : true) : false, wetY:PATIO.waterY + .035, strata:R() < .2 ? 2.5 : 0, base:-.55 });
    prev = s2;
  }
  // feature stones on the gravel, half buried, mossed on top
  PATIO.bigRocks = [[-11.9, -.1, .62, .7], [-6.9, -3.35, .44, .62], [-12.4, -3.0, .4, .85], [-7.0, .8, .32, .6], [-10.6, 1.25, .36, .55]]
    .map(([x, z, s2, sy], i)=>placeRock(R, PATIO.g, x, PATIO.y + s2*.12, z, s2, { sy, sx:1 + R()*.2, sz:.8 + R()*.3, color:pick(), detail:4, moss:i !== 2, strata:i === 2 ? 3 : 0, base:-.28, cuts:5 + Math.floor(R()*3) }));
  // stepping stones from the deck to the bridge: flat-topped, set low
  [[-6.15,-.75],[-6.8,-.42],[-7.45,-.2],[-8.1,-.02],[-8.75,.12]].forEach(([x, z], i)=>{
    placeRock(R, PATIO.g, x, PATIO.y - .015, z, .26 + (i % 2)*.04, { sy:.5, sx:1.05, sz:.85, flatTop:.42, cuts:3, rough:.1, base:-.3, detail:2, color:'#8b8880', moss:'light' });
  });
  // moss under the maple
  for (let i=0;i<7;i++) mesh(new THREE.PlaneGeometry(.8 + R()*.7, .7 + R()*.5), PM.moss, { x:-12 + (R()-.5)*2.4, y:PATIO.y + .005, z:-3.8 + (R()-.5)*1.8, rx:-Math.PI/2, rz:R()*6, cast:false }, PATIO.g);
})();

/* ---------------- lily pads + lotus ---------------- */
const lilies = [];
(function buildLilies(){
  const R = mulberry(83);
  const spots = [[-10.6,-1.95],[-11.15,-1.3],[-7.6,-2.05],[-7.15,-1.4],[-11.0,-.6],[-8.0,-.55],[-10.05,-2.45]];
  spots.forEach(([x,z],i)=>{
    const r = .14 + R()*.08;
    const g = new THREE.CircleGeometry(r, 14, .35, Math.PI*2 - .7);
    const m = mesh(g, toon({ color:mix('#4f7d3a', '#6b9446', R()), side:THREE.DoubleSide }), { x, y:PATIO.waterY + .006, z, rx:-Math.PI/2, rz:R()*6, cast:false }, PATIO.g);
    lilies.push({ m, ph:R()*6 });
    if (i === 1 || i === 3){
      const fl = new THREE.Group(); fl.position.set(x + .03, PATIO.waterY + .02, z + .02); PATIO.g.add(fl);
      for (let k=0;k<8;k++){ const pet = mesh(new THREE.SphereGeometry(.035, 6, 4), toon({ color:k%2 ? '#f2b6c6' : '#f7d2dc' }), { y:.03 }, fl); pet.scale.set(.6, .3, 1.4); pet.position.set(Math.cos(k/8*Math.PI*2)*.04, .025, Math.sin(k/8*Math.PI*2)*.04); pet.rotation.y = -k/8*Math.PI*2; pet.rotation.z = .5; }
      mesh(new THREE.SphereGeometry(.022, 6, 4), toon({ color:'#f3d36b' }), { y:.04 }, fl);
    }
  });
})();

/* ---------------- the bridge ---------------- */
(function buildBridge(){
  // a taikobashi: planked deck on two stringers, three rails, posts capped in bronze, piers into the water
  const [, zA] = pondPoint(Math.PI/2, 1.25), [, zB] = pondPoint(-Math.PI/2, 1.25);
  const x = POND.x, rise = .42, w = .78;
  const arcY = u=>PATIO.y + .05 + rise*Math.sin(Math.PI*u);
  const at = (u, dx=0, dy=0)=>V3(x + dx, arcY(u) + dy, zB + (zA - zB)*u);
  const path = (dx, dy, n=28, u0=0, u1=1)=>Array.from({length:n+1}, (_, i)=>at(lerp(u0, u1, i/n), dx, dy));
  const verm = toon({ color:'#c23f27' }), vermDark = toon({ color:'#8e2c1f' }), bronze = toon({ color:'#b08a3e', emissive:'#3a2a10', emissiveIntensity:.25 });
  const add = (g, m, cast=true)=>{ const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; PATIO.g.add(o); return o; };
  // deck: planks across, each its own shade of weathered cedar, with a hairline gap
  const texPlank = canvasTex(32, 8, (ctx,w2,h)=>{ const R = mulberry(311); ctx.fillStyle = '#9a7752'; ctx.fillRect(0,0,w2,h);
    for (let k=0;k<14;k++){ ctx.fillStyle = R() < .5 ? '#917049' : '#a5835c'; ctx.fillRect(Math.floor(R()*w2), 1 + Math.floor(R()*(h-2)), 6 + Math.floor(R()*14), 1); }
    ctx.fillStyle = '#5e4630'; ctx.fillRect(0, h-1, w2, 1); ctx.fillRect(Math.floor(R()*w2), 3, 1, 1); }, {});
  const NP = 24, span = Math.abs(zA - zB);
  let arcLen = 0; { let p = at(0); for (let i=1;i<=200;i++){ const q = at(i/200); arcLen += q.distanceTo(p); p = q; } }
  const plankG = slab(w - .02, .032, arcLen/NP*.9, .004, .004);
  const planks = new THREE.InstancedMesh(plankG, toon({ map:texPlank }), NP);
  const R = mulberry(312), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), tmpC = new THREE.Color();
  for (let i=0;i<NP;i++){
    const u = (i + .5)/NP, p = at(u), t = V3().subVectors(at(u + .002), at(u - .002)).normalize(); if (t.z < 0) t.negate();
    q.setFromUnitVectors(V3(0, 0, 1), t);
    m4.compose(p.clone().add(V3((R() - .5)*.006, -.016, 0)), q, V3(1, 1, 1)); planks.setMatrixAt(i, m4);
    planks.setColorAt(i, tmpC.set(mix('#d9cdb9', '#eee4d4', R())));
  }
  planks.castShadow = planks.receiveShadow = true; PATIO.g.add(planks);
  // stringers (keta) under each edge, and a fascia board that shows the curve
  [-1, 1].forEach(sd=>{
    add(beamGeo(path(sd*(w/2 - .05), -.075), .075, .1), verm);
    add(beamGeo(path(sd*(w/2 - .005), -.035), .022, .07), vermDark);
  });
  // cross-ties under the deck
  for (let k=1;k<8;k++){ const u = k/8, p = at(u, 0, -.11); add(beamGeo([p.clone().add(V3(-w/2 + .03, 0, 0)), p.clone().add(V3(w/2 - .03, 0, 0))], .05, .045), vermDark); }
  // posts and rails
  const NPOST = 7, posts = [];
  [-1, 1].forEach(sd=>{
    const px = sd*(w/2 - .025);
    for (let k=0;k<NPOST;k++){
      const u = k/(NPOST - 1), end = k === 0 || k === NPOST - 1, base = at(u, px, -.02);
      const sz = end ? .085 : .055, hgt = end ? .66 : .58;
      const g = slab(sz, hgt, sz, .006, .006); g.translate(base.x, base.y, base.z); add(g, verm);
      // a small dark collar where the post meets the rails, and a bronze cap on every post
      const cap = new THREE.LatheGeometry(end
        ? [[.05,0],[.053,.012],[.046,.024],[.05,.036],[.066,.075],[.06,.11],[.04,.14],[.016,.165],[.004,.19],[0,.2]].map(([r,y])=>new THREE.Vector2(r, y))
        : [[.035,0],[.036,.012],[.03,.02],[.022,.032],[0,.04]].map(([r,y])=>new THREE.Vector2(r, y)), 12);
      cap.translate(base.x, base.y + hgt, base.z); add(cap, bronze);
      if (end){ const band = new THREE.CylinderGeometry(.05, .05, .03, 12); band.translate(base.x, base.y + hgt - .015, base.z); add(band, bronze); }
      posts.push({ x:base.x, z:base.z, u });
    }
    // kasagi (top rail), hiragi (middle), jifuku (bottom) — each following the arch
    const inset = path(px, 0, 28, .01, .99);
    add(beamGeo(inset.map(p=>p.clone().add(V3(0, .56, 0))), .062, .042), verm);
    add(beamGeo(inset.map(p=>p.clone().add(V3(0, .33, 0))), .04, .036), verm);
    add(beamGeo(inset.map(p=>p.clone().add(V3(0, .085, 0))), .046, .04), verm);
    // bronze sleeves where the top rail passes each post
    for (let k=1;k<NPOST - 1;k++){ const u = k/(NPOST - 1), p = at(u, px, .56); const sl = new THREE.CylinderGeometry(.037, .037, .05, 10); sl.rotateX(Math.PI/2); const t = V3().subVectors(at(u + .002), at(u - .002)); sl.rotateX(-Math.atan2(t.y, Math.abs(t.z))*Math.sign(zA - zB)); sl.translate(p.x, p.y, p.z); add(sl, bronze, false); }
  });
  // piers: two pairs down into the pond, with a tie beam above the water and a dark wet foot below it
  PATIO.posts = [];
  [.26, .74].forEach(u=>{
    const top = arcY(u) - .12;
    [-1, 1].forEach(sd=>{
      const px = x + sd*(w/2 - .1), pz = zB + (zA - zB)*u;
      const above = slab(.075, top - (PATIO.waterY + .01), .075, .006, .004); above.translate(px, PATIO.waterY + .01, pz); add(above, verm);
      const below = slab(.08, PATIO.waterY + .01 + .6, .08, .006, .004); below.translate(px, -.6, pz); add(below, toon({ color:'#3b2a22' }), false);
      PATIO.posts.push({ x:px, z:pz, r:.06 });
    });
    const p = at(u, 0, -.2); add(beamGeo([p.clone().add(V3(-w/2 + .05, 0, 0)), p.clone().add(V3(w/2 - .05, 0, 0))], .06, .07), verm);
    const lo = V3(x, PATIO.waterY + .1, zB + (zA - zB)*u); add(beamGeo([lo.clone().add(V3(-w/2 + .07, 0, 0)), lo.clone().add(V3(w/2 - .07, 0, 0))], .05, .055), verm);
  });
  // abutments: cut granite blocks the deck lands on, set into the banks
  const stoneM = toon({ map:texGranite, vertexColors:true });
  [0, 1].forEach(e=>{
    const zE = e ? zA : zB, dir = e ? 1 : -1;
    for (let k=0;k<3;k++){
      const bw = w + .18 - k*.05, bh = .09, bd = .34 - k*.05;
      const g = slab(bw, bh, bd, .02, .012); weatherGeo(g, { color:'#e6e1d6', y0:-.1, y1:.1, moss:.15, mossScale:9, seed:400 + e*10 + k });
      g.translate(x + (R() - .5)*.02, PATIO.y - .07 + k*bh*.95, zE + dir*(.06 + k*.02) - dir*k*.02);
      add(g, stoneM);
    }
  });
  PATIO.bridge = { x, zA, zB, posts };
})();

/* ---------------- shishi-odoshi ----------------
   A balance, not an animation: water from the pipe fills the open end until it outweighs the
   heavier closed end, the tube swings down and empties, and the closed end falls back onto the stone. */
const SHI = { a:.4, w:0, m:0, push:0, inflow:0, outflow:0, rest:.4, stop:-.62, knock:0 };
const shishiGroup = new THREE.Group(); PATIO.g.add(shishiGroup);
(function buildShishi(){
  const a = -.95, [px, pz] = pondPoint(a, 1.1);
  shishiGroup.position.set(px, PATIO.y, pz);
  shishiGroup.rotation.y = Math.atan2(-(POND.z - pz), POND.x - px);       // the mouth faces the pond
  const bam = (len, r, x, y, z, rx=0, rz=0, parent=shishiGroup, open=false)=>mesh(new THREE.CylinderGeometry(r, r, len, 10, 1, open), PM.bamboo, { x, y, z, rx, rz }, parent);
  const node = (x, y, z, r, rx=0, rz=0, parent=shishiGroup)=>mesh(new THREE.CylinderGeometry(r*1.08, r*1.08, .018, 10), PM.bambooNode, { x, y, z, rx, rz }, parent);
  const cut = (x, y, z, r, rx, ry, rz, parent=shishiGroup)=>mesh(new THREE.CircleGeometry(r*.82, 10), PM.bambooIn, { x, y, z, rx, ry, rz, cast:false }, parent);
  // the frame: two posts lashed with dark rope, and an axle through the tube
  [.1, -.1].forEach(z=>{ bam(.64, .028, -.05, .32, z); node(-.05, .2, z, .028); node(-.05, .44, z, .028); mesh(new THREE.TorusGeometry(.03, .007, 4, 10), PM.rope, { x:-.05, y:.5, z, rx:Math.PI/2 }, shishiGroup); });
  bam(.26, .011, -.05, .48, 0, Math.PI/2);
  // the rocking tube: open at the mouth (+x), closed by a node at the back
  SHI.pivot = new THREE.Group(); SHI.pivot.position.set(-.05, .48, 0); shishiGroup.add(SHI.pivot);
  bam(1.0, .05, .08, 0, 0, 0, Math.PI/2, SHI.pivot, true);
  bam(.98, .043, .08, 0, 0, 0, Math.PI/2, SHI.pivot, true).material = PM.bambooIn;      // the inside of the culm
  [-.18, .22].forEach(x=>node(.08 + x, 0, 0, .05, 0, Math.PI/2, SHI.pivot));
  mesh(new THREE.CircleGeometry(.05, 10), PM.bambooNode, { x:-.42, ry:-Math.PI/2 }, SHI.pivot);
  // the mouth is cut on a slant, the classic shape
  const lip = mesh(new THREE.CylinderGeometry(.05, .05, .12, 10, 1, true, 0, Math.PI), PM.bamboo, { x:.62, y:-.012, rz:Math.PI/2, rx:Math.PI/2 }, SHI.pivot);
  lip.scale.set(1, 1, .9);
  SHI.mouth = new THREE.Object3D(); SHI.mouth.position.set(.6, .01, 0); SHI.pivot.add(SHI.mouth);
  SHI.lipOut = new THREE.Object3D(); SHI.lipOut.position.set(.68, -.03, 0); SHI.pivot.add(SHI.lipOut);
  // the stone the closed end knocks on, set on a flat footing so it sits right under the tube
  const SR = mulberry(90);
  placeRock(SR, shishiGroup, -.43, .02, 0, .21, { sy:.36, flatTop:.55, cuts:3, base:-.2, detail:2, color:'#86837b', moss:'light' });
  const st = placeRock(SR, shishiGroup, -.43, .15, 0, .13, { sy:.82, base:-.45, detail:2, color:'#6d6b66', cuts:4 });
  SHI.stone = st;
  // the feed: a post and a kakei pipe that reaches out over the mouth, tilted down
  bam(1.0, .034, .503, .5, -.34); node(.503, .3, -.34, .034); node(.503, .7, -.34, .034);
  const from = V3(.503, .97, -.32), to = V3(.503, .9, -.06), dir = to.clone().sub(from);
  const pipe = bam(dir.length(), .026, (from.x+to.x)/2, (from.y+to.y)/2, (from.z+to.z)/2, 0, 0, shishiGroup, true);
  pipe.quaternion.setFromUnitVectors(V3(0,1,0), dir.clone().normalize());
  cut(to.x, to.y, to.z, .026, 0, 0, 0).quaternion.setFromUnitVectors(V3(0,0,1), dir.clone().normalize());
  SHI.spoutTip = new THREE.Object3D(); SHI.spoutTip.position.copy(to).addScaledVector(dir.clone().normalize(), .004); shishiGroup.add(SHI.spoutTip);
  SHI.spoutDir = dir.clone().normalize();
  // a stone basin catches the pour; it has water in it
  mesh(lathe([[0,0],[.21,0],[.25,.13],[.22,.15],[.17,.07],[0,.07]], 14), PM.stone, { x:.6, y:0, z:0 }, shishiGroup);
  SHI.basinWater = mesh(new THREE.CircleGeometry(.175, 16), toon({ color:'#3e6a66', emissive:'#20403e', emissiveIntensity:.3 }), { x:.6, y:.118, z:0, rx:-Math.PI/2, cast:false }, shishiGroup);
  SHI.basin = V3(.6, .118, 0);
})();
interactive('shishi', shishiGroup, { kind:'use', zone:'patio', label:'shishi-odoshi' });

/* water as a continuous stream: a thin tube laid along a falling arc, with bands that run down it */
const texStream = canvasTex(4, 16, (ctx,w,h)=>{ const c = ['#dff2f8','#e9f7fb','#d2ebf3','#c4e3ee']; for (let y=0;y<h;y++){ ctx.fillStyle = c[Math.floor(y/4)]; ctx.fillRect(0, y, w, 1); } ctx.fillStyle = '#f6fcfe'; ctx.fillRect(1, 0, 1, h); }, { repeat:[1, 1] });
texStream.wrapS = texStream.wrapT = THREE.RepeatWrapping;
function makeStream(n=18, radial=6){
  const g = new THREE.BufferGeometry(), pos = new Float32Array((n+1)*(radial+1)*3), uv = [], idx = [];
  for (let i=0;i<=n;i++) for (let j=0;j<=radial;j++) uv.push(j/radial, i/n);
  for (let i=0;i<n;i++) for (let j=0;j<radial;j++){ const a = i*(radial+1)+j, b = a + radial + 1; idx.push(a, b, a+1, b, b+1, a+1); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ map:texStream.clone(), transparent:true, opacity:.9, depthWrite:false, side:THREE.DoubleSide });
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping; mat.map.needsUpdate = true;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; fx_(m); scene.add(m);
  // a 1px core line: a stream thinner than a pixel would otherwise break into dashes
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n+1)*3), 3));
  const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color:'#e4f5fa', transparent:true, opacity:.95, depthWrite:false }));
  line.frustumCulled = false; fx_(line); scene.add(line);
  return { m, g, line, n, radial, pts:Array.from({length:n+1}, ()=>V3()), r:new Float32Array(n+1), len:0 };
}
const _sa = V3(), _sb = V3(), _sc = V3(), _up = V3(0,1,0);
/* lay the stream along a ballistic arc from p0 with velocity v0, until it drops to floorY or a catch point */
function layStream(S, p0, v0, r0, floorY, catchAt, catchR, alpha, dt=0){
  const g = 9.8, pts = S.pts, n = S.n;
  // time to fall to the floor
  const a = -.5*g, b = v0.y, c = p0.y - floorY, T = (-b - Math.sqrt(Math.max(0, b*b - 4*a*c)))/(2*a);
  let tEnd = Math.max(.02, T), caught = false;
  if (catchAt){
    // the first moment the arc reaches the catch height; is the catch point under it?
    const c2 = p0.y - catchAt.y, T2 = (-b - Math.sqrt(Math.max(0, b*b - 4*a*c2)))/(2*a);
    if (T2 > 0 && T2 < tEnd){ const x = p0.x + v0.x*T2, z = p0.z + v0.z*T2; if (Math.hypot(x - catchAt.x, z - catchAt.z) < catchR){ tEnd = T2; caught = true; } }
  }
  // the falling front travels at the water's own pace: a stream never jumps to full length
  if (S.tCur === undefined || alpha < .02) S.tCur = alpha < .02 ? 0 : tEnd;
  S.tCur = tEnd < S.tCur ? tEnd : Math.min(tEnd, S.tCur + dt);
  const reached = S.tCur >= tEnd - 1e-4; tEnd = Math.max(.004, S.tCur);
  let L = 0;
  for (let i=0;i<=n;i++){
    const t = tEnd*i/n;
    pts[i].set(p0.x + v0.x*t, p0.y + v0.y*t - .5*g*t*t, p0.z + v0.z*t);
    if (i) L += pts[i].distanceTo(pts[i-1]);
    // a falling stream thins as it speeds up, and wobbles a touch
    const sp = Math.hypot(v0.x, v0.y - g*t, v0.z);
    S.r[i] = r0 * Math.sqrt(Math.max(.15, Math.hypot(v0.x, v0.y, v0.z) + .25) / (sp + .25)) * (1 + .1*Math.sin(STATE.t*23 + i*1.7));
  }
  S.len = L;
  const P = S.g.attributes.position.array, R = S.radial;
  for (let i=0;i<=n;i++){
    _sa.subVectors(pts[Math.min(n, i+1)], pts[Math.max(0, i-1)]).normalize();
    _sb.crossVectors(_sa, Math.abs(_sa.y) > .95 ? V3(1,0,0) : _up).normalize(); _sc.crossVectors(_sa, _sb);
    for (let j=0;j<=R;j++){ const an = j/R*Math.PI*2, k = (i*(R+1)+j)*3, cr = Math.cos(an)*S.r[i], sr = Math.sin(an)*S.r[i];
      P[k] = pts[i].x + _sb.x*cr + _sc.x*sr; P[k+1] = pts[i].y + _sb.y*cr + _sc.y*sr; P[k+2] = pts[i].z + _sb.z*cr + _sc.z*sr; }
  }
  S.g.attributes.position.needsUpdate = true;
  const LP = S.line.geometry.attributes.position.array;
  for (let i=0;i<=n;i++){ LP[i*3] = pts[i].x; LP[i*3+1] = pts[i].y; LP[i*3+2] = pts[i].z; }
  S.line.geometry.attributes.position.needsUpdate = true;
  S.line.material.opacity = .95*alpha; S.line.visible = alpha > .02;
  S.line.material.color.set(Math.sin(STATE.t*40) > .6 ? '#f4fbfd' : '#dcf1f7');
  S.m.material.opacity = .9*alpha; S.m.visible = alpha > .02;
  S.m.material.map.repeat.set(1, Math.max(1, Math.round(L*6)));
  return { end:pts[n], caught:caught && reached, reached };
}
const SHI_IN = makeStream(16, 5), SHI_OUT = makeStream(18, 7);
const shiDrops = makePoints(36, '#e4f4f8', .012); const SHI_DROPS = [];
function shiSplash(p, n, k){ for (let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, s = (.2 + Math.random()*.5)*k; SHI_DROPS.push({ x:p.x, y:p.y, z:p.z, vx:Math.cos(a)*s, vy:(.4 + Math.random()*.8)*k, vz:Math.sin(a)*s, floor:p.y - .01 }); } while (SHI_DROPS.length > 36) SHI_DROPS.shift(); }

/* ---------------- stone lantern ---------------- */
const lanternGroup = new THREE.Group(); PATIO.g.add(lanternGroup);
const LANTERN = { on:null };
(function buildLantern(){
  // a kasuga-dōrō: plinth, pillar, platform, light box, roof, jewel; every part weathered where it would be
  lanternGroup.position.set(-8.9, PATIO.y, -3.95);
  const toCam = Math.atan2(-4.75 - -8.9, -.85 - -3.95);              // the open window faces where you stand
  lanternGroup.rotation.y = toCam - Math.atan2(Math.cos(Math.PI/6), Math.sin(Math.PI/6));
  const G = lanternGroup, stone = toon({ map:texGranite, vertexColors:true });
  const part = (geo, o={})=>{ geo.computeVertexNormals(); weatherGeo(geo, { y0:0, y1:1.6, color:'#f4f0e6', ...o }); const m = new THREE.Mesh(geo, stone); m.castShadow = m.receiveShadow = true; G.add(m); return m; };
  const rot = 0;
  // kiso: a hexagonal plinth, its top carved into upturned lotus petals
  part(hexLathe([[.31,0],[.33,.015],[.33,.07],[.31,.09],[.25,.095]], 6, rot), { seed:1, moss:.25, mossScale:6 });
  part(petalLathe([[.25,.095],[.245,.12],[.22,.15],[.17,.17],[.12,.178],[.1,.18]], 12, .38, 72, 2.2), { seed:2, moss:.35, mossScale:9 });
  // sao: the pillar, with the swollen joint (fushi) at its waist and collars at either end
  const sao = new THREE.LatheGeometry([[.1,.18],[.098,.195],[.084,.21],[.079,.3],[.077,.405],[.088,.415],[.094,.43],[.088,.445],[.077,.455],[.074,.56],[.073,.66],[.079,.68],[.086,.69],[.095,.715],[.1,.725]].map(([r,y])=>new THREE.Vector2(r, y)), 16);
  part(sao, { seed:3, lowDark:.74 });
  // chūdai: down-turned petals carrying a hexagonal platform
  part(petalLathe([[.1,.725],[.13,.735],[.17,.75],[.2,.765],[.215,.78]], 12, .34, 72, 2.2), { seed:4 });
  part(hexLathe([[.215,.78],[.235,.79],[.235,.84],[.215,.855],[.17,.858]], 6, rot), { seed:5, moss:.3, mossScale:8 });
  // hibukuro: the light box. Corner posts, rims, and six faces: windows, sun, moon, and two carved deer
  const HB0 = .858, HB1 = 1.12, RB = .165;
  const corner = k=>{ const a = k/6*Math.PI*2 + rot; return [Math.cos(a)*RB, Math.sin(a)*RB]; };
  for (let k=0;k<6;k++){ const [x, z] = corner(k); const post = hexLathe([[.024,HB0],[.024,HB1]], 6, k/6*Math.PI*2); post.translate(x, 0, z); part(post, { seed:6 + k }); }
  part(hexLathe([[.19,HB0],[.19,HB0 + .025],[.175,HB0 + .03]], 6, rot), { seed:13 });
  part(hexLathe([[.175,HB1 - .03],[.19,HB1 - .025],[.19,HB1]], 6, rot), { seed:14 });
  const faceTex = kind=>canvasTex(24, 36, (ctx,w,h)=>{
    const R = mulberry(300 + kind.length*7);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){ const v = 178 + fbm(x*.25, y*.25, kind.length, 3, 2)*26 + (R() - .5)*30; ctx.fillStyle = `rgb(${v|0},${(v-3)|0},${(v-9)|0})`; ctx.fillRect(x, y, 1, 1); }
    ctx.fillStyle = 'rgba(40,36,30,.22)'; for (let x=0;x<w;x++) if (R() < .25) ctx.fillRect(x, 0, 1, 3 + Math.floor(R()*10));   // rain streaks under the roof
    const hole = (fn)=>{ const img = ctx.getImageData(0, 0, w, h); for (let y=0;y<h;y++) for (let x=0;x<w;x++) if (fn(x + .5, y + .5)) img.data[(y*w + x)*4 + 3] = 0; ctx.putImageData(img, 0, 0); };
    const inset = (fn, c1, c2)=>{ for (let y=0;y<h;y++) for (let x=0;x<w;x++) if (fn(x + .5, y + .5)){ ctx.fillStyle = fn(x + .5, y - .5) ? c1 : c2; ctx.fillRect(x, y, 1, 1); } };
    if (kind === 'window') hole((x, y)=>x > 4 && x < w - 4 && y > 6 && y < h - 5 && !(y < 11 && Math.hypot(x - w/2, y - 11) > 8));
    if (kind === 'sun') hole((x, y)=>Math.hypot(x - w/2, y - h/2) < 7);
    if (kind === 'moon') hole((x, y)=>Math.hypot(x - w/2, y - h/2) < 7.5 && Math.hypot(x - w/2 - 3.5, y - h/2 + 2) > 6.5);
    if (kind === 'deer'){
      // a recessed panel with a deer carved in relief, lit from above
      inset((x, y)=>x > 3 && x < w - 3 && y > 4 && y < h - 4, 'rgba(70,64,56,.55)', 'rgba(255,250,235,.12)');
      const D = ['......X.X.....','.......X......','......XX......','.....XXX......','.....XX.......','....XX........','XXXXXX........','XXXXXXX.......','.XXXXXX.......','.X..X.X.......','.X..X.X.......','.X..X..X......'];
      D.forEach((row, ry)=>[...row].forEach((ch, rx)=>{ if (ch === 'X'){ const x = 5 + rx, y = 12 + ry; ctx.fillStyle = (ry === 0 || D[ry-1][rx] !== 'X') ? '#d8d2c4' : '#a49d90'; ctx.fillRect(x, y, 1, 1); } }));
    }
  });
  const kinds = ['window', 'deer', 'moon', 'window', 'deer', 'sun'];
  for (let k=0;k<6;k++){
    const [x0, z0] = corner(k), [x1, z1] = corner(k + 1), mid = (k + .5)/6*Math.PI*2 + rot, edge = Math.hypot(x1 - x0, z1 - z0);
    const mat = toon({ map:faceTex(kinds[k]), alphaTest:.5, side:THREE.DoubleSide });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(edge - .03, HB1 - HB0 - .05), mat);
    const ap = RB*Math.cos(Math.PI/6) - .006;
    f.position.set(Math.cos(mid)*ap, (HB0 + HB1)/2, Math.sin(mid)*ap); f.rotation.y = Math.PI/2 - mid;
    f.castShadow = true; f.receiveShadow = true; G.add(f);
  }
  // inside: a paper-lit core, warm at night, shadowed by day
  LANTERN.glow = new THREE.MeshBasicMaterial({ color:'#3a2b1c', side:THREE.DoubleSide });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, HB1 - HB0 - .05, 6, 1, true), LANTERN.glow); core.position.y = (HB0 + HB1)/2; G.add(core);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(.14, 6), LANTERN.glow); floor.rotation.x = -Math.PI/2; floor.position.y = HB0 + .032; G.add(floor);
  // kasa: the roof, mossy on top, with curled warabite at each corner
  const roof = roofGeo(6, .4, .23, .042, .055, rot); roof.translate(0, HB1, 0);
  part(roof, { seed:20, moss:.05, mossScale:7, y0:HB1 - .1 });
  for (let k=0;k<6;k++){
    const a = k/6*Math.PI*2 + rot, r = .4*1.08;
    const curl = new THREE.TorusGeometry(.022, .011, 5, 10, Math.PI*1.3); curl.rotateZ(-Math.PI*.15); curl.rotateY(-a); curl.translate(Math.cos(a)*r, HB1 + .055 + .045, Math.sin(a)*r);
    part(curl, { seed:30 + k, moss:.2, mossScale:20 });
  }
  // hōju: a lotus cup and the flame-pointed jewel
  const HJ = HB1 + .23;
  part(petalLathe([[.035,HJ - .01],[.06,HJ + .005],[.08,HJ + .025],[.085,HJ + .04]], 8, .4, 48, 2), { seed:40 });
  part(new THREE.LatheGeometry([[0,HJ + .035],[.05,HJ + .04],[.07,HJ + .07],[.068,HJ + .1],[.05,HJ + .13],[.025,HJ + .155],[.008,HJ + .18],[0,HJ + .19]].map(([r,y])=>new THREE.Vector2(r, y)), 16), { seed:41, moss:.3, mossScale:12 });
  // the flame sits inside the box; a short-range shadow lets its light out only through the openings
  LANTERN.light = new THREE.PointLight('#ffb35c', 0, 4.5, 1.6); LANTERN.light.position.set(0, (HB0 + HB1)/2, 0);
  LANTERN.light.castShadow = true; LANTERN.light.shadow.mapSize.set(512, 512);
  LANTERN.light.shadow.camera.near = .02; LANTERN.light.shadow.camera.far = 4.5; LANTERN.light.shadow.bias = -.004;
  LANTERN.light.shadow.autoUpdate = false; LANTERN.light.shadow.needsUpdate = true;   // nothing near it moves: draw its shadow once
  G.add(LANTERN.light);
  // and the faint warmth that glow puts on the gravel and the azaleas in front of it
  const wm = Math.PI/6 + rot;
  LANTERN.fill = new THREE.PointLight('#ff9e48', 0, 2.4, 1.4); LANTERN.fill.position.set(Math.cos(wm)*.85, .35, Math.sin(wm)*.85); G.add(LANTERN.fill);
})();
interactive('lantern', lanternGroup, { kind:'use', zone:'patio', label:'lantern' });

/* ---------------- fence + bamboo grove ---------------- */
(function buildFenceAndBamboo(){
  const runs = [[[-13.9, 6.4], [-13.9, -7.6]], [[-5.8, -7.6], [-13.9, -7.6]], [[-5.8, 6.4], [-13.9, 6.4]]];
  let n = 0; const posts = [];
  runs.forEach(([a,b])=>{ const len = Math.hypot(b[0]-a[0], b[1]-a[1]); const k = Math.floor(len/.075); for (let i=0;i<=k;i++) posts.push([lerp(a[0],b[0],i/k), lerp(a[1],b[1],i/k)]); });
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.033, .033, 1.35, 6), PM.fence, posts.length);
  const m4 = new THREE.Matrix4(), R = mulberry(86);
  posts.forEach(([x,z],i)=>{ const h = 1.3 + R()*.08; m4.compose(V3(x, PATIO.y + h/2, z), new THREE.Quaternion(), V3(1, h/1.35, 1)); pole.setMatrixAt(i, m4); });
  pole.castShadow = pole.receiveShadow = true; PATIO.g.add(pole);
  runs.forEach(([a,b])=>{ [.35, .85, 1.18].forEach(y=>rod(V3(a[0], PATIO.y + y, a[1]), V3(b[0], PATIO.y + y, b[1]), .025, .025, toon({ color:'#8f7c4c' }), PATIO.g, 6)); });
  // the grove
  const culms = [];
  for (let i=0;i<110;i++){ const x = -14.3 - R()*3.4, z = -9 + R()*16.5; culms.push([x, z, 4.5 + R()*4, .04 + R()*.035, (R()-.5)*.08, (R()-.5)*.08]); }
  for (let i=0;i<30;i++){ const z = R() < .5 ? -8 - R()*2 : 6.8 + R()*2; culms.push([-6 - R()*8, z, 4 + R()*4, .04 + R()*.03, (R()-.5)*.08, (R()-.5)*.08]); }
  const culm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), PM.bamboo, culms.length);
  // a spray: seven narrow leaves fanning down and out from one twig
  const leafG = (()=>{
    const one = leafGeo('bamboo'), pos = [], nrm = [], q = new THREE.Quaternion(), e = new THREE.Euler(), v = V3(), n = V3();
    for (let k=0;k<7;k++){
      const az = k/7*Math.PI*2 + R()*.5, len = .19 + R()*.08;
      e.set(0, az, Math.PI/2 + .35 + R()*.5, 'YZX'); q.setFromEuler(e);
      const tw = V3(Math.cos(az)*.06*k/7, -.03*k/7, -Math.sin(az)*.06*k/7);
      const p = one.attributes.position, ix = one.index.array;
      n.set(0, 0, 1).applyQuaternion(q);
      for (let i=0;i<ix.length;i++){ v.fromBufferAttribute(p, ix[i]); v.x *= len*.9; v.y *= len; v.applyQuaternion(q).add(tw); pos.push(v.x, v.y, v.z); nrm.push(n.x, n.y, n.z); }
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); return out; })();
  const leaves = new THREE.InstancedMesh(leafG, PM.leaf, culms.length*4);
  let li = 0;
  culms.forEach(([x,z,h,r,lx,lz],i)=>{
    m4.compose(V3(x, PATIO.y + h/2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(lx, 0, lz)), V3(r, h, r)); culm.setMatrixAt(i, m4);
    for (let k=0;k<4;k++){ const y = PATIO.y + h*(.55 + k*.13); m4.compose(V3(x + lz*h*.5 + (R()-.5)*.5, y, z - lx*h*.5 + (R()-.5)*.5), new THREE.Quaternion().setFromEuler(new THREE.Euler((R()-.5)*.5, R()*6, (R()-.5)*.5)), V3(1, 1, 1).multiplyScalar(1.1 + R()*.7)); leaves.setColorAt(li, new THREE.Color(mix(R() < .5 ? '#4d7a38' : '#3a6230', R() < .3 ? '#8aa653' : '#2c4a26', R()*.6))); leaves.setMatrixAt(li++, m4); }
  });
  culm.castShadow = true; leaves.castShadow = true;
  PATIO.g.add(culm, leaves);
  PATIO.grove = [culm, leaves];
})();

/* ---------------- fireflies ---------------- */
const flies = makePoints(28, '#e8ff8a', .014);
const flyP = Array.from({length:28}, ()=>({ x:POND.x + (Math.random()-.5)*7, y:.2 + Math.random()*1.3, z:POND.z + (Math.random()-.5)*5, ph:Math.random()*6, sp:.3 + Math.random()*.5 }));

/* the pond is clickable: feeding the koi */
interactive('pond', pondWater, { kind:'use', zone:'patio', label:'koi pond' });
lilies.forEach(l=>{ l.m.userData.iid = 'pond'; pickables.push(l.m); });

/* =====================================================================
   PATIO UPDATE
   ===================================================================== */
const _pv = V3();
/* small things don't need to cast: keeps the shadow pass light */
PATIO.g.updateMatrixWorld(true);
PATIO.g.traverse(o=>{
  if (!o.isMesh || o.isInstancedMesh || !o.castShadow) return;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const s = o.getWorldScale(V3()); if (o.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z) < .16) o.castShadow = false;
});
function patioUpdate(dt, t){
  const T = TIME.T, night = T ? clamp(T.stars*1.2, 0, 1) : 0;
  const near = STATE.zone !== 'room' || DOOR.open > .05;           // only animate what can be seen
  // the room's view cone reaches past the wall: keep the garden's heavy parts out of it until the door opens
  const show = STATE.zone !== 'room' || DOOR.open > .01;
  if (PATIO.heavy[0].visible !== show){ PATIO.heavy.forEach(o=>o.visible = show); PATIO.grove[1].visible = show; }
  waterMat.uniforms.time.value = t;
  waterMat.uniforms.night.value = night;
  if (T){ waterMat.uniforms.sky.value.set(mix(T.hor, T.top, .5)); waterMat.uniforms.deep.value.set(mix('#16392f', '#081614', night)); waterMat.uniforms.shallow.value.set(mix('#3f6a4f', '#17302a', night)); }
  // lantern: lit after dark unless switched
  const lit = LANTERN.on !== null ? LANTERN.on : (T ? T.lamp > .5 : false);
  LANTERN.light.intensity = damp(LANTERN.light.intensity, lit ? 3.2 : 0, 4, dt) * (.96 + .04*Math.sin(t*9.1)*Math.sin(t*3.7));
  LANTERN.glow.color.set(lit ? '#ffcf7a' : '#3a2b1c');
  LANTERN.fill.intensity = LANTERN.light.intensity*.14;
  waterMat.uniforms.glow.value.set(lit ? '#ffb35c' : '#000000');
  PATIO.spill.intensity = STATE.lampOn ? 1.4 * (.35 + DOOR.open*.65) : .25*DOOR.open;
  if (!near) return;

  // shishi-odoshi: integrate the balance in small steps so every motion is continuous
  const S = SHI;
  S.mouth.getWorldPosition(_pv);
  const spw = SHI.spoutTip.getWorldPosition(V3()), sdir = SHI.spoutDir.clone().transformDirection(shishiGroup.matrixWorld);
  // the inflow stream: is the open end under it right now?
  const inRes = layStream(SHI_IN, spw, sdir.multiplyScalar(.32), .011, shishiGroup.localToWorld(SHI.basin.clone()).y, _pv, .06, 1, dt);
  const catching = inRes.caught;
  SHI_IN.m.material.map.offset.y -= dt*2.2;
  for (let k=0, n=4; k<n; k++){
    const h = dt/n;
    // water in: a steady trickle when it lands in the mouth. Water out: once the mouth tips below level
    S.inflow = catching ? .15 : 0;
    const tilt = Math.max(0, -S.a + .06);
    S.outflow = S.m * Math.min(9, tilt*tilt*55);
    S.m = Math.max(0, S.m + (S.inflow - S.outflow)*h);
    // torques: water at the mouth pulls it down, the heavier closed end pulls it back; a hand push when clicked
    // as it dips, the water runs toward the mouth and its pull grows: a slow start, then a commitment
    const arm = .28 + .4*clamp(S.rest - S.a, 0, 1);
    const tq = (-S.m*arm + .26*.95) * Math.cos(S.a) - S.push*.62;
    S.w += (tq*22 - S.w*.9)*h;
    S.a += S.w*h;
    if (S.a >= S.rest){ S.a = S.rest; if (S.w > 0){ const hit = S.w; S.w = hit < .08 ? 0 : -hit*.3; if (hit > .35) S.knock = Math.max(S.knock, hit); } }
    if (S.a <= S.stop){ S.a = S.stop; if (S.w < 0) S.w = -S.w*.12; }
    S.push = Math.max(0, S.push - h*1.1);
  }
  S.pivot.rotation.z = S.a;
  if (S.knock){
    // the knock: loudness follows how hard the closed end came down
    if (STATE.zone !== 'room' || DOOR.open > .3){ sfx.tak(clamp(S.knock/2.2, .35, 1)); if (S.knock > 1.2) say(SHI.stone, 'tak'); }
    ripple(POND.x - 1.6, POND.z + .9, .2 + .15*clamp(S.knock/2, 0, 1));
    S.knock = 0;
  }
  // the pour: water leaves the slanted lip along the tube, faster the steeper it hangs
  const lip = SHI.lipOut.getWorldPosition(V3()), axis = V3(1, 0, 0).transformDirection(SHI.pivot.matrixWorld);
  const flowK = clamp(S.outflow/2.2, 0, 1);
  const basinW = shishiGroup.localToWorld(SHI.basin.clone());
  const outRes = layStream(SHI_OUT, lip, axis.multiplyScalar(.25 + flowK*.9), .009 + .022*Math.sqrt(flowK), basinW.y, null, 0, clamp(flowK*3, 0, 1), dt);
  SHI_OUT.m.material.map.offset.y -= dt*(2 + flowK*5);
  if (flowK > .05 && outRes.reached && Math.random() < dt*30*flowK) shiSplash(outRes.end, 2, .3 + flowK*.6);
  if (inRes.reached && Math.random() < dt*(catching ? 6 : 14)) shiSplash(inRes.end, 1, catching ? .18 : .3);
  if (S.outflow > .4 && !S.gushing){ S.gushing = true; sfx.gush && sfx.gush(); }
  if (S.outflow < .05) S.gushing = false;
  // the basin surface shivers while it's being poured into
  SHI.basinWater.position.y = SHI.basin.y + Math.sin(t*31)*.003*flowK;
  SHI.basinWater.scale.setScalar(1 + Math.sin(t*17)*.015*flowK);
  // drops
  const dp2 = shiDrops.geometry.attributes.position, da2 = shiDrops.geometry.attributes.alpha;
  for (let i=SHI_DROPS.length-1;i>=0;i--){ const d = SHI_DROPS[i]; d.vy -= 9.8*dt*.6; d.x += d.vx*dt; d.y += d.vy*dt; d.z += d.vz*dt; if (d.y < d.floor) SHI_DROPS.splice(i, 1); }
  for (let i=0;i<36;i++){ const d = SHI_DROPS[i]; if (d){ dp2.setXYZ(i, d.x, d.y, d.z); da2.setX(i, .85); } else da2.setX(i, 0); }
  dp2.needsUpdate = da2.needsUpdate = true;

  koiUpdate(dt, t);
  // pads bob, and rock a little when a fish passes beneath
  PADS.forEach(p=>{ p.nudge = Math.max(0, p.nudge - dt*.6); const l = p.l;
    l.m.position.y = PATIO.waterY + .006 + Math.sin(t*.8 + l.ph)*.002 + Math.sin(t*6 + l.ph)*.004*p.nudge;
    l.m.rotation.x = -Math.PI/2 + Math.sin(t*3.1 + l.ph)*.05*p.nudge; l.m.rotation.y = Math.cos(t*2.7 + l.ph)*.05*p.nudge; });
  leavesUpdate(dt, t);
  // fireflies
  const fp = flies.geometry.attributes.position, fa = flies.geometry.attributes.alpha;
  flyP.forEach((p,i)=>{ p.ph += dt*p.sp; fp.setXYZ(i, p.x + Math.sin(p.ph*1.3)*.6, PATIO.y + p.y + Math.sin(p.ph*2.1)*.2, p.z + Math.cos(p.ph)*.6); fa.setX(i, night * (Math.sin(p.ph*4 + i) > .3 ? 1 : .15)); });
  fp.needsUpdate = fa.needsUpdate = true;
  PATIO.grove.forEach(m=>{ m.rotation.z = Math.sin(t*.45)*.004; m.rotation.x = Math.sin(t*.37 + 1)*.003; });
}
