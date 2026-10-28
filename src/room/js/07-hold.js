/* =====================================================================
   HOLDING THINGS
   An object is lifted off its spot into a pivot that flies to the centre
   of the view. It can be turned with a drag, tilts toward the cursor,
   and a second click uses it. Clicking anywhere else puts it back exactly
   where it was.
   ===================================================================== */
const HOLD_D = .62;                                  // metres in front of the camera
const qE = (x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
const Q_FLAT = qE(Math.PI/2, 0, 0);                  // lying face-up -> facing the camera
const HOLD = { id:null, busy:false, dim:0, phase:null, t:0, drag:null, dragged:false };
const SPEC = {
  magazine: { q:Q_FLAT, frac:.8, spring:true },
  phone:    { q:Q_FLAT, frac:.8, spring:true },
  gameboy:  { q:Q_FLAT, frac:.8 },
  'cart-exp':{ q:qE(Math.PI/2-.25, .35, 0), frac:.5 }, 'cart-fall':{ q:qE(Math.PI/2-.25, .35, 0), frac:.5 }, 'cart-skl':{ q:qE(Math.PI/2-.25, .35, 0), frac:.5 }, 'cart-time':{ q:qE(Math.PI/2-.25, .35, 0), frac:.5 },
  coffee:   { q:qE(.38, -.55, 0), frac:.6, d:.85 },
  succulent:{ q:qE(.55, 0, 0), frac:.6, d:.85 },
  kp17:     { q:qE(.12, -.5, 0), frac:.56, d:1.25 },
  album:    { q:qE(0, .22, 0), frac:.64 },
};
function specFor(id){ return SPEC[id] || (id.startsWith('album-') ? SPEC.album : SPEC.coffee); }

const _m4 = new THREE.Matrix4(), _b = new THREE.Box3();
function localBox(obj, filter){
  obj.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert(), box = new THREE.Box3();
  obj.traverse(c=>{
    if (!c.isMesh || !c.visible || !c.layers.isEnabled(0) || (filter && !filter(c))) return;
    if (!c.geometry.boundingBox) c.geometry.computeBoundingBox();
    _b.copy(c.geometry.boundingBox).applyMatrix4(_m4.multiplyMatrices(inv, c.matrixWorld)); box.union(_b);
  });
  return box;
}
function fitScale(box, q, frac){
  const pts = [];
  for (let i=0;i<8;i++) pts.push(V3(i&1?box.max.x:box.min.x, i&2?box.max.y:box.min.y, i&4?box.max.z:box.min.z).applyQuaternion(q));
  const ex = Math.max(...pts.map(p=>p.x)) - Math.min(...pts.map(p=>p.x));
  const ey = Math.max(...pts.map(p=>p.y)) - Math.min(...pts.map(p=>p.y));
  const vh = viewH(holdDist()), vw = vh * camera.aspect;
  return Math.min(frac*vh/ey, Math.min(.94, frac*1.25)*vw/ex);
}
/* texels the given local length occupies on screen once held at scale s */
const pxFor = (len, s)=>Math.round(len * s / viewH(holdDist()) * RH * .86);
function holdDist(){ return (HOLD.spec && HOLD.spec.d) || HOLD_D; }   // a little under 1:1 so pixels only ever double, never drop

function pickUp(id, opts={}){
  if (HOLD.id || HOLD.busy || STATE.zone !== 'room') return;
  const it = INTERACT[id]; if (!it || it.kind !== 'hold') return;
  const obj = it.obj, spec = specFor(id);
  HOLD.spec = spec;
  if (STATE.hovered){ setMask(INTERACT[STATE.hovered].obj, false); STATE.hovered = null; }
  const box = localBox(obj);
  const center = box.getCenter(V3());
  const worldCenter = obj.localToWorld(center.clone());
  const q0 = obj.getWorldQuaternion(new THREE.Quaternion());
  const pivot = new THREE.Object3D(); pivot.position.copy(worldCenter); scene.add(pivot); pivot.updateMatrixWorld();
  const saved = { parent:obj.parent, pos:obj.position.clone(), quat:obj.quaternion.clone(), scale:obj.scale.clone() };
  pivot.attach(obj);
  const shadows = []; obj.traverse(c=>{ if (c.isMesh){ shadows.push([c, c.castShadow]); c.castShadow = false; } });
  setMask(obj, true);
  Object.assign(HOLD, {
    id, it, obj, spec, pivot, saved, shadows, q0inv:q0.clone().invert(), start:worldCenter.clone(),
    box, fitBox:box.clone(), frac:spec.frac, focus:center.clone(), focusT:center.clone(),
    s:1, sT:fitScale(box, spec.q, spec.frac), t:0, phase:'up', busy:true,
    viaKey:false, userQ:new THREE.Quaternion(), tilt:{ x:0, y:0 }, vel:{ x:0, y:0 }, useQ:new THREE.Quaternion(), useP:V3(), anim:null, mode:'closed',
  });
  HOLD.s = HOLD.sT;
  if (BLOBS[id]) BLOBS[id].userData.fade = true;
  const onPick = ON_PICK[id] || (id.startsWith('album-') ? ON_PICK.album : null);
  if (onPick) onPick(opts);
  sfx.pick();
  announce(holdDescription(id));
  hotRefresh();
}
function putDown(){
  if (!HOLD.id || HOLD.phase === 'down') return;
  const id = HOLD.id;
  const onPut = ON_PUT[id] || (id.startsWith('album-') ? ON_PUT.album : null);
  if (onPut) onPut();
  HOLD.phase = 'down'; HOLD.busy = true;
  sfx.put();
  hotHide();
  announce('Put it back.');
}
function finishPutDown(){
  const { obj, saved, pivot, shadows, id } = HOLD;
  saved.parent.attach(obj);
  obj.position.copy(saved.pos); obj.quaternion.copy(saved.quat); obj.scale.copy(saved.scale);
  scene.remove(pivot);
  shadows.forEach(([c,v])=>c.castShadow = v);
  setMask(obj, false);
  if (BLOBS[id]) BLOBS[id].userData.fade = false;
  const after = HOLD.after; HOLD.after = null;
  HOLD.id = null; HOLD.busy = false; HOLD.phase = null; HOLD.obj = null;
  if (ON_DONE[id]) ON_DONE[id]();
  if (after) after();
}
/* change what part of the object is framed, and how big */
function reframe(localBox_, frac, focusLocal){
  HOLD.fitBox = localBox_; HOLD.frac = frac;
  HOLD.sT = fitScale(localBox_, HOLD.spec.q, frac);
  HOLD.focusT = focusLocal || localBox_.getCenter(V3());
}

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = V3(), _v2 = V3();
function holdUpdate(dt){
  HOLD.dim = damp(HOLD.dim, HOLD.id && HOLD.phase !== 'down' ? 1 : 0, 7, dt);
  holdLightsUpdate(dt);
  albumTick(dt);
  for (const k in BLOBS){ const b = BLOBS[k]; b.material.opacity = damp(b.material.opacity, b.userData.fade ? 0 : b.userData.op, 9, dt); }
  if (ROOM.drop){ const d = ROOM.drop; d.t = Math.min(1, d.t + dt/.45); d.obj.position.y = d.y + (1 - easeOut(d.t))*.16 + Math.sin(d.t*Math.PI)*.0; if (d.t >= 1){ d.obj.position.y = d.y; ROOM.drop = null; } }
  if (!HOLD.id) return;
  if (HOLD.refit){ HOLD.refit = false; if (HOLD.exactFn) HOLD.exactFn(); else HOLD.sT = fitScale(HOLD.fitBox, HOLD.spec.q, HOLD.frac); }
  // reading: finer render, and the surface being read is drawn clean
  const reading = HOLD.phase !== 'down' && ((HOLD.id === 'magazine' && HOLD.mode !== 'closed') || (HOLD.id === 'phone' && HOLD.phase === 'held'));
  HOLD.crisp = reading || (HOLD.id === 'gameboy' && HOLD.mode === 'lean' && HOLD.phase !== 'down');
  if (reading !== !!STATE.reading){ setReading(reading); if (HOLD.exactFn) HOLD.exactFn(); }
  const dur = reduceMotion ? .01 : (HOLD.phase === 'up' ? .55 : .48);
  if (HOLD.phase === 'up'){ HOLD.t = Math.min(1, HOLD.t + dt/dur); if (HOLD.t >= 1){ HOLD.phase = 'held'; HOLD.busy = false; if (HOLD.onHeld){ const f = HOLD.onHeld; HOLD.onHeld = null; f(); } } }
  if (HOLD.phase === 'down'){ HOLD.t = Math.max(0, HOLD.t - dt/dur); if (HOLD.t <= 0){ finishPutDown(); return; } }
  const e = ease(HOLD.t);
  HOLD.s = damp(HOLD.s, HOLD.sT, 7, dt); if (Math.abs(HOLD.s - HOLD.sT) < HOLD.sT*.003) HOLD.s = HOLD.sT;
  HOLD.focus.lerp(HOLD.focusT, 1 - Math.exp(-7*dt));

  // turning: drag inertia, springs back for things meant to be read
  if (!HOLD.drag){
    if (Math.abs(HOLD.vel.x) + Math.abs(HOLD.vel.y) > .0001){
      _q.setFromAxisAngle(V3(0,1,0), HOLD.vel.x); _q2.setFromAxisAngle(V3(1,0,0), HOLD.vel.y);
      HOLD.userQ.premultiply(_q).premultiply(_q2);
      HOLD.vel.x *= Math.exp(-4.5*dt); HOLD.vel.y *= Math.exp(-4.5*dt);
    }
    if (HOLD.spec.spring || HOLD.mode !== 'closed'){ HOLD.userQ.slerp(_q.identity(), 1 - Math.exp(-3.5*dt)); if (STATE.reading && Math.abs(HOLD.userQ.w) > .99999) HOLD.userQ.identity(); }
  }
  // the held thing leans toward the cursor
  const tx = STATE.pointerIn && !HOLD.drag && !reduceMotion ? STATE.pointer.y * -.2 : 0;
  const ty = STATE.pointerIn && !HOLD.drag && !reduceMotion ? STATE.pointer.x * .3 : 0;
  const k = STATE.reading ? 0 : HOLD.mode === 'closed' ? 1 : .35;
  HOLD.tilt.x = damp(HOLD.tilt.x, tx*k, 5, dt); HOLD.tilt.y = damp(HOLD.tilt.y, ty*k, 5, dt);
  if (HOLD.anim){ HOLD.anim.t += dt; if (!HOLD.anim.step(HOLD.anim.t)) { HOLD.anim = null; HOLD.useQ.identity(); HOLD.useP.set(0,0,0); } }

  const camQ = camera.getWorldQuaternion(new THREE.Quaternion());
  const bob = reduceMotion || STATE.reading ? 0 : Math.sin(STATE.t*1.6)*.004;
  const qHeld = camQ.clone()
    .multiply(qE(HOLD.tilt.x, HOLD.tilt.y, 0))
    .multiply(HOLD.useQ).multiply(HOLD.userQ).multiply(HOLD.spec.q).multiply(HOLD.q0inv);
  const D = holdDist();
  const yComp = CAM.shift * D * Math.tan(camera.fov*Math.PI/360);
  const holdPoint = camera.localToWorld(V3(HOLD.useP.x, yComp + bob + HOLD.useP.y, -D + HOLD.useP.z));
  // where the focus point sits inside the pivot
  const obj = HOLD.obj;
  _v.copy(HOLD.focus).multiply(obj.scale).applyQuaternion(obj.quaternion).add(obj.position);
  const heldPos = holdPoint.sub(_v.applyQuaternion(qHeld).multiplyScalar(HOLD.s));
  const p = HOLD.pivot;
  p.position.lerpVectors(HOLD.start, heldPos, e);
  p.position.y += Math.sin(e*Math.PI) * .14 * (HOLD.phase === 'down' ? .6 : 1);
  p.quaternion.identity().slerp(qHeld, e);
  p.scale.setScalar(lerp(1, HOLD.s, e));
  p.updateMatrixWorld(true);
  // land the page's texels exactly on screen pixels once it has settled
  if (STATE.reading && HOLD.snapRef && e >= 1 && !HOLD.drag && HOLD.s === HOLD.sT && HOLD.focus.distanceTo(HOLD.focusT) < 1e-5 && Math.abs(HOLD.tilt.x) + Math.abs(HOLD.tilt.y) < 1e-4){
    const ref = HOLD.snapRef().project(camera);
    const px = (ref.x*.5+.5)*RW, py = (-ref.y*.5+.5)*RH;
    const pw = viewH(D) / RH;
    const right = V3(1,0,0).applyQuaternion(camQ), up = V3(0,1,0).applyQuaternion(camQ);
    p.position.addScaledVector(right, -(px - Math.round(px))*pw).addScaledVector(up, (py - Math.round(py))*pw);
    p.updateMatrixWorld(true);
  }
  hotUpdate();
}
function holdLightsUpdate(dt){
  const on = HOLD.id && HOLD.phase !== 'down' ? 1 : 0;
  const far = holdDist() / HOLD_D, dark = HOLD.id === 'kp17' ? 3.4 : 1;
  holdKey.intensity = damp(holdKey.intensity, on * .75 * far*far * dark, 6, dt);
  holdRim.intensity = damp(holdRim.intensity, on * .45 * far*far * dark, 6, dt);
}

/* rotate with a drag */
function holdDrag(dx, dy){
  const a = dx * .011, b = dy * .011;
  _q.setFromAxisAngle(V3(0,1,0), a); _q2.setFromAxisAngle(V3(1,0,0), b);
  HOLD.userQ.premultiply(_q).premultiply(_q2);
  HOLD.vel.x = a*.5; HOLD.vel.y = b*.5;
}
function holdRotateKey(dx, dy){ HOLD.vel.x += dx*.06; HOLD.vel.y += dy*.06; }

/* what a click on the held object hit */
function holdHit(){
  if (!HOLD.obj) return null;
  const meshes = []; HOLD.obj.traverse(c=>{ if (c.isMesh && c.visible && c.layers.isEnabled(0)) meshes.push(c); });
  return rayFromPointer().intersectObjects(meshes, false)[0] || null;
}

/* =====================================================================
   PER-ITEM BEHAVIOUR
   ===================================================================== */
const ON_PICK = {}, ON_PUT = {}, ON_DONE = {}, ON_USE = {};

/* ---- magazine ---- */
function magPortrait(){ return camera.aspect < .9; }
function magFrame(){
  const { w, h } = MAG, top = MAG.block + MAG.N*MAG.eps;
  HOLD.exactFn = null; HOLD.snapRef = null;
  if (HOLD.mode === 'closed'){ reframe(new THREE.Box3(V3(-w/2, 0, -h/2), V3(w/2, top, h/2)), .8); return; }
  if (!magPortrait()) reframe(new THREE.Box3(V3(-3*w/2, 0, -h/2), V3(w/2, top, h/2)), .88, V3(-w/2, top, 0));
  else { const left = MAG.focusSide === 'L'; reframe(new THREE.Box3(V3(left ? -3*w/2 : -w/2, 0, -h/2), V3(left ? -w/2 : w/2, top, h/2)), .92); }
  HOLD.exactFn = ()=>{ magFrame.fit(); magExact(); };
  magFrame.fit = ()=>{ HOLD.sT = fitScale(HOLD.fitBox, HOLD.spec.q, HOLD.frac); };
  HOLD.snapRef = ()=>magazine.localToWorld(V3(-w/2, top, -h/2));
  if (STATE.reading) magExact();
}
/* text unit: how many screen pixels one font pixel takes, so caps land near 11 css px */
function readUnit(){ return Math.max(1, Math.ceil(10.5 / (7 * RS / DPR))); }
/* paint a page small, then blow it up by a whole number so every font pixel is a clean block */
function paintScaled(mat, W, H, u, painter){
  repaint(mat, W, H, (ctx)=>{ const [c, cx] = makeCanvas(W/u, H/u); painter(cx, W/u, H/u); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 0, 0, W, H); });
}
function magExact(){
  // framing first (what fits), then shrink to the nearest size where a page texel is exactly one screen pixel
  const u = readUnit();
  const pagePx = MAG.h * HOLD.sT / viewH(holdDist()) * RH;
  const ph = Math.max(4*u, Math.floor(pagePx / (4*u)) * 4*u), pw = ph * 3/4;
  HOLD.sT = ph * viewH(holdDist()) / (MAG.h * RH);
  if (!MAG.painted || MAG.painted[0] !== pw || MAG.painted[1] !== ph || MAG.painted[2] !== u) magPaintPages(pw, ph, u);
}
function magPaintPages(pw, ph, u){
  MAG.leaves.forEach(L=>{ paintScaled(L.recto, pw, ph, u, magPainter(L.k, 'r')); paintScaled(L.verso, pw, ph, u, magPainter(L.k, 'v')); });
  paintScaled(MAG.insideBack, pw, ph, u, PAGE.colophon);
  MAG.leaves.forEach(L=>{ L.recto.emissiveIntensity = L.verso.emissiveIntensity = .55; });
  MAG.insideBack.emissiveIntensity = .55;
  MAG.painted = [pw, ph, u];
}
ON_PICK.magazine = ()=>{
  HOLD.mode = 'closed'; MAG.focusSide = 'L';
  const sC = fitScale(new THREE.Box3(V3(-MAG.w/2,0,-MAG.h/2), V3(MAG.w/2,.01,MAG.h/2)), Q_FLAT, .8);
  const ph = clamp(pxFor(MAG.h, sC), 96, 420);
  repaint(MAG.leaves[0].recto, Math.round(ph*MAG.w/MAG.h), ph, PAGE.cover);
  MAG.leaves[0].recto.emissiveIntensity = .3;
  magFrame();
};
ON_PUT.magazine = ()=>{ if (MAG.spread) magSetSpread(0, .05); HOLD.exactFn = null; HOLD.snapRef = null; };
ON_DONE.magazine = ()=>{ const r = MAG.leaves[0].recto; r.map = texMagCover; r.emissiveMap = texMagCover; r.emissiveIntensity = .2; r.needsUpdate = true; };
ON_USE.magazine = (hit, key)=>{
  if (HOLD.mode === 'closed'){
    HOLD.mode = 'open'; MAG.focusSide = 'L'; setReading(true); magSetSpread(1); sfx.page(); magFrame(); announce(magPageText(1)); return;
  }
  let side = key || 'R';
  const portrait = magPortrait();
  if (hit && !key){ if (portrait) side = STATE.pointer.x < -.2 ? 'L' : 'R'; else { const lp = MAG_LOCAL(hit.point); side = lp.x < -MAG.w/2 ? 'L' : 'R'; } }
  if (side === 'R'){
    if (portrait && MAG.focusSide === 'L'){ MAG.focusSide = 'R'; magFrame(); sfx.tick(true); return; }
    if (MAG.spread >= MAG.N){ magSetSpread(0, .06); HOLD.mode = 'closed'; magFrame(); sfx.page(); announce('Closed the magazine.'); return; }
    magSetSpread(MAG.spread + 1); MAG.focusSide = 'L';
  } else {
    if (portrait && MAG.focusSide === 'R'){ MAG.focusSide = 'L'; magFrame(); sfx.tick(true); return; }
    if (MAG.spread <= 1){ magSetSpread(0); HOLD.mode = 'closed'; magFrame(); sfx.page(); announce('Closed the magazine.'); return; }
    magSetSpread(MAG.spread - 1); MAG.focusSide = 'R';
  }
  sfx.page(); magFrame(); announce(magPageText(MAG.spread));
};
function MAG_LOCAL(p){ return magazine.worldToLocal(p.clone()); }

/* ---- phone ---- */
function phoneExact(){
  const sFit = fitScale(HOLD.box, Q_FLAT, .82);
  const ph = Math.max(40, Math.floor(PH.sh * sFit / viewH(holdDist()) * RH));
  const pw = Math.round(ph * PH.sw / PH.sh);
  HOLD.sT = ph * viewH(holdDist()) / (PH.sh * RH);
  PH.screen.scale.x = (pw/ph) / (PH.sw/PH.sh);           // a hair of stretch so both axes land 1:1
  if (PH.pw !== pw || PH.ph !== ph){ PH.pw = pw; PH.ph = ph; PH.dirty = true; }
}
ON_PICK.phone = ()=>{ PH.held = true; PH.hover = null; HOLD.onHeld = ()=>{ HOLD.exactFn = phoneExact; HOLD.snapRef = ()=>PH.screen.localToWorld(V3(-PH.sw/2, PH.sh/2, 0)); setReading(true); phoneExact(); }; };
ON_PUT.phone = ()=>{ PH.held = false; PH.hover = null; HOLD.exactFn = null; HOLD.snapRef = null; };
ON_DONE.phone = ()=>{ PH.mat.map = PH.tableTex; PH.mat.needsUpdate = true; PH.screen.scale.x = 1; PH.pw = 0; };
const APP_LINES = { calendar:'nothing booked. good.', clock:'it\u2019s later than you think', camera:'say cheese', notes:'todo: finish BREAD v2', maps:'you are here', news:'no news is good news', podcasts:'queue: 41 episodes', appstore:'everything\u2019s up to date', health:'step count: suspiciously low', settings:'it\u2019s fine as it is', shortcuts:'ship it', mail:'6,608 unread. not today', reminders:'drink water', phone:'no signal in here', safari:'it\u2019s already open', messages:'no new messages', music:'the records are on the wall', batteries:'100%. always.' };
ON_USE.phone = (hit)=>{
  if (!hit || hit.object !== PH.screen || !hit.uv || !PH.pw) return;
  const x = hit.uv.x * PH.pw, y = (1 - hit.uv.y) * PH.ph;
  const r = PH.rects.find(r=>x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (!r || r.url) return;
  PH.pressed = r.id; PH.pressT = STATE.t; PH.dirty = true; sfx.tick(true);
  if (APP_LINES[r.id]) say(phone, APP_LINES[r.id]);
};

/* ---- game boy (+ cartridges) ---- */
function gbFrame(){
  if (GBOS.power && HOLD.mode === 'lean'){
    const c = GBG.lcd.position, hw = GBG.lw/2, hh = GBG.lh/2;
    reframe(new THREE.Box3(V3(c.x-hw, c.y, c.z-hh), V3(c.x+hw, c.y+.001, c.z+hh)), .56, V3(c.x, c.y, c.z + hh*.25));
  } else reframe(HOLD.box, .8, HOLD.box.getCenter(V3()));
}
function gbPowerOn(){ GBOS.power = true; GBOS.state = 'boot'; GBOS.t0 = STATE.t; GBOS.chimed = false; GBOS.scroll = 0; HOLD.mode = 'lean'; gbFrame(); sfx.power(); announce(GBOS.cart ? 'The Game Boy boots the ' + CART_NAME[GBOS.cart] + ' cartridge.' : 'The Game Boy is on. No cartridge.'); }
const CART_NAME = { exp:'experience', skl:'skills', time:'unlabelled', fall:'Blockfall' };
ON_PICK.gameboy = (opts)=>{
  HOLD.mode = 'closed';
  const c = GBG.lcd.position; const sLean = fitScale(new THREE.Box3(V3(c.x-GBG.lw/2, c.y, c.z-GBG.lh/2), V3(c.x+GBG.lw/2, c.y+.001, c.z+GBG.lh/2)), Q_FLAT, .56);
  const fw = clamp(pxFor(GBG.w, sLean), 64, 900); repaint(GBG.faceMat, fw, Math.round(fw*104/64), paintGBFace);
  if (opts.cart){ GBOS.cart = opts.cart; GBG.cartMat.map = CART_TEX[opts.cart]; GBG.cartMat.needsUpdate = true; GBG.cart.visible = true; HOLD.onHeld = gbPowerOn; }
  else { GBOS.cart = null; GBG.cart.visible = false; }
};
ON_PUT.gameboy = ()=>{ GBOS.power = false; GBOS.state = 'off'; };
ON_DONE.gameboy = ()=>{
  GBG.faceMat.map = texGBFace; GBG.faceMat.needsUpdate = true;
  if (GBOS.cart){ const c = carts[GBOS.cart]; c.visible = true; ROOM.drop = { obj:c, y:c.userData.y0, t:0 }; if (BLOBS['cart-'+GBOS.cart]) BLOBS['cart-'+GBOS.cart].userData.fade = false; GBG.cart.visible = false; GBOS.cart = null; }
};
ON_USE.gameboy = (hit, key)=>{
  const n = hit ? hit.object.name : '';
  if (!GBOS.power){ gbPowerOn(); return; }
  if (key){ gbInput(key); return; }
  if (n === 'gbLCD'){ const uv = hit.uv; gbTap(uv.x*160, (1-uv.y)*144); return; }
  if (n === 'gbA'){ gbInput('a'); return; }
  if (n === 'gbB'){ gbInput('b'); return; }
  if (n === 'gbDpad'){ const lp = GBG.dpad.worldToLocal(hit.point.clone()); gbInput(Math.abs(lp.x) > Math.abs(lp.z) ? (lp.x > 0 ? 'right' : 'left') : (lp.z > 0 ? 'down' : 'up')); return; }
  HOLD.mode = HOLD.mode === 'lean' ? 'closed' : 'lean'; gbFrame(); sfx.tick(true);
};
['exp','skl','time','fall'].forEach(c=>{
  ON_USE['cart-'+c] = ()=>{
    // the cartridge goes into the Game Boy, and the Game Boy comes up
    if (HOLD.busy) return;
    HOLD.after = ()=>{ carts[c].visible = false; if (BLOBS['cart-'+c]) BLOBS['cart-'+c].userData.fade = true; pickUp('gameboy', { cart:c }); };
    HOLD.phase = 'down'; HOLD.busy = true; sfx.insert(); hotHide();
  };
});

/* ---- coffee ---- */
ON_USE.coffee = ()=>{
  if (HOLD.anim) return;
  if (coffee.level <= .05){
    HOLD.anim = { t:0, step:(t)=>{ coffee.level = Math.min(1, t/1.1); return t < 1.1; } }; sfx.pour(); say(mug, 'refilled'); announce('Refilled.'); return;
  }
  ROOM.sipT = 1.25; sfx.sip();
  let drank = false;
  HOLD.anim = { t:0, step:(t)=>{
    const k = Math.sin(clamp(t/1.25, 0, 1)*Math.PI);
    HOLD.useQ.setFromEuler(new THREE.Euler(k*.95, 0, -k*.12));
    HOLD.useP.set(0, k*.06, k*.16);
    if (!drank && t > .6){ drank = true; coffee.level = Math.max(0, coffee.level - .34); say(mug, coffee.level <= .05 ? 'last sip' : ['sip', 'still hot', 'good beans'][coffee.sips++ % 3]); }
    if (t >= 1.25){ ROOM.sipT = 0; return false; } return true; } };
  announce(coffee.level - .34 <= .05 ? 'Last sip.' : 'A sip.');
};

/* ---- succulent ---- */
const SUCC_LINES = ['it didn\u2019t need that', 'thriving', 'okay, that\u2019s enough water'];
ON_USE.succulent = ()=>{ ROOM.rosetteWiggle = 1; sfx.water(); say(succulent, SUCC_LINES[((ROOM.watered = (ROOM.watered||0) + 1) - 1) % 3]); };

/* ---- KP17 ---- */
ON_USE.kp17 = ()=>{ if (!(ROOM.wave > 0)){ ROOM.wave = 2.2; sfx.servo(); say(kp17, 'hi'); } };

/* ---- albums: turning the sleeve slides the record out ---- */
ON_PICK.album = ()=>{
  const g = HOLD.obj, a = g.userData.album;
  const px = clamp(pxFor(ALBUM_SIZE, HOLD.sT), 64, 360);
  repaint(g.userData.back, px, px, (ctx,W,H)=>paintAlbumBack(ctx, W, H, a));
  g.userData.slide = 1;
  // frame the sleeve plus the record sticking out of it
  const box = HOLD.box.clone(); box.max.x += ALBUM_SIZE*.42;
  reframe(box, .66, box.getCenter(V3()));
};
ON_PUT.album = ()=>{ HOLD.obj.userData.slide = 0; };
function albumTick(dt){
  for (const g of albums){ const d = g.userData.disc, want = g.userData.slide ? ALBUM_SIZE*.42 : 0; d.position.x = damp(d.position.x, want, 6, dt); d.rotation.z -= g.userData.slide ? dt*.6 : 0; d.position.z = d.position.x > .01 ? -.0045 : 0; }
}

function useHeld(hit, key){
  const id = HOLD.id; if (!id || HOLD.busy) return;
  const f = ON_USE[id];
  if (f) f(hit, key);
}
function holdDescription(id){
  const d = {
    magazine:'Holding the magazine, Arahe No. 06. Press Enter to open it; arrow keys turn pages; Escape puts it down.',
    phone:'Holding the phone. Its apps link to GitHub, LinkedIn and the previous portfolio. Tab to an app and press Enter.',
    gameboy:'Holding the Game Boy. Press Enter to switch it on. It needs a cartridge from the table.',
    coffee:'Holding the coffee. Press Enter to take a sip.', succulent:'Holding the succulent.', kp17:'Holding the KP17 desk model, a 17-DOF humanoid. Press Enter and it waves.',
    'cart-exp':'Holding the red cartridge: experience. Press Enter to put it in the Game Boy.', 'cart-fall':'Holding a grey cartridge: Blockfall. Press Enter to put it in the Game Boy.', 'cart-skl':'Holding the blue cartridge: skills. Press Enter to put it in the Game Boy.', 'cart-time':'Holding an unlabelled yellow cartridge. Press Enter to put it in the Game Boy.',
  };
  if (id.startsWith('album-')){ const a = INTERACT[id].album; return `Holding ${a.title} by ${a.artist}, ${a.year}. Tab to the link and press Enter to open it on Apple Music.`; }
  return d[id] || 'Holding it.';
}
