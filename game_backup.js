// Backup da versão anterior da tela inicial (sem música e efeitos)
// Este arquivo é apenas para referência caso queira voltar ao design anterior

// Tela inicial pixel para navegador (melhorada)
const BASE_W = 320, BASE_H = 180, SCALE = 3;
const SCREEN_W = BASE_W * SCALE, SCREEN_H = BASE_H * SCALE;

const MENU_OPTIONS = ["Iniciar", "Sair"];

const canvas = document.getElementById('screen');
canvas.width = SCREEN_W; canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// offscreen canvas for pixel art base
const base = document.createElement('canvas');
base.width = BASE_W; base.height = BASE_H;
const bctx = base.getContext('2d');

let selected = 0;
let tick = 0;
let state = 'menu';

// animated particles (fireflies)
const particles = [];
for(let i=0;i<18;i++){
  particles.push({
    x: Math.random()*BASE_W,
    y: Math.random()*BASE_H*0.6 + 20,
    vx: (Math.random()-0.5)*0.12,
    vy: (Math.random()-0.5)*0.06,
    size: Math.random()*1.4+0.6,
    hue: 160 + Math.random()*60,
    phase: Math.random()*Math.PI*2
  });
}

function drawAnimatedBackground(ctx, t){
  const tile = 8;
  for(let y=0;y<BASE_H;y+=tile){
    for(let x=0;x<BASE_W;x+=tile){
      const tgrad = (y/BASE_H) + 0.05*Math.sin((x+y+ t*0.03)*0.25);
      let r = Math.floor(8 + 18 * tgrad);
      let g = Math.floor(26 + 120 * tgrad);
      let b = Math.floor(36 + 88 * tgrad);
      const jitter = ((x * 31) ^ (y * 17)) % 12 - 6;
      r = Math.max(0, Math.min(255, r + jitter));
      g = Math.max(0, Math.min(255, g + jitter));
      b = Math.max(0, Math.min(255, b + jitter));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x,y,tile,tile);
    }
  }

  // subtle moving pattern overlay
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#072a2a';
  for(let i=0;i<BASE_W;i+=16){
    ctx.fillRect((i + (t*0.02)%16)|0, BASE_H-14, 8, 8);
  }
  ctx.globalAlpha = 1.0;

  // animated sun with slight bob
  const sx = BASE_W - 48;
  const sy = 32 + Math.sin(t*0.004)*2;
  const sunColors = [[255,210,60],[255,240,120]];
  sunColors.forEach((col,i)=>{
    const radius = 12 - i*4;
    for(let yy=-radius;yy<=radius;yy++){
      for(let xx=-radius;xx<=radius;xx++){
        if(xx*xx+yy*yy<=radius*radius){
          const px = sx+xx, py=sy+yy;
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.fillRect(px,py,1,1);
        }
      }
    }
  });

  // firefly particles
  particles.forEach(p=>{
    p.x += p.vx + 0.02*Math.sin(t*0.003 + p.phase);
    p.y += p.vy + 0.01*Math.cos(t*0.002 + p.phase);
    if(p.x < 0) p.x += BASE_W; if(p.x>BASE_W) p.x-=BASE_W;
    if(p.y < 10) p.y = 10; if(p.y>BASE_H-20) p.y = BASE_H-20;
    const glow = 0.6 + 0.4*Math.sin(t*0.01 + p.phase);
    const col = `hsla(${p.hue},70%,60%,${0.85*glow})`;
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.max(1, p.size), Math.max(1, p.size));
    // soft outer pixel
    ctx.globalAlpha = 0.15*glow;
    ctx.fillStyle = col;
    ctx.fillRect(Math.floor(p.x)-1, Math.floor(p.y)-1, Math.max(1, p.size)+2, Math.max(1, p.size)+2);
    ctx.globalAlpha = 1.0;
  });
}

function render(t){
  // draw animated background
  drawAnimatedBackground(bctx, t);

  // vignette
  for(let i=0;i<6;i++){
    bctx.fillStyle = `rgba(0,0,0,${0.04 + i*0.01})`;
    bctx.fillRect(i*2,i*2,BASE_W - i*4, BASE_H - i*4);
  }

  // title with pixel-y font effect (draw shadow)
  bctx.font = '28px monospace';
  const title = 'Jogo RPG';
  const tx = (BASE_W - bctx.measureText(title).width)/2;
  bctx.fillStyle = '#0b1620';
  bctx.fillText(title, tx+1, 36+1);
  bctx.fillStyle = '#fff2c8';
  // subtle color shift
  const shift = Math.sin(t*0.003)*12;
  bctx.fillStyle = `rgb(${255-shift|0},${245-shift|0},${200})`;
  bctx.fillText(title, tx, 36);

  // subtitle pulse and floating
  const pulse = 1 + 0.06 * (1 + Math.sin(t*0.008));
  bctx.save();
  bctx.translate(BASE_W/2, 56 + Math.sin(t*0.006)*2);
  bctx.scale(pulse, pulse);
  bctx.fillStyle = '#dfe7e6';
  bctx.font = '14px monospace';
  const s = 'Um jogo em pixel - press Enter';
  bctx.fillText(s, -bctx.measureText(s).width/2, 0);
  bctx.restore();

  // menu with smooth highlight (lerp)
  bctx.font = '16px monospace';
  let startY = 96;
  MENU_OPTIONS.forEach((opt,i)=>{
    const txtW = bctx.measureText(opt).width;
    const x = (BASE_W - txtW)/2;
    const y = startY + i*26;
    const isSel = (i===selected);
    // animated highlight box
    if(isSel){
      const pad = 6 + 2*Math.sin(t*0.02);
      bctx.fillStyle = '#12141b';
      bctx.fillRect(x-pad, y-14, txtW+pad*2, 22);
      // border glow
      bctx.strokeStyle = `rgba(80,160,200,${0.9 + 0.1*Math.sin(t*0.02)})`;
      bctx.lineWidth = 1;
      bctx.strokeRect(x-pad, y-14, txtW+pad*2, 22);
    }
    bctx.fillStyle = isSel? '#fff' : '#dfe6e5';
    bctx.fillText(opt, x, y);
  });

  // scanlines overlay
  bctx.globalAlpha = 0.06;
  bctx.fillStyle = '#000';
  for(let yy=0;yy<BASE_H;yy+=2){
    bctx.fillRect(0,yy,BASE_W,1);
  }
  bctx.globalAlpha = 1.0;

  // scale up and draw
  ctx.clearRect(0,0,SCREEN_W,SCREEN_H);
  ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
}

function update(t){
  tick = t;
}

function loop(ts){
  update(ts);
  render(ts);
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e)=>{
  if(state!=='menu') return;
  if(e.key==='ArrowUp' || e.key==='w') selected = (selected - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
  else if(e.key==='ArrowDown' || e.key==='s') selected = (selected + 1) % MENU_OPTIONS.length;
  else if(e.key==='Enter') activate(selected);
});

canvas.addEventListener('click', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (BASE_W / canvas.width);
  const cy = (e.clientY - rect.top) * (BASE_H / canvas.height);
  let startY = 96;
  MENU_OPTIONS.forEach((opt,i)=>{
    const txtW = bctx.measureText(opt).width;
    const x = (BASE_W - txtW)/2;
    const y = startY + i*26 - 12;
    if(cx >= x-8 && cx <= x-8 + txtW+16 && cy >= y && cy <= y + 24){
      activate(i);
    }
  });
});

function activate(i){
  const opt = MENU_OPTIONS[i];
  if(opt === 'Iniciar'){
    state = 'starting';
    // placeholder: small animated transition then back
    setTimeout(()=>{ state='menu'; }, 1200);
  } else if(opt === 'Sair'){
    state = 'quit';
    bctx.fillStyle = '#000'; bctx.fillRect(0,0,BASE_W,BASE_H);
    bctx.fillStyle = '#fff'; bctx.font = '18px monospace';
    const msg = 'Obrigado por jogar!';
    bctx.fillText(msg, (BASE_W - bctx.measureText(msg).width)/2, BASE_H/2);
    ctx.drawImage(base,0,0,SCREEN_W,SCREEN_H);
  }
}

// start
requestAnimationFrame(loop);
