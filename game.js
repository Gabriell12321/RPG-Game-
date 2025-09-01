// Tela inicial pixel para navegador (melhorada com áudio e mais informações)
const BASE_W = 320, BASE_H = 180, SCALE = 3;
const SCREEN_W = BASE_W * SCALE, SCREEN_H = BASE_H * SCALE;

const MENU_OPTIONS = ["Iniciar", "Opções", "Créditos", "Sair"];
const GAME_VERSION = "Beta v0.1";
const GAME_INFO = {
  nome: "Jogo RPG Pixel",
  genero: "Aventura / RPG",
  estilo: "Zelda-like 2D",
  controles: "WASD/Setas - mover, E/Space - interagir, I - inventário"
};

// Audio elements
const bgMusic = document.getElementById('bgMusic');
const menuMoveSfx = document.getElementById('menuMove');
const menuSelectSfx = document.getElementById('menuSelect');

// Audio controls
const musicToggleBtn = document.getElementById('musicToggle');
const sfxToggleBtn = document.getElementById('sfxToggle');

// Configurações de áudio
let audioConfig = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.4,
  sfxVolume: 0.5
};

// Adicionar suporte a tela cheia
const gameContainer = document.getElementById('gameContainer');
const fullscreenToggleBtn = document.getElementById('fullscreenToggle');
let isFullscreen = false;

// Configurações do jogo
let gameConfig = {
  fullscreen: false,
  ...audioConfig
};

// Carregar configurações salvas (se existirem)
if (localStorage.getItem('rpgGameConfig')) {
  try {
    const savedConfig = JSON.parse(localStorage.getItem('rpgGameConfig'));
    gameConfig = {...gameConfig, ...savedConfig};
    // Manter retrocompatibilidade com a estrutura antiga
    audioConfig.musicEnabled = gameConfig.musicEnabled;
    audioConfig.sfxEnabled = gameConfig.sfxEnabled;
    audioConfig.musicVolume = gameConfig.musicVolume;
    audioConfig.sfxVolume = gameConfig.sfxVolume;
  } catch(e) {
    console.error("Erro ao carregar configurações do jogo:", e);
  }
}

// Configurar estado inicial dos botões de áudio e fullscreen
function updateAudioButtons() {
  if (audioConfig.musicEnabled) {
    musicToggleBtn.textContent = "🔊 Música";
    musicToggleBtn.classList.remove('muted');
    bgMusic.volume = audioConfig.musicVolume;
    if (document.hasFocus()) bgMusic.play().catch(e => console.log("Erro ao tocar música:", e));
  } else {
    musicToggleBtn.textContent = "🔇 Música";
    musicToggleBtn.classList.add('muted');
    bgMusic.pause();
  }
  
  if (audioConfig.sfxEnabled) {
    sfxToggleBtn.textContent = "🔊 Sons";
    sfxToggleBtn.classList.remove('muted');
    menuMoveSfx.volume = audioConfig.sfxVolume;
    menuSelectSfx.volume = audioConfig.sfxVolume;
  } else {
    sfxToggleBtn.textContent = "🔇 Sons";
    sfxToggleBtn.classList.add('muted');
  }
  
  // Configurar o botão de tela cheia também
  updateFullscreenUI();
}

// Event listeners para controles de áudio e fullscreen
musicToggleBtn.addEventListener('click', () => {
  gameConfig.musicEnabled = !gameConfig.musicEnabled;
  audioConfig.musicEnabled = gameConfig.musicEnabled;
  updateAudioButtons();
  saveGameConfig();
});

sfxToggleBtn.addEventListener('click', () => {
  gameConfig.sfxEnabled = !gameConfig.sfxEnabled;
  audioConfig.sfxEnabled = gameConfig.sfxEnabled;
  updateAudioButtons();
  saveGameConfig();
});

// Funções para manipular o modo de tela cheia
function toggleFullscreen() {
  if (!document.fullscreenElement && 
      !document.mozFullScreenElement && 
      !document.webkitFullscreenElement && 
      !document.msFullscreenElement) {
    // Entrar em tela cheia
    if (gameContainer.requestFullscreen) {
      gameContainer.requestFullscreen();
    } else if (gameContainer.msRequestFullscreen) {
      gameContainer.msRequestFullscreen();
    } else if (gameContainer.mozRequestFullScreen) {
      gameContainer.mozRequestFullScreen();
    } else if (gameContainer.webkitRequestFullscreen) {
      gameContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    isFullscreen = true;
  } else {
    // Sair da tela cheia
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    isFullscreen = false;
  }
  updateFullscreenUI();
  gameConfig.fullscreen = isFullscreen;
  saveGameConfig();
}

function updateFullscreenUI() {
  if (isFullscreen) {
    gameContainer.classList.add('fullscreen-container');
    fullscreenToggleBtn.textContent = "⮌ Normal";
    fullscreenToggleBtn.classList.add('fullscreen-btn-active');
  } else {
    gameContainer.classList.remove('fullscreen-container');
    fullscreenToggleBtn.textContent = "⛶ Tela Cheia";
    fullscreenToggleBtn.classList.remove('fullscreen-btn-active');
  }
  
  // Redimensionar o canvas após trocar o modo de exibição
  setTimeout(resizeCanvas, 100);
}

// Salvar todas as configurações
function saveGameConfig() {
  localStorage.setItem('rpgGameConfig', JSON.stringify(gameConfig));
}

// Event listener para botão de tela cheia
fullscreenToggleBtn.addEventListener('click', toggleFullscreen);

// Event listener para F11 (alternar tela cheia)
document.addEventListener('keydown', function(e) {
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
  }
});

// Detectar quando o usuário sai do modo tela cheia usando ESC
document.addEventListener('fullscreenchange', function() {
  isFullscreen = !!document.fullscreenElement;
  updateFullscreenUI();
});
document.addEventListener('webkitfullscreenchange', function() {
  isFullscreen = !!document.webkitFullscreenElement;
  updateFullscreenUI();
});
document.addEventListener('mozfullscreenchange', function() {
  isFullscreen = !!document.mozFullScreenElement;
  updateFullscreenUI();
});

// Função para redimensionar o canvas mantendo a proporção
function resizeCanvas() {
  if (isFullscreen) {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    const scale = Math.min(
      containerWidth / SCREEN_W,
      containerHeight / SCREEN_H
    );
    
    canvas.style.width = `${SCREEN_W * scale}px`;
    canvas.style.height = `${SCREEN_H * scale}px`;
  } else {
    canvas.style.width = '';
    canvas.style.height = '';
  }
}

function playMenuMoveSfx() {
  if (!audioConfig.sfxEnabled) return;
  menuMoveSfx.currentTime = 0;
  menuMoveSfx.play().catch(e => {});
}

function playMenuSelectSfx() {
  if (!audioConfig.sfxEnabled) return;
  menuSelectSfx.currentTime = 0;
  menuSelectSfx.play().catch(e => {});
}

// Canvas setup
const canvas = document.getElementById('screen');
canvas.width = SCREEN_W; canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Iniciar áudio depois de interação do usuário
document.addEventListener('click', function initAudio() {
  updateAudioButtons();
  document.removeEventListener('click', initAudio);
}, {once: true});

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
  // Diferentes estados de renderização baseados no estado atual do menu
  switch(menuState) {
    case 'main':
      renderMainMenu(t);
      break;
    case 'options':
      renderOptionsMenu(t);
      break;
    case 'credits':
      renderCreditsScreen(t);
      break;
    default:
      renderMainMenu(t);
  }

  // scanlines overlay
  bctx.globalAlpha = 0.06;
  bctx.fillStyle = '#000';
  for(let yy=0;yy<BASE_H;yy+=2){
    bctx.fillRect(0,yy,BASE_W,1);
  }
  bctx.globalAlpha = 1.0;

  // Efeito de brilho nos cantos (vignette)
  const gradSize = 80;
  const grd = bctx.createRadialGradient(
    BASE_W/2, BASE_H/2, BASE_W/3, 
    BASE_W/2, BASE_H/2, BASE_W*0.75
  );
  grd.addColorStop(0, "rgba(0,40,50,0)");
  grd.addColorStop(1, "rgba(0,10,20,0.3)");
  bctx.fillStyle = grd;
  bctx.fillRect(0, 0, BASE_W, BASE_H);

  // Renderizar info box quando visível
  if (infoBoxVisible && infoText) {
    renderInfoBox(t);
  }

  // scale up and draw to visible canvas
  ctx.clearRect(0,0,SCREEN_W,SCREEN_H);
  ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
}

// Menu principal
function renderMainMenu(t) {
  // Desenhar fundo animado
  drawAnimatedBackground(bctx, t);

  // Vignette
  for(let i=0;i<6;i++){
    bctx.fillStyle = `rgba(0,0,0,${0.04 + i*0.01})`;
    bctx.fillRect(i*2,i*2,BASE_W - i*4, BASE_H - i*4);
  }

  // Título com efeito de pixel e sombra
  bctx.font = '28px VCR-OSD-MONO, monospace';
  const title = 'Jogo RPG';
  const tx = (BASE_W - bctx.measureText(title).width)/2;
  
  // Sombra do título
  bctx.fillStyle = '#0b1620';
  bctx.fillText(title, tx+1, 36+1);
  
  // Título com variação de cor suave
  const shift = Math.sin(t*0.003)*12;
  bctx.fillStyle = `rgb(${255-shift|0},${245-shift|0},${200})`;
  bctx.fillText(title, tx, 36);

  // Desenhar pequeno efeito de borda em volta do título
  bctx.strokeStyle = '#112';
  bctx.lineWidth = 1;
  bctx.strokeText(title, tx, 36);

  // Subtítulo com animação de pulso e flutuação
  const pulse = 1 + 0.06 * (1 + Math.sin(t*0.008));
  bctx.save();
  bctx.translate(BASE_W/2, 56 + Math.sin(t*0.006)*2);
  bctx.scale(pulse, pulse);
  bctx.fillStyle = '#dfe7e6';
  bctx.font = '14px VCR-OSD-MONO, monospace';
  const s = 'Um jogo em pixel - press Enter';
  bctx.fillText(s, -bctx.measureText(s).width/2, 0);
  bctx.restore();

  // Menu com highlight suave
  bctx.font = '16px VCR-OSD-MONO, monospace';
  let startY = 96;
  MENU_OPTIONS.forEach((opt,i)=>{
    const txtW = bctx.measureText(opt).width;
    const x = (BASE_W - txtW)/2;
    const y = startY + i*22;
    const isSel = (i===selected);
    
    // Caixa de destaque animada
    if(isSel){
      // Efeito de respiro na caixa
      const pad = 6 + 2*Math.sin(t*0.02);
      
      // Desenhar um brilho atrás da caixa
      const glowSize = 3 + Math.sin(t*0.02)*1.5;
      bctx.fillStyle = `rgba(60,140,180,${0.2 + 0.1*Math.sin(t*0.03)})`;
      bctx.fillRect(x-pad-glowSize, y-14-glowSize, txtW+pad*2+glowSize*2, 22+glowSize*2);
      
      // Caixa principal
      bctx.fillStyle = '#12141b';
      bctx.fillRect(x-pad, y-14, txtW+pad*2, 22);
      
      // Borda com brilho animado
      const hue = (t*0.02) % 360;
      bctx.strokeStyle = `rgba(80,160,200,${0.9 + 0.1*Math.sin(t*0.02)})`;
      bctx.lineWidth = 1;
      bctx.strokeRect(x-pad, y-14, txtW+pad*2, 22);
      
      // Segunda borda interna com efeito diferente
      bctx.strokeStyle = `rgba(120,240,220,${0.3 + 0.2*Math.sin(t*0.04)})`;
      bctx.strokeRect(x-pad+2, y-14+2, txtW+pad*2-4, 22-4);
    }
    
    // Texto da opção do menu
    bctx.fillStyle = isSel ? '#fff' : '#dfe6e5';
    bctx.fillText(opt, x, y);
    
    // Efeito de sombra no texto
    if (isSel) {
      bctx.globalAlpha = 0.1;
      bctx.fillStyle = '#7cf';
      bctx.fillText(opt, x+1, y+1);
      bctx.globalAlpha = 1.0;
    }
  });

  // Mostrar versão no canto inferior direito
  bctx.font = '10px monospace';
  bctx.fillStyle = '#5a899a';
  bctx.fillText(GAME_VERSION, BASE_W - 40, BASE_H - 6);
}

// Tela de opções
function renderOptionsMenu(t) {
  // Fundo mais escuro para o menu de opções
  drawAnimatedBackground(bctx, t);
  
  // Overlay semi-transparente
  bctx.fillStyle = 'rgba(10,20,30,0.7)';
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Título
  bctx.font = '20px VCR-OSD-MONO, monospace';
  bctx.fillStyle = '#eee';
  const title = 'OPÇÕES';
  bctx.fillText(title, (BASE_W - bctx.measureText(title).width)/2, 30);
  
  // Instruções
  bctx.font = '12px monospace';
  bctx.fillStyle = '#aac';
  const backText = 'Pressione ESC para voltar';
  bctx.fillText(backText, (BASE_W - bctx.measureText(backText).width)/2, BASE_H - 15);
  
  // Opções
  const options = [
    "Volume da Música: " + (audioConfig.musicEnabled ? "ON" : "OFF"),
    "Volume dos Efeitos: " + (audioConfig.sfxEnabled ? "ON" : "OFF"),
    "Tela Cheia: " + (isFullscreen ? "ON" : "OFF"),
    "Velocidade de Texto: Normal"
  ];
  
  bctx.font = '14px VCR-OSD-MONO, monospace';
  options.forEach((opt, i) => {
    const y = 70 + i * 22;
    bctx.fillStyle = '#90b7c6';
    bctx.fillText(opt, 40, y);
    
    // Indicador de seleção animado
    if (i === selected) {
      const arrowX = 20 + Math.sin(t*0.01) * 3;
      bctx.fillStyle = '#fff';
      bctx.fillText('>', arrowX, y);
    }
  });
}

// Tela de créditos
function renderCreditsScreen(t) {
  // Fundo com efeito de rolagem lenta
  const scrollY = (t * 0.02) % 200;
  
  // Fundo base
  drawAnimatedBackground(bctx, t);
  
  // Overlay semitransparente
  bctx.fillStyle = 'rgba(5,15,25,0.7)';
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Título
  bctx.font = '20px VCR-OSD-MONO, monospace';
  bctx.fillStyle = '#eee';
  const title = 'CRÉDITOS';
  bctx.fillText(title, (BASE_W - bctx.measureText(title).width)/2, 30);
  
  // Créditos com rolagem
  const credits = [
    {title: "Criado por:", name: "Você"},
    {title: "Design:", name: "Seu Nome Aqui"},
    {title: "Programação:", name: "Você & Copilot"},
    {title: "Arte Pixel:", name: "Estilo Retro 16-bit"},
    {title: "Música:", name: "OpenGameArt.org"},
    {title: "Efeitos Sonoros:", name: "OpenGameArt.org"},
    {title: "Inspirado em:", name: "The Legend of Zelda"},
    {title: "Agradecimentos:", name: "À comunidade de jogos pixel"}
  ];
  
  // Posição inicial ajustada com o scroll
  let startY = 70 - scrollY;
  
  // Desenhar os créditos
  bctx.font = '12px monospace';
  credits.forEach((entry, i) => {
    const y = startY + i * 25;
    
    // Só desenhar se estiver visível na tela
    if (y > 0 && y < BASE_H - 20) {
      bctx.fillStyle = '#5fefd7';
      bctx.fillText(entry.title, 40, y);
      
      bctx.fillStyle = '#cde';
      bctx.fillText(entry.name, 40, y + 12);
    }
    
    // Quando chegar ao final, reiniciar
    if (startY + credits.length * 25 < 50) {
      startY = BASE_H;
    }
  });
  
  // Instruções
  bctx.font = '12px monospace';
  bctx.fillStyle = '#aac';
  const backText = 'Pressione ESC para voltar';
  bctx.fillText(backText, (BASE_W - bctx.measureText(backText).width)/2, BASE_H - 15);
}

// Caixa de informações
function renderInfoBox(t) {
  // Calcular opacidade baseada no tempo desde a última atualização
  const boxAge = t - lastInfoUpdate;
  const opacity = boxAge > 4000 ? Math.max(0, 1 - (boxAge - 4000)/1000) : 1;
  
  if (opacity <= 0) {
    infoBoxVisible = false;
    return;
  }
  
  // Desenhar caixa com borda
  const boxW = Math.min(260, BASE_W - 20);
  const boxH = 30;
  const boxX = (BASE_W - boxW) / 2;
  const boxY = BASE_H - boxH - 10;
  
  bctx.fillStyle = `rgba(10,30,40,${0.8 * opacity})`;
  bctx.fillRect(boxX, boxY, boxW, boxH);
  
  bctx.strokeStyle = `rgba(80,180,200,${0.6 * opacity})`;
  bctx.lineWidth = 1;
  bctx.strokeRect(boxX, boxY, boxW, boxH);
  
  // Texto da informação
  bctx.font = '12px monospace';
  bctx.fillStyle = `rgba(220,255,230,${opacity})`;
  bctx.fillText(infoText, boxX + 8, boxY + 18);
}

function update(t){
  tick = t;
  
  // Detectar mudanças na seleção para tocar som
  if (previousSelected !== selected) {
    previousSelected = selected;
  }
  
  // Detecção de foco para pausar/retomar a música
  if (document.hasFocus()) {
    if (audioConfig.musicEnabled && bgMusic.paused) {
      bgMusic.play().catch(e => {});
    }
  } else {
    if (!bgMusic.paused) {
      bgMusic.pause();
    }
  }
}

function loop(ts){
  update(ts);
  render(ts);
  requestAnimationFrame(loop);
}

// Informações sobre o estado atual e transições
let menuState = 'main';
let previousSelected = 0; // Para detectar mudanças na seleção e tocar som
let infoText = '';
let infoBoxVisible = false;
let lastInfoUpdate = 0;

// Eventos de teclado para navegação no menu
window.addEventListener('keydown', (e)=>{
  if(state!=='menu') return;
  let oldSelected = selected;
  
  if(e.key==='ArrowUp' || e.key==='w') {
    selected = (selected - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
  }
  else if(e.key==='ArrowDown' || e.key==='s') {
    selected = (selected + 1) % MENU_OPTIONS.length;
  }
  else if(e.key==='Enter') {
    playMenuSelectSfx();
    activate(selected);
    return;
  }
  else if(e.key==='Escape' && menuState !== 'main') {
    menuState = 'main';
    playMenuSelectSfx();
    return;
  }
  
  // Tocar som quando muda a seleção
  if (selected !== oldSelected) {
    playMenuMoveSfx();
    showOptionInfo(selected);
  }
});

// Tratamento de clicks do mouse
canvas.addEventListener('click', (e)=>{
  if(state !== 'menu') return;
  
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (BASE_W / canvas.width);
  const cy = (e.clientY - rect.top) * (BASE_H / canvas.height);
  let startY = 96;
  
  let clicked = false;
  MENU_OPTIONS.forEach((opt,i)=>{
    const txtW = bctx.measureText(opt).width;
    const x = (BASE_W - txtW)/2;
    const y = startY + i*22 - 12;
    if(cx >= x-8 && cx <= x-8 + txtW+16 && cy >= y && cy <= y + 24){
      if(selected !== i) {
        playMenuMoveSfx();
        selected = i;
        showOptionInfo(i);
      } else {
        playMenuSelectSfx();
        activate(i);
      }
      clicked = true;
    }
  });
  
  // Se clicar fora das opções, mostrar/esconder caixa de informações
  if(!clicked && cy > 130) {
    infoBoxVisible = !infoBoxVisible;
    lastInfoUpdate = tick;
  }
});

// Mostrar informações sobre a opção selecionada
function showOptionInfo(index) {
  const option = MENU_OPTIONS[index];
  switch(option) {
    case 'Iniciar':
      infoText = 'Comece uma nova jornada no mundo de pixel';
      break;
    case 'Opções':
      infoText = 'Configure gráficos, áudio e controles';
      break;
    case 'Créditos':
      infoText = 'Informações sobre o desenvolvimento';
      break;
    case 'Sair':
      infoText = 'Encerrar o jogo';
      break;
    default:
      infoText = '';
  }
  
  infoBoxVisible = true;
  lastInfoUpdate = tick;
}

// Ativar opção do menu
function activate(i){
  const opt = MENU_OPTIONS[i];
  
  switch(opt) {
    case 'Iniciar':
      state = 'starting';
      showLoadingScreen();
      // Iniciar o jogo após uma pequena animação
      setTimeout(() => { 
        // Placeholder para início do jogo real
        state = 'menu';
      }, 1500);
      break;
      
    case 'Opções':
      menuState = 'options';
      selected = 0;
      break;
      
    case 'Créditos':
      menuState = 'credits';
      break;
      
    case 'Sair':
      state = 'quit';
      showQuitScreen();
      break;
  }
}

// Tela de carregamento
function showLoadingScreen() {
  // Efeito de transição
  const transitionDuration = 500; // ms
  const startTime = Date.now();
  
  function drawTransition() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / transitionDuration, 1);
    
    bctx.fillStyle = '#000';
    bctx.fillRect(0, 0, BASE_W, BASE_H);
    
    // Mensagem pulsante
    const pulse = 0.8 + 0.2 * Math.sin(elapsed * 0.01);
    bctx.font = '16px monospace';
    bctx.fillStyle = `rgba(200, 230, 255, ${pulse})`;
    const msg = 'Carregando...';
    bctx.fillText(msg, (BASE_W - bctx.measureText(msg).width)/2, BASE_H/2);
    
    // Indicador de progresso
    const barWidth = BASE_W * 0.4;
    const barHeight = 4;
    const barX = (BASE_W - barWidth) / 2;
    const barY = BASE_H/2 + 20;
    
    bctx.fillStyle = '#112';
    bctx.fillRect(barX, barY, barWidth, barHeight);
    bctx.fillStyle = '#7ea';
    bctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Dicas rotativas
    const tips = [
      "Pressione I para abrir o inventário",
      "Explore cada canto do mapa para encontrar segredos",
      "Fale com os NPCs para descobrir missões",
      "Melhore suas habilidades para enfrentar inimigos mais fortes"
    ];
    
    const tipIndex = Math.floor(elapsed / 1000) % tips.length;
    bctx.font = '12px monospace';
    bctx.fillStyle = '#aac';
    const tip = tips[tipIndex];
    bctx.fillText(tip, (BASE_W - bctx.measureText(tip).width)/2, BASE_H/2 + 50);
    
    ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
    
    if (progress < 1) {
      requestAnimationFrame(drawTransition);
    }
  }
  
  drawTransition();
}

// Tela de saída
function showQuitScreen() {
  bctx.fillStyle = '#000'; 
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Mensagem de despedida
  bctx.font = '18px monospace';
  bctx.fillStyle = '#fff';
  const msg = 'Obrigado por jogar!';
  bctx.fillText(msg, (BASE_W - bctx.measureText(msg).width)/2, BASE_H/2);
  
  // Data e versão
  bctx.font = '12px monospace';
  bctx.fillStyle = '#7aa';
  const ver = GAME_VERSION + ' - ' + new Date().getFullYear();
  bctx.fillText(ver, (BASE_W - bctx.measureText(ver).width)/2, BASE_H/2 + 30);
  
  ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
}

// Event listener para redimensionar a janela
window.addEventListener('resize', resizeCanvas);

// Inicializar e começar o loop
updateAudioButtons();

// Aplicar tela cheia se estiver salvo nas configurações
if (gameConfig.fullscreen) {
  // Atraso pequeno para garantir que a página foi carregada
  setTimeout(() => {
    toggleFullscreen();
  }, 500);
}

requestAnimationFrame(loop);
