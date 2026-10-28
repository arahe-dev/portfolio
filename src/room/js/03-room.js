/* =====================================================================
   SCENE + ROOM SHELL
   ===================================================================== */
const scene = new THREE.Scene();
const ROOM = { xl:-3, xr:3, back:-3, front:7, h:3 };
const INTERACT = {};           // id -> { obj, kind:'hold'|'use', ... }
const pickables = [];
function interactive(id, obj, info){
  INTERACT[id] = { id, obj, kind:'use', ...info };
  obj.traverse(c=>{ if (c.isMesh && c.layers.isEnabled(0)){ c.userData.iid = id; pickables.push(c); } });
}

const M = {
  wall: toon({ color:PAL.wall, map:texPlaster }),
  wallSide: toon({ color:shade(PAL.wall,.96), map:texPlaster }),
  ceiling: toon({ color:PAL.ceiling }),
  trim: toon({ color:PAL.trim }),
  floor: toon({ map:texFloor }),
  walnut: toon({ map:texWalnut }),
  walnutSide: toon({ color:shade(PAL.walnut,.9) }),
  oak: toon({ map:texOak }),
  oakSide: toon({ color:PAL.oakLight }),
  brass: toon({ color:PAL.brass }),
  black: toon({ color:'#18171c' }),
  dark: toon({ color:'#2a2830' }),
};

(function buildShell(){
  const { xl, xr, back, front, h } = ROOM;
  const W = xr-xl, D = front-back;
  // floor
  const floor = mesh(new THREE.PlaneGeometry(W, D), M.floor, { rx:-Math.PI/2, z:(back+front)/2, cast:false }, scene);
  texFloor.repeat.set(W/2, D/2);
  // ceiling (thick so it blocks light)
  mesh(Box(W+.4, .2, D), M.ceiling, { y:h+.1, z:(back+front)/2, receive:false }, scene);
  // back wall
  texPlaster.repeat.set(6,3);
  mesh(Box(W+.4, h, .2), M.wall, { y:h/2, z:back-.1 }, scene);
  // right wall
  mesh(Box(.2, h, D), M.wallSide, { x:xr+.1, y:h/2, z:(back+front)/2 }, scene);
  // left wall with a sliding-door opening to the patio: z in [-2.35,-0.75], floor to 2.45
  const WIN = { z0:-2.35, z1:-.75, y0:0, y1:2.45 };
  const lw = (z0,z1,y0,y1)=>mesh(Box(.2, y1-y0, z1-z0), M.wallSide, { x:xl-.1, y:(y0+y1)/2, z:(z0+z1)/2 }, scene);
  lw(back, WIN.z0, 0, h); lw(WIN.z1, front, 0, h);
  lw(WIN.z0, WIN.z1, WIN.y1, h);
  ROOM.win = WIN;
  // baseboards + crown
  const bb = (w,d,x,z)=>{ mesh(Box(w,.11,d), M.trim, { x, y:.055, z }, scene); };
  bb(W, .03, 0, back+.015); bb(.03, D, xr-.015, (back+front)/2);
  bb(.03, WIN.z0-back, xl+.015, (back+WIN.z0)/2); bb(.03, front-WIN.z1, xl+.015, (WIN.z1+front)/2);
  const cr = (w,d,x,z)=>{ mesh(Box(w,.07,d), M.trim, { x, y:h-.035, z }, scene); };
  cr(W, .06, 0, back+.03); cr(.06, D, xr-.03, (back+front)/2); cr(.06, D, xl+.03, (back+front)/2);
  // power outlet + switch
  const plate = toon({ color:'#ece6d8' });
  mesh(Box(.08,.12,.01), plate, { x:-1.55, y:.3, z:back+.005 }, scene);
  mesh(Box(.01,.12,.08), plate, { x:xr-.005, y:1.2, z:-.5 }, scene);
})();

/* ---------------- sliding door: frame, two glass panels (one rolls behind the other), curtains ---------------- */
const doorGroup = new THREE.Group(); scene.add(doorGroup);
const DOOR = { open:0, target:0 };
(function buildDoor(){
  const { xl } = ROOM, W = ROOM.win;
  const trim = toon({ color:'#efe8da' }), bronze = toon({ color:'#2f2b28' }), steel = toon({ color:'#8d8f96' });
  const zc = (W.z0+W.z1)/2, zl = W.z1-W.z0, yl = W.y1;
  // jamb lining + head
  mesh(Box(.22,.04,zl+.04), trim, { x:xl-.1, y:W.y1-.02, z:zc }, doorGroup);
  mesh(Box(.22,yl,.04), trim, { x:xl-.1, y:yl/2, z:W.z0+.02 }, doorGroup);
  mesh(Box(.22,yl,.04), trim, { x:xl-.1, y:yl/2, z:W.z1-.02 }, doorGroup);
  // casing around the opening on the room side
  mesh(Box(.025,.09,zl+.2), trim, { x:xl+.012, y:W.y1+.045, z:zc }, doorGroup);
  mesh(Box(.025,yl,.07), trim, { x:xl+.012, y:yl/2, z:W.z0-.035 }, doorGroup);
  mesh(Box(.025,yl,.07), trim, { x:xl+.012, y:yl/2, z:W.z1+.035 }, doorGroup);
  // tracks
  mesh(Box(.2,.025,zl), steel, { x:xl-.1, y:.0125, z:zc }, doorGroup);
  mesh(Box(.2,.03,zl), bronze, { x:xl-.1, y:W.y1-.055, z:zc }, doorGroup);
  const glassMat = new THREE.MeshBasicMaterial({ color:'#cfe6ff', transparent:true, opacity:.07, depthWrite:false, side:THREE.DoubleSide });
  const panel = (z0, z1, x, handle)=>{
    const g = new THREE.Group(); g.position.set(x, 0, (z0+z1)/2); doorGroup.add(g);
    const pw = z1 - z0, ph = W.y1 - .09, t = .045;
    mesh(Box(.04,t,pw), bronze, { y:.025+t/2 }, g); mesh(Box(.04,t*1.6,pw), bronze, { y:.025+t*.8 }, g);
    mesh(Box(.04,t,pw), bronze, { y:.025+ph-t/2 }, g);
    mesh(Box(.04,ph,t), bronze, { y:.025+ph/2, z:-pw/2+t/2 }, g); mesh(Box(.04,ph,t), bronze, { y:.025+ph/2, z:pw/2-t/2 }, g);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(pw-2*t, ph-2*t), glassMat); gl.position.set(0, .025+ph/2, 0); gl.rotation.y = Math.PI/2; fx_(gl); g.add(gl);
    // a faint sheen so the glass reads as glass
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(.06, ph*.7), new THREE.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:.05, depthWrite:false, side:THREE.DoubleSide }));
    sheen.position.set(.002, .025+ph*.55, -pw*.18); sheen.rotation.set(0, Math.PI/2, .35); fx_(sheen); g.add(sheen);
    if (handle){ mesh(Box(.05,.32,.025), steel, { x:.035, y:1.02, z:pw/2-.09 }, g); mesh(Box(.05,.32,.025), steel, { x:-.035, y:1.02, z:pw/2-.09 }, g); }
    return g;
  };
  panel(W.z0+.02, zc+.04, xl-.155, false);
  DOOR.panel = panel(zc-.04, W.z1-.02, xl-.075, true);
  DOOR.zShut = DOOR.panel.position.z; DOOR.zOpen = DOOR.zShut - (zl/2 - .06);
  DOOR.gap = { z:(zc + W.z1)/2, x:xl-.1 };
  // invisible stand-in so clicking anywhere in the doorway counts as the door, from either side
  const hitPane = new THREE.Mesh(new THREE.PlaneGeometry(zl, yl), new THREE.MeshBasicMaterial({ visible:false, side:THREE.DoubleSide }));
  hitPane.position.set(xl-.1, yl/2, zc); hitPane.rotation.y = Math.PI/2; doorGroup.add(hitPane);
  // curtain rod + finials
  rod(V3(xl+.12, W.y1+.22, W.z0-.55), V3(xl+.12, W.y1+.22, W.z1+.55), .012, .012, M.brass, doorGroup, 8);
  [W.z0-.57, W.z1+.57].forEach(z=>mesh(new THREE.SphereGeometry(.03,8,6), M.brass, { x:xl+.12, y:W.y1+.22, z }, doorGroup));
  mesh(Box(.1,.03,.03), M.brass, { x:xl+.06, y:W.y1+.22, z:W.z0-.45 }, doorGroup);
  mesh(Box(.1,.03,.03), M.brass, { x:xl+.06, y:W.y1+.22, z:W.z1+.45 }, doorGroup);
  // curtains: pleated planes, gathered towards the bottom
  const cMat = toon({ color:PAL.curtain, map:texCurtain, side:THREE.DoubleSide });
  const curtain = (zA, zB, flip)=>{
    const wdt = Math.abs(zB-zA), hgt = W.y1+.2-.05;
    const g = new THREE.PlaneGeometry(wdt, hgt, 28, 8);
    const p = g.attributes.position;
    for (let i=0;i<p.count;i++){
      const x = p.getX(i), y = p.getY(i);
      const v = (y + hgt/2)/hgt;                  // 0 bottom .. 1 top
      const u = (x + wdt/2)/wdt;
      const fold = Math.sin(u*Math.PI*7) * .045 * (1 - .3*v);
      const gather = flip ? (1-u) : u;
      const pinch = (1 - v) * .12 * gather;      // bottom pulls toward the wall corner
      p.setX(i, x + (flip ? pinch : -pinch) * wdt);
      p.setZ(i, fold);
    }
    g.computeVertexNormals();
    const m = mesh(g, cMat, { x:xl+.09, y:.05+hgt/2, z:(zA+zB)/2, ry:Math.PI/2 }, doorGroup);
    return m;
  };
  curtain(W.z0-.52, W.z0+.12, false);
  curtain(W.z1-.12, W.z1+.52, true);
})();

/* ---------------- console + TV wall ---------------- */
const tvGroup = new THREE.Group(); scene.add(tvGroup);
const consoleGroup = new THREE.Group(); scene.add(consoleGroup);
(function buildConsole(){
  const z = ROOM.back + .23, w = 2.7, d = .44, h = .5, legH = .16;
  const top = mesh(slab(w, .035, d+.02, .02, .008), [M.walnut, M.walnutSide], { y:legH+h, z }, consoleGroup);
  mesh(Box(w-.02, h, d), M.walnutSide, { y:legH+h/2, z }, consoleGroup);
  const slatMat = toon({ map:texSlats });
  const doorW = (w-.08)/3;
  for (let i=0;i<3;i++){
    const x = -w/2+.04 + doorW*(i+.5);
    const door = mesh(Box(doorW-.015, h-.06, .015), [M.walnutSide,M.walnutSide,M.walnutSide,M.walnutSide,slatMat,M.walnutSide], { x, y:legH+h/2, z:z+d/2+.006 }, consoleGroup);
    mesh(Box(.1,.012,.02), M.brass, { x:x + (i===1?0: (i===0? doorW/2-.09 : -doorW/2+.09)), y:legH+h-.07, z:z+d/2+.02 }, consoleGroup);
  }
  // tapered legs
  [[-w/2+.12, z-d/2+.08],[w/2-.12, z-d/2+.08],[-w/2+.12, z+d/2-.08],[w/2-.12, z+d/2-.08]].forEach(([x,zz])=>{
    rod(V3(x, legH, zz), V3(x + Math.sign(x)*.03, 0, zz + .02), .022, .012, M.walnutSide, consoleGroup, 8);
  });
  const ty = legH+h+.035;
  ROOM.consoleTop = ty;
  // soundbar
  const sb = mesh(slab(.95, .065, .1, .03, .01), toon({ color:'#232228' }), { y:ty, z:z+.06 }, consoleGroup);
  mesh(Box(.93,.035,.002), toon({ color:'#36353d' }), { y:ty+.032, z:z+.111 }, consoleGroup);
  // books stack + vase (left)
  const bookCols = ['#c9533d','#2f5d7a','#e2c07a','#3e3b5a'];
  let by = ty;
  [[.32,.045,.24,.06],[.28,.038,.22,-.05],[.3,.05,.23,.03]].forEach(([bw,bh,bd,rot],i)=>{
    mesh(Box(bw,bh,bd), toon({ color:bookCols[i] }), { x:-.62, y:by+bh/2, z:z+.02, ry:rot }, consoleGroup);
    mesh(Box(bw-.01,bh-.012,.003), toon({ color:'#efe6d2' }), { x:-.62, y:by+bh/2, z:z+.02+bd/2+.001, ry:rot, cast:false }, consoleGroup);
    by += bh;
  });
  const vase = mesh(lathe([[0,0],[.045,0],[.06,.05],[.062,.1],[.04,.17],[.028,.2],[.032,.22],[0,.22]], 14), toon({ color:'#d5cbb6' }), { x:-1.2, y:ty, z:z+.04 }, consoleGroup);
  // dried grass stems from the vase
  const stemMat = toon({ color:'#d8bf8a' });
  const R = mulberry(77);
  for (let i=0;i<9;i++){
    const a = Math.PI + (R()-.5)*1.6, l = .14+R()*.13, tilt = .2+R()*.35;
    const top = V3(-1.2 + Math.cos(a)*Math.sin(tilt)*l, ty+.2 + Math.cos(tilt)*l, z+.04 + Math.sin(a)*Math.sin(tilt)*l);
    rod(V3(-1.2, ty+.2, z+.04), top, .004, .004, stemMat, consoleGroup, 4);
    mesh(new THREE.SphereGeometry(.028,6,5), toon({ color:'#e6d2a2' }), { x:top.x, y:top.y, z:top.z, s:1 }, consoleGroup).scale.set(.8,1.7,.8);
  }
  // router with blinking LEDs (right)
  mesh(slab(.2,.035,.13,.02,.006), toon({ color:'#e9e6df' }), { x:.7, y:ty, z:z-.06 }, consoleGroup);
  [-.04,0,.04].forEach((dx,i)=>{ rod(V3(.7+dx*1.6, ty+.03, z-.11), V3(.7+dx*2.2, ty+.2, z-.13), .006, .005, toon({ color:'#e9e6df' }), consoleGroup, 5); });
  const leds = [];
  for (let i=0;i<4;i++){ const l = mesh(Box(.01,.006,.004), new THREE.MeshBasicMaterial({ color:'#3cff8a' }), { x:.64+i*.03, y:ty+.02, z:z+.007, cast:false }, consoleGroup); leds.push(l); }
  ROOM.routerLeds = leds;
})();

const tvTex = canvasTex(112, 63, null, {});
(function buildTV(){
  const z = ROOM.back + .03, y = 1.68, w = 2.44, h = 1.373;
  mesh(Box(w+.04, h+.04, .045), M.black, { y, z:z+.0225 }, tvGroup);
  mesh(Box(w+.04, .012, .046), toon({ color:'#2b2a31' }), { y:y-h/2-.014, z:z+.023, cast:false }, tvGroup);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat(tvTex, 1.15));
  scr.position.set(0, y, z+.046); tvGroup.add(scr);
  ROOM.tvScreen = scr;
  const led = mesh(Box(.012,.006,.004), new THREE.MeshBasicMaterial({ color:'#ff4433' }), { x:w/2-.06, y:y-h/2-.016, z:z+.05, cast:false }, tvGroup);
  // cable falling behind the console
  const curve = new THREE.CatmullRomCurve3([V3(.1, y-h/2+.05, z+.01), V3(.14, y-h/2-.2, z+.012), V3(.06, ROOM.consoleTop+.05, z+.012), V3(.0, ROOM.consoleTop-.02, z+.01)]);
  mesh(new THREE.TubeGeometry(curve, 20, .007, 5), M.black, {}, tvGroup);
  ROOM.tvCenter = V3(0, y, z+.05);
})();

/* ---------------- bookshelf (back-left corner) ---------------- */
(function buildBookshelf(){
  const g = new THREE.Group(); g.position.set(-2.28, 0, ROOM.back+.16); scene.add(g);
  const W = .86, H = 1.86, D = .3, t = .026;
  const wood = toon({ map:texWalnut }), woodS = toon({ color:shade(PAL.walnut,.95) }), backM = toon({ color:shade(PAL.walnut,.62) });
  mesh(Box(t,H,D), [woodS,woodS,wood,wood,woodS,woodS], { x:-W/2+t/2, y:H/2 }, g);
  mesh(Box(t,H,D), [woodS,woodS,wood,wood,woodS,woodS], { x: W/2-t/2, y:H/2 }, g);
  mesh(Box(W,t,D), wood, { y:H-t/2 }, g);
  mesh(Box(W-2*t,.07,D-.02), backM, { y:.035, z:.01 }, g);
  mesh(Box(W-2*t,H,.01), backM, { y:H/2, z:-D/2+.005 }, g);
  const levels = [.07, .43, .79, 1.15, 1.5];
  const cols = ['#c9533d','#e2c07a','#2f5d7a','#3e3b5a','#7a9a6a','#efe3c6','#b4553b','#1f2a44','#d9a53c','#5b4a6e','#8c3b4a','#e9e1cf','#4a7d8c'];
  const mats = cols.map(c=>toon({ color:c, map:texSpine }));
  const R = mulberry(23);
  levels.forEach((y0,li)=>{
    if (li > 0) mesh(Box(W-2*t, t, D-.012), wood, { y:y0-t/2, z:.004 }, g);
    const gap = (li < levels.length-1 ? levels[li+1] : H) - y0 - t;
    let x = -W/2 + t + .006;
    const end = W/2 - t - .006;
    const leanAt = 3 + Math.floor(R()*6), stopAt = .55 + R()*.4;
    let i = 0;
    while (x < end - .03){
      if (li === 2 && i === 5){                                     // a small trailing plant
        const pot = mesh(lathe([[0,0],[.045,0],[.05,.07],[0,.07]], 12), toon({ color:'#c9b8a0' }), { x:x+.05, y:y0 }, g);
        for (let k=0;k<7;k++){ const a = k/7*Math.PI*2; const l = .08+R()*.14;
          rod(V3(x+.05, y0+.07, 0), V3(x+.05+Math.cos(a)*.06, y0+.07-l*.6 + (k%2)*.05, Math.sin(a)*.05+.03), .006, .004, toon({ color:k%2?'#4e7a46':'#6f9a5c' }), g, 4); }
        x += .11; i++; continue;
      }
      if (li === 4 && i === 0){                                     // stack lying flat
        let yy = y0;
        for (let k=0;k<4;k++){ const hh = .03+R()*.02; mesh(Box(.2-k*.012, hh, .2), mats[Math.floor(R()*mats.length)], { x:x+.11, y:yy+hh/2, ry:(R()-.5)*.15 }, g); yy += hh; }
        x += .24; i++; continue;
      }
      const bw = .018 + R()*.026, bh = Math.min(gap-.03, .2 + R()*.12), bd = .19 + R()*.06;
      const lean = (i === leanAt && x > -W/2 + .2) ? .28 : 0;
      mesh(Box(bw, bh, bd), mats[Math.floor(R()*mats.length)], { x:x+bw/2 + (lean? bh*Math.sin(lean)*.5:0), y:y0+bh/2*Math.cos(lean), z:(D-bd)/2 - .03, rz:-lean }, g);
      x += bw + .002 + (lean ? bh*Math.sin(lean) : 0);
      i++;
      if (lean || (x - (-W/2)) / W > stopAt + (li===0 ? .4 : 0)) break;
    }
  });
})();

/* ---------------- record cube + turntable + lamp (back-right corner) ---------------- */
const lampGroup = new THREE.Group();
const lampShadeMat = toon({ color:'#f1e2c0', emissive:'#ffcf87', emissiveIntensity:0 });
(function buildRecordCube(){
  const g = new THREE.Group(); g.position.set(2.56, 0, ROOM.back+.2); scene.add(g);
  const W = .78, H = .78, D = .39, t = .03;
  const birch = toon({ color:'#e6dccb' }), inner = toon({ color:'#d3c8b4' });
  mesh(Box(t,H,D), birch, { x:-W/2+t/2, y:H/2 }, g); mesh(Box(t,H,D), birch, { x:W/2-t/2, y:H/2 }, g);
  mesh(Box(W,t,D), birch, { y:H-t/2 }, g); mesh(Box(W,t,D), birch, { y:t/2 }, g);
  mesh(Box(t,H-2*t,D), birch, { y:H/2 }, g);
  mesh(Box(W-2*t,t,D), birch, { y:H/2 }, g);
  mesh(Box(W,H,.008), inner, { y:H/2, z:-D/2+.004 }, g);
  const cw = (W-3*t)/2, ch = (H-3*t)/2;
  const spineM = toon({ map:texSpines }), dark = toon({ color:'#1d1b22' });
  const cells = [[-1,1],[1,1],[-1,-1],[1,-1]];
  cells.forEach(([sx,sy],i)=>{
    const cx = sx*(cw/2+t/2), cy = H/2 + sy*(ch/2+t/2);
    if (i === 3){
      // amplifier
      mesh(Box(cw-.02, .11, D-.06), toon({ color:'#232228' }), { x:cx, y:cy-ch/2+.055, z:.0 }, g);
      mesh(Box(cw-.06, .02, .004), toon({ color:'#c7a35a' }), { x:cx, y:cy-ch/2+.075, z:(D-.06)/2+.002 }, g);
      [-.08,.06].forEach(dx=>mesh(Cyl(.016,.016,.012,12), toon({ color:'#b9b9be' }), { x:cx+dx, y:cy-ch/2+.04, z:(D-.06)/2+.006, rx:Math.PI/2 }, g));
      mesh(Box(.008,.004,.002), new THREE.MeshBasicMaterial({ color:'#ffb347' }), { x:cx+.12, y:cy-ch/2+.04, z:(D-.06)/2+.002, cast:false }, g);
      return;
    }
    const fill = i === 1 ? .62 : .96;
    mesh(Box(cw*fill, ch-.012, D-.05), [dark,dark,dark,dark,spineM,dark], { x:cx - cw*(1-fill)/2, y:cy-.006, z:-.0 }, g);
    if (i === 1){ mesh(Box(.006, ch-.03, D-.08), toon({ color:'#c9533d' }), { x:cx + cw*.36, y:cy-.01, rz:-.32 }, g); }
  });
  ROOM.cubeTop = H;
  // turntable
  const tt = new THREE.Group(); tt.position.set(-.1, H, .01); g.add(tt);
  mesh(slab(.44,.09,.34,.02,.006), [toon({ map:texWalnut }), toon({ color:shade(PAL.walnut,.9) })], {}, tt);
  [[-.19,-.14],[.19,-.14],[-.19,.14],[.19,.14]].forEach(([x,z])=>mesh(Cyl(.018,.02,.012,10), dark, { x, y:-.004, z }, tt));
  mesh(Cyl(.152,.152,.012,32), toon({ color:'#3a3a40' }), { x:-.05, y:.096 }, tt);
  const platter = new THREE.Group(); platter.position.set(-.05, .103, 0); tt.add(platter);
  const recTex = canvasTex(64, 64, (ctx)=>{
    ctx.fillStyle = '#121216'; ctx.beginPath(); ctx.arc(32,32,32,0,Math.PI*2); ctx.fill();
    for (let r=30;r>12;r-=2){ ctx.strokeStyle = r%4 ? '#1d1d23' : '#17171c'; ctx.beginPath(); ctx.arc(32,32,r,0,Math.PI*2); ctx.stroke(); }
    ctx.fillStyle = '#e3b23c'; ctx.beginPath(); ctx.arc(32,32,11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c9533d'; ctx.fillRect(26,28,12,3); ctx.fillStyle='#121216'; ctx.fillRect(31,31,2,2);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(16,14,6,1); ctx.fillRect(14,16,2,4);
  });
  mesh(new THREE.CircleGeometry(.146, 32), toon({ map:recTex }), { rx:-Math.PI/2 }, platter);
  ROOM.platter = platter;
  // tonearm
  mesh(Cyl(.014,.016,.03,10), toon({ color:'#b9b9be' }), { x:.15, y:.105, z:-.09 }, tt);
  rod(V3(.15,.12,-.09), V3(.04,.115,.07), .004, .004, toon({ color:'#c9c9ce' }), tt, 6);
  mesh(Box(.022,.008,.03), dark, { x:.035, y:.112, z:.08, ry:.5 }, tt);
  mesh(Box(.03,.012,.012), toon({ color:'#b9b9be' }), { x:.17, y:.12, z:-.11 }, tt);
  // mushroom lamp
  lampGroup.position.set(.25, H, -.04); g.add(lampGroup);
  mesh(Cyl(.055,.065,.02,20), toon({ color:'#f1e2c0' }), { y:.01 }, lampGroup);
  mesh(Cyl(.016,.02,.16,12), toon({ color:'#f1e2c0' }), { y:.1 }, lampGroup);
  const dome = new THREE.SphereGeometry(.11, 22, 10, 0, Math.PI*2, 0, Math.PI/2);
  mesh(dome, lampShadeMat, { y:.17 }, lampGroup);
  mesh(new THREE.CircleGeometry(.11, 22), lampShadeMat, { y:.17, rx:Math.PI/2, cast:false }, lampGroup);
})();
const lampLight = new THREE.PointLight('#ffb867', 0, 0, 2);
scene.add(lampLight);
lampGroup.updateWorldMatrix(true, false);
lampLight.position.copy(lampGroup.localToWorld(V3(0, .14, .02)));

/* ---------------- album ledges on the right wall ---------------- */
const albums = [];
const ALBUM_SIZE = .31;
(function buildAlbumWall(){
  const x = ROOM.xr;
  const ledge = (y, z0, z1)=>{
    const L = z1 - z0, zc = (z0+z1)/2;
    mesh(Box(.1, .022, L), toon({ map:texOak }), { x:x-.05, y, z:zc }, scene);
    mesh(Box(.014, .04, L), toon({ color:PAL.oakLight }), { x:x-.093, y:y+.02, z:zc }, scene);
  };
  ledge(1.62, -2.62, -.62);
  ledge(1.1, -2.42, -.82);
  ALBUMS.forEach((a, i)=>{
    const upper = i < 5;
    const z = upper ? -2.42 + i*.4 : -2.22 + (i-5)*.4;
    const y = upper ? 1.62 : 1.1;
    const { dom, acc } = coverColors(a.id);
    const g = new THREE.Group(); g.rotation.order = 'YXZ';
    g.position.set(x - .055, y + .011 + ALBUM_SIZE/2, z);
    g.rotation.set(-.1, -Math.PI/2, (i%3-1)*.012);
    scene.add(g);
    const edge = toon({ color:shade(dom, .78) });
    const front = toon({ map:COVER_TEX[a.id] });
    const back = paperMat(canvasTex(24, 24, (ctx)=>{ ctx.fillStyle = dom; ctx.fillRect(0,0,24,24); ctx.fillStyle = lum(dom) > .5 ? '#1c1726' : '#f1e6cc'; for (let k=0;k<6;k++) ctx.fillRect(3, 4+k*3, 10+((k*7)%8), 1); }), .2);
    const sleeve = mesh(Box(ALBUM_SIZE, ALBUM_SIZE, .006), [edge,edge,edge,edge,front,back], {}, g);
    // the record inside: slides out of the open edge when the sleeve is picked up
    const disc = new THREE.Group(); g.add(disc);
    const recTex = canvasTex(96, 96, (ctx)=>{
      ctx.fillStyle = '#111114'; ctx.beginPath(); ctx.arc(48,48,48,0,Math.PI*2); ctx.fill();
      for (let r=46;r>18;r-=2){ ctx.strokeStyle = r%4 ? '#1c1c22' : '#151519'; ctx.beginPath(); ctx.arc(48,48,r,0,Math.PI*2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(22,20,10,1); ctx.fillRect(20,22,2,8);
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(48,48,16,0,Math.PI*2); ctx.fill();
      ctx.drawImage(COVER_TEX[a.id].userData.canvas, 16, 16, 16, 16, 40, 40, 16, 16);
      ctx.fillStyle = '#111114'; ctx.fillRect(47,47,2,2);
    });
    const dm = toon({ map:recTex, side:THREE.DoubleSide });
    mesh(new THREE.CircleGeometry(ALBUM_SIZE*.47, 40), dm, {}, disc);
    disc.position.z = 0; disc.scale.setScalar(.98);
    g.userData = { album:a, disc, back, dom, acc };
    albums.push(g);
    interactive('album-'+i, g, { kind:'hold', album:a, label:'records' });
  });
})();

/* ---------------- KP17 (after the reference: black servo brackets, green PCB, blue hip) ---------------- */
const kp17 = new THREE.Group();
const KP = {};
(function buildKP17(){
  const k = 2.3;
  const black = toon({ color:'#232329' }), bracket = toon({ color:'#33333b', map:texBracket }), silver = toon({ color:'#9aa0a8' });
  const servoM = toon({ map:texServo }), blue = toon({ color:'#2f62d0' }), pcb = toon({ map:texPCB });
  const servo = (parent, w, h, d, x, y, z, horn='x', hs=1)=>{
    const s = new THREE.Group(); s.position.set(x*k, y*k, z*k); parent.add(s);
    mesh(Box(w*k, h*k, d*k), [black,black,black,black,servoM,servoM], {}, s);
    mesh(Box((w+.012)*k, .003*k, d*k*.7), black, { y:h*k*.3 }, s);
    const hr = mesh(Cyl(.0085*k,.0085*k,.004*k,14), silver, {}, s);
    if (horn === 'x'){ hr.rotation.z = Math.PI/2; hr.position.x = hs*(w/2+.002)*k; }
    else if (horn === 'z'){ hr.rotation.x = Math.PI/2; hr.position.z = hs*(d/2+.002)*k; }
    else { hr.position.y = hs*(h/2+.002)*k; }
    mesh(Cyl(.002*k,.002*k,.0045*k,6), black, {}, hr);
    return s;
  };
  const uBracket = (parent, len, w, d, x, y, z)=>{
    const b = new THREE.Group(); b.position.set(x*k, y*k, z*k); parent.add(b);
    [-1,1].forEach(sd=>mesh(Box(.003*k, len*k, d*k), bracket, { x:sd*w/2*k, y:-len/2*k }, b));
    mesh(Box(w*k, .003*k, d*k), bracket, { y:-len*k }, b);
    return b;
  };
  // pelvis
  const pelvis = new THREE.Group(); kp17.add(pelvis);
  servo(pelvis, .086, .028, .046, 0, 0, 0, 'y', -1);
  mesh(Box(.026*k,.022*k,.03*k), blue, { x:.036*k, y:.004*k, z:.012*k }, pelvis);
  // torso
  const torso = new THREE.Group(); torso.position.y = .016*k; pelvis.add(torso);
  servo(torso, .03, .04, .04, 0, .02, 0, 'y', -1);           // waist
  servo(torso, .094, .044, .058, 0, .062, 0, 'z', 1);         // chest block
  mesh(Box(.086*k,.05*k,.004*k), pcb, { y:.064*k, z:-.032*k, rx:-.05 }, torso);
  [[-.03,.08],[.03,.08],[-.03,.045],[.03,.045]].forEach(([x,y])=>mesh(Cyl(.0018*k,.0018*k,.006*k,6), silver, { x:x*k, y:y*k, z:-.035*k, rx:Math.PI/2 }, torso));
  const neck = new THREE.Group(); neck.position.set(0, .084*k, -.004*k); torso.add(neck);
  servo(neck, .024, .042, .04, 0, .021, 0, 'y', 1);           // head is a servo, like the real one
  KP.neck = neck;
  // arms
  const arm = (side)=>{
    const sh = new THREE.Group(); sh.position.set(side*.068*k, .072*k, 0); torso.add(sh);
    servo(sh, .04, .022, .04, 0, 0, 0, 'x', side);
    const up = uBracket(sh, .045, .026, .02, side*.01, -.01, 0);
    servo(up, .022, .04, .036, 0, -.048, 0, 'x', -side);
    const el = new THREE.Group(); el.position.y = -.07*k; up.add(el);
    const fo = uBracket(el, .045, .026, .02, 0, 0, 0);
    servo(fo, .022, .04, .036, 0, -.032, 0, 'x', side);
    const hand = mesh(Box(.028*k, .04*k, .003*k), bracket, { y:-.07*k }, fo);
    mesh(Cyl(.007*k,.007*k,.004*k,10), black, { y:-.08*k, rx:Math.PI/2 }, fo);
    return { sh, el };
  };
  KP.armL = arm(-1); KP.armR = arm(1);
  // legs
  const leg = (side)=>{
    const hip = new THREE.Group(); hip.position.set(side*.026*k, -.016*k, 0); pelvis.add(hip);
    servo(hip, .024, .036, .042, 0, -.018, 0, 'x', side);
    const th = uBracket(hip, .05, .03, .024, 0, -.036, 0);
    servo(th, .024, .04, .036, 0, -.056, 0, 'x', -side);
    const knee = new THREE.Group(); knee.position.y = -.1*k; hip.add(knee);
    const sn = uBracket(knee, .05, .03, .024, 0, 0, 0);
    servo(sn, .024, .04, .036, 0, -.03, 0, 'x', side);
    const ankle = new THREE.Group(); ankle.position.y = -.09*k; knee.add(ankle);
    servo(ankle, .03, .022, .04, 0, -.011, 0, 'x', side);
    const foot = new THREE.Mesh(Box(.058*k, .004*k, .092*k), [black,black,toon({ map:texFoot }),black,black,black]);
    foot.position.set(side*.006*k, -.026*k, .018*k); foot.castShadow = foot.receiveShadow = true; ankle.add(foot);
    return { hip, knee, ankle };
  };
  KP.legL = leg(-1); KP.legR = leg(1);
  // sitting pose
  [KP.legL, KP.legR].forEach((l,i)=>{ l.hip.rotation.x = -1.48; l.hip.rotation.z = (i?1:-1)*.06; l.knee.rotation.x = 1.42 + i*.08; l.ankle.rotation.x = .06; });
  [KP.armL, KP.armR].forEach((a,i)=>{ a.sh.rotation.x = -.42; a.sh.rotation.z = (i?-1:1)*.1; a.el.rotation.x = -.7; });
  neck.rotation.y = -.25; neck.rotation.x = .08;
  KP.k = k;
  // on the console's right end, legs over the edge
  kp17.position.set(1.17, ROOM.consoleTop + .026*k, ROOM.back + .45 - .1*k);
  kp17.rotation.y = -.3;
  scene.add(kp17);
})();
/* ---------------- wall clock (live local time) ---------------- */
const clockGroup = new THREE.Group(); scene.add(clockGroup);
const clockHands = {};
(function buildClock(){
  clockGroup.position.set(1.85, 2.2, ROOM.back+.02);
  mesh(Cyl(.2,.2,.04,28), M.black, { z:.02, rx:Math.PI/2 }, clockGroup);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.18, 28), toon({ map:texClock }));
  face.position.z = .041; face.receiveShadow = true; clockGroup.add(face);
  const hand = (len, w, col, z)=>{ const g = Box(w, len, .004); g.translate(0, len/2 - .02, 0); const m = mesh(g, toon({ color:col }), { z, cast:false }, clockGroup); return m; };
  clockHands.h = hand(.1, .014, '#1c1726', .046);
  clockHands.m = hand(.15, .009, '#1c1726', .05);
  clockHands.s = hand(.16, .004, '#d36a45', .054);
  mesh(Cyl(.012,.012,.01,10), M.brass, { z:.057, rx:Math.PI/2, cast:false }, clockGroup);
})();

/* ---------------- rug ---------------- */
(function buildRug(){
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.3), toon({ map:texRug, alphaTest:.5 }));
  rug.rotation.x = -Math.PI/2; rug.position.set(0, .006, 1.55); rug.receiveShadow = true;
  scene.add(rug);
})();

/* ---------------- roomba + dock ---------------- */
const roomba = new THREE.Group(); scene.add(roomba);
(function buildRoomba(){
  const r = .17;
  mesh(Cyl(r, r, .07, 28), toon({ color:'#26272c' }), { y:.045 }, roomba);
  mesh(Cyl(r-.005, r, .012, 28), toon({ color:'#3b3d44' }), { y:.086 }, roomba);
  mesh(Cyl(r*.55, r*.55, .006, 22), toon({ color:'#1b1c20' }), { y:.093 }, roomba);
  mesh(Cyl(.022, .022, .008, 12), toon({ color:'#c9cbd1' }), { y:.096 }, roomba);
  // front bumper arc
  const bump = new THREE.CylinderGeometry(r+.006, r+.006, .05, 28, 1, true, -Math.PI/2.6, Math.PI/1.3);
  mesh(bump, toon({ color:'#8f9298', side:THREE.DoubleSide }), { y:.04 }, roomba);
  const led = mesh(Box(.02,.004,.008), new THREE.MeshBasicMaterial({ color:'#46e6ff' }), { y:.098, z:.06, cast:false }, roomba);
  ROOM.roombaLed = led;
  // side brush
  const brush = new THREE.Group(); brush.position.set(.11, .012, .1); roomba.add(brush);
  for (let i=0;i<3;i++){ const b = mesh(Box(.07,.003,.004), toon({ color:'#d6d0c0' }), { x:.035, rz:0 }, brush); b.parent.remove(b); const piv = new THREE.Group(); piv.rotation.y = i*Math.PI*2/3; piv.add(b); brush.add(piv); }
  ROOM.roombaBrush = brush;
  roomba.position.set(1.0, 0, -1.4);
  // dock
  const dock = new THREE.Group(); dock.position.set(1.55, 0, ROOM.back+.08); scene.add(dock);
  mesh(slab(.2,.11,.1,.03,.01), toon({ color:'#26272c' }), {}, dock);
  mesh(Box(.16,.01,.12), toon({ color:'#1c1d21' }), { y:.005, z:.1 }, dock);
  mesh(Box(.03,.006,.002), new THREE.MeshBasicMaterial({ color:'#3cff8a' }), { y:.08, z:.051, cast:false }, dock);
})();

/* =====================================================================
   SKY + TIME OF DAY
   ===================================================================== */
const skyTex = canvasTex(160, 100, null, { linear:false });
(function buildSky(){
  // one big painted sky beyond the garden; the bamboo and fence hide its lower edge
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(110, 46), new THREE.MeshBasicMaterial({ map:skyTex, toneMapped:false }));
  sky.position.set(-38, 14, -2); sky.rotation.y = Math.PI/2; scene.add(sky);
  const side = (z, ry)=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 46), new THREE.MeshBasicMaterial({ map:skyTex, toneMapped:false })); m.position.set(-10, 14, z); m.rotation.y = ry; scene.add(m); };
  side(-34, 0); side(30, Math.PI);
})();

const TIMEKEYS = [
  { h:0,    top:'#090d22', hor:'#262a52', sun:0,   sunCol:'#ffffff', moon:1, amb:.16, hemi:'#4b5aa0', lamp:1, city:1,  stars:1 },
  { h:4.8,  top:'#0e1330', hor:'#3a3363', sun:0,   sunCol:'#ffffff', moon:.8, amb:.18, hemi:'#4b5aa0', lamp:1, city:.9, stars:.8 },
  { h:6.0,  top:'#33508e', hor:'#ef9a6c', sun:.6,  sunCol:'#ffb27a', moon:0, amb:.34, hemi:'#8a8fc0', lamp:.6, city:.4, stars:.1 },
  { h:7.6,  top:'#5c9ce0', hor:'#cfe4ef', sun:2.4, sunCol:'#fff0d4', moon:0, amb:.62, hemi:'#b8d0ef', lamp:0, city:0,  stars:0 },
  { h:12.5, top:'#4b8fe0', hor:'#bfe0f2', sun:2.8, sunCol:'#fffaf0', moon:0, amb:.72, hemi:'#c2dbf5', lamp:0, city:0,  stars:0 },
  { h:16.4, top:'#5a8bd0', hor:'#f2d5a0', sun:2.6, sunCol:'#ffe0aa', moon:0, amb:.62, hemi:'#d6cfe0', lamp:0, city:0,  stars:0 },
  { h:18.1, top:'#4a4890', hor:'#ff9558', sun:1.7, sunCol:'#ff9a55', moon:0, amb:.42, hemi:'#c39ab0', lamp:.6, city:.3, stars:0 },
  { h:19.2, top:'#23245c', hor:'#b45a78', sun:.25, sunCol:'#ff7a6a', moon:.3, amb:.26, hemi:'#7a6aa0', lamp:1, city:.8, stars:.4 },
  { h:20.4, top:'#0d1230', hor:'#322f5d', sun:0,   sunCol:'#ffffff', moon:1, amb:.18, hemi:'#4b5aa0', lamp:1, city:1,  stars:1 },
  { h:24,   top:'#090d22', hor:'#262a52', sun:0,   sunCol:'#ffffff', moon:1, amb:.16, hemi:'#4b5aa0', lamp:1, city:1,  stars:1 },
];
function sampleTime(h){
  let a = TIMEKEYS[0], b = TIMEKEYS[1];
  for (let i=0;i<TIMEKEYS.length-1;i++){ if (h>=TIMEKEYS[i].h && h<=TIMEKEYS[i+1].h){ a=TIMEKEYS[i]; b=TIMEKEYS[i+1]; break; } }
  const t = (h-a.h)/(b.h-a.h || 1);
  const o = {};
  for (const k in a){ o[k] = typeof a[k]==='string' ? mix(a[k], b[k], t) : lerp(a[k], b[k], t); }
  return o;
}
function periodName(h){
  if (h<5) return 'Late night'; if (h<6.6) return 'Dawn'; if (h<11.5) return 'Morning'; if (h<16) return 'Afternoon';
  if (h<18.6) return 'Golden hour'; if (h<20) return 'Dusk'; return 'Night';
}

const STARS = (()=>{ const R = mulberry(99); return Array.from({length:70}, ()=>({ x:Math.floor(R()*160), y:Math.floor(R()*60), p:R()*6.28, b:R() })); })();
const CLOUDS = (()=>{ const R = mulberry(55); return Array.from({length:6}, ()=>({ x:R()*200-20, y:10+R()*34, w:14+Math.floor(R()*22), s:.6+R()*1.1 })); })();
const BAYER4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];

function drawSky(T, h, t){
  const ctx = skyTex.userData.ctx, W = 160, H = 100;
  // dithered vertical gradient
  const A = hexRGB(T.top), B = hexRGB(T.hor);
  const img = ctx.createImageData(W, H), d = img.data;
  for (let y=0;y<H;y++){
    const g = Math.pow(y/(H-1), 1.35) * 7;    // 8 colour steps
    for (let x=0;x<W;x++){
      const th = BAYER4[(y&3)*4 + (x&3)]/16;
      const step = Math.min(7, Math.floor(g + th)) / 7;
      const i = (y*W+x)*4;
      d[i] = lerp(A[0],B[0],step); d[i+1] = lerp(A[1],B[1],step); d[i+2] = lerp(A[2],B[2],step); d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // stars
  if (T.stars > .02){
    for (const s of STARS){
      const tw = .5 + .5*Math.sin(t*1.7 + s.p);
      if (s.b*T.stars*(.6+.4*tw) > .35){ ctx.fillStyle = s.b>.85 ? '#fff6d8' : '#c9d3ff'; ctx.fillRect(s.x, s.y, 1, 1); if (s.b>.94 && tw>.8){ ctx.fillRect(s.x-1,s.y,3,1); ctx.fillRect(s.x,s.y-1,1,3); } }
    }
  }
  // sun / moon: x across the window as the day goes
  const dayT = clamp((h-5.5)/13.5, 0, 1);
  if (T.sun > .05){
    const sx = Math.round(lerp(120, 30, dayT)), sy = Math.round(78 - Math.sin(dayT*Math.PI)*62);
    const sc = mix('#fff2c0', '#ff9a55', clamp(1 - Math.sin(dayT*Math.PI)*1.6, 0, 1));
    ctx.fillStyle = sc; ctx.globalAlpha = .25; ctx.fillRect(sx-7, sy-5, 14, 10); ctx.fillRect(sx-5, sy-7, 10, 14); ctx.globalAlpha = 1;
    ctx.fillRect(sx-4, sy-3, 8, 6); ctx.fillRect(sx-3, sy-4, 6, 8);
  }
  if (T.moon > .05){
    const nt = ((h + 24 - 19) % 24) / 11;    // 19:00 -> 06:00
    const mx = Math.round(lerp(130, 40, clamp(nt,0,1))), my = Math.round(60 - Math.sin(clamp(nt,0,1)*Math.PI)*42);
    ctx.globalAlpha = T.moon;
    ctx.fillStyle = 'rgba(200,210,255,.18)'; ctx.fillRect(mx-6,my-4,12,8); ctx.fillRect(mx-4,my-6,8,12);
    ctx.fillStyle = '#eef0ff'; ctx.fillRect(mx-3,my-2,6,4); ctx.fillRect(mx-2,my-3,4,6);
    ctx.fillStyle = T.top; ctx.fillRect(mx,my-3,3,2); ctx.fillRect(mx+1,my-1,2,2);
    ctx.globalAlpha = 1;
  }
  // clouds
  const cloudCol = mix(mix('#ffffff', T.hor, .35), T.top, T.stars*.6);
  for (const c of CLOUDS){
    const x = Math.round(((c.x + t*c.s*1.2) % 200) - 20);
    ctx.fillStyle = shade(cloudCol, .82); ctx.fillRect(x+2, c.y+2, c.w, 3);
    ctx.fillStyle = cloudCol; ctx.fillRect(x, c.y, c.w, 3); ctx.fillRect(x+3, c.y-2, Math.floor(c.w*.5), 2); ctx.fillRect(x+Math.floor(c.w*.45), c.y-3, Math.floor(c.w*.3), 3);
  }
  skyTex.needsUpdate = true;
}
