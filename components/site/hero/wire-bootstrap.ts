import { WIRE_EDGES, wireRotation, projectWireVertex } from "./wire-geometry";

/** The same projection runs before hydration; ownership and its clock pass to
 * WireMark's effect. No extra engine or second persistent animation loop. */
export const WIRE_BOOTSTRAP = `
(() => {
  const canvas = document.getElementById('hero-wire');
  if (!canvas || canvas.dataset.wireOwner === 'react') return;
  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) return;
  const parts = ${JSON.stringify(WIRE_EDGES)};
  const rotation = ${wireRotation.toString()};
  const project = ${projectWireVertex.toString()};
  const start = performance.now(); canvas.dataset.wireStart = String(start); canvas.dataset.wireOwner = "bootstrap";
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 1, h = 1, dpr = 1, scale = 1, lift = .9, raf = 0, visible = true;
  let x = 0, y = 0, tx = 0, ty = 0;
  const fit = () => {
    w = canvas.clientWidth || 1; h = canvas.clientHeight || 1;
    dpr = Math.min(devicePixelRatio || 1, 2);
    const pw = Math.round(w*dpr), ph = Math.round(h*dpr);
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const phone = w < 760;
    scale = 32*Math.tan(Math.PI/12)*w/h*Number(canvas.dataset[phone ? 'sizePhone' : 'sizeDesktop'])/5.38;
    lift = Number(canvas.dataset[phone ? 'liftPhone' : 'liftDesktop']);
  };
  const onMove = (event) => { tx = event.clientX/innerWidth*2-1; ty = event.clientY/innerHeight*2-1; };
  const stop = () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', kick);
  };
  const frame = (now) => {
    raf = 0;
    if (canvas.dataset.wireOwner === 'react' || !canvas.isConnected) { stop(); return; }
    if (!visible || document.hidden) return;
    x += (tx-x)*.06; y += (ty-y)*.06;
    canvas.dataset.wireX=String(x); canvas.dataset.wireY=String(y);
    canvas.dataset.wireTx=String(tx); canvas.dataset.wireTy=String(ty);
    const t=(now-start)/1000;
    const m=rotation((reduced ? 0.1 : 0.1+Math.sin(t*.35)*.08)+y*.14,(reduced?-.4:t*.22)+x*.22,0);
    const focal=h/(2*Math.tan(Math.PI/12));
    ctx.clearRect(0,0,w,h); ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1/dpr;
    for (const part of parts) for (let i=0;i<part.length;i+=6) {
      const a=project(part,i,m,scale,x*.18,lift-y*.12,w,h,focal);
      const b=project(part,i+3,m,scale,x*.18,lift-y*.12,w,h,focal);
      ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
    }
    if (!reduced) raf=requestAnimationFrame(frame);
  };
  function kick() { if (!raf && visible && !document.hidden) raf=requestAnimationFrame(frame); }
  const io=new IntersectionObserver(([entry])=>{ visible=entry.isIntersecting; if(visible)kick(); });
  const ro=new ResizeObserver(()=>{fit();kick();});
  fit(); io.observe(canvas); ro.observe(canvas);
  if (matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove',onMove,{passive:true});
  document.addEventListener('visibilitychange',kick); kick();
})();
`;
