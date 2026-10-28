// Drive the room and take screenshots.
//   node act.js <out-prefix> <W> <H> <hour> '<steps json>'
// steps: {pick:id} hover then click an object's centre, {click:[x,y]}, {move:[x,y]}, {key}, {eval:js}, {wait:ms}, {shot:name}
const { open } = require('./serve');
const [pre, W='1440', H='900', hour='21', steps='[]'] = process.argv.slice(2);
(async()=>{
  const { b, p } = await open(W, H, hour);
  for (const s of JSON.parse(steps)){
    if (s.pick){ let xy = await p.evaluate(id=>__room.at(id), s.pick); await p.mouse.move(xy[0], xy[1]); await p.waitForTimeout(1500);
      xy = await p.evaluate(id=>__room.at(id), s.pick); await p.mouse.move(xy[0], xy[1]); await p.waitForTimeout(400); await p.mouse.click(xy[0], xy[1]); }
    if (s.click) await p.mouse.click(s.click[0], s.click[1]);
    if (s.move) await p.mouse.move(s.move[0], s.move[1]);
    if (s.key) await p.keyboard.press(s.key);
    if (s.eval) console.log(await p.evaluate(s.eval));
    await p.waitForTimeout(s.wait || 500);
    if (s.shot) await p.screenshot({ path:`${pre}${s.shot}.png` });
  }
  await b.close();
})();
