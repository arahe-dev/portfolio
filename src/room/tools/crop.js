// Stand on the patio and screenshot a region.
//   node crop.js <out.png> <hour> <W> <H> <x> <y> <w> <h> [js to evaluate first]
const { open } = require('./serve');
const [out, hour, W, H, cx, cy, cw, ch, js] = process.argv.slice(2);
(async()=>{
  const { b, p } = await open(W, H, hour);
  await p.evaluate(()=>{ __room.TRIP.t = 1; __room.STATE.zone = 'patio'; });
  if (js) console.log(await p.evaluate(js));
  await p.waitForTimeout(3500);
  await p.screenshot({ path:out, clip:{ x:+cx, y:+cy, width:+cw, height:+ch } });
  await b.close();
})();
