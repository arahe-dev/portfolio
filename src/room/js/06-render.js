/* =====================================================================
   RENDERER — scene at low resolution into float targets, then a pixel
   post pass: depth/normal outlines, hover outline, dim-behind-held-item,
   tone map, ordered dither + posterise. Upscaled with hard pixels.
   ===================================================================== */
const canvas = document.getElementById('view');
const marks = document.getElementById('marks');
const mctx = marks.getContext('2d');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias:false, powerPreference:'high-performance' }); } catch (e) { renderer = null; }

const camera = new THREE.PerspectiveCamera(43, 16/9, .05, 60);
scene.add(camera);
const CAM = { base:V3(0, 1.68, 5.0), lookDown:11.5*Math.PI/180, shift:0 };
camera.position.copy(CAM.base);
/* key + rim light that travel with the camera: they only reach things held close */
const holdKey = new THREE.PointLight('#fff1dc', 0, 3, 2); holdKey.position.set(-.35, .42, -.15); camera.add(holdKey);
const holdRim = new THREE.PointLight('#9fb4ff', 0, 3, 2); holdRim.position.set(.55, .1, -1.6); camera.add(holdRim);

let RW = 320, RH = 180, SCALE = 3, RS = 3, DPR = 1, MW = 320, MH = 180;   // RS: render scale (finer while reading); MW/MH: overlay text grid
let rtColor, rtNormal, rtMask;
function makeTargets(){
  [rtColor, rtNormal, rtMask].forEach(t=>t && t.dispose());
  const common = { minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter, generateMipmaps:false };
  rtColor = new THREE.WebGLRenderTarget(RW, RH, { ...common, type:THREE.HalfFloatType, depthTexture:new THREE.DepthTexture(RW, RH) });
  rtNormal = new THREE.WebGLRenderTarget(RW, RH, { ...common });
  rtMask = new THREE.WebGLRenderTarget(RW, RH, { ...common });
}

const post = new THREE.ShaderMaterial({
  uniforms:{
    tColor:{ value:null }, tDepth:{ value:null }, tNormal:{ value:null }, tMask:{ value:null },
    res:{ value:new THREE.Vector2(RW,RH) }, cNear:{ value:camera.near }, cFar:{ value:camera.far },
    exposure:{ value:1.0 }, hoverCol:{ value:new THREE.Color('#ffd76a') }, maskOn:{ value:0 }, hold:{ value:0 },
    levels:{ value:28 }, vignette:{ value:.32 }, crisp:{ value:0 },
  },
  vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader:`
    precision highp float;
    uniform sampler2D tColor, tDepth, tNormal, tMask;
    uniform vec2 res; uniform float cNear, cFar, exposure, maskOn, hold, levels, vignette, crisp;
    uniform vec3 hoverCol;
    varying vec2 vUv;
    float linD(vec2 uv){ float z = texture2D(tDepth, uv).r*2.0-1.0; return 2.0*cNear*cFar/(cFar+cNear - z*(cFar-cNear)); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).rgb*2.0-1.0; }
    const float B4[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    void edge(vec2 o, float d, vec3 n, inout float dd, inout float ne){
      vec2 uv = vUv + o/res;
      float dn = linD(uv); vec3 nn = nrm(uv);
      dd += clamp(dn - d, 0.0, 4.0);
      vec3 nd = n - nn;
      float nInd = clamp(smoothstep(-.01, .01, dot(nd, vec3(1.0))), 0.0, 1.0);
      float dInd = clamp(sign((d - dn) * .25 + .0025*d), 0.0, 1.0);
      ne += distance(n, nn) * dInd * nInd;
    }
    void main(){
      vec3 col = texture2D(tColor, vUv).rgb;
      float d = linD(vUv); vec3 n = nrm(vUv);
      float dd = 0.0, ne = 0.0;
      edge(vec2( 1, 0), d, n, dd, ne); edge(vec2(-1, 0), d, n, dd, ne);
      edge(vec2( 0, 1), d, n, dd, ne); edge(vec2( 0,-1), d, n, dd, ne);
      float m = maskOn > .5 ? texture2D(tMask, vUv).r : 0.0;
      float cr = crisp * m;                      // a held page or screen is drawn clean: no outlines, no dither
      float dEdge = step(.045*d + .02, dd) * (1.0 - cr);
      float nEdge = step(.45, ne) * (1.0 - dEdge) * (1.0 - cr);
      col *= 1.0 - dEdge*.5;
      col *= 1.0 + nEdge*.32;
      // the room recedes behind a held object
      float back = hold * (1.0 - m);
      float l0 = dot(col, vec3(.299,.587,.114));
      col = mix(col, vec3(l0)*vec3(.55,.6,.85), back*.55) * (1.0 - back*.62);
      col *= exposure;
      col = aces(col);
      float lum = dot(col, vec3(.299,.587,.114));
      col = mix(vec3(lum), col, 1.12);
      col += pow(1.0 - lum, 4.0) * vec3(.020, .012, .045);
      col = pow(max(col, 0.0), vec3(1.0/2.2));
      vec2 q = vUv - .5; q.x *= res.x/res.y;
      col *= 1.0 - (vignette + hold*.25)*pow(length(q)*1.05, 2.4) * (1.0 - cr);
      ivec2 p = ivec2(mod(gl_FragCoord.xy, 4.0));
      float b = B4[p.y*4 + p.x]/16.0;
      col = mix(floor(col*levels + b) / levels, col, cr);
      if (maskOn > .5 && hold < .01){
        float mm = max(max(texture2D(tMask, vUv + vec2(1,0)/res).r, texture2D(tMask, vUv - vec2(1,0)/res).r),
                       max(texture2D(tMask, vUv + vec2(0,1)/res).r, texture2D(tMask, vUv - vec2(0,1)/res).r));
        if (m < .5 && mm > .5) col = hoverCol;
        else if (m > .5) col = col*1.06 + vec3(.02,.015,0.0);
      }
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), post));
const normalMat = new THREE.MeshNormalMaterial({ side:THREE.DoubleSide });
const maskMat = new THREE.MeshBasicMaterial({ color:'#ffffff', side:THREE.DoubleSide });

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 4);
  const dw = Math.round(innerWidth*DPR), dh = Math.round(innerHeight*DPR);
  SCALE = Math.max(1, Math.round(innerWidth < innerHeight ? dw/290 : dh/300));
  RS = STATE.reading ? Math.max(1, Math.floor(SCALE/2)) : SCALE;
  RW = Math.ceil(dw / RS); RH = Math.ceil(dh / RS);
  MW = Math.ceil(dw / SCALE); MH = Math.ceil(dh / SCALE);
  if (!renderer) return;
  renderer.setPixelRatio(1);
  renderer.setSize(RW, RH, false);
  canvas.style.width = (RW*RS/DPR) + 'px'; canvas.style.height = (RH*RS/DPR) + 'px';
  marks.style.width = (MW*SCALE/DPR) + 'px'; marks.style.height = (MH*SCALE/DPR) + 'px';
  marks.width = MW; marks.height = MH;
  makeTargets();
  post.uniforms.res.value.set(RW, RH);
  camera.aspect = RW / RH;
  const aspect = RW / RH;
  const needW = aspect < 1 ? 2.05 : 2.5;
  const dist = CAM.base.z - TABLE.z;
  const vfovNeed = 2 * Math.atan((needW/2) / dist / aspect) * 180/Math.PI;
  camera.fov = clamp(Math.max(43, vfovNeed), 43, 76);
  CAM.lookDown = (aspect < 1 ? 13.5 : 11.5) * Math.PI/180;
  dust.material.uniforms.scale.value = RH * .5 / Math.tan(camera.fov*Math.PI/360);
  if (HOLD.id) HOLD.refit = true;
  if (TRIP.pos) tripCurves();
}
function applyProjection(){
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[9] = CAM.shift;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
const viewH = d=>2 * d * Math.tan(camera.fov*Math.PI/360);

/* ---------------- time of day ---------------- */
const LAMP_I = 1.9;
const TIME = { warp:null, h:0, last:-1, T:null, dirty:false };
function currentHour(){
  if (TIME.warp !== null) return TIME.warp;
  const d = new Date(); return d.getHours() + d.getMinutes()/60 + d.getSeconds()/3600;
}
function setWarp(v){ TIME.warp = v; TIME.dirty = true; }
function hourLabel(h){ const H = Math.floor(h), m = Math.floor((h-H)*60); return String(H).padStart(2,'0') + ':' + String(m).padStart(2,'0'); }
const STATE = { zone:'room', lampOverride:null, party:false, channel:0, channelFlash:0, hovered:null, keyHover:null, pointer:new THREE.Vector2(0,0), pointerIn:false, t:0, lampOn:false };
function applyTime(h){
  const T = sampleTime(h); TIME.T = T; TIME.h = h;
  hemi.color.set(T.hemi); hemi.groundColor.set(mix('#3a2a20', '#1a1418', T.stars)); hemi.intensity = T.amb * 2.1;
  bounce.color.set(mix(T.sunCol, '#c98a50', .45)); ROOM.base = ROOM.base || {}; ROOM.base.bounce = T.sun * 1.5;
  let dir;
  if (T.sun > .05){
    const dayT = clamp((h-5.5)/13.5, 0, 1);
    const elev = lerp(.12, .95, Math.sin(dayT*Math.PI));
    dir = V3(Math.cos(elev)*.95, -Math.sin(elev), lerp(.55, -.1, dayT)).normalize();
    sun.color.set(T.sunCol); ROOM.base.sun = T.sun;
  } else {
    dir = V3(.45, -.85, .3).normalize();
    sun.color.set('#9fb4ff'); ROOM.base.sun = .42*T.moon;
  }
  sun.position.copy(sun.target.position).addScaledVector(dir, -20);
  updateShaft(dir);
  shaftMat.uniforms.color.value.set(T.sun > .05 ? T.sunCol : '#9fb4ff');
  ROOM.base.shaft = T.sun > .05 ? clamp(T.sun*.05, 0, .12) : .03*T.moon;
  ROOM.base.dust = T.sun > .05 ? clamp(T.sun*.35, 0, .85) : .25*T.moon;
  const lampOn = STATE.lampOverride !== null ? STATE.lampOverride : T.lamp > .5;
  STATE.lampOn = lampOn;
  lampLight.intensity = lampOn ? LAMP_I : 0;
  lampShadeMat.emissiveIntensity = lampOn ? .85 : 0;
  fillLight.intensity = lampOn ? .55 : 0;
  post.uniforms.exposure.value = lerp(1.05, 1.25, T.stars);
}

/* ---------------- picking ---------------- */
const ray = new THREE.Raycaster();
function rayFromPointer(){ ray.setFromCamera(STATE.pointer, camera); ray.layers.set(0); return ray; }
function pick(){
  if (!STATE.pointerIn || STATE.zone === 'trip') return null;
  // the first thing under the pointer decides; things on the other side of the door don't count
  const hit = rayFromPointer().intersectObjects(pickables, false)[0];
  if (!hit) return null;
  const it = INTERACT[hit.object.userData.iid]; if (!it) return null;
  const z = it.zone || 'room';
  if (z !== 'any' && z !== STATE.zone) return null;
  STATE.lastHit = hit.point;
  return it.id;
}
function setMask(obj, on){ obj.traverse(c=>{ if (c.isMesh){ on ? c.layers.enable(L_MASK) : c.layers.disable(L_MASK); } }); }
function projectToCss(v){ const p = v.clone().project(camera); return [(p.x*.5+.5)*RW*RS/DPR, (-p.y*.5+.5)*RH*RS/DPR]; }
/* reading mode: the room renders at a finer pixel while a page or screen is held up to read */
function setReading(on){
  if (!!STATE.reading === !!on) return;
  STATE.reading = !!on; resize();
}

/* ---------------- camera ---------------- */
const parallax = { x:0, y:0 };
/* ---------------- the trip through the door and back ---------------- */
const TRIP = { t:0, dir:0, delay:0, start:null, pos:null, look:null };
function tripCurves(){
  const gz = DOOR.gap.z, portrait = camera.aspect < 1;
  const look = V3(-9.3, -.35, -1.8), pv = V3(-4.75, 1.95, -.85);
  if (portrait) pv.sub(look).multiplyScalar(1.16).add(look);
  const ahead = V3(CAM.base.x, CAM.base.y - Math.tan(CAM.lookDown)*10, CAM.base.z - 10);
  TRIP.pos = new THREE.CatmullRomCurve3([CAM.base.clone(), V3(-.95, 1.62, 1.75), V3(-2.25, 1.56, gz + .28), V3(-3.1, 1.56, gz), V3(-4.05, 1.86, gz + .08), pv], false, 'centripetal');
  TRIP.look = new THREE.CatmullRomCurve3([ahead, V3(-2.6, 1.2, -1.9), V3(-3.8, 1.3, gz), V3(-6.6, .55, gz - .12), V3(-8.5, .02, -1.45), look], false, 'centripetal');
}
function goOut(){
  if (STATE.zone !== 'room' || HOLD.id || HOLD.busy) return;
  if (STATE.hovered){ setMask(INTERACT[STATE.hovered].obj, false); STATE.hovered = null; }
  STATE.zone = 'trip'; DOOR.target = 1; sfx.slide(); TRIP.delay = reduceMotion ? 0 : .55; TRIP.dir = 1;
  TRIP.start = camera.position.clone(); tripCurves();
  announce('Out through the sliding door to the patio: a koi pond, a bridge and a shishi-odoshi. Escape or the door takes you back inside.');
  syncZoneUI();
}
function goIn(){
  if (STATE.zone !== 'patio') return;
  if (STATE.hovered){ setMask(INTERACT[STATE.hovered].obj, false); STATE.hovered = null; }
  STATE.zone = 'trip'; TRIP.dir = -1; TRIP.delay = 0; TRIP.start = null; tripCurves();
  announce('Back inside the living room.');
  syncZoneUI();
}
function tripUpdate(dt){
  if (!TRIP.dir) return;
  if (TRIP.delay > 0){ TRIP.delay -= dt; return; }
  TRIP.t = clamp(TRIP.t + TRIP.dir * dt / (reduceMotion ? .01 : 2.9), 0, 1);
  if (TRIP.dir > 0 && TRIP.t >= 1){ TRIP.dir = 0; STATE.zone = 'patio'; syncZoneUI(); }
  if (TRIP.dir < 0 && TRIP.t <= 0){ TRIP.dir = 0; STATE.zone = 'room'; DOOR.target = 0; sfx.slide(); syncZoneUI(); }
}
const _qa = new THREE.Quaternion(), _m4b = new THREE.Matrix4();
function updateCamera(dt){
  tripUpdate(dt);
  if (TRIP.t > 0 || TRIP.dir){
    if (!TRIP.pos) tripCurves();
    const e = ease(TRIP.t), w = clamp(e/.2, 0, 1), ws = w*w*(3 - 2*w);
    const pos = TRIP.pos.getPoint(e), look = TRIP.look.getPoint(e);
    // a little look-around once you're standing outside
    const settled = STATE.zone === 'patio' && !reduceMotion;
    const tx = settled && STATE.pointerIn ? STATE.pointer.x : 0, ty = settled && STATE.pointerIn ? STATE.pointer.y : 0;
    parallax.x = damp(parallax.x, tx, 2.6, dt); parallax.y = damp(parallax.y, ty, 2.6, dt);
    const right = V3().subVectors(look, pos).cross(V3(0,1,0)).normalize();
    pos.addScaledVector(right, parallax.x*.3*TRIP.t).add(V3(0, parallax.y*.14*TRIP.t, 0));
    look.addScaledVector(right, parallax.x*.12*TRIP.t);
    if (TRIP.start) pos.lerpVectors(TRIP.start, pos, ws);
    camera.position.copy(pos);
    _qa.setFromRotationMatrix(_m4b.lookAt(pos, look, V3(0,1,0)));
    camera.quaternion.identity().slerp(_qa, ws);
    CAM.shift = lerp(-Math.tan(CAM.lookDown) / Math.tan(camera.fov*Math.PI/360), 0, ws);
    applyProjection(); camera.updateMatrixWorld();
    return;
  }
  TRIP.start = null;
  const t = STATE.t, free = !HOLD.id && !reduceMotion;
  const tx = free && STATE.pointerIn ? STATE.pointer.x : 0, ty = free && STATE.pointerIn ? STATE.pointer.y : 0;
  parallax.x = damp(parallax.x, tx, 3.2, dt); parallax.y = damp(parallax.y, ty, 3.2, dt);
  const sway = reduceMotion ? 0 : 1;
  camera.position.set(CAM.base.x + parallax.x*.34 + Math.sin(t*.21)*.02*sway, CAM.base.y + parallax.y*.14 + Math.sin(t*.33)*.01*sway, CAM.base.z);
  camera.quaternion.identity();
  CAM.shift = -Math.tan(CAM.lookDown) / Math.tan(camera.fov*Math.PI/360) - parallax.y*.04;
  applyProjection();
  camera.updateMatrixWorld();
}

/* ---------------- frame ---------------- */
let lastT = performance.now();
const tmpV = V3();
const roombaAI = { target:V3(1,0,-1), speed:.32, spin:0, pause:0 };
function pickRoombaTarget(){
  for (let i=0;i<20;i++){
    const x = lerp(-2.5, 2.5, Math.random()), z = lerp(-2.1, 3.6, Math.random());
    if (z < -2.2 && (x < -1.7 || x > 2.0)) continue;
    roombaAI.target.set(x, 0, z); return;
  }
}
function frame(now){
  const dt = Math.min(.05, (now - lastT)/1000); lastT = now;
  STATE.t += dt; const t = STATE.t;

  const h = currentHour();
  if (Math.abs(h - TIME.last) > 1/60 || TIME.dirty){ applyTime(h); TIME.last = h; TIME.dirty = false; }
  if (now - (frame.skyAt||0) > 66){ frame.skyAt = now; drawSky(TIME.T, h, t); }

  const d = new Date(); const hh = TIME.warp !== null ? TIME.warp : d.getHours() + d.getMinutes()/60;
  clockHands.h.rotation.z = -((hh % 12)/12) * Math.PI*2;
  clockHands.m.rotation.z = -((hh*60 % 60)/60) * Math.PI*2;
  clockHands.s.rotation.z = -(d.getSeconds()/60) * Math.PI*2;

  if (now - (frame.tvAt||0) > 50){ frame.tvAt = now; drawTV(t); }
  const flick = .82 + .12*Math.sin(t*7.3) + .06*Math.sin(t*17.1);
  tvLight.color.set(TV_TINT[STATE.channel]);
  tvLight.intensity = (1.1 + STATE.channelFlash*2.5) * flick * (TIME.T ? lerp(.55, 1.2, TIME.T.stars) : 1);
  STATE.channelFlash = Math.max(0, STATE.channelFlash - dt*3);

  if (STATE.lampOn) lampLight.intensity = LAMP_I * (.97 + .03*Math.sin(t*2.1));
  if (STATE.party){ const hue = (t*.25)%1; lampLight.color.setHSL(hue, .8, .6); tvLight.color.setHSL((hue+.5)%1, .9, .6); }
  else lampLight.color.set('#ffb867');
  ROOM.routerLeds.forEach((l,i)=>{ l.visible = i===0 || Math.sin(t*(9+i*5) + i*2) > -.2; });
  ROOM.platter.rotation.y -= dt * 3.49;

  if (now - (frame.gbAt||0) > 66){ frame.gbAt = now; gbPaint(t); }
  phoneTick(t);

  // roomba
  const R = roombaAI;
  if (R.spin > 0){ R.spin -= dt; roomba.rotation.y += dt*9; }
  else if (R.pause > 0){ R.pause -= dt; }
  else {
    tmpV.subVectors(R.target, roomba.position); tmpV.y = 0;
    if (tmpV.length() < .1){ R.pause = .4 + Math.random()*1.2; pickRoombaTarget(); }
    else {
      const want = Math.atan2(tmpV.x, tmpV.z);
      let diff = want - roomba.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      roomba.rotation.y += clamp(diff, -dt*2.4, dt*2.4);
      if (Math.abs(diff) < .5){ const sp = R.speed * (STATE.party ? 3 : 1); roomba.position.x += Math.sin(roomba.rotation.y)*sp*dt; roomba.position.z += Math.cos(roomba.rotation.y)*sp*dt; }
    }
  }
  roomba.position.x = clamp(roomba.position.x, -2.6, 2.6); roomba.position.z = clamp(roomba.position.z, -2.25, 3.8);
  ROOM.roombaBrush.rotation.y += dt*14;
  ROOM.roombaLed.material.color.set(Math.sin(t*3) > 0 ? '#46e6ff' : '#1d5f6a');

  sun.intensity = ROOM.base.sun; bounce.intensity = ROOM.base.bounce;
  shaftMat.uniforms.strength.value = ROOM.base.shaft; ROOM.dustStrength = ROOM.base.dust;
  // the sliding panel rolls along its track
  DOOR.open = damp(DOOR.open, DOOR.target, 5, dt);
  DOOR.panel.position.z = lerp(DOOR.zShut, DOOR.zOpen, DOOR.open);

  // dust motes in the light shaft
  const dp = dust.geometry.attributes.position, da = dust.geometry.attributes.alpha, shp = shaftGeo.attributes.position;
  const A0 = V3().fromBufferAttribute(shp,0), A1 = V3().fromBufferAttribute(shp,1), A3 = V3().fromBufferAttribute(shp,3), A4 = V3().fromBufferAttribute(shp,4);
  const along = A4.clone().sub(A0);
  dustP.forEach((p,i)=>{
    p.w += dt*.012; if (p.w > .75) p.w = 0;
    const u = p.u + Math.sin(t*.3 + p.ph)*.02, v = p.v + Math.sin(t*.23 + p.ph*2)*.03;
    const x = A0.x + (A1.x-A0.x)*u + (A3.x-A0.x)*v + along.x*p.w;
    const y = A0.y + (A1.y-A0.y)*u + (A3.y-A0.y)*v + along.y*p.w;
    const z = A0.z + (A1.z-A0.z)*u + (A3.z-A0.z)*v + along.z*p.w;
    dp.setXYZ(i, x, y, z);
    da.setX(i, (y > .05 ? 1 : 0) * ROOM.dustStrength * (.5 + .5*Math.sin(t*2 + p.ph*3)) * (1 - p.w/.75));
  });
  dp.needsUpdate = da.needsUpdate = true;
  shaftMat.uniforms.time.value = t;

  magUpdate(dt);
  updateCamera(dt);
  patioUpdate(dt, t);
  sfx.ambient(STATE.zone === 'patio' ? 1 : STATE.zone === 'trip' ? .5 : DOOR.open*.3, !!(TIME.T && TIME.T.stars > .5));
  holdUpdate(dt);

  // steam follows the mug wherever it is
  const mp = V3(); mug.getWorldPosition(mp); const ms = V3(); mug.getWorldScale(ms);
  steam.position.set(mp.x, mp.y + (ROOM.coffeeY0 + .17)*ms.y, mp.z);
  steam.scale.setScalar(ms.y > 1.01 ? ms.y*.55 : 1);
  steam.quaternion.copy(camera.quaternion);
  steamMat.uniforms.time.value = t;
  steamMat.uniforms.hot.value = (ROOM.sipT > 0 ? 0 : clamp(coffee.level*1.2, 0, 1)) * (HOLD.id === 'coffee' ? .8 : 1);
  steamMat.uniforms.color.value.set(TIME.T ? mix('#e8e2d8', '#8f8a99', TIME.T.stars) : '#d9d3c9');
  const lvl = lerp(ROOM.coffeeY1, ROOM.coffeeY0, coffee.level);
  ROOM.coffeeSurf.forEach((m,i)=>{ m.position.y = lvl + i*.0002; m.visible = coffee.level > .02; });

  // little animations
  if (ROOM.rosetteWiggle > 0){ ROOM.rosetteWiggle -= dt; ROOM.rosette.rotation.z = Math.sin(ROOM.rosetteWiggle*30)*.08*ROOM.rosetteWiggle; }
  if (ROOM.wave > 0){
    ROOM.wave -= dt; const w = ROOM.wave;
    KP.armR.sh.rotation.x = lerp(-.42, -2.6, Math.min(1, (2.2-w)*4, w*4)); KP.armR.el.rotation.x = -.5 + Math.sin(w*12)*.45;
    KP.neck.rotation.y = lerp(-.25, .2, Math.min(1, (2.2-w)*3, w*3));
    if (w <= 0){ KP.armR.sh.rotation.x = -.42; KP.armR.el.rotation.x = -.7; KP.neck.rotation.y = -.25; }
  }

  // hover
  let hov = null;
  if (!HOLD.id && !HOLD.busy && STATE.zone !== 'trip') hov = STATE.keyHover || pick();
  if (hov !== STATE.hovered){
    if (STATE.hovered) setMask(INTERACT[STATE.hovered].obj, false);
    STATE.hovered = hov;
    if (hov){ setMask(INTERACT[hov].obj, true); sfx.tick(); }
  }
  updateCursor();
  drawMarks(t);

  render();
  requestAnimationFrame(frame);
}

function render(){
  camera.layers.set(0); camera.layers.enable(L_FX);
  renderer.setRenderTarget(rtColor); renderer.setClearColor('#0e0c13', 1); renderer.clear();
  renderer.render(scene, camera);
  camera.layers.set(0);
  scene.overrideMaterial = normalMat;
  renderer.setRenderTarget(rtNormal); renderer.setClearColor('#8080ff', 1); renderer.clear();
  const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  renderer.render(scene, camera);
  const maskOn = !!(STATE.hovered || HOLD.id);
  post.uniforms.maskOn.value = maskOn ? 1 : 0;
  post.uniforms.hold.value = HOLD.dim;
  post.uniforms.crisp.value = HOLD.crisp ? 1 : 0;
  if (maskOn){
    scene.overrideMaterial = maskMat; camera.layers.set(L_MASK);
    renderer.setRenderTarget(rtMask); renderer.setClearColor('#000000', 1); renderer.clear();
    renderer.render(scene, camera);
  }
  scene.overrideMaterial = null; renderer.shadowMap.autoUpdate = sm;
  camera.layers.set(0); camera.layers.enable(L_FX);
  post.uniforms.tColor.value = rtColor.texture; post.uniforms.tDepth.value = rtColor.depthTexture;
  post.uniforms.tNormal.value = rtNormal.texture; post.uniforms.tMask.value = rtMask.texture;
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}
