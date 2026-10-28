/* =====================================================================
   COFFEE TABLE + THINGS ON IT
   ===================================================================== */
const S = 1.45, SM = 1.6, SG = 1.8;   // props are scaled up a touch so they read at pixel resolution
const table = new THREE.Group(); scene.add(table);
const TABLE = { z:2.05, top:.44, w:1.8, d:.84 };
table.position.set(0, 0, TABLE.z);
(function buildTable(){
  const { top, w, d } = TABLE;
  mesh(slab(w, .045, d, .09, .012), [M.oak, M.oakSide], { y:top-.045 }, table);
  mesh(slab(w-.12, .05, d-.12, .06, 0), M.oakSide, { y:top-.095 }, table);
  const legs = [[-w/2+.14, -d/2+.12],[w/2-.14, -d/2+.12],[-w/2+.14, d/2-.12],[w/2-.14, d/2-.12]];
  legs.forEach(([x,z])=>rod(V3(x, top-.09, z), V3(x+Math.sign(x)*.05, 0, z+Math.sign(z)*.04), .026, .015, M.oakSide, table, 8));
  mesh(slab(w-.36, .022, d-.3, .03, .004), [M.oak, M.oakSide], { y:.13 }, table);
  mesh(Box(.36,.05,.26), toon({ color:'#2f5d7a', map:texSpine }), { x:.38, y:.177, z:.02, ry:.08 }, table);
  mesh(Box(.32,.04,.24), toon({ color:'#e2c07a' }), { x:.36, y:.222, z:.03, ry:-.06 }, table);
  mesh(Box(.4,.03,.3), toon({ color:'#c9533d' }), { x:-.35, y:.156, z:.0, ry:-.12 }, table);
})();
const T0 = TABLE.top;

/* ---- magazine: a real object with a cover and leaves hinged at the spine ---- */
const MAG = { w:.21*SM, h:.28*SM, leaves:[], spread:0, N:8, block:.0045, eps:.00045 };
const magazine = new THREE.Group(); table.add(magazine);
function leafGeometry(w, h, seg){
  const n = seg+1, pos = new Float32Array(n*2*2*3), uv = new Float32Array(n*2*2*2), idx = [];
  for (let half=0; half<2; half++) for (let i=0;i<n;i++) for (let j=0;j<2;j++){
    const k = half*n*2 + i*2 + j, x = i/seg*w, z = j ? h/2 : -h/2;
    pos[k*3] = x; pos[k*3+1] = 0; pos[k*3+2] = z;
    uv[k*2] = half ? 1 - i/seg : i/seg; uv[k*2+1] = j ? 0 : 1;
  }
  const g = new THREE.BufferGeometry();
  for (let half=0; half<2; half++){
    for (let i=0;i<seg;i++){
      const o = half*n*2, a = o+i*2, b = o+i*2+1, c = o+(i+1)*2, d = o+(i+1)*2+1;
      if (!half) idx.push(a,b,c, c,b,d); else idx.push(a,c,b, c,d,b);
    }
  }
  g.setIndex(idx);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.addGroup(0, seg*6, 0); g.addGroup(seg*6, seg*6, 1);
  g.computeVertexNormals();
  g.userData = { seg, w, n };
  return g;
}
function bendLeaf(L, p, dir){
  const g = L.geo, pos = g.attributes.position, { seg, w, n } = g.userData;
  const lift = Math.sin(p*Math.PI);
  for (let half=0; half<2; half++) for (let i=0;i<n;i++){
    const f = i/seg, y = -dir * lift * .22 * w * f*f;
    for (let j=0;j<2;j++){ const k = half*n*2 + i*2 + j; pos.setY(k, y + (half ? -.00005 : 0)); pos.setX(k, f*w*(1 - lift*.06*f)); }
  }
  pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}
(function buildMagazine(){
  magazine.position.set(-.52, T0, .03); magazine.rotation.y = .2;
  const { w, h, N, block, eps } = MAG;
  const blank = canvasTex(8, 8, (ctx)=>{ ctx.fillStyle = '#f3ecdc'; ctx.fillRect(0,0,8,8); });
  MAG.insideBack = paperMat(blank);
  const edge = toon({ color:'#efe6d2' });
  mesh(Box(w, block, h), [edge,edge,MAG.insideBack,toon({ color:'#d36a45' }),edge,edge], { x:0, y:block/2 }, magazine).name = 'magBlock';
  for (let k=0;k<N;k++){
    const pivot = new THREE.Group(); magazine.add(pivot);
    const geo = leafGeometry(w, h, 12);
    const recto = paperMat(k === 0 ? texMagCover : blank, k === 0 ? .2 : .42);
    const verso = paperMat(blank);
    const m = new THREE.Mesh(geo, [recto, verso]); m.castShadow = m.receiveShadow = true; m.name = 'leaf';
    m.userData.leaf = k; pivot.add(m);
    const L = { k, pivot, geo, mesh:m, recto, verso, angle:0, from:0, to:0, t:1, delay:0, dir:1 };
    L.y0 = block + (N-1-k)*eps; L.y1 = block + k*eps;
    pivot.position.set(-w/2, L.y0, 0);
    MAG.leaves.push(L);
  }
  // a second, older issue lies underneath
  mesh(slab(.2*SM, .004, .26*SM, .004, 0), [toon({ map:texMagCover2 }), toon({ color:'#f3ecdc' })], { x:-.47, y:T0, z:-.0, ry:.02 }, table);
})();
function magSetSpread(s, stagger=.12){
  s = clamp(s, 0, MAG.N);
  const prev = MAG.spread; MAG.spread = s;
  let n = 0;
  const order = s > prev ? MAG.leaves : [...MAG.leaves].reverse();
  order.forEach(L=>{
    const to = L.k < s ? Math.PI : 0;
    if (to !== L.to){ L.from = L.angle; L.to = to; L.t = 0; L.dir = to > L.from ? 1 : -1; L.delay = n++ * stagger; }
  });
}
function magUpdate(dt){
  for (const L of MAG.leaves){
    if (L.t >= 1 && L.angle === L.to) continue;
    if (L.delay > 0){ L.delay -= dt; continue; }
    L.t = Math.min(1, L.t + dt / (reduceMotion ? .01 : .55));
    const e = ease(L.t);
    L.angle = lerp(L.from, L.to, e);
    const p = L.angle / Math.PI;
    L.pivot.rotation.z = L.angle;
    L.pivot.position.y = lerp(L.y0, L.y1, p) + Math.sin(p*Math.PI)*.002;
    bendLeaf(L, L.t < 1 ? Math.sin(e*Math.PI)*.5+.0 : 0, L.dir);
    if (L.t >= 1) L.angle = L.to;
  }
}
interactive('magazine', magazine, { kind:'hold', label:'projects' });

/* ---- succulent ---- */
const succulent = new THREE.Group(); table.add(succulent);
(function(){
  succulent.position.set(-.16, T0, -.21);
  mesh(lathe([[0,0],[.042,0],[.046,.008],[.05,.06],[.054,.064],[.054,.072],[.047,.072],[.045,.064],[0,.064]].map(p=>[p[0]*S,p[1]*S]), 18), toon({ color:'#b8b1a5' }), {}, succulent);
  mesh(Cyl(.047*S,.047*S,.004,16), toon({ color:'#3b2a1e' }), { y:.068*S }, succulent);
  const rosette = new THREE.Group(); rosette.position.y = .074*S; succulent.add(rosette);
  const base = new THREE.Color('#8fb59b'), tip = new THREE.Color('#d68196'), mid = new THREE.Color('#6f9d84');
  const rings = [ { n:10, len:.068, pitch:.12, r:.014 }, { n:8, len:.056, pitch:.45, r:.01 }, { n:7, len:.044, pitch:.8, r:.006 }, { n:5, len:.03, pitch:1.1, r:.002 } ];
  rings.forEach((ring, ri)=>{
    for (let i=0;i<ring.n;i++){
      const g = new THREE.SphereGeometry(1, 8, 6);
      g.translate(0, 0, 1); g.scale(.36, .17, .5);
      const p = g.attributes.position, cols = [];
      for (let k=0;k<p.count;k++){ const zz = p.getZ(k); const c = mid.clone().lerp(base, clamp(zz*1.2,0,1)).lerp(tip, clamp((zz-.75)*3, 0, 1)); cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const leaf = new THREE.Mesh(g, toon({ vertexColors:true }));
      leaf.scale.setScalar(ring.len*S);
      const piv = new THREE.Group(); piv.rotation.y = (i/ring.n)*Math.PI*2 + ri*.4;
      leaf.position.z = ring.r*S; leaf.rotation.x = -ring.pitch;
      leaf.castShadow = leaf.receiveShadow = true;
      piv.add(leaf); rosette.add(piv);
    }
  });
  ROOM.rosette = rosette;
})();
interactive('succulent', succulent, { kind:'hold', label:'succulent' });

/* ---- coffee mug ---- */
const mug = new THREE.Group(); table.add(mug);
const coffee = { level:1, sips:0 };
(function(){
  mug.position.set(-.1, T0, .1);
  const coaster = mesh(Cyl(.06*S,.06*S,.006,20), toon({ color:'#a77b52' }), { x:-.1, y:T0+.003, z:.1 }, table);
  const glaze = toon({ color:'#ece4d2', side:THREE.DoubleSide });
  const s = S*.95;
  const prof = [[0,0],[.034,0],[.039,.004],[.041,.012],[.041,.088],[.0418,.092],[.0405,.095],[.036,.093],[.0355,.012],[0,.01]].map(p=>[p[0]*s,p[1]*s+.006]);
  mesh(lathe(prof, 22), glaze, {}, mug);
  mesh(Cyl(.0418*s,.0418*s,.014*s,22,true), toon({ color:'#2f6e72' }), { y:.006+.03*s }, mug);
  mesh(new THREE.TorusGeometry(.024*s, .0065*s, 6, 12, Math.PI), glaze, { x:.041*s, y:.006+.052*s, rz:-Math.PI/2 }, mug);
  const surf = mesh(new THREE.CircleGeometry(.0355*s, 20), toon({ color:'#3a2214' }), { y:.006+.078*s, rx:-Math.PI/2, cast:false }, mug);
  const crema = mesh(new THREE.RingGeometry(.026*s, .0355*s, 20), toon({ color:'#8a5a32' }), { y:.006+.0782*s, rx:-Math.PI/2, cast:false }, mug);
  ROOM.coffeeSurf = [surf, crema]; ROOM.coffeeY0 = .006+.078*s; ROOM.coffeeY1 = .006+.02*s;
})();
interactive('coffee', mug, { kind:'hold', label:'coffee' });

/* ---- cartridges ---- */
const CART_TEX = { exp:texCartExp, skl:texCartSkl, time:texCartTime, fall:texCartFall };
const carts = {};
[['exp','cart-exp'],['skl','cart-skl'],['time','cart-time']].forEach(([cart,id],i)=>{
  const g = new THREE.Group(); table.add(g);
  g.position.set(.1 + (i===1? .015:0) - (i===2? .01:0), T0, -.23 + i*.15); g.rotation.y = [.12,-.08,.2][i];
  mesh(slab(.058*SG, .009*SG, .066*SG, .004, .001), [toon({ map:CART_TEX[cart] }), toon({ color:'#a9a69d' })], {}, g);
  carts[cart] = g; g.userData.y0 = T0;
  interactive(id, g, { kind:'hold', cart, label:'experience, skills, ???' });
});
/* Blockfall, from the old site: left on the lower shelf, under the books */
(function(){
  const g = new THREE.Group(); table.add(g);
  g.position.set(-.08, .152, .2); g.rotation.y = -.5;
  mesh(slab(.058*SG, .009*SG, .066*SG, .004, .001), [toon({ map:texCartFall }), toon({ color:'#6f6e78' })], {}, g);
  carts.fall = g; g.userData.y0 = .152;
  interactive('cart-fall', g, { kind:'hold', cart:'fall', label:'blockfall', secret:true });
})();

/* ---- Game Boy ---- */
const gameboy = new THREE.Group(); table.add(gameboy);
const gbLcdTex = canvasTex(160, 144, null, {});
const GBG = {};
(function(){
  gameboy.position.set(.36, T0, .0); gameboy.rotation.y = -.16;
  const S = SG, w = .09*S, d = .148*S, h = .026*S;
  GBG.w = w; GBG.d = d; GBG.h = h;
  const body = toon({ color:'#c9c6bb' });
  GBG.faceMat = toon({ map:texGBFace });
  mesh(slab(w, h, d, .006*S, .003), [GBG.faceMat, body], { name:'gbBody' }, gameboy);
  const fx = u=>(u-.5)*w, fz = v=>(v-.5)*d;
  const lw = w*GB_SCREEN.w/64, lh = d*GB_SCREEN.h/104;
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), screenMat(gbLcdTex, 1));
  lcd.rotation.x = -Math.PI/2; lcd.position.set(fx((GB_SCREEN.x+GB_SCREEN.w/2)/64), h+.0006, fz((GB_SCREEN.y+GB_SCREEN.h/2)/104)); lcd.name = 'gbLCD';
  gameboy.add(lcd); GBG.lcd = lcd; GBG.lw = lw; GBG.lh = lh;
  const dark = toon({ color:'#26252b' });
  const dpx = fx(16/64), dpz = fz(72/104);
  const dpad = new THREE.Group(); dpad.position.set(dpx, h+.002*S, dpz); gameboy.add(dpad);
  mesh(Box(.017*S,.004*S,.0055*S), dark, { name:'gbDpad' }, dpad);
  mesh(Box(.0055*S,.004*S,.017*S), dark, { name:'gbDpad' }, dpad);
  GBG.dpad = dpad;
  const btn = toon({ color:'#8b1d47' });
  GBG.a = mesh(Cyl(.0052*S,.0052*S,.004*S,12), btn, { x:fx(53/64), y:h+.002*S, z:fz(70/104), name:'gbA' }, gameboy);
  GBG.b = mesh(Cyl(.0052*S,.0052*S,.004*S,12), btn, { x:fx(42/64), y:h+.002*S, z:fz(76/104), name:'gbB' }, gameboy);
  const pill = toon({ color:'#8d8a94' });
  mesh(Box(.009*S,.002*S,.003*S), pill, { x:fx(25/64), y:h+.001*S, z:fz(90/104), ry:.45, name:'gbSelect' }, gameboy);
  mesh(Box(.009*S,.002*S,.003*S), pill, { x:fx(35/64), y:h+.001*S, z:fz(90/104), ry:.45, name:'gbStart' }, gameboy);
  // inserted cartridge pokes out of the top edge at the back
  const cartMat = toon({ map:texCartExp });
  GBG.cartMat = cartMat;
  GBG.cart = mesh(slab(.058*SG, .009*SG, .066*SG, .004, .001), [cartMat, toon({ color:'#a9a69d' })], { y:-.0005, z:-d/2 + .016*SG, rx:Math.PI, name:'gbCart' }, gameboy);
  GBG.cart.visible = false;
})();
interactive('gameboy', gameboy, { kind:'hold', label:'game boy' });

/* ---- phone ---- */
const phone = new THREE.Group(); table.add(phone);
const PH = {};
(function(){
  phone.position.set(.64, T0, .04); phone.rotation.y = .38;
  const S = SG*.95, w = .074*S, d = .155*S, h = .0085*S;
  mesh(slab(w, h, d, .01*S, .002), [toon({ color:'#1d1d22' }), toon({ color:'#3c3c44' })], {}, phone);
  PH.sw = w-.006; PH.sh = d-.008;
  PH.mat = screenMat(canvasTex(40, 84, null, {}), 1);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(PH.sw, PH.sh), PH.mat);
  scr.rotation.x = -Math.PI/2; scr.position.y = h+.0005; scr.name = 'phoneScreen'; phone.add(scr);
  PH.screen = scr;
  // camera bump on the back
  mesh(slab(.026*S, .002, .03*S, .006, 0), toon({ color:'#2a2a31' }), { x:-w/2+.022*S, y:-.0018, z:-d/2+.024*S, rx:Math.PI }, phone);
})();
interactive('phone', phone, { kind:'hold', label:'socials' });

/* ---- KP17, lamp, TV, roomba ---- */
interactive('kp17', kp17, { kind:'hold', label:'kp17' });
interactive('tv', tvGroup, { kind:'use', label:'tv' });
interactive('lamp', lampGroup, { kind:'use', label:'lamp' });
interactive('roomba', roomba, { kind:'use', label:'roomba' });
interactive('door', doorGroup, { kind:'use', zone:'any', label:'patio' });

/* =====================================================================
   CONTACT SHADOWS (soft blobs, stepped so they dither like pixel art)
   ===================================================================== */
const texBlob = canvasTex(32, 32, (ctx,w,h)=>{
  const img = ctx.createImageData(w,h);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const dx = (x+.5)/w*2-1, dy = (y+.5)/h*2-1;
    const d = Math.max(Math.abs(dx), Math.abs(dy))*.55 + Math.hypot(dx,dy)*.45;
    const a = d < .55 ? 1 : d < .78 ? .55 : d < .95 ? .22 : 0;
    const i = (y*w+x)*4; img.data[i]=img.data[i+1]=img.data[i+2]=0; img.data[i+3]=a*255;
  }
  ctx.putImageData(img,0,0);
}, { linear:true });
const BLOBS = {};
function blob(parent, w, d, x, y, z, op=.4, ry=0, id){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color:'#000000', map:texBlob, transparent:true, opacity:op, depthWrite:false }));
  m.rotation.set(-Math.PI/2, 0, ry); m.position.set(x, y, z); m.renderOrder = 1; fx_(m); parent.add(m);
  m.userData.op = op; if (id) BLOBS[id] = m;
  return m;
}
blob(table, .4*SM*.9, .48*SM*.9, -.52, T0+.001, .03, .38, .2, 'magazine');
blob(table, .16*1.45, .16*1.45, -.1, T0+.0015, .1, .45, 0, 'coffee');
blob(table, .14*1.45, .14*1.45, -.16, T0+.001, -.21, .45, 0, 'succulent');
blob(table, .2*SG, .3*SG, .36, T0+.001, 0, .45, -.16, 'gameboy');
blob(table, .15*SG, .3*SG, .64, T0+.001, .04, .4, .38, 'phone');
['exp','skl','time'].forEach(c=>{ const g = carts[c]; blob(table, .1*SG, .11*SG, g.position.x, T0+.0012, g.position.z, .35, -g.rotation.y, 'cart-'+c); });
blob(table, TABLE.w*1.08, TABLE.d*1.25, 0, .008, 0, .5);
blob(scene, 2.9, .75, 0, .004, ROOM.back+.26, .5);
blob(scene, 1.05, .55, -2.28, .004, ROOM.back+.2, .45);
blob(scene, 1.0, .58, 2.56, .004, ROOM.back+.22, .4);
blob(scene, .3, .34, kp17.position.x, ROOM.consoleTop+.0015, kp17.position.z - .03, .5, 0, 'kp17');
blob(roomba, .48, .48, 0, .003, 0, .55);

/* =====================================================================
   LIGHTS
   ===================================================================== */
const hemi = new THREE.HemisphereLight('#9fb0e0', '#3a2a20', .5); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d4', 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -12; sun.shadow.camera.right = 12; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
sun.shadow.camera.near = .5; sun.shadow.camera.far = 50;
sun.shadow.bias = -.0008; sun.shadow.normalBias = .035;
sun.target.position.set(-4.5, 0, -1);
scene.add(sun, sun.target);
const tvLight = new THREE.PointLight('#6f8cff', 1.2, 7, 1.6); tvLight.position.set(0, 1.5, -2.3); scene.add(tvLight);
const fillLight = new THREE.PointLight('#ffd6a8', 0, 8, 1.4); fillLight.position.set(0, 2.6, 2.2); scene.add(fillLight);
const bounce = new THREE.PointLight('#ffd9a8', 0, 0, 1.2); bounce.position.set(-1.6, .5, -.9); scene.add(bounce);

/* =====================================================================
   PARTICLES: steam + dust motes (layer FX)
   ===================================================================== */
function makePoints(n, color, size){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  const m = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ color:{ value:new THREE.Color(color) }, size:{ value:size }, scale:{ value:300 } },
    vertexShader:`attribute float alpha; varying float vA; uniform float size; uniform float scale;
      void main(){ vA = alpha; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = max(1.0, floor(size*scale/-mv.z + .5)); }`,
    fragmentShader:`uniform vec3 color; varying float vA; void main(){ if (vA < .01) discard; gl_FragColor = vec4(color, vA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; fx_(p); scene.add(p);
  return p;
}
const steamMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false,
  uniforms:{ time:{ value:0 }, hot:{ value:1 }, color:{ value:new THREE.Color('#d9d3c9') } },
  vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`uniform float time, hot; uniform vec3 color; varying vec2 vUv;
    void main(){
      vec2 uv = vUv; float y = uv.y; float a = 0.0;
      for (int i=0;i<3;i++){
        float fi = float(i), ph = fi*2.1;
        float cx = .5 + (fi-1.0)*.13 + sin(y*7.0 - time*1.8 + ph)*.16*y + sin(y*15.0 - time*2.6 + ph*1.7)*.04*y;
        float w = mix(.075, .045, y);
        float line = smoothstep(w, w*.35, abs(uv.x - cx));
        float puff = smoothstep(.15, .45, fract(y*1.7 - time*.45 + fi*.37));
        a = max(a, line * puff * (1.0 - fi*.15));
      }
      a *= smoothstep(0.0, .1, y) * smoothstep(1.0, .55, y) * hot;
      a = a > .5 ? .3 : (a > .22 ? .13 : 0.0);
      if (a <= 0.0) discard;
      gl_FragColor = vec4(color, a);
    }`,
});
const steam = new THREE.Mesh(new THREE.PlaneGeometry(.2, .34), steamMat);
steam.frustumCulled = false; fx_(steam); scene.add(steam);
const dust = makePoints(90, '#fff4d8', .007);
const dustP = Array.from({length:90}, ()=>({ u:Math.random(), v:Math.random(), w:Math.random(), ph:Math.random()*6.28 }));

const shaftMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
  uniforms:{ color:{ value:new THREE.Color('#ffe2b0') }, strength:{ value:0 }, time:{ value:0 } },
  vertexShader:`attribute float along; varying float vAl; varying vec3 vP; void main(){ vAl = along; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`uniform vec3 color; uniform float strength; uniform float time; varying float vAl; varying vec3 vP;
    void main(){ float a = pow(1.0 - vAl, 1.6) * strength; a *= .75 + .25*sin(vP.z*9.0 + vP.y*5.0 + time*.4); gl_FragColor = vec4(color*a, 1.0); }`,
});
const shaftGeo = new THREE.BufferGeometry();
shaftGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(8*3), 3));
shaftGeo.setAttribute('along', new THREE.Float32BufferAttribute([0,0,0,0,1,1,1,1], 1));
shaftGeo.setIndex([0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7]);
const shaft = new THREE.Mesh(shaftGeo, shaftMat); shaft.frustumCulled = false; fx_(shaft); scene.add(shaft);
function updateShaft(dir){
  const W = ROOM.win, x = ROOM.xl - .12, L = 5.5;
  const c = [[W.z0+.05,W.y0+.05],[W.z1-.05,W.y0+.05],[W.z1-.05,W.y1-.05],[W.z0+.05,W.y1-.05]];
  const p = shaftGeo.attributes.position;
  c.forEach(([z,y],i)=>{ p.setXYZ(i, x, y, z); p.setXYZ(i+4, x+dir.x*L, y+dir.y*L, z+dir.z*L); });
  p.needsUpdate = true; shaftGeo.computeBoundingSphere();
}
