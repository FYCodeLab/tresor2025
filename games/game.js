/* Pas d'écran ! – LITE (placeholders si images absentes) */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d',{alpha:false});
const ui = {
  time: document.getElementById('time'),
  good: document.getElementById('good'),
  bad: document.getElementById('bad'),
  playBtn: document.getElementById('playBtn'),
  replayBtn: document.getElementById('replayBtn'),
};
let W=canvas.width, H=canvas.height;

function resize(){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth+'px';
  canvas.style.height = innerHeight+'px';
  W=canvas.width; H=canvas.height;
}
resize(); addEventListener('resize', resize);

// Audio beeps
let ac=null;
function ensureAudio(){ if(!ac){ ac = new (window.AudioContext||window.webkitAudioContext)(); } if(ac.state==='suspended') ac.resume(); }
function beep(f=700,d=0.08,t='square',v=0.2){ if(!ac) return; const T=ac.currentTime; const o=ac.createOscillator();o.type=t;o.frequency.value=f; const g=ac.createGain();g.gain.setValueAtTime(v,T);g.gain.exponentialRampToValueAtTime(0.0001,T+d);o.connect(g).connect(ac.destination);o.start(T);o.stop(T+d); }
function playGood(){ beep(880,0.08,'triangle',0.25); setTimeout(()=>beep(1320,0.06,'triangle',0.2),60); }
function playBad(){ beep(200,0.12,'sawtooth',0.25); setTimeout(()=>beep(140,0.14,'sawtooth',0.22),80); }

// Attempt to load images; if not found, keep null
function tryImage(src){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>resolve(img);
    img.onerror = ()=>resolve(null);
    img.src = src;
  });
}

const ASSETS = {
  kids: ['juju.png','suz.png','leo.png','paul.png','raph.png'].map(n=>'assets/'+n),
  parents: ['fred.png','steph.png'].map(n=>'assets/'+n),
  devices: { phone:'assets/phone.png', ipad:'assets/iPad.png', tv:'assets/tv.png',
             phonex:'assets/phonex.png', ipadx:'assets/ipadx.png' }
};

let IMGS = {kids:[],parents:[],devices:{}};
Promise.all([
  ...ASSETS.kids.map(tryImage),
  ...ASSETS.parents.map(tryImage),
  ...Object.values(ASSETS.devices).map(tryImage),
]).then(imgs=>{
  let k=0;
  IMGS.kids = imgs.slice(k, k+=ASSETS.kids.length);
  IMGS.parents = imgs.slice(k, k+=ASSETS.parents.length);
  const d = imgs.slice(k);
  IMGS.devices = { phone:d[0], ipad:d[1], tv:d[2], phonex:d[3], ipadx:d[4] };
  drawSplash();
});

function drawSplash(){
  ctx.fillStyle='#72d6ff'; ctx.fillRect(0,0,W,H);
  hills(); titleBoard();
}
function hills(){
  const bands = ['#c7f36f','#9fe24f','#67c91a','#2ea01a'];
  for(let i=0;i<bands.length;i++){
    ctx.fillStyle=bands[i];
    const y = H*0.6 + i*25;
    ctx.beginPath(); ctx.moveTo(0,y);
    for(let x=0;x<=W;x+=40){ ctx.quadraticCurveTo(x+20, y-20-(i*3), x+40, y); }
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
  }
}
function titleBoard(){
  ctx.save();
  const bw = Math.min(W*0.8, 800), bh = Math.min(H*0.5, 380);
  const x=(W-bw)/2, y=(H-bh)/2;
  ctx.translate(x+5,y+5); ctx.fillStyle='#000'; roundedRect(0,0,bw,bh,20,true);
  ctx.translate(-5,-5); ctx.fillStyle='#ff3e3e'; roundedRect(0,0,bw,bh,20,true);
  ctx.lineWidth=10; ctx.strokeStyle='#000'; roundedRect(0,0,bw,bh,20,false,true);
  ctx.fillStyle='#fff'; ctx.font = `${Math.floor(bh*0.14)}px Impact, Arial Black, sans-serif`;
  ctx.textAlign='center'; ctx.fillText("PAS D'ÉCRAN !", bw/2, bh*0.33);
  ctx.font = `${Math.floor(bh*0.07)}px Arial Black, sans-serif`;
  ctx.fillText("Version LITE (images optionnelles)", bw/2, bh*0.55);
  ctx.restore();
}
function roundedRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
  if (fill) ctx.fill(); if (stroke) ctx.stroke();
}

// State
let running=false, tLeft=120, good=0, bad=0, last=0;
let entities = [];
const bubbles = [
  "Juste 5 minutes...", "Qui a pris le chargeur ?", "Je fais mes devoirs !",
  "Mode avion c’est bien !", "Papaaaaa...", "Promis j’arrête.",
  "C’est éducatif !", "Regarde ce mème !", "Pas d’écran !",
  "Mais c’est pour la science !", "Team clavier-souris !"
];

function randomPos(){
  const margin = 90; // keep away from edges
  const uiPad = 120; // reserve space for top UI bar
  const x = Math.random()*(W-2*margin)+margin;
  const y = Math.random()*(H-uiPad-margin*1)-margin*0 + uiPad; // full height below UI
  return {x,y};
}

function spawn(){
  const r = Math.random();
  if (r < 0.65){
    const kidImg = pick(IMGS.kids);
    const pos = randomPos();
    let status, deviceImg=null, authorizedImg=null;
    const rd = Math.random();
    if (rd < 0.5){ status='unauthorized'; deviceImg = pick([IMGS.devices.phone, IMGS.devices.ipad, IMGS.devices.tv]); }
    else if (rd < 0.75){ status='authorized'; authorizedImg = pick([IMGS.devices.phonex, IMGS.devices.ipadx]); }
    else { status='none'; }
    entities.push(makeEntity('kid', kidImg, pos, status, deviceImg, authorizedImg));
  } else {
    const img = pick(IMGS.parents);
    entities.push(makeEntity('parent', img, randomPos(), 'angry', null, null));
  }
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]||null; }

function makeEntity(type, img, pos, status, device, authorizedImg){
  const size = Math.max(90, Math.min(W,H)*0.18) * (0.85 + Math.random()*0.3);
  return { id: Math.random().toString(36).slice(2),
    type, img, status, device, authorizedImg,
    x: pos.x, y: pos.y, size,
    born: performance.now(), life: 1100 + Math.random()*900,
    bubble: Math.random()<0.25 ? pick(bubbles) : null, hit:false };
}

function drawEntity(e, now){
  const wob = Math.sin((now - e.born)/120)*4;
  const s = e.size;

  // shadow
  ctx.save(); ctx.translate(e.x, e.y + s*0.55); ctx.scale(1,0.35);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(0,0,s*0.45,0,Math.PI*2); ctx.fill(); ctx.restore();

  // body (image or placeholder)
  ctx.save(); ctx.translate(e.x + wob, e.y); ctx.beginPath(); ctx.arc(0,0,s*0.5,0,Math.PI*2); ctx.closePath(); ctx.clip();
  if (e.img){ ctx.drawImage(e.img, -s*0.5, -s*0.5, s, s); }
  else {
    // placeholder South-Park-ish face
    ctx.fillStyle='#ffdbb5'; ctx.fillRect(-s*0.5,-s*0.5,s,s);
    ctx.fillStyle='#000'; // eyes + mouth
    ctx.beginPath(); ctx.arc(-s*0.17,-s*0.05,s*0.06,0,Math.PI*2); ctx.arc(s*0.17,-s*0.05,s*0.06,0,Math.PI*2); ctx.fill();
    ctx.fillRect(-s*0.18,s*0.15,s*0.36,s*0.06);
    ctx.fillStyle='#8b5a2b'; ctx.fillRect(-s*0.5,-s*0.5,s,s*0.25); // hair band
  }
  ctx.restore();

  // outline
  ctx.lineWidth = Math.max(6, s*0.06);
  ctx.strokeStyle = e.type==='parent' ? '#ba2020' : '#000';
  ctx.beginPath(); ctx.arc(e.x + wob, e.y, s*0.5, 0, Math.PI*2); ctx.stroke();

  // devices/badges
  if (e.type==='kid'){
    if (e.status==='unauthorized'){
      if (e.device){ ctx.drawImage(e.device, e.x + wob - s*0.15, e.y + s*0.15, s*0.5, s*0.5); }
      else { drawDevicePlaceholder(e.x+wob, e.y+s*0.25, s*0.5, '#ff2b2b'); }
      band(e.x+wob, e.y + s*0.25, s*0.6, '#ff2b2b');
    } else if (e.status==='authorized'){
      if (e.authorizedImg){ ctx.drawImage(e.authorizedImg, e.x + wob - s*0.15, e.y + s*0.15, s*0.5, s*0.5); }
      else { drawDevicePlaceholder(e.x+wob, e.y+s*0.25, s*0.5, '#22c55e'); }
      badge(e.x+wob + s*0.27, e.y - s*0.27, s*0.22, '#22c55e', 'OK');
    }
  } else {
    badge(e.x + wob + s*0.27, e.y - s*0.27, s*0.22, '#ff3e3e', 'GRR');
  }

  if (e.bubble){ drawBubble(e.x + wob + s*0.55, e.y - s*0.55, e.bubble); }
}

function drawDevicePlaceholder(cx, cy, size, color){
  ctx.save(); ctx.translate(cx, cy);
  // a tiny phone rectangle
  ctx.rotate(-0.2); ctx.fillStyle='#000'; ctx.fillRect(-size*0.25-3, -size*0.35-3, size*0.5+6, size*0.7+6);
  ctx.fillStyle='#fff'; ctx.fillRect(-size*0.25, -size*0.35, size*0.5, size*0.7);
  ctx.fillStyle=color; ctx.fillRect(-size*0.25, size*0.05, size*0.5, size*0.12); // banner shows color (unauthorized/authorized)
  ctx.restore();
}

function badge(cx, cy, r, color, text){
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle='#000'; ctx.lineWidth = r*0.25;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#000'; ctx.font=`${Math.floor(r*0.95)}px Arial Black`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, cx, cy+1); ctx.restore();
}
function band(cx, cy, w, color){
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5);
  ctx.fillStyle=color; ctx.strokeStyle='#000'; ctx.lineWidth=6;
  ctx.fillRect(-w/2, -12, w, 24); ctx.strokeRect(-w/2, -12, w, 24);
  ctx.restore();
}

function loop(now){
  if (!running){ return; }
  if (now - last > 500){
    last = now;
    if (entities.length < 5 && Math.random()<0.9) spawn();
  }
  entities = entities.filter(e => now - e.born < e.life && !e.hit);
  ctx.fillStyle='#72d6ff'; ctx.fillRect(0,0,W,H);
  hills();
  entities.forEach(e => drawEntity(e, now));
  requestAnimationFrame(loop);
}

function start(){
  ensureAudio();
  tLeft=120; good=0; bad=0;
  ui.time.textContent=tLeft; ui.good.textContent=good; ui.bad.textContent=bad;
  entities.length=0; running=true; last=0;
  ui.playBtn.disabled = true; ui.replayBtn.disabled = false;
  // Clear any splash/frame before starting loop
  ctx.clearRect(0,0,W,H);
  countdown();
  requestAnimationFrame(loop);
}
function restart(){ stop(false); start(); }
function stop(alertEnd=true){
  running=false; drawSplash(); ui.playBtn.disabled = false;
  if(alertEnd){ setTimeout(()=>{ alert(`Temps écoulé !\nBons coups: ${good}\nOups: ${bad}`); }, 50); }
}
function countdown(){ if (!running) return; if (tLeft<=0){ stop(true); return; } setTimeout(()=>{ tLeft--; ui.time.textContent=tLeft; countdown(); }, 1000); }

canvas.addEventListener('pointerdown', (ev)=>{
  if (!running) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const x = (ev.clientX - rect.left) * dpr;
  const y = (ev.clientY - rect.top) * dpr;

  let hit=null;
  for (let i=entities.length-1;i>=0;i--){
    const e=entities[i];
    const dx = x - e.x, dy = y - e.y;
    if (Math.hypot(dx,dy) <= e.size*0.5){ hit = e; break; }
  }
  if (hit){
    const ok = (hit.type==='kid' && hit.status==='unauthorized');
    if (ok){ good++; playGood(); } else { bad++; playBad(); }
    ui.good.textContent=good; ui.bad.textContent=bad;
    hit.hit=true;
    splat(x,y, ok ? '#22c55e' : '#ff3e3e');
  }
});

function splat(x,y,color){
  ctx.save();
  for (let i=0;i<18;i++){
    const a = Math.random()*Math.PI*2;
    const r = 10 + Math.random()*30;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.ellipse(x+Math.cos(a)*r, y+Math.sin(a)*r, 10, 16, a, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}
ui.playBtn.addEventListener('click', ()=>{ start(); });
ui.replayBtn.addEventListener('click', ()=>{ restart(); });

function drawBubble(x,y,text){
  const padding = 10;
  ctx.save();
  ctx.font = Math.floor(Math.min(W,H)*0.03) + 'px Comic Sans MS';
  const w = ctx.measureText(text).width + padding*2;
  const h = parseInt(ctx.font,10) + padding*1.6;
  const r = 12;
  ctx.translate(x,y);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  roundRect(-w, -h, w, h, r);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-24, 8); ctx.lineTo(-2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#000'; ctx.textBaseline='top'; ctx.fillText(text, -w+padding, -h+padding);
  ctx.restore();
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); }