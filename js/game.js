// Tela inicial para RPG de terror com chuva e música triste
// Constantes globais do jogo
const BASE_W = 400, BASE_H = 225, SCALE = 3;
const SCREEN_W = BASE_W * SCALE, SCREEN_H = BASE_H * SCALE;

// Criar/mesclar objeto global para compartilhar funções e variáveis entre arquivos, sem sobrescrever
window.GameSystem = window.GameSystem || { constants: {}, functions: {}, state: {} };
window.GameSystem.constants = Object.assign({
  WORLD_CHUNK_SIZE: 16,
  VISIBLE_CHUNKS_RADIUS: 3,
  WORLD_SEED: Math.random() * 10000 | 0,
  TILE_SIZE: 16,
  BASE_W: BASE_W,
  BASE_H: BASE_H,
  SCREEN_W: SCREEN_W,
  SCREEN_H: SCREEN_H,
  SCALE: SCALE
}, window.GameSystem.constants || {});
window.GameSystem.functions = window.GameSystem.functions || {};
window.GameSystem.state = Object.assign({
  isLoaded: false,
  currentState: 'loading',
  worldInitialized: false,
  graphicsQuality: 'high', // low, medium, high, ultra
  useAdvancedLighting: true,
  usePostProcessing: true,
  useParticleEffects: true,
  use3DEffects: true
}, window.GameSystem.state || {});

// Variável para armazenar o estado do jogo
let state = 'menu';
let map = [];
const TILE_SIZE = 16;
let MAP_WIDTH = 20;
let MAP_HEIGHT = 20;

// Verificar se o DOM está carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

function initGame() {

  const MENU_OPTIONS = ["Começar Pesadelo", "Opções", "Segredos", "Desistir"];
  const GAME_VERSION = "Pesadelo v0.1";
  const GAME_INFO = {
    nome: "Pesadelo Pixelado",
    genero: "Terror / RPG",
    estilo: "Terror Psicológico 2D",
    controles: "WASD/Setas - mover, E/Space - interagir, F - lanterna, Shift - correr"
  };

  // Audio elements (com verificação de existência)
  const bgMusic = document.getElementById('bgMusic');
  const menuMoveSfx = document.getElementById('menuMove');
  const menuSelectSfx = document.getElementById('menuSelect');
  const rainSound = document.getElementById('rainSound');

  // Referências de UI
  const gameContainer = document.getElementById('gameContainer');
  const musicToggleBtn = document.getElementById('musicToggle');
  const sfxToggleBtn = document.getElementById('sfxToggle');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggle');

  // Configuração persistente
  let gameConfig = {
    musicEnabled: true,
    sfxEnabled: true,
    fullscreen: false
  };
  try {
    const saved = localStorage.getItem('rpgGameConfig');
    if (saved) gameConfig = {...gameConfig, ...JSON.parse(saved)};
  } catch {}

  // Espelhar estado de áudio atual
  const audioConfig = {
    musicEnabled: gameConfig.musicEnabled,
    sfxEnabled: gameConfig.sfxEnabled
  };

  // Atualizar estados de botões
  function updateAudioButtons() {
    if (musicToggleBtn) musicToggleBtn.textContent = (audioConfig.musicEnabled ? '🔊 Música' : '🔈 Música');
    if (sfxToggleBtn) sfxToggleBtn.textContent = (audioConfig.sfxEnabled ? '🔊 Sons' : '🔈 Sons');
    if (fullscreenToggleBtn) fullscreenToggleBtn.textContent = document.fullscreenElement ? '⮌ Normal' : '⛶ Tela Cheia';
  }

  // Handlers de botões
  if (musicToggleBtn) musicToggleBtn.addEventListener('click', () => {
    gameConfig.musicEnabled = !gameConfig.musicEnabled;
    audioConfig.musicEnabled = gameConfig.musicEnabled;
    try {
      if (bgMusic) {
        if (audioConfig.musicEnabled) bgMusic.play().catch(()=>{}); else bgMusic.pause();
      }
    } catch {}
    updateAudioButtons();
    saveGameConfig();
  });
  if (sfxToggleBtn) sfxToggleBtn.addEventListener('click', () => {
    gameConfig.sfxEnabled = !gameConfig.sfxEnabled;
    audioConfig.sfxEnabled = gameConfig.sfxEnabled;
    updateAudioButtons();
    saveGameConfig();
  });

// Criar áudio sintético se os arquivos externos falharem
let audioContext;
let synthAudio = {
  menuMove: null,
  menuSelect: null,
  rain: null
};

// Inicializar contexto de áudio
function initSynthAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Som de movimento no menu (beep curto)
    synthAudio.menuMove = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    };

    // Som de seleção no menu (beep grave)
    synthAudio.menuSelect = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    };

  } catch (e) {
    console.log("Audio sintético não disponível:", e);
  }
}

let isFullscreen = !!document.fullscreenElement;
updateAudioButtons();

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

// Helper global de debug (usado por múltiplas etapas da transição)
function updateDebug(message) {
  const debugStatus = document.getElementById('debug-status');
  if (debugStatus) {
    debugStatus.innerHTML += `<br>${message}`;
  }
  try { console.log(message); } catch {}
}

// Event listener para botão de tela cheia
if (typeof fullscreenToggleBtn !== 'undefined' && fullscreenToggleBtn) {
  fullscreenToggleBtn.addEventListener('click', toggleFullscreen);
}

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
  
  // Tentar tocar o áudio normal primeiro
  if (menuMoveSfx && menuMoveSfx.readyState >= 2) {
    menuMoveSfx.currentTime = 0;
    menuMoveSfx.play().catch(e => {
      // Se falhar, usar áudio sintético
      if (synthAudio.menuMove) synthAudio.menuMove();
    });
  } else {
    // Usar áudio sintético se o arquivo não carregou
    if (synthAudio.menuMove) synthAudio.menuMove();
  }
}

function playMenuSelectSfx() {
  if (!audioConfig.sfxEnabled) return;
  
  // Tentar tocar o áudio normal primeiro
  if (menuSelectSfx && menuSelectSfx.readyState >= 2) {
    menuSelectSfx.currentTime = 0;
    menuSelectSfx.play().catch(e => {
      // Se falhar, usar áudio sintético
      if (synthAudio.menuSelect) synthAudio.menuSelect();
    });
  } else {
    // Usar áudio sintético se o arquivo não carregou
    if (synthAudio.menuSelect) synthAudio.menuSelect();
  }
}

// Canvas setup
const canvas = document.getElementById('screen');
canvas.width = SCREEN_W; canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Iniciar áudio depois de interação do usuário
document.addEventListener('click', function initAudio() {
  initSynthAudio();
  updateAudioButtons();
  document.removeEventListener('click', initAudio);
}, {once: true});

// Também inicializar quando pressionar uma tecla
document.addEventListener('keydown', function initAudioKey() {
  initSynthAudio();
  updateAudioButtons();
  document.removeEventListener('keydown', initAudioKey);
}, {once: true});

// offscreen canvas for pixel art base
const base = document.createElement('canvas');
base.width = BASE_W; base.height = BASE_H;
const bctx = base.getContext('2d');

let selected = 0;
let tick = 0;
// Variáveis do estado do jogo
let state = 'menu';
let gameStarted = false;

// Variáveis do jogador
let player = {
  x: 160,
  y: 120,
  width: 16,
  height: 16,
  speed: 2,
  lanterna: false,
  direction: 0, // 0=norte, 1=leste, 2=sul, 3=oeste
  health: 100,
  maxHealth: 100,
  inSafeZone: true
};

// Sistema de zonas seguras
let safeZones = [
  {
    name: "Casa",
    x: 0,
    y: 0,
    width: BASE_W,
    height: BASE_H,
    active: true
  }
];

// Sistema de inimigos
let enemies = [];
let enemySpawnTimer = 0;
let enemySpawnInterval = 3000; // 3 segundos

// Configurações de inimigos
const ENEMY_TYPES = {
  shadow: {
    name: "Sombra",
    health: 30,
    speed: 1,
    damage: 10,
    color: '#2F2F2F',
    size: 12,
    spawnChance: 0.7
  },
  ghost: {
    name: "Fantasma",
    health: 20,
    speed: 1.5,
    damage: 15,
    color: '#E6E6FA',
    size: 14,
    spawnChance: 0.2
  },
  demon: {
    name: "Demônio",
    health: 50,
    speed: 0.8,
    damage: 20,
    color: '#8B0000',
    size: 18,
    spawnChance: 0.1
  }
};

// Câmera para o mundo aberto
let camera = {
  x: 0,
  y: 0
};

// Sistema de iluminação
let lighting = {
  ambientLight: 0.3, // Luz ambiente (0-1)
  lightSources: [],
  shadows: true,
  timeOfDay: 0.5 // 0=noite, 0.5=meio-dia, 1=noite
};
let render3D = {
  enabled: true,
  tileHeight: 8, // Altura dos tiles em pixels
  shadowLength: 6,
  fogDistance: 100
};

// Sistema de entrada
let keys = {};

// Event listeners para o jogo
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  
  // Debug para verificar se a tecla está sendo detectada
  console.log('Tecla pressionada:', e.key, 'Estado do jogo:', state);
  
  // Verificar interação com tecla E ou Espaço
  if ((e.key.toLowerCase() === 'e' || e.key === ' ') && state === 'playing') {
    console.log('Tentando interagir com a porta...');
    checkDoorInteraction(player.x, player.y);
  }
  
  // Voltar para casa com R (quando no mundo aberto)
  if (e.key.toLowerCase() === 'r' && state === 'world') {
    returnToHouse();
  }
  
  // Alternar lanterna com F
  if (e.key.toLowerCase() === 'f') {
    player.lanterna = !player.lanterna;
    console.log('Lanterna:', player.lanterna ? 'ligada' : 'desligada');
  }
  
  // Controlar tempo do dia com T
  if (e.key.toLowerCase() === 't') {
    lighting.timeOfDay = (lighting.timeOfDay + 0.2) % 1;
    console.log('Hora do dia:', lighting.timeOfDay);
  }
  
  // Prevenção de rolagem da página quando usando teclas de seta/WASD
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Função para retornar à casa
function returnToHouse() {
  console.log('Retornando para casa...');
  
  // Restaurar estado da casa
  state = 'playing';
  MAP_WIDTH = 20;
  MAP_HEIGHT = 20;
  
  // Regenerar mapa da casa
  map = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => Math.floor(Math.random() * 3))
  );
  
  // Reposicionar jogador na casa
  player.x = 160;
  player.y = 120;
  
  // Restaurar zona segura da casa
  safeZones = [
    {
      name: "Casa",
      x: 0,
      y: 0,
      width: BASE_W,
      height: BASE_H,
      active: true
    }
  ];
  
  // Remover todos os inimigos
  enemies = [];
  
  // Regenerar vida completamente
  player.health = player.maxHealth;
  
  console.log('De volta à zona segura! Vida restaurada.');
  
  // Reiniciar loop do jogo normal
  gameLoop();
}

// animated particles (rain drops)
const particles = [];
for(let i=0; i<100; i++){
  particles.push({
    x: Math.random()*BASE_W,
    y: Math.random()*BASE_H,
    vx: (Math.random()-0.5)*0.2,
    vy: 2 + Math.random()*3,
    size: Math.random()*2.5+0.5,
    opacity: 0.4 + Math.random()*0.6,
    length: 5 + Math.random()*10
  });
}

function drawAnimatedBackground(ctx, t){
  // Dark, gloomy background with subtle texture
  const tile = 8;
  for(let y=0; y<BASE_H; y+=tile){
    for(let x=0; x<BASE_W; x+=tile){
      // Darker background with subtle blue tint
      const tgrad = (y/BASE_H) * 0.6 + 0.05*Math.sin((x+y+t*0.01)*0.25);
      let r = Math.floor(4 + 6 * tgrad);
      let g = Math.floor(6 + 8 * tgrad);
      let b = Math.floor(12 + 20 * tgrad);
      
      // Add subtle noise
      const jitter = ((x * 29) ^ (y * 13)) % 8 - 4;
      r = Math.max(0, Math.min(255, r + jitter));
      g = Math.max(0, Math.min(255, g + jitter));
      b = Math.max(0, Math.min(255, b + jitter));
      
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x,y,tile,tile);
    }
  }

  // Occasional lightning effect
  if (Math.random() < 0.003) {
    ctx.globalAlpha = 0.2 + Math.random() * 0.3;
    ctx.fillStyle = '#aabcff';
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = 1.0;
  }

  // Draw distant buildings silhouettes
  ctx.fillStyle = '#000000';
  
  // Building 1
  ctx.fillRect(20, 60, 40, 120);
  
  // Building 2
  ctx.fillRect(70, 80, 30, 100);
  
  // Building 3
  ctx.fillRect(110, 70, 50, 110);
  
  // Building 4
  ctx.fillRect(170, 85, 35, 95);
  
  // Building 5
  ctx.fillRect(220, 65, 45, 115);
  
  // Building 6
  ctx.fillRect(280, 75, 25, 105);

  // Add some windows with occasional light
  ctx.fillStyle = '#292929';
  for(let b = 0; b < 6; b++) {
    const bx = 20 + b * 50;
    const by = 60 + b * 5;
    const bw = 30 + b % 3 * 10;
    
    for(let wy = 0; wy < 8; wy++) {
      for(let wx = 0; wx < 3; wx++) {
        // Window position
        const wx_pos = bx + wx * 8 + 5;
        const wy_pos = by + wy * 12 + 10;
        
        // Random light in windows
        if (Math.random() < 0.05) {
          ctx.fillStyle = `rgba(255, 200, 100, ${0.1 + Math.random() * 0.2})`;
        } else {
          ctx.fillStyle = '#1a1a1a';
        }
        
        // Draw window
        if (wx_pos < bx + bw - 8) {
          ctx.fillRect(wx_pos, wy_pos, 4, 6);
        }
      }
    }
  }

  // Rain particles
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.6)';
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    // Reset particles that go off screen
    if (p.y > BASE_H) {
      p.y = -10;
      p.x = Math.random() * BASE_W;
    }
    
    // Draw rain drop
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.vx * 1.5, p.y + p.length);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // Occasional splash effect at bottom
    if (p.y > BASE_H - 20 && Math.random() < 0.05) {
      ctx.fillStyle = 'rgba(180, 200, 255, 0.3)';
      ctx.fillRect(p.x, BASE_H - 2, 1, 1);
    }
  });
  
  // Fog overlay
  for(let i = 0; i < 4; i++) {
    const fogY = 30 + i * 40;
    const fogOffset = (t * 0.02 + i * 50) % BASE_W;
    
    ctx.fillStyle = `rgba(40, 45, 60, ${0.04 + i * 0.01})`;
    
    for(let x = -BASE_W; x < BASE_W; x += 30) {
      const width = 100 + Math.sin(x * 0.1) * 30;
      const height = 5 + Math.cos(x * 0.05) * 5;
      ctx.fillRect((x + fogOffset) % BASE_W, fogY, width, height);
    }
  }
  
  // Occasionally draw a subtle moon with clouds passing over it
  const mx = BASE_W - 40;
  const my = 30;
  
  // Moon
  ctx.fillStyle = 'rgba(180, 190, 210, 0.3)';
  ctx.beginPath();
  ctx.arc(mx, my, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Cloud over moon
  const cloudOffset = (t * 0.01) % (BASE_W * 2);
  ctx.fillStyle = 'rgba(10, 12, 20, 0.7)';
  ctx.fillRect(mx - 15 + cloudOffset % 40 - 20, my - 4, 20, 8);
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

  // Efeito de vinheta mais escura para ambientação de terror
  const gradSize = 80;
  const grd = bctx.createRadialGradient(
    BASE_W/2, BASE_H/2, BASE_W/4, 
    BASE_W/2, BASE_H/2, BASE_W*0.7
  );
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(0.7, "rgba(30,0,0,0.2)");
  grd.addColorStop(1, "rgba(0,0,0,0.5)");
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
  // Desenhar fundo animado de chuva
  drawAnimatedBackground(bctx, t);

  // Vignette mais forte para aumentar a sensação de terror
  for(let i=0; i<8; i++){
    bctx.fillStyle = `rgba(0,0,0,${0.06 + i*0.02})`;
    bctx.fillRect(i*2, i*2, BASE_W - i*4, BASE_H - i*4);
  }

  // Título com efeito de pixel e sombra
  bctx.font = 'bold 28px "Courier New", monospace';
  const title = 'PESADELO';
  const tx = (BASE_W - bctx.measureText(title).width)/2;
  
  // Efeito de sangue escorrendo aleatoriamente
  for (let i = 0; i < 3; i++) {
    const bloodX = tx + 10 + i * 30 + Math.random() * 30;
    const bloodStartY = 36;
    const bloodLength = 5 + Math.random() * 20;
    
    const bloodColor = `rgba(120, 0, 0, ${0.6 + Math.random() * 0.4})`;
    const bloodWidth = 1 + Math.random() * 1.5;
    
    bctx.fillStyle = bloodColor;
    bctx.fillRect(bloodX, bloodStartY, bloodWidth, bloodLength);
  }
  
  // Sombra do título
  bctx.fillStyle = '#200505';
  bctx.fillText(title, tx+1, 36+1);
  
  // Título com variação de cor suave em tons de vermelho
  const shift = Math.sin(t*0.003)*12;
  bctx.fillStyle = `rgb(${180+shift|0},${20+Math.abs(Math.sin(t*0.005)*20)|0},${20})`;
  bctx.fillText(title, tx, 36);

  // Desenhar efeito de borda em volta do título
  bctx.strokeStyle = '#300';
  bctx.lineWidth = 1;
  bctx.strokeText(title, tx, 36);

  // Subtítulo com animação de pulso e tremor para efeito de horror
  const pulse = 1 + 0.03 * (1 + Math.sin(t*0.012));
  const jitterX = Math.random() * 2 - 1;
  const jitterY = Math.random() * 1.5 - 0.75;
  
  bctx.save();
  bctx.translate(BASE_W/2 + jitterX, 56 + Math.sin(t*0.006)*2 + jitterY);
  bctx.scale(pulse, pulse);
  bctx.fillStyle = '#a09999';
  bctx.font = '14px "Courier New", monospace';
  const s = 'Entre por sua conta e risco';
  bctx.fillText(s, -bctx.measureText(s).width/2, 0);
  bctx.restore();

  // Menu com highlight suave e tremor para efeito de horror
  bctx.font = '16px "Courier New", monospace';
  let startY = 96;
  MENU_OPTIONS.forEach((opt,i)=>{
    // Adicionar um leve tremor ao texto para efeito de horror
    const tremor = i === selected ? Math.random() * 2 - 1 : 0;
    
    const txtW = bctx.measureText(opt).width;
    const x = (BASE_W - txtW)/2 + tremor;
    const y = startY + i*22;
    const isSel = (i===selected);
    
    // Caixa de destaque animada com efeito de sangue para a seleção
    if(isSel){
      const glow = (1 + Math.sin(t*0.008))*0.5;
      const w = txtW + 12, h = 18;
      bctx.fillStyle = `rgba(80,20,20,${0.4 + glow*0.2})`;
      bctx.fillRect(x-w/2, y-h/2, w, h);
      
      // Bordas que parecem de sangue
      bctx.strokeStyle = `rgba(180,30,30,${0.5 + glow*0.3})`;
      bctx.strokeRect(x-w/2, y-h/2, w, h);
      
      // Gotejamento de sangue na opção selecionada
      const dropCount = 3;
      for(let d = 0; d < dropCount; d++) {
        const dropX = x - w/2 + d * (w/dropCount) + w/(dropCount*2);
        const dropY = y + h/2;
        const dropHeight = 2 + Math.random() * 8;
        
        bctx.fillStyle = `rgba(120,10,10,${0.6 + Math.random() * 0.4})`;
        bctx.fillRect(dropX, dropY, 1, dropHeight);
      }
      
      // Partícula flutuante na opção selecionada (aparência de mosca)
      if (Math.random() < 0.7) {
        const px = x + (Math.random() * 2 - 1) * 20 - txtW/2;
        const py = y + (Math.random() * 2 - 1) * 6;
        const psize = 1 + Math.random();
        bctx.fillStyle = `rgba(20,20,20,${0.7})`;
        bctx.fillRect(px, py-psize/2, psize, psize);
      }
    }
    
    // Texto do menu (com efeito tremor se selecionado)
    if(isSel){
      // Efeito de distorção no texto selecionado
      for(let j = 0; j < 3; j++) {
        const offsetX = (Math.random() * 2 - 1) * 1.5;
        const offsetY = (Math.random() * 2 - 1) * 1.5;
        
        bctx.fillStyle = j === 0 ? '#ff9999' : '#e1e1e1';
        const alpha = j === 0 ? 0.8 : 0.4;
        bctx.globalAlpha = alpha;
        bctx.fillText(opt, x + offsetX, y + offsetY);
      }
      bctx.globalAlpha = 1;
      bctx.fillStyle = '#ffffff';
      bctx.fillText(opt, x, y);
    } else {
      bctx.fillStyle = '#a08585';
      bctx.fillText(opt, x, y);
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

// Sistema de mapa
let MAP_WIDTH = 20; // Largura do mapa em tiles
let MAP_HEIGHT = 20; // Altura do mapa em tiles
// TILE_SIZE já está definido globalmente

// Matriz que representa o mapa (0 = vazio, 1 = parede, 2 = grama, etc.)
let map = Array.from({ length: MAP_HEIGHT }, () =>
  Array.from({ length: MAP_WIDTH }, () => Math.floor(Math.random() * 3))
);

// Renderizar o mapa na tela
function renderMap(ctx) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      switch (map[y][x]) {
        case 0: // Vazio
          ctx.fillStyle = '#111';
          break;
        case 1: // Parede
          ctx.fillStyle = '#555';
          break;
        case 2: // Grama
          ctx.fillStyle = '#0a0';
          break;
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
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
  // Executa apenas no menu; evita sobrescrever a tela do jogo
  if (state === 'menu') {
    update(ts);
    render(ts);
    requestAnimationFrame(loop);
  }
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
    case 'Começar Pesadelo':
      state = 'starting';
      showLoadingScreen();
      // Iniciar o jogo após uma pequena animação
      setTimeout(() => { 
        state = 'playing';
        startGame();
      }, 1500);
      break;
      
    case 'Opções':
      menuState = 'options';
      selected = 0;
      break;
      
    case 'Segredos':
      menuState = 'credits';
      break;
      
    case 'Desistir':
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

// Sistema de transição para sair da casa e entrar no mundo externo
function transitionToWorld() {
  console.log('Iniciando transição para o mundo aberto...');
  
  // Limpar a tela e mostrar mensagem de carregamento
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Mostrar mensagem na página para depuração
  const debugDiv = document.createElement('div');
  debugDiv.id = 'debug-info';
  debugDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; z-index: 1000; font-family: monospace;';
  debugDiv.innerHTML = `Iniciando transição para o mundo aberto...<br><div id="debug-status">Carregando...</div>`;
  document.body.appendChild(debugDiv);
  
  function updateDebug(message) {
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) {
      debugStatus.innerHTML += `<br>${message}`;
    }
    console.log(message);
  }
  
  // Verificar se já estamos no processo de transição para evitar múltiplas chamadas
  if (window.isTransitioning) {
    updateDebug('Transição já em andamento, ignorando nova chamada.');
    return;
  }
  window.isTransitioning = true;
  updateDebug('Iniciando carregamento do mundo...');
  
  // Carregar o sistema de mundo e iniciar a renderização
  loadWorldSystem()
    .then(() => {
      // Inicializar o mundo
      if (typeof initializeWorld === 'function') {
        initializeWorld();
      }
      
      // Iniciar loop de renderização
      if (typeof renderWorld === 'function') {
        function gameLoop() {
          if (state === 'world') {
            renderWorld();
          }
          requestAnimationFrame(gameLoop);
        }
        gameLoop();
      }
      
      // Limpar mensagens de debug após alguns segundos
      setTimeout(() => {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
          debugInfo.remove();
        }
      }, 5000);
      
      window.isTransitioning = false;
    })
    .catch(error => {
      console.error('Erro na transição:', error);
      updateDebug('ERRO: ' + error.message);
    });
  
  const transitionDuration = 1000; // Duração da transição em milissegundos
  const startTime = Date.now();

  function drawTransition() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / transitionDuration, 1);

    // Tela preta com opacidade crescente
    bctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
    bctx.fillRect(0, 0, BASE_W, BASE_H);

    // Texto de carregamento
    if (progress > 0.3) {
      bctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
      bctx.font = '16px Arial';
      bctx.fillText('Carregando mundo...', BASE_W/2 - 70, BASE_H/2);
    }

    if (progress < 1) {
      requestAnimationFrame(drawTransition);
    } else {
      // Após a transição, carregar o mundo externo
      console.log('Transição completa. Carregando mundo infinito...');
      state = 'world';
      
      // Atualizar debug
      updateDebug('Transição completa, estado mudado para "world"');

      // Sempre carregar o sistema de mundo para garantir dependências (geraTile/render/huds)
      // Evita curto-circuito quando existirem funções locais parciais (ex: generateChunk)
      updateDebug('Carregando sistema de mundo (forçado) ...');
      loadWorldSystem();
    }
  }

  drawTransition();
}

// Carregar dinamicamente os arquivos do sistema de mundo
function loadWorldSystem() {
  console.log('Carregando sistema de mundo...');
  
  // Atualizar mensagem de debug
  const updateDebug = (message) => {
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) {
      debugStatus.innerHTML += `<br>${message}`;
    }
    console.log(message);
  };
  
  updateDebug('Iniciando carregamento de scripts do mundo...');
  
  // Carregar scripts necessários
  return new Promise((resolve, reject) => {
    Promise.all([
      loadScript('js/world_system.js'),
      loadScript('js/world_render.js'),
      loadScript('js/world_render_funcs.js'),
      loadScript('js/world_render_effects.js')
    ]).then(() => {
      // Inicializar o sistema de mundo
      window.GameSystem.functions = {
        generateChunksAroundPlayer,
        checkSafeZone,
        renderPlayer3D,
        ...window.GameSystem.functions // Preservar funções existentes
      };
      
      // Configurar o estado inicial do mundo
      state = 'world';
      updateDebug('Sistema de mundo inicializado com sucesso');
      resolve();
    }).catch(error => {
      console.error('Erro ao carregar scripts:', error);
      updateDebug('ERRO: Falha ao carregar sistema de mundo');
      reject(error);
    });
  });
}

// Função auxiliar para carregar scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Erro ao carregar ${src}`));
    document.body.appendChild(script);
  });
  
  window.GameSystem.state = {
    player,
    state,
    worldChunks,
    camera,
    lighting
  };
  
  updateDebug('GameSystem configurado');
  
  // Carregar scripts em uma sequência com verificações adequadas
  loadScript('js/world_system.js')
    .then(() => {
      updateDebug('Sistema de geração de mundo carregado');
      return loadScript('js/world_render_funcs.js');
    })
    .then(() => {
      updateDebug('Funções auxiliares de renderização carregadas');
      return loadScript('js/world_render_effects.js');
    })
    .then(() => {
      updateDebug('Efeitos de clima/horizonte carregados');
      return loadScript('js/world_render.js');
    })
    .then(() => {
      updateDebug('Sistema de renderização de mundo carregado');
      finishWorldTransition();
    })
    .catch((error) => {
      console.error('ERRO ao carregar scripts do mundo:', error);
      updateDebug('ERRO ao carregar scripts! Verificando dependências...');
      
      // Verificar se as funções principais existem e criar fallbacks se necessário
      if (typeof renderWorld !== 'function') {
        window.renderWorld = function fallbackRenderWorld() {
          bctx.fillStyle = '#300';
          bctx.fillRect(0, 0, BASE_W, BASE_H);
          bctx.fillStyle = '#f00';
          bctx.font = '10px Arial';
          bctx.fillText('ERRO: Função renderWorld não encontrada', 10, 30);
          bctx.fillText('Verifique a console para detalhes', 10, 50);
          ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
        };
        updateDebug('Criado renderWorld fallback');
      }
      
      if (typeof generateChunk !== 'function') {
        window.generateChunk = function fallbackGenerateChunk(x, y) {
          return {
            x: x, y: y, 
            biome: 'plains',
            tiles: Array(WORLD_CHUNK_SIZE).fill().map(() => 
              Array(WORLD_CHUNK_SIZE).fill({type: 'grass', walkable: true, color: '#7aab67'})
            ),
            entities: []
          };
        };
        updateDebug('Criado generateChunk fallback');
      }
      
      if (typeof calculateTileLighting !== 'function') {
        window.calculateTileLighting = function(x, y, light) { return light || 0.7; };
        updateDebug('Criado calculateTileLighting fallback');
      }
      
      if (typeof renderTile3D !== 'function') {
        window.renderTile3D = function(ctx, tile, x, y, light) {
          ctx.fillStyle = '#7aab67';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        };
        updateDebug('Criado renderTile3D fallback');
      }

      // Garantir que GameSystem.functions tenha referências para os fallbacks
      try {
        window.GameSystem = window.GameSystem || { functions: {}, constants: {} };
        window.GameSystem.functions = window.GameSystem.functions || {};
        if (!window.GameSystem.functions.calculateTileLighting && window.calculateTileLighting) {
          window.GameSystem.functions.calculateTileLighting = window.calculateTileLighting;
        }
        if (!window.GameSystem.functions.renderTile3D && window.renderTile3D) {
          window.GameSystem.functions.renderTile3D = window.renderTile3D;
        }
        if (typeof window.GameSystem.functions.applyLighting !== 'function') {
          // Fallback simples para applyLighting
          window.GameSystem.functions.applyLighting = function(color, factor){ return color; };
        }
        if (typeof window.GameSystem.functions.lightenColor !== 'function') {
          window.GameSystem.functions.lightenColor = function(c){ return c; };
        }
        if (typeof window.GameSystem.functions.darkenColor !== 'function') {
          window.GameSystem.functions.darkenColor = function(c){ return c; };
        }
      } catch {}
      
      // Mesmo com erro, tentar continuar
      updateDebug('Tentando continuar mesmo com erros...');
      finishWorldTransition();
    });

  // Função para carregar um script com Promise
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      try {
        window.__loadedScripts = window.__loadedScripts || new Set();
        if (window.__loadedScripts.has(src)) {
          console.log(`Script ${src} já carregado (skip)`);
          return resolve();
        }
      } catch {}

      const script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-dyn-src', src);
      // Hint for better error reporting in index.html overlay
      try { window.__lastLoadingScript = src; } catch {}
      // Only set crossOrigin when not running from file:// to avoid CORS blocks
      try {
        if (location && location.protocol !== 'file:') {
          script.crossOrigin = 'anonymous';
        }
      } catch {}
      script.onload = () => {
        console.log(`Script ${src} carregado com sucesso`);
        try { if (window.__lastLoadingScript === src) window.__lastLoadingScript = undefined; } catch {}
        try { window.__loadedScripts.add(src); } catch {}
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Erro ao carregar script ${src}:`, error);
        reject(new Error(`Falha ao carregar ${src}`));
      };
      document.head.appendChild(script);
    });
  }
}

// Finalizar a transição para o mundo
function finishWorldTransition() {
  try {
    console.log('Iniciando geração do mundo...');
    updateDebug('Iniciando geração do mundo...');
    
    // Verificar se as funções necessárias estão disponíveis
    if (typeof generateWorld !== 'function') {
      // Implementar generateWorld localmente se não existir
      generateWorld = function() {
        console.log('Usando implementação fallback de generateWorld');
        
        // Resetar chunks existentes
        worldChunks = new Map();
        
        // Configurar jogador para começar na origem do mundo
        player.worldX = 0;
        player.worldY = 0;
        
        // Posicionar jogador no centro da tela
        player.x = BASE_W / 2;
        player.y = BASE_H / 2;
        
        // Configurar câmera
        camera = {
          x: player.worldX - BASE_W / 2,
          y: player.worldY - BASE_H / 2
        };
        
        // Gerar chunks iniciais ao redor do jogador se a função existir
        if (typeof generateChunksAroundPlayer === 'function') {
          generateChunksAroundPlayer();
        }
        
        updateDebug('Mundo gerado usando fallback');
      };
    }
    
    // Gerar o mundo
    generateWorld();
    updateDebug('Mundo gerado, iniciando loop de jogo...');
    
    // Se o loop do mundo não estiver definido, criar uma versão básica
    if (typeof worldLoop !== 'function') {
      worldLoop = function() {
        try {
          if (state !== 'world') return;
          
          // Atualizar o jogador
          if (typeof updateWorldPlayer === 'function') {
            updateWorldPlayer();
          }
          
          // Renderizar uma tela básica se renderWorld não existir
          if (typeof renderWorld === 'function') {
            renderWorld();
          } else {
            // Renderização de emergência
            bctx.fillStyle = '#300';
            bctx.fillRect(0, 0, BASE_W, BASE_H);
            bctx.fillStyle = '#f00';
            bctx.font = '10px Arial';
            bctx.fillText('ERRO: renderWorld não está definida', 10, 30);
            bctx.fillText('Tente recarregar a página', 10, 50);
            ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
            ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
          }
          
          // Continuar o loop
          requestAnimationFrame(worldLoop);
        } catch (error) {
          console.error('ERRO no worldLoop:', error);
          updateDebug('ERRO no worldLoop: ' + error.message);
          
          // Tentar continuar o loop mesmo com erro
          setTimeout(() => requestAnimationFrame(worldLoop), 1000);
        }
      };
    }
    
    // Iniciar o loop do mundo
    worldLoop();
    window.isTransitioning = false;
    updateDebug('Mundo infinito carregado e pronto!');
    
    // Verificar se os scripts foram carregados corretamente
    if (typeof renderWorld !== 'function') {
      console.error('ERRO: A função renderWorld não foi definida. O script world_render.js pode não ter carregado corretamente.');
      updateDebug('ERRO: renderWorld não definida');
    }
    
    if (typeof generateChunk !== 'function') {
      console.error('ERRO: A função generateChunk não foi definida. O script world_system.js pode não ter carregado corretamente.');
      updateDebug('ERRO: generateChunk não definida');
    }
  } catch (error) {
    console.error('ERRO ao finalizar transição para o mundo:', error);
    updateDebug('ERRO FATAL na transição: ' + error.message);
    
    // Mostrar mensagem de erro na página
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'color:red; background:black; padding:20px; margin:20px; font-family:monospace; position:fixed; bottom:50px; left:50px; right:50px; z-index:1000;';
    errorDiv.innerHTML = `
      ERRO ao finalizar transição para o mundo: ${error.message}<br>
      ${error.stack.replace(/\n/g, '<br>')}
      <p>Tente recarregar a página (F5)</p>
    `;
    document.body.appendChild(errorDiv);
    
    // Tentar reiniciar para o menu
    setTimeout(() => {
      try {
        window.isTransitioning = false;
        state = 'menu';
        menuState = 'main';
        player.x = 160;
        player.y = 120;
        player.inSafeZone = true;
        
        // Limpar a tela
        bctx.fillStyle = '#000';
        bctx.fillRect(0, 0, BASE_W, BASE_H);
        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
        
        // Reiniciar o loop principal
        requestAnimationFrame(loop);
      } catch (e) {
        console.error('Não foi possível voltar ao menu:', e);
      }
    }, 3000);
  }
}

// Constantes para o sistema de mundo infinito
const WORLD_CHUNK_SIZE = 16; // Tamanho de cada chunk do mundo
const VISIBLE_CHUNKS_RADIUS = 2; // Quantos chunks são visíveis em cada direção
const WORLD_SEED = Math.random() * 10000 | 0; // Seed para geração do mundo

// Adicionar constantes ao objeto global
window.GameSystem.constants = {
  BASE_W,
  BASE_H,
  SCALE,
  SCREEN_W,
  SCREEN_H,
  TILE_SIZE,
  WORLD_CHUNK_SIZE,
  VISIBLE_CHUNKS_RADIUS,
  WORLD_SEED
};

// Estrutura para armazenar os chunks do mundo infinito
let worldChunks = new Map(); // Map usando coordenadas de chunk como chave

// Função para gerar o mundo externo infinito
function generateWorld() {
  console.log('Gerando o mundo externo infinito...');
  
  // Resetar chunks existentes
  worldChunks = new Map();
  
  // Configurar jogador para começar na origem do mundo
  player.worldX = 0;
  player.worldY = 0;
  
  // Posicionar jogador no centro da tela
  player.x = BASE_W / 2;
  player.y = BASE_H / 2;
  
  // Configurar câmera
  camera = {
    x: player.worldX - BASE_W / 2,
    y: player.worldY - BASE_H / 2
  };
  
  // Gerar chunks iniciais ao redor do jogador
  generateChunksAroundPlayer();
  
  // Atualizar zona segura para o mundo (nenhuma zona segura no mundo aberto por padrão)
  safeZones = [];
  player.inSafeZone = false;
  
  // Adicionar casa do jogador como zona segura no mundo
  addPlayerHouseToWorld();
  
  // Regenerar vida quando sai da casa
  player.health = Math.min(player.maxHealth, player.health + 20);
  console.log('Saindo para o mundo infinito. Vida regenerada:', player.health);
}

// Adiciona a casa do jogador como uma estrutura e zona segura no mundo
function addPlayerHouseToWorld() {
  // Adicionar uma pequena cabana como zona segura
  const houseX = -50;
  const houseY = -50;
  const houseWidth = 60;
  const houseHeight = 50;
  
  safeZones.push({
    name: "Cabana do Jogador",
    x: houseX,
    y: houseY,
    width: houseWidth,
    height: houseHeight,
    active: true,
    isPlayerHouse: true
  });
  
  console.log('Casa do jogador adicionada como zona segura no mundo');
}

// Função para gerar ou carregar chunks ao redor do jogador
function generateChunksAroundPlayer() {
  const playerChunkX = Math.floor(player.worldX / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const playerChunkY = Math.floor(player.worldY / (WORLD_CHUNK_SIZE * TILE_SIZE));
  
  // Gerar ou carregar todos os chunks visíveis
  for (let cy = playerChunkY - VISIBLE_CHUNKS_RADIUS; cy <= playerChunkY + VISIBLE_CHUNKS_RADIUS; cy++) {
    for (let cx = playerChunkX - VISIBLE_CHUNKS_RADIUS; cx <= playerChunkX + VISIBLE_CHUNKS_RADIUS; cx++) {
      const chunkKey = `${cx},${cy}`;
      
      // Se o chunk não existe, gerar um novo
      if (!worldChunks.has(chunkKey)) {
        worldChunks.set(chunkKey, generateChunk(cx, cy));
      }
    }
  }
  
  console.log(`Chunks gerados ao redor do jogador. Total de chunks: ${worldChunks.size}`);
}

// Sistema de geração de ruído melhorado (Simplex-like noise)
function noise(x, y, seed = WORLD_SEED) {
  // Algoritmo de ruído 2D simplificado
  const s = seed + x * 12.9898 + y * 78.233;
  const sin = Math.sin(s) * 43758.5453123;
  return sin - Math.floor(sin);
}

// Ruído suavizado com várias oitavas
function smoothNoise(x, y, octaves = 4, persistence = 0.5, seed = WORLD_SEED) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency, seed + i * 97) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  return total / maxValue;
}

// Gerar um único chunk do mundo
function generateChunk(chunkX, chunkY) {
  const chunk = {
    x: chunkX,
    y: chunkY,
    tiles: [],
    entities: [],
    generated: Date.now()
  };
  
  // Determinar o bioma principal do chunk baseado na posição
  const biomeNoise = smoothNoise(chunkX * 0.3, chunkY * 0.3, 2, 0.5);
  const chunkBiome = getBiomeFromNoise(biomeNoise);
  
  chunk.biome = chunkBiome;

  // Fallback local para geração de tile caso o sistema de mundo ainda não tenha exposto a função
  const tileGen = (typeof window.generateTileFromTerrain === 'function')
    ? window.generateTileFromTerrain
    : function localGenerateTileFromTerrain(terrainValue, moisture, biome) {
        // Implementação simples e segura para evitar crash
        let tile = {
          type: 'grass',
          walkable: true,
          color: '#7aab67',
          height: Math.floor(terrainValue * 6)
        };
        switch (biome) {
          case 'desert':
            tile.type = (terrainValue > 0.7) ? 'dune' : 'sand';
            tile.color = (terrainValue > 0.7) ? '#d6c97b' : '#dbd28e';
            break;
          case 'forest':
            tile.type = 'grass';
            tile.color = '#4d8a3d';
            break;
          case 'mountains':
            if (terrainValue > 0.6) {
              tile.type = 'mountain';
              tile.color = '#6b6b6b';
              tile.walkable = false;
              tile.height += 3;
            } else {
              tile.type = 'stone';
              tile.color = '#8e8e8e';
            }
            break;
          case 'snowlands':
            tile.type = (terrainValue > 0.7) ? 'ice' : 'snow';
            tile.color = (terrainValue > 0.7) ? '#b3e0e5' : '#e8f0f0';
            break;
          default:
            // plains
            tile.type = (moisture > 0.7) ? 'flower' : 'grass';
            tile.color = (moisture > 0.7) ? '#8ab979' : '#7aab67';
        }
        if (moisture > 0.85 && terrainValue < 0.4) {
          tile.type = 'water';
          tile.color = '#266691';
          tile.walkable = false;
          tile.height = 0;
        }
        return tile;
      };
  
  // Gerar tiles do chunk
  for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
    const row = [];
    for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
      // Calcular coordenadas absolutas do mundo
      const worldX = chunkX * WORLD_CHUNK_SIZE + x;
      const worldY = chunkY * WORLD_CHUNK_SIZE + y;
      
      // Múltiplas camadas de ruído para terreno complexo
      const elevation = smoothNoise(worldX * 0.05, worldY * 0.05, 4, 0.5);
      const moisture = smoothNoise(worldX * 0.07, worldY * 0.07, 3, 0.4, WORLD_SEED + 123);
      const detail = smoothNoise(worldX * 0.2, worldY * 0.2, 2, 0.3, WORLD_SEED + 456);
      
      // Combinação para criar terrenos variados
      const terrainValue = elevation * 0.6 + moisture * 0.3 + detail * 0.1;
      
  // Gerar tipo de tile baseado no terreno e bioma (com fallback seguro)
  const tile = tileGen(terrainValue, moisture, chunkBiome);
      
      row.push(tile);
    }
    chunk.tiles.push(row);
  }
  
  // Adicionar entidades baseadas no bioma (árvores, rochas, etc.)
  if (typeof window.generateEntitiesForChunk === 'function') {
    window.generateEntitiesForChunk(chunk);
  } else {
    // Fallback leve: poucas rochas/plantas para dar vida sem travar
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const ex = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
      const ey = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
      const t = (chunk.tiles[ey] && chunk.tiles[ey][ex]) ? chunk.tiles[ey][ex] : null;
      if (!t || !t.walkable) continue;
      const type = Math.random() < 0.5 ? 'rock' : 'flower';
      chunk.entities.push({ type, x: ex, y: ey, worldX: chunk.x * WORLD_CHUNK_SIZE + ex, worldY: chunk.y * WORLD_CHUNK_SIZE + ey });
    }
  }
  
  return chunk;
}

// Determinar bioma baseado no valor de ruído
function getBiomeFromNoise(noise) {
  if (noise < 0.2) return 'desert';
  if (noise < 0.4) return 'plains';
  if (noise < 0.6) return 'forest';
  if (noise < 0.8) return 'mountains';
  return 'snowlands';
}

// Loop do mundo aberto
// Loop do mundo infinito
function worldLoop() {
  try {
    if (state !== 'world') return;
    
    // Reduzir logging para evitar spam no console
    const timestamp = Date.now();
    if (timestamp % 100 === 0) {
      console.log('Loop de mundo executando, frame:', timestamp);
    }
    
    try {
      updateWorldPlayer();
    } catch (playerError) {
      console.error('ERRO ao atualizar jogador:', playerError);
    }
    
    // Verificar se a função de renderização existe (carregada do script externo)
    if (typeof renderWorld === 'function') {
      try {
        // Verificar se existem as funções auxiliares necessárias
        if (typeof calculateTileLighting !== 'function') {
          window.calculateTileLighting = function(worldX, worldY, ambientLight) {
            return ambientLight || 0.7;
          };
        }
        
        if (typeof renderTile3D !== 'function') {
          window.renderTile3D = function(ctx, tile, x, y, lightLevel) {
            ctx.fillStyle = tile && tile.color ? tile.color : '#7aab67';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          };
        }
        
        if (typeof applyLighting !== 'function') {
          window.applyLighting = function(color, factor) {
            return color;
          };
        }
        
        renderWorld();
      } catch (renderError) {
        console.error('ERRO durante renderização do mundo:', renderError);
        
        // Renderização de emergência com mensagem de erro
        bctx.fillStyle = '#300';
        bctx.fillRect(0, 0, BASE_W, BASE_H);
        bctx.fillStyle = '#f00';
        bctx.font = '10px Arial';
        bctx.fillText('Erro na renderização: ' + renderError.message, 10, 30);
        bctx.fillText('Verifique o console para detalhes', 10, 50);
        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
      }
    } else {
      // Se renderWorld não estiver definida, criar uma função local simples
      window.renderWorld = function() {
        // Limpar tela
        bctx.fillStyle = '#000066';
        bctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Mensagem de carregamento
        bctx.fillStyle = '#fff';
        bctx.font = '16px Arial';
        bctx.fillText('Carregando sistema de mundo...', BASE_W/2 - 100, BASE_H/2);
        
        // Instruções para tentar novamente
        bctx.fillStyle = '#aaa';
        bctx.font = '10px Arial';
        bctx.fillText('Se esta mensagem persistir, tente recarregar a página (F5)', BASE_W/2 - 120, BASE_H/2 + 20);
        
        // Desenhar player
        bctx.fillStyle = '#ff0000';
        bctx.fillRect(BASE_W/2 - 8, BASE_H/2 - 8, 16, 16);
        
        // Atualizar tela
        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
      };
      
      renderWorld();
      
      // Tentar carregar novamente o script
      console.warn('renderWorld não está definida! Tentando carregar script novamente...');
      
      const script = document.createElement('script');
      script.src = 'js/world_render.js';
      document.head.appendChild(script);
    }
    
    // Continuar o loop
    requestAnimationFrame(worldLoop);
  } catch (loopError) {
    console.error('ERRO FATAL no loop de mundo:', loopError);
    
    // Mostrar mensagem de erro na tela
    try {
      bctx.fillStyle = '#300';
      bctx.fillRect(0, 0, BASE_W, BASE_H);
      bctx.fillStyle = '#f00';
      bctx.font = '10px Arial';
      bctx.fillText('ERRO FATAL: ' + loopError.message, 10, 30);
      bctx.fillText('Tentando recuperar...', 10, 50);
      ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
    } catch (e) {
      console.error('Não foi possível mostrar erro na tela:', e);
    }
    
    // Tentar continuar o loop mesmo após um erro
    setTimeout(() => requestAnimationFrame(worldLoop), 1000);
  }
}

// Constantes para o sistema de colisão e movimento
// TILE_SIZE já está definido globalmente

// Atualizar jogador no mundo infinito
function updateWorldPlayer() {
  try {
    // Verificar se o player existe
    if (!player) {
      console.error('ERRO: player não está definido em updateWorldPlayer');
      player = {
        x: BASE_W / 2,
        y: BASE_H / 2,
        width: 16,
        height: 16,
        speed: 2,
        worldX: 0,
        worldY: 0,
        direction: 2, // Sul
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        lanterna: false,
        inSafeZone: true,
        inventory: []
      };
      console.warn('player criado com valores padrão');
    }
    
    // Garantir que o player tenha todas as propriedades necessárias
    if (typeof player.speed === 'undefined') player.speed = 2;
    if (typeof player.worldX === 'undefined') player.worldX = 0;
    if (typeof player.worldY === 'undefined') player.worldY = 0;
    if (typeof player.stamina === 'undefined') player.stamina = 100;
    if (typeof player.maxStamina === 'undefined') player.maxStamina = 100;
    if (typeof player.width === 'undefined') player.width = 16;
    if (typeof player.height === 'undefined') player.height = 16;
    
    // Armazenar posição antiga para verificar colisões
    const oldX = player.x;
    const oldY = player.y;
    const oldWorldX = player.worldX;
    const oldWorldY = player.worldY;
    
    // Velocidade base do movimento
    let moveSpeed = player.speed;
  
    // Correr quando shift estiver pressionado (com gerenciamento de stamina)
    const isRunning = keys['shift'] && player.stamina > 0;
    if (isRunning) {
      moveSpeed *= 1.5;
      player.stamina = Math.max(0, player.stamina - 0.5); // Reduzir stamina ao correr
    } else {
      // Recuperar stamina quando não está correndo
      player.stamina = Math.min(player.maxStamina, player.stamina + 0.2);
    }
    
    // Calcular direção de movimento
    let dx = 0, dy = 0;
    
    // Movimento com WASD ou setas
    if (keys['w'] || keys['arrowup']) {
      dy -= moveSpeed;
      player.direction = 0; // Norte
    }
    if (keys['s'] || keys['arrowdown']) {
      dy += moveSpeed;
      player.direction = 2; // Sul
    }
    if (keys['a'] || keys['arrowleft']) {
      dx -= moveSpeed;
      player.direction = 3; // Oeste
    }
    if (keys['d'] || keys['arrowright']) {
      dx += moveSpeed;
      player.direction = 1; // Leste
    }
    
    // Movimento diagonal não deve ser mais rápido
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071; // cos(45°)
      dy *= 0.7071; // sin(45°)
    }
    
    // Verificar interações com tecla E (uma vez por pressionamento)
    if (keys['e'] && !keys.previousE) {
      interactWithWorld();
    }
    keys.previousE = keys['e']; // Rastrear estado anterior da tecla E
    
    // Se o jogador está se movendo, atualizar animações
    if (dx !== 0 || dy !== 0) {
      player.isMoving = true;
      
      // Contador para animação de caminhada
      player.animCounter = (player.animCounter || 0) + 1;
      if (player.animCounter > (isRunning ? 5 : 8)) { // Animação mais rápida ao correr
        player.animFrame = ((player.animFrame || 0) + 1) % 4;
        player.animCounter = 0;
      }
      
      // Verifique colisões antes de mover
      const nextWorldX = player.worldX + dx;
      const nextWorldY = player.worldY + dy;
      
      // Verificar colisão com o mundo usando a função getTile (se disponível)
      let canMoveX = true;
      let canMoveY = true;
      
      if (typeof getTile === 'function') {
        // Calcular as coordenadas em tiles da nova posição
        const tileSize = TILE_SIZE || 16;
        const playerWidthInTiles = player.width / tileSize;
        const playerHeightInTiles = player.height / tileSize;
        
        // Pontos de colisão do jogador (centro, bordas)
        const points = [
          // Centro
          {x: nextWorldX + player.width/2, y: nextWorldY + player.height/2},
          // Bordas
          {x: nextWorldX, y: nextWorldY}, // Canto superior esquerdo
          {x: nextWorldX + player.width, y: nextWorldY}, // Canto superior direito
          {x: nextWorldX, y: nextWorldY + player.height}, // Canto inferior esquerdo
          {x: nextWorldX + player.width, y: nextWorldY + player.height} // Canto inferior direito
        ];
        
        // Verificar colisões em X
        if (dx !== 0) {
          for (const point of points) {
            const tileX = Math.floor(point.x / tileSize);
            const tileY = Math.floor(point.y / tileSize);
            const tile = getTile(tileX, tileY);
            
            if (tile && tile.solid) {
              canMoveX = false;
              break;
            }
          }
        }
        
        // Verificar colisões em Y
        if (dy !== 0) {
          for (const point of points) {
            const tileX = Math.floor(point.x / tileSize);
            const tileY = Math.floor(point.y / tileSize);
            const tile = getTile(tileX, tileY);
            
            if (tile && tile.solid) {
              canMoveY = false;
              break;
            }
          }
        }
      }
      
      // Aplicar movimento apenas se não houver colisão
      if (canMoveX) player.worldX = nextWorldX;
      if (canMoveY) player.worldY = nextWorldY;
      
      // Som de passos
      if ((player.stepCounter || 0) <= 0) {
        // Reproduzir som de passos (se implementado)
        player.stepCounter = isRunning ? 15 : 20; // Passos mais rápidos ao correr
      } else {
        player.stepCounter--;
      }
    } else {
      // Jogador parado
      player.isMoving = false;
      player.animFrame = 0;
      player.stepCounter = 0;
    }
    
    // Ajustar câmera para seguir o jogador
    camera.x = player.worldX - BASE_W / 2;
    camera.y = player.worldY - BASE_H / 2;
    
    // Gerar novos chunks conforme necessário
    if (typeof generateChunksAroundPlayer === 'function') {
      generateChunksAroundPlayer();
    }
    
    // Verificar se o jogador está em uma zona segura
    if (typeof checkSafeZone === 'function') {
      checkSafeZone();
    }
    
    // Se não estiver em zona segura, gerar e atualizar inimigos
    if (!player.inSafeZone) {
      if (typeof spawnEnemies === 'function') spawnEnemies();
      if (typeof updateEnemies === 'function') updateEnemies();
    }
    
    // Regen de vida lento quando em zona segura
    if (player.inSafeZone && player.health < player.maxHealth && Date.now() % 30 === 0) {
      player.health += 0.1;
    }
  
  } catch (playerUpdateError) {
    console.error('ERRO ao atualizar jogador no mundo:', playerUpdateError);
    console.error(playerUpdateError.stack);
  }
}

// Função para interagir com objetos no mundo
function interactWithWorld() {
  try {
    const tileSize = TILE_SIZE || 16;
    
    // Determinar a posição do tile na frente do jogador
    let interactX = player.worldX;
    let interactY = player.worldY;
    
    // Ajustar baseado na direção do jogador
    switch (player.direction) {
      case 0: // Norte
        interactY -= tileSize;
        break;
      case 1: // Leste
        interactX += tileSize;
        break;
      case 2: // Sul
        interactY += tileSize;
        break;
      case 3: // Oeste
        interactX -= tileSize;
        break;
    }
    
    // Converter para coordenadas de tile
    const tileX = Math.floor(interactX / tileSize);
    const tileY = Math.floor(interactY / tileSize);
    
    console.log(`Tentando interagir com tile em (${tileX}, ${tileY})`);
    
    // Resolver getTile de forma segura (global ou via GameSystem)
    const getTileFn = (typeof window.getTile === 'function')
      ? window.getTile
      : (window.GameSystem && window.GameSystem.functions && typeof window.GameSystem.functions.getTile === 'function'
        ? window.GameSystem.functions.getTile
        : null);

    // Verificar se a função getTile existe
    if (getTileFn) {
      const tile = getTileFn(tileX, tileY);
      
      if (tile && tile.interactive) {
        // Processar interação baseado no tipo de tile
        console.log(`Interagindo com: ${tile.type || 'objeto desconhecido'}`);
        
        if (tile.type === 'door') {
          // Entrar/sair de edifícios
          console.log('Interagindo com uma porta');
          if (typeof enterBuilding === 'function') {
            enterBuilding(tile.buildingId || 'default');
          }
        } else if (tile.type === 'chest') {
          // Abrir baú
          console.log('Abrindo baú');
          if (typeof openChest === 'function') {
            openChest(tile.id || `chest_${tileX}_${tileY}`);
          }
        } else if (tile.type === 'npc') {
          // Conversar com NPC
          console.log('Conversando com NPC');
          if (typeof startDialog === 'function') {
            startDialog(tile.dialogId || tile.id || 'default');
          }
        } else if (tile.type === 'item') {
          // Pegar item
          console.log('Coletando item');
          if (typeof collectItem === 'function') {
            collectItem(tile.itemId || tile.id, tileX, tileY);
          }
        } else if (tile.type === 'sign') {
          // Ler placa
          console.log('Lendo placa');
          const message = tile.message || 'Não há nada escrito aqui.';
          // Mostrar mensagem na tela (se existir função)
          if (typeof showMessage === 'function') {
            showMessage(message);
          } else {
            console.log(`Mensagem da placa: ${message}`);
          }
        } else {
          console.log('Objeto interativo encontrado, mas não há manipulador para o tipo:', tile.type);
        }
      } else {
        console.log('Nenhum objeto interativo encontrado nesta posição');
      }
    } else {
      console.warn('Função getTile não está definida!');
    }
  } catch (interactError) {
    console.error('Erro ao interagir com o mundo:', interactError);
  }
}

// Verificar colisões com o terreno e objetos no mundo
function checkWorldCollisions() {
  // Obter as coordenadas do chunk e posição local
  const worldX = player.worldX;
  const worldY = player.worldY;
  
  // Obter o chunk onde o jogador está
  const chunkX = Math.floor(worldX / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const chunkY = Math.floor(worldY / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const chunkKey = `${chunkX},${chunkY}`;
  
  // Se o chunk não existe, não podemos verificar colisões
  if (!worldChunks || !worldChunks.has(chunkKey)) {
    return;
  }
  
  const chunk = worldChunks.get(chunkKey);
  
  // Converter coordenadas do mundo para coordenadas de tile
  const tileXInWorld = Math.floor(worldX / TILE_SIZE);
  const tileYInWorld = Math.floor(worldY / TILE_SIZE);
  
  // Converter para coordenadas locais do chunk
  const tileXInChunk = (tileXInWorld % WORLD_CHUNK_SIZE + WORLD_CHUNK_SIZE) % WORLD_CHUNK_SIZE;
  const tileYInChunk = (tileYInWorld % WORLD_CHUNK_SIZE + WORLD_CHUNK_SIZE) % WORLD_CHUNK_SIZE;
  
  // Verificar se o tile é sólido
  if (chunk.tiles[tileYInChunk] && 
      chunk.tiles[tileYInChunk][tileXInChunk] && 
      !chunk.tiles[tileYInChunk][tileXInChunk].walkable) {
    
    // Reverter movimento
    player.worldX = player.worldX - (player.direction === 1 ? 2 : (player.direction === 3 ? -2 : 0));
    player.worldY = player.worldY - (player.direction === 2 ? 2 : (player.direction === 0 ? -2 : 0));
  }
  
  // Verificar colisões com terreno sólido
  const tileX = Math.floor(player.x / TILE_SIZE);
  const tileY = Math.floor(player.y / TILE_SIZE);
  
  if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
    const tile = map[tileY][tileX];
    // Terrenos sólidos: montanha, árvores de todos os tamanhos, picos
    if (tile === 4 || tile === 5 || tile === 7 || tile === 8 || tile === 9) {
      player.x = oldX;
      player.y = oldY;
    }
  }
  
  // Atualizar câmera para seguir o jogador
  camera.x = player.x - BASE_W / 2;
  camera.y = player.y - BASE_H / 2;
  
  // Limitar câmera dentro do mundo
  camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - BASE_W, camera.x));
  camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - BASE_H, camera.y));
}

// Renderizar mundo aberto com gráficos 3D melhorados
function renderWorld() {
  // Cor do céu baseada na hora do dia
  const skyBrightness = Math.max(0.1, Math.sin(lighting.timeOfDay * Math.PI));
  const skyColors = {
    r: Math.floor(135 * skyBrightness + 20),
    g: Math.floor(206 * skyBrightness + 20), 
    b: Math.floor(235 * skyBrightness + 30)
  };
  bctx.fillStyle = `rgb(${skyColors.r}, ${skyColors.g}, ${skyColors.b})`;
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Renderizar tiles com efeitos 3D e iluminação
  const startTileX = Math.floor(camera.x / TILE_SIZE);
  const startTileY = Math.floor(camera.y / TILE_SIZE);
  const endTileX = Math.min(MAP_WIDTH, startTileX + Math.ceil(BASE_W / TILE_SIZE) + 1);
  const endTileY = Math.min(MAP_HEIGHT, startTileY + Math.ceil(BASE_H / TILE_SIZE) + 1);
  
  // Renderizar em camadas para efeito de profundidade
  for (let layer = 0; layer < 3; layer++) {
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
          const tile = map[y][x];
          const screenX = x * TILE_SIZE - camera.x;
          const screenY = y * TILE_SIZE - camera.y;
          const worldX = x * TILE_SIZE;
          const worldY = y * TILE_SIZE;
          
          const lightLevel = calculateLighting(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
          
          renderTile3D(bctx, tile, screenX, screenY, lightLevel, layer);
        }
      }
    }
  }
  
  // Renderizar jogador 3D no mundo
  renderWorldPlayer3D(bctx);
  
  // Efeitos de névoa/fog para distância
  renderFogEffect(bctx);
  
  // Overlay de escuridão noturna
  if (lighting.timeOfDay < 0.2 || lighting.timeOfDay > 0.8) {
    renderWorldDarknessOverlay(bctx);
  }
  
  // UI do mundo melhorada
  renderWorldUI(bctx);
}

// Renderizar tile 3D com múltiplas camadas
function renderTile3D(ctx, tile, x, y, lightLevel, layer) {
  const tileHeight = getTileHeight(tile);
  
  switch (layer) {
    case 0: // Base/chão
      renderTileBase(ctx, tile, x, y, lightLevel);
      break;
    case 1: // Altura/volume
      if (tileHeight > 0) {
        renderTileHeight(ctx, tile, x, y, lightLevel, tileHeight);
      }
      break;
    case 2: // Detalhes/sombras
      renderTileDetails(ctx, tile, x, y, lightLevel, tileHeight);
      break;
  }
}

// Obter altura do tile para efeito 3D
function getTileHeight(tile) {
  switch (tile) {
    case 4: return 12; // Montanha
    case 5: return 8;  // Árvore pequena
    case 7: return 16; // Pico de montanha
    case 8: return 14; // Árvore média
    case 9: return 20; // Árvore grande
    default: return 0;
  }
}

// Renderizar base do tile
function renderTileBase(ctx, tile, x, y, lightLevel) {
  let baseColor = '#90EE90';
  
  switch (tile) {
    case 2: baseColor = '#90EE90'; break; // Grama
    case 4: baseColor = '#8B7355'; break; // Montanha
    case 6: baseColor = '#4169E1'; break; // Água
    case 10: baseColor = '#228B22'; break; // Grama floresta
    case 11: baseColor = '#90EE90'; break; // Flor
    default: baseColor = '#90EE90';
  }
  
  ctx.fillStyle = applyLighting(baseColor, lightLevel);
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // Texturas especiais
  if (tile === 6) { // Água com ondas
    ctx.fillStyle = applyLighting('#6495ED', lightLevel * 1.1);
    const time = Date.now() * 0.003;
    const wave1 = Math.sin(time + x * 0.1) * 2;
    const wave2 = Math.cos(time + y * 0.1) * 2;
    ctx.fillRect(x + 2 + wave1, y + 2 + wave2, 4, 2);
    ctx.fillRect(x + 8 + wave2, y + 8 + wave1, 4, 2);
  }
}

// Renderizar altura/volume do tile
function renderTileHeight(ctx, tile, x, y, lightLevel, height) {
  let topColor = '#90EE90';
  let sideColor = '#228B22';
  
  switch (tile) {
    case 4: // Montanha
      topColor = '#A0522D';
      sideColor = '#8B4513';
      break;
    case 5: case 8: case 9: // Árvores
      topColor = '#228B22';
      sideColor = '#006400';
      break;
    case 7: // Pico com neve
      topColor = '#FFFAFA';
      sideColor = '#696969';
      break;
  }
  
  // Topo 3D
  ctx.fillStyle = applyLighting(topColor, lightLevel * 1.2);
  ctx.fillRect(x, y - height, TILE_SIZE, height);
  
  // Lateral direita (sombra)
  ctx.fillStyle = applyLighting(sideColor, lightLevel * 0.7);
  ctx.fillRect(x + TILE_SIZE - 3, y - height, 3, TILE_SIZE + height);
  
  // Lateral inferior (sombra)
  ctx.fillStyle = applyLighting(sideColor, lightLevel * 0.6);
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
}

// Renderizar detalhes e sombras
function renderTileDetails(ctx, tile, x, y, lightLevel, height) {
  switch (tile) {
    case 5: case 8: case 9: // Árvores com tronco
      const trunkWidth = tile === 5 ? 3 : tile === 8 ? 4 : 5;
      const trunkHeight = height + 6;
      
      ctx.fillStyle = applyLighting('#8B4513', lightLevel);
      ctx.fillRect(x + (TILE_SIZE - trunkWidth)/2, y - 2, trunkWidth, trunkHeight);
      
      // Sombra do tronco
      ctx.fillStyle = applyLighting('#654321', lightLevel * 0.6);
      ctx.fillRect(x + (TILE_SIZE - trunkWidth)/2 + trunkWidth - 1, y - 2, 1, trunkHeight);
      break;
      
    case 11: // Flor
      ctx.fillStyle = applyLighting('#FF69B4', lightLevel);
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillStyle = applyLighting('#FFD700', lightLevel);
      ctx.fillRect(x + 7, y + 7, 2, 2);
      break;
  }
  
  // Sombras projetadas por objetos altos
  if (height > 8) {
    const shadowLength = Math.floor(height * 0.6);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * lightLevel})`;
    ctx.fillRect(x + TILE_SIZE, y + shadowLength, shadowLength, TILE_SIZE - shadowLength);
  }
}

// Renderizar jogador 3D no mundo
function renderWorldPlayer3D(ctx) {
  const screenX = player.x - camera.x;
  const screenY = player.y - camera.y;
  const lightLevel = calculateLighting(screenX + player.width/2, screenY + player.height/2);
  
  // Sombra do jogador
  ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * lightLevel})`;
  ctx.fillRect(screenX + 2, screenY + player.height + 2, player.width, 8);
  
  // Corpo 3D do jogador
  const playerHeight3D = 8;
  
  // Base
  ctx.fillStyle = applyLighting('#FF6347', lightLevel);
  ctx.fillRect(screenX, screenY, player.width, player.height);
  
  // Altura 3D
  ctx.fillStyle = applyLighting('#FFD700', lightLevel * 1.3);
  ctx.fillRect(screenX, screenY - playerHeight3D, player.width, playerHeight3D);
  
  // Sombras laterais
  ctx.fillStyle = applyLighting('#CD853F', lightLevel * 0.7);
  ctx.fillRect(screenX + player.width - 2, screenY - playerHeight3D, 2, player.height + playerHeight3D);
  ctx.fillRect(screenX, screenY + player.height - 2, player.width, 2);
  
  // Lanterna (se ligada)
  if (player.lanterna) {
    ctx.fillStyle = applyLighting('#FFFF00', 1);
    ctx.fillRect(screenX + 2, screenY - playerHeight3D - 2, 2, 2);
    
    // Feixe da lanterna
    const beamLength = 40;
    const beamAngle = player.direction * Math.PI / 2;
    const beamEndX = screenX + player.width/2 + Math.cos(beamAngle) * beamLength;
    const beamEndY = screenY + player.height/2 + Math.sin(beamAngle) * beamLength;
    
    ctx.strokeStyle = `rgba(255, 255, 0, ${0.3})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(screenX + player.width/2, screenY + player.height/2);
    ctx.lineTo(beamEndX, beamEndY);
    ctx.stroke();
  }
}

// Efeito de névoa/fog
function renderFogEffect(ctx) {
  if (render3D.fogDistance > 0) {
    const gradient = ctx.createRadialGradient(
      BASE_W/2, BASE_H/2, 0,
      BASE_W/2, BASE_H/2, render3D.fogDistance
    );
    gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
    gradient.addColorStop(0.7, 'rgba(200, 200, 200, 0.1)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }
}

// Overlay de escuridão noturna no mundo
function renderWorldDarknessOverlay(ctx) {
  if (!player.lanterna) {
    ctx.fillStyle = 'rgba(0, 0, 20, 0.8)';
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  } else {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;
    
    const gradient = ctx.createRadialGradient(
      screenX + player.width/2, screenY + player.height/2, 0,
      screenX + player.width/2, screenY + player.height/2, 70
    );
    gradient.addColorStop(0, 'rgba(0, 0, 20, 0)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 20, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 20, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }
}

// UI melhorada do mundo
function renderWorldUI(ctx) {
  // Painel principal
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(5, 5, 200, 80);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  
  ctx.fillText('🌍 Mundo Aberto 3D', 10, 20);
  ctx.fillText(`📍 Pos: ${Math.floor(player.x/TILE_SIZE)}, ${Math.floor(player.y/TILE_SIZE)}`, 10, 35);
  
  const lightLevel = calculateLighting(BASE_W/2, BASE_H/2);
  ctx.fillText(`💡 Iluminação: ${Math.floor(lightLevel * 100)}%`, 10, 50);
  ctx.fillText(`🔦 Lanterna: ${player.lanterna ? '✅' : '❌'}`, 10, 65);
  
  const timeStr = lighting.timeOfDay < 0.3 ? '� Noite' : 
                 lighting.timeOfDay < 0.7 ? '☀️ Dia' : '🌅 Crepúsculo';
  ctx.fillText(timeStr, 10, 80);
  
  // Controles adicionais
  ctx.fillText('R - Voltar para casa 🏠', 10, 95);
  
  // Barra de vida do jogador no mundo
  const healthBarWidth = 120;
  const healthBarHeight = 10;
  const healthX = BASE_W - healthBarWidth - 10;
  const healthY = 10;
  
  // Fundo da barra de vida
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(healthX - 5, healthY - 5, healthBarWidth + 10, healthBarHeight + 10);
  
  // Barra vermelha (vida perdida)
  ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
  ctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);
  
  // Barra verde (vida atual)
  const healthPercent = player.health / player.maxHealth;
  ctx.fillStyle = player.health > 30 ? 'rgba(0, 200, 0, 0.9)' : 'rgba(255, 100, 0, 0.9)';
  ctx.fillRect(healthX, healthY, healthBarWidth * healthPercent, healthBarHeight);
  
  // Texto da vida
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  ctx.fillText(`❤️ ${player.health}/${player.maxHealth}`, healthX + 5, healthY + 8);
  
  // Status de perigo
  ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
  ctx.font = '10px monospace';
  ctx.fillText('⚠️ ZONA DE PERIGO', BASE_W/2 - 60, BASE_H - 25);
  ctx.font = '8px monospace';
  ctx.fillText(`👹 Inimigos ativos: ${enemies.length}`, BASE_W/2 - 50, BASE_H - 12);
  
  // Aviso de vida baixa
  if (player.health < 30) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.font = '12px monospace';
    ctx.fillText('💀 VIDA BAIXA! Volte para casa!', BASE_W/2 - 90, BASE_H/2);
  }
  
  // Minimapa 3D
  renderMinimap3D(ctx, BASE_W - 85, 110, 75, 75);
}

// Minimapa 3D
function renderMinimap3D(ctx, x, y, width, height) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(x, y, width, height);
  
  const scale = 0.5;
  const centerX = Math.floor(player.x / TILE_SIZE);
  const centerY = Math.floor(player.y / TILE_SIZE);
  const range = 8;
  
  for (let dy = -range; dy < range; dy++) {
    for (let dx = -range; dx < range; dx++) {
      const mapX = centerX + dx;
      const mapY = centerY + dy;
      
      if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
        const tile = map[mapY][mapX];
        const screenX = x + (dx + range) * scale * 4;
        const screenY = y + (dy + range) * scale * 4;
        
        let color = '#90EE90';
        switch (tile) {
          case 4: case 7: color = '#8B7355'; break;
          case 5: case 8: case 9: color = '#228B22'; break;
          case 6: color = '#4169E1'; break;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, 3, 3);
      }
    }
  }
  
  // Jogador no minimapa
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + range * scale * 4 - 1, y + range * scale * 4 - 1, 3, 3);
}

// Função para renderizar tiles individuais com detalhes
function renderTile(ctx, tile, x, y) {
  switch (tile) {
    case 2: // Grama normal
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Adicionar pontos de grama
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + i * 5 + 2, y + 12, 2, 3);
      }
      break;
      
    case 4: // Montanha
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Adicionar sombra
      ctx.fillStyle = '#654321';
      ctx.fillRect(x + 12, y, 4, TILE_SIZE);
      break;
      
    case 5: // Árvore pequena
      ctx.fillStyle = '#90EE90'; // Base de grama
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8B4513'; // Tronco
      ctx.fillRect(x + 6, y + 10, 4, 6);
      ctx.fillStyle = '#228B22'; // Copa
      ctx.fillRect(x + 3, y + 6, 10, 8);
      break;
      
    case 6: // Água
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Efeito de ondas
      ctx.fillStyle = '#6495ED';
      ctx.fillRect(x + 2, y + 2, 4, 2);
      ctx.fillRect(x + 8, y + 8, 4, 2);
      break;
      
    case 7: // Pico de montanha
      ctx.fillStyle = '#696969';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Neve no topo
      ctx.fillStyle = '#FFFAFA';
      ctx.fillRect(x + 4, y, 8, 4);
      break;
      
    case 8: // Árvore média
      ctx.fillStyle = '#90EE90'; // Base de grama
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8B4513'; // Tronco
      ctx.fillRect(x + 6, y + 8, 4, 8);
      ctx.fillStyle = '#228B22'; // Copa
      ctx.fillRect(x + 2, y + 2, 12, 10);
      ctx.fillStyle = '#32CD32'; // Folhas extras
      ctx.fillRect(x + 4, y + 4, 8, 6);
      break;
      
    case 9: // Árvore grande
      ctx.fillStyle = '#90EE90'; // Base de grama
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#8B4513'; // Tronco
      ctx.fillRect(x + 5, y + 6, 6, 10);
      ctx.fillStyle = '#228B22'; // Copa grande
      ctx.fillRect(x, y, TILE_SIZE, 12);
      ctx.fillStyle = '#32CD32'; // Folhas brilhantes
      ctx.fillRect(x + 2, y + 2, 12, 8);
      ctx.fillStyle = '#006400'; // Sombra das folhas
      ctx.fillRect(x + 12, y + 8, 4, 4);
      break;
      
    case 10: // Grama da floresta
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Grama mais densa
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + i * 4, y + 10, 2, 4);
      }
      break;
      
    case 11: // Flor
      ctx.fillStyle = '#90EE90'; // Base de grama
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#FF69B4'; // Flor rosa
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillStyle = '#FFD700'; // Centro da flor
      ctx.fillRect(x + 7, y + 7, 2, 2);
      break;
      
    default: // Grama padrão
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
}

// Função para iniciar o jogo
function startGame() {
  gameStarted = true;
  console.log('Jogo iniciado!');
  
  // Inicializar posição do jogador
  player.x = 160;
  player.y = 120;
  
  // Iniciar loop do jogo
  gameLoop();
}

// Loop principal do jogo
function gameLoop() {
  if (state !== 'playing') return;
  
  updatePlayer();
  renderGame();
  
  requestAnimationFrame(gameLoop);
}

// Atualizar jogador
function updatePlayer() {
  // Movimento com WASD ou setas
  if (keys['w'] || keys['arrowup']) {
    player.y -= player.speed;
    player.direction = 0; // Norte
  }
  if (keys['s'] || keys['arrowdown']) {
    player.y += player.speed;
    player.direction = 2; // Sul
  }
  if (keys['a'] || keys['arrowleft']) {
    player.x -= player.speed;
    player.direction = 3; // Oeste
  }
  if (keys['d'] || keys['arrowright']) {
    player.x += player.speed;
    player.direction = 1; // Leste
  }
  
  // Limitar jogador dentro da tela
  player.x = Math.max(0, Math.min(BASE_W - player.width, player.x));
  player.y = Math.max(0, Math.min(BASE_H - player.height, player.y));
  
  // Verificar se está em zona segura
  checkSafeZone();
  
  // Atualizar inimigos (apenas se não estiver em zona segura)
  if (!player.inSafeZone) {
    updateEnemies();
    spawnEnemies();
  }
}

// Verificar se o jogador está em uma zona segura
// Verificar se o jogador está em uma zona segura
function checkSafeZone() {
  const oldSafeState = player.inSafeZone;
  player.inSafeZone = false;
  
  // No estado normal (casa), toda a área é segura
  if (state === 'playing') {
    player.inSafeZone = true;
    return;
  }
  
  // No mundo aberto, verificar zonas seguras específicas
  if (state === 'world') {
    for (let zone of safeZones) {
      // No mundo, usamos coordenadas globais para as zonas seguras
      if (zone.active) {
        let playerInZone = false;
        
        if (zone.isPlayerHouse) {
          // Checar se o jogador está na casa usando worldX/worldY
          playerInZone = (
            player.worldX >= zone.x && 
            player.worldX + player.width <= zone.x + zone.width &&
            player.worldY >= zone.y && 
            player.worldY + player.height <= zone.y + zone.height
          );
        } else {
          // Para zonas na tela, usar coordenadas de tela
          playerInZone = (
            player.x >= zone.x && 
            player.x + player.width <= zone.x + zone.width &&
            player.y >= zone.y && 
            player.y + player.height <= zone.y + zone.height
          );
        }
        
        if (playerInZone) {
          player.inSafeZone = true;
          
          // Remover todos os inimigos quando entrar na zona segura
          if (enemies.length > 0) {
            enemies = [];
            console.log(`Zona segura ativada: ${zone.name}. Inimigos removidos.`);
          }
          
          // Se o jogador acabou de entrar em uma zona segura, regenerar um pouco de vida
          if (!oldSafeState) {
            player.health = Math.min(player.health + 10, player.maxHealth);
            console.log('Entrando em zona segura. Vida parcialmente restaurada.');
          }
          
          break;
        }
      }
    }
  }
  
  // Debug visual - desenhar fronteiras de zonas seguras
  if (state === 'world') {
    for (let zone of safeZones) {
      if (zone.active && zone.isPlayerHouse) {
        // Converter coordenadas do mundo para coordenadas de tela para a casa do jogador
        const screenX = zone.x - camera.x;
        const screenY = zone.y - camera.y;
        
        bctx.strokeStyle = player.inSafeZone ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
        bctx.lineWidth = 3;
        bctx.strokeRect(screenX, screenY, zone.width, zone.height);
        
        // Texto indicador
        bctx.fillStyle = player.inSafeZone ? 'rgba(0,255,0,0.7)' : 'rgba(255,200,0,0.7)';
        bctx.font = '10px Arial';
        bctx.fillText('CASA (ZONA SEGURA)', screenX + 10, screenY - 5);
      }
    }
  }
}

// Criar novo inimigo
function createEnemy(type, x, y) {
  const enemyType = ENEMY_TYPES[type];
  return {
    type: type,
    x: x,
    y: y,
    width: enemyType.size,
    height: enemyType.size,
    health: enemyType.health,
    maxHealth: enemyType.health,
    speed: enemyType.speed,
    damage: enemyType.damage,
    color: enemyType.color,
    lastAttack: 0,
    attackCooldown: 1000,
    direction: Math.random() * Math.PI * 2,
    wanderTimer: 0
  };
}

// Gerar inimigos (apenas fora de zonas seguras)
// Gerar inimigos no mundo
function spawnEnemies() {
  if (player.inSafeZone) return;
  
  const currentTime = Date.now();
  if (currentTime - enemySpawnTimer > enemySpawnInterval && enemies.length < 5) {
    // Escolher tipo de inimigo baseado na chance
    let enemyType = 'shadow';
    const rand = Math.random();
    
    if (rand < ENEMY_TYPES.demon.spawnChance) {
      enemyType = 'demon';
    } else if (rand < ENEMY_TYPES.demon.spawnChance + ENEMY_TYPES.ghost.spawnChance) {
      enemyType = 'ghost';
    }
    
    // Verificar se estamos no mundo aberto ou na casa
    if (state === 'world') {
      // No mundo aberto, usar coordenadas globais
      let spawnWorldX, spawnWorldY;
      let validPosition = false;
      let attempts = 0;
      
      do {
        // Gerar posição ao redor do jogador, mas não muito perto
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 50; // Entre 100 e 150 unidades do jogador
        
        spawnWorldX = player.worldX + Math.cos(angle) * distance;
        spawnWorldY = player.worldY + Math.sin(angle) * distance;
        
        // Verificar se está fora de zonas seguras
        let isInSafeZone = false;
        for (let zone of safeZones) {
          if (zone.active && zone.isPlayerHouse &&
              spawnWorldX >= zone.x && 
              spawnWorldX <= zone.x + zone.width &&
              spawnWorldY >= zone.y && 
              spawnWorldY <= zone.y + zone.height) {
            isInSafeZone = true;
            break;
          }
        }
        
        validPosition = !isInSafeZone;
        attempts++;
        
        // Evitar loop infinito
        if (attempts > 100) {
          console.log('Não foi possível encontrar posição válida para spawn de inimigo');
          return;
        }
      } while (!validPosition);
      
      // Criar inimigo com coordenadas de mundo
      const enemy = createEnemy(enemyType, spawnWorldX - camera.x, spawnWorldY - camera.y);
      enemy.worldX = spawnWorldX;
      enemy.worldY = spawnWorldY;
      
      enemies.push(enemy);
      enemySpawnTimer = currentTime;
      console.log(`Inimigo gerado no mundo: ${ENEMY_TYPES[enemyType].name} na posição (${Math.floor(spawnWorldX)}, ${Math.floor(spawnWorldY)})`);
    } else {
      // Na casa (não deveria acontecer devido à safe zone, mas por precaução)
      let spawnX, spawnY;
      let validPosition = false;
      let attempts = 0;
      
      do {
        spawnX = Math.random() * (BASE_W - 20) + 10;
        spawnY = Math.random() * (BASE_H - 20) + 10;
        
        // Verificar distância do jogador
        const distanceFromPlayer = Math.sqrt((spawnX - player.x) ** 2 + (spawnY - player.y) ** 2);
        
        validPosition = (distanceFromPlayer >= 50);
        attempts++;
        
        // Evitar loop infinito
        if (attempts > 100) {
          console.log('Não foi possível encontrar posição válida para spawn de inimigo');
          return;
        }
      } while (!validPosition);
      
      enemies.push(createEnemy(enemyType, spawnX, spawnY));
      enemySpawnTimer = currentTime;
      console.log(`Inimigo gerado na casa: ${ENEMY_TYPES[enemyType].name} na posição (${Math.floor(spawnX)}, ${Math.floor(spawnY)})`);
    }
  }
}

// Verificar se um inimigo está em uma zona segura
function isEnemyInSafeZone(enemy) {
  for (let zone of safeZones) {
    if (zone.active) {
      let enemyInZone = false;
      
      if (state === 'world' && zone.isPlayerHouse) {
        // Para o mundo aberto, verificar com coordenadas de mundo
        enemyInZone = (
          enemy.worldX >= zone.x && 
          enemy.worldX <= zone.x + zone.width &&
          enemy.worldY >= zone.y && 
          enemy.worldY <= zone.y + zone.height
        );
      } else {
        // Para dentro da casa, usar coordenadas de tela
        enemyInZone = (
          enemy.x >= zone.x && 
          enemy.x <= zone.x + zone.width &&
          enemy.y >= zone.y && 
          enemy.y <= zone.y + zone.height
        );
      }
      
      if (enemyInZone) return true;
    }
  }
  return false;
}

// Atualizar inimigos
function updateEnemies() {
  // Não processar inimigos se o jogador está em zona segura
  if (player.inSafeZone) {
    // Remover todos os inimigos enquanto estiver em zona segura
    if (enemies.length > 0) {
      console.log(`Removendo ${enemies.length} inimigos devido à zona segura`);
      enemies = [];
    }
    return;
  }
  
  // Remover inimigos em zonas seguras
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (isEnemyInSafeZone(enemies[i])) {
      console.log(`Inimigo removido por estar em zona segura: ${enemies[i].type}`);
      enemies.splice(i, 1);
      continue;
    }
  }
  
  // Processar inimigos restantes
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    // Verificar se estamos no mundo ou na casa
    if (state === 'world') {
      // No mundo, os inimigos seguem o jogador usando worldX/worldY
      const dx = player.worldX - enemy.worldX;
      const dy = player.worldY - enemy.worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 100) {
        // Muito longe - movimento aleatório
        enemy.wanderTimer -= 16;
        if (enemy.wanderTimer <= 0) {
          enemy.direction = Math.random() * Math.PI * 2;
          enemy.wanderTimer = 1000 + Math.random() * 2000;
        }
        
        enemy.worldX += Math.cos(enemy.direction) * enemy.speed * 0.5;
        enemy.worldY += Math.sin(enemy.direction) * enemy.speed * 0.5;
        
        // Atualizar posição na tela baseado na câmera
        enemy.x = enemy.worldX - camera.x;
        enemy.y = enemy.worldY - camera.y;
      } else {
        // Perseguir jogador
        enemy.worldX += (dx / distance) * enemy.speed;
        enemy.worldY += (dy / distance) * enemy.speed;
        
        // Atualizar posição na tela
        enemy.x = enemy.worldX - camera.x;
        enemy.y = enemy.worldY - camera.y;
        
        // Atacar se próximo
        if (distance < 25 && Date.now() - enemy.lastAttack > enemy.attackCooldown) {
          attackPlayer(enemy);
          enemy.lastAttack = Date.now();
        }
      }
    } else {
      // Na casa, os inimigos seguem usando coordenadas de tela diretamente
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 100) {
        // Muito longe - movimento aleatório
        enemy.wanderTimer -= 16;
        if (enemy.wanderTimer <= 0) {
          enemy.direction = Math.random() * Math.PI * 2;
          enemy.wanderTimer = 1000 + Math.random() * 2000;
        }
        
        enemy.x += Math.cos(enemy.direction) * enemy.speed * 0.5;
        enemy.y += Math.sin(enemy.direction) * enemy.speed * 0.5;
      } else {
        // Perseguir jogador
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        
        // Atacar se próximo
        if (distance < 25 && Date.now() - enemy.lastAttack > enemy.attackCooldown) {
          attackPlayer(enemy);
          enemy.lastAttack = Date.now();
        }
      }
    }
    
    // Manter inimigo na tela
    enemy.x = Math.max(0, Math.min(BASE_W - enemy.width, enemy.x));
    enemy.y = Math.max(0, Math.min(BASE_H - enemy.height, enemy.y));
    
    // Remover inimigo se morto
    if (enemy.health <= 0) {
      enemies.splice(i, 1);
    }
  }
}

// Inimigo ataca jogador
function attackPlayer(enemy) {
  if (!player.inSafeZone) {
    player.health -= enemy.damage;
    console.log(`${ENEMY_TYPES[enemy.type].name} atacou! Vida: ${player.health}/${player.maxHealth}`);
    
    if (player.health <= 0) {
      player.health = 0;
      console.log("Game Over!");
      // Aqui pode adicionar lógica de game over
    }
  }
}

// Calcular iluminação em um ponto
function calculateLighting(x, y) {
  let lightLevel = lighting.ambientLight;
  
  // Ciclo dia/noite
  const dayNightMultiplier = Math.max(0.1, Math.sin(lighting.timeOfDay * Math.PI));
  lightLevel *= dayNightMultiplier;
  
  // Lanterna do jogador
  if (player.lanterna && state === 'playing') {
    const dist = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
    const maxDist = 50;
    if (dist < maxDist) {
      const flashlightStrength = Math.max(0, 1 - (dist / maxDist));
      lightLevel += flashlightStrength * 0.8;
    }
  }
  
  // Lanterna no mundo aberto
  if (player.lanterna && state === 'world') {
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    const dist = Math.sqrt((x - playerScreenX) ** 2 + (y - playerScreenY) ** 2);
    const maxDist = 60;
    if (dist < maxDist) {
      const flashlightStrength = Math.max(0, 1 - (dist / maxDist));
      lightLevel += flashlightStrength * 0.9;
    }
  }
  
  return Math.min(1, lightLevel);
}

// Aplicar iluminação a uma cor
function applyLighting(color, lightLevel) {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  
  const newR = Math.floor(r * lightLevel);
  const newG = Math.floor(g * lightLevel);
  const newB = Math.floor(b * lightLevel);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
}

// Renderizar o jogo com iluminação 3D
function renderGame() {
  // Cor de fundo baseada na hora do dia e zona segura
  const skyBrightness = Math.max(0.1, Math.sin(lighting.timeOfDay * Math.PI));
  let skyR = Math.floor(47 * skyBrightness);
  let skyG = Math.floor(47 * skyBrightness);
  let skyB = Math.floor(47 * skyBrightness);
  
  // Zona segura tem tom mais quente e acolhedor
  if (player.inSafeZone) {
    skyR += 20;
    skyG += 15;
    skyB += 10;
  }
  
  bctx.fillStyle = `rgb(${skyR}, ${skyG}, ${skyB})`;
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Indicador visual de zona segura
  if (player.inSafeZone) {
    bctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    bctx.lineWidth = 4;
    bctx.strokeRect(2, 2, BASE_W - 4, BASE_H - 4);
    
    // Texto de zona segura
    bctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    bctx.font = '12px monospace';
    bctx.fillText('🏠 ZONA SEGURA', BASE_W/2 - 50, 30);
  }
  
  // Renderizar mapa com iluminação
  renderMapWithLighting(bctx);
  
  // Renderizar porta com efeito 3D
  renderDoor3D(bctx, 145, 95);
  
  // Mostrar área de interação da porta
  const doorX = 150;
  const doorY = 105;
  const interactionRadius = 30; // Maior para facilitar interação
  const distance = Math.sqrt((player.x - doorX) ** 2 + (player.y - doorY) ** 2);
  
  // Sempre desenhar um indicador visual para a porta
  const doorLightLevel = calculateLighting(doorX, doorY);
  
  // Desenhar destaque da porta
  bctx.fillStyle = `rgba(255, 220, 150, ${doorLightLevel * 0.3})`;
  bctx.fillRect(doorX - 15, doorY - 10, 30, 20);
  
  // Desenhar símbolo de porta
  bctx.fillStyle = applyLighting('#ffffff', doorLightLevel);
  bctx.font = '12px monospace';
  bctx.fillText('🚪', doorX - 6, doorY + 4);
  
  if (distance <= interactionRadius) {
    // Círculo de interação pulsante
    const pulseAmount = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    
    // Círculo de interação com brilho
    bctx.strokeStyle = `rgba(0, 255, 0, ${doorLightLevel * pulseAmount})`;
    bctx.lineWidth = 2;
    bctx.beginPath();
    bctx.arc(doorX, doorY, interactionRadius, 0, 2 * Math.PI);
    bctx.stroke();
    
    // Texto de interação
    bctx.fillStyle = applyLighting('#00ff00', doorLightLevel);
    bctx.font = '10px monospace';
    bctx.fillText('Pressione E para sair', doorX - 40, doorY - 15);
  }
  
  // Renderizar inimigos (apenas fora da zona segura)
  if (!player.inSafeZone) {
    renderEnemies(bctx);
  }
  
  // Renderizar jogador 3D
  renderPlayer3D(bctx);
  
  // Overlay de iluminação (escuridão)
  if (lighting.timeOfDay < 0.2 || lighting.timeOfDay > 0.8) {
    renderDarknessOverlay(bctx);
  }
  
  // UI com informações
  renderGameUI(bctx);
}

// Renderizar inimigos
function renderEnemies(ctx) {
  for (let enemy of enemies) {
    const lightLevel = calculateLighting(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    
    // Sombra do inimigo
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * lightLevel})`;
    ctx.fillRect(enemy.x + 2, enemy.y + enemy.height + 1, enemy.width - 2, 4);
    
    // Corpo do inimigo
    ctx.fillStyle = applyLighting(enemy.color, lightLevel);
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Efeito de tipo específico
    switch (enemy.type) {
      case 'shadow':
        // Efeito de sombra tremulante
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
        ctx.fillRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
        break;
        
      case 'ghost':
        // Efeito de transparência fantasmagórica
        ctx.fillStyle = `rgba(230, 230, 250, ${0.7 + Math.sin(Date.now() * 0.005) * 0.3})`;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        break;
        
      case 'demon':
        // Olhos vermelhos brilhantes
        ctx.fillStyle = applyLighting('#FF0000', 1);
        ctx.fillRect(enemy.x + 3, enemy.y + 3, 2, 2);
        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 3, 2, 2);
        break;
    }
    
    // Barra de vida do inimigo
    if (enemy.health < enemy.maxHealth) {
      const barWidth = enemy.width;
      const barHeight = 3;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      // Fundo da barra
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(enemy.x, enemy.y - 8, barWidth, barHeight);
      
      // Vida atual
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(enemy.x, enemy.y - 8, barWidth * healthPercent, barHeight);
    }
    
    // Nome do inimigo
    ctx.fillStyle = applyLighting('#FFFFFF', lightLevel);
    ctx.font = '6px monospace';
    const name = ENEMY_TYPES[enemy.type].name;
    ctx.fillText(name, enemy.x - 5, enemy.y - 12);
  }
}

// Renderizar mapa com iluminação
function renderMapWithLighting(ctx) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tileX = x * TILE_SIZE;
      const tileY = y * TILE_SIZE;
      const lightLevel = calculateLighting(tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
      
      renderTileWithLighting(ctx, map[y][x], tileX, tileY, lightLevel);
    }
  }
}

// Renderizar tile com iluminação e efeito 3D
function renderTileWithLighting(ctx, tile, x, y, lightLevel) {
  let baseColor = '#111';
  let topColor = '#111';
  
  switch (tile) {
    case 0: baseColor = '#111111'; topColor = '#222222'; break;
    case 1: baseColor = '#555555'; topColor = '#777777'; break;
    case 2: baseColor = '#228B22'; topColor = '#32CD32'; break;
  }
  
  // Aplicar iluminação
  const litBaseColor = applyLighting(baseColor, lightLevel);
  const litTopColor = applyLighting(topColor, lightLevel * 1.2);
  
  // Renderizar base do tile
  ctx.fillStyle = litBaseColor;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // Efeito 3D - topo do tile
  if (render3D.enabled && (tile === 1 || tile === 2)) {
    ctx.fillStyle = litTopColor;
    ctx.fillRect(x, y - render3D.tileHeight/2, TILE_SIZE, render3D.tileHeight/2);
    
    // Sombra lateral
    ctx.fillStyle = applyLighting(baseColor, lightLevel * 0.6);
    ctx.fillRect(x + TILE_SIZE - 2, y - render3D.tileHeight/2, 2, TILE_SIZE + render3D.tileHeight/2);
  }
}

// Renderizar porta com efeito 3D
function renderDoor3D(ctx, x, y) {
  const lightLevel = calculateLighting(x + 5, y + 10);
  
  // Base da porta
  ctx.fillStyle = applyLighting('#8B4513', lightLevel);
  ctx.fillRect(x, y, 10, 20);
  
  // Efeito 3D da porta
  ctx.fillStyle = applyLighting('#A0522D', lightLevel * 1.2);
  ctx.fillRect(x, y - 3, 10, 3);
  
  // Sombra da porta
  ctx.fillStyle = applyLighting('#654321', lightLevel * 0.7);
  ctx.fillRect(x + 8, y - 3, 2, 23);
  
  // Maçaneta
  ctx.fillStyle = applyLighting('#FFD700', lightLevel);
  ctx.fillRect(x + 7, y + 8, 2, 2);
}

// Renderizar jogador 3D
function renderPlayer3D(ctx) {
  const lightLevel = calculateLighting(player.x + player.width/2, player.y + player.height/2);
  
  // Sombra do jogador
  ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * lightLevel})`;
  ctx.fillRect(player.x + 2, player.y + player.height + 2, player.width - 4, 6);
  
  // Corpo do jogador com altura 3D
  const playerHeight3D = 4;
  
  // Base do jogador
  ctx.fillStyle = applyLighting('#FF6347', lightLevel);
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Topo 3D do jogador
  ctx.fillStyle = applyLighting('#FFD700', lightLevel * 1.3);
  ctx.fillRect(player.x, player.y - playerHeight3D, player.width, playerHeight3D);
  
  // Sombra lateral
  ctx.fillStyle = applyLighting('#CD853F', lightLevel * 0.8);
  ctx.fillRect(player.x + player.width - 2, player.y - playerHeight3D, 2, player.height + playerHeight3D);
  
  // Indicador de direção
  const dirX = player.x + player.width/2;
  const dirY = player.y + player.height/2;
  ctx.fillStyle = applyLighting('#FFFFFF', lightLevel);
  
  switch(player.direction) {
    case 0: ctx.fillRect(dirX - 1, dirY - 6, 2, 4); break; // Norte
    case 1: ctx.fillRect(dirX + 2, dirY - 1, 4, 2); break; // Leste
    case 2: ctx.fillRect(dirX - 1, dirY + 2, 2, 4); break; // Sul
    case 3: ctx.fillRect(dirX - 6, dirY - 1, 4, 2); break; // Oeste
  }
}

// Renderizar overlay de escuridão
function renderDarknessOverlay(ctx) {
  if (!player.lanterna) {
    // Escuridão total sem lanterna
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  } else {
    // Criar gradiente radial da lanterna
    const gradient = ctx.createRadialGradient(
      player.x + player.width/2, player.y + player.height/2, 0,
      player.x + player.width/2, player.y + player.height/2, 50
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }
}

// Renderizar UI do jogo
function renderGameUI(ctx) {
  // Painel de informações expandido
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(5, 5, 180, 120);
  
  const lightLevel = calculateLighting(player.x, player.y);
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  
  ctx.fillText('🎮 Controles:', 10, 20);
  ctx.fillText('WASD - mover', 10, 35);
  ctx.fillText('E - interagir', 10, 50);
  ctx.fillText('F - lanterna', 10, 65);
  ctx.fillText('T - mudar hora', 10, 80);
  
  // Indicadores de status
  ctx.fillText(`💡 Luz: ${Math.floor(lightLevel * 100)}%`, 10, 100);
  ctx.fillText(`🔦 Lanterna: ${player.lanterna ? 'ON' : 'OFF'}`, 10, 115);
  
  const timeStr = lighting.timeOfDay < 0.2 ? '🌙 Noite' : 
                 lighting.timeOfDay < 0.8 ? '☀️ Dia' : '🌙 Noite';
  ctx.fillText(timeStr, 10, 130);
  
  // Barra de vida do jogador
  const healthBarWidth = 120;
  const healthBarHeight = 12;
  const healthX = BASE_W - healthBarWidth - 10;
  const healthY = 10;
  
  // Fundo da barra de vida
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(healthX - 5, healthY - 5, healthBarWidth + 10, healthBarHeight + 10);
  
  // Barra vermelha (vida perdida)
  ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
  ctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);
  
  // Barra verde (vida atual)
  const healthPercent = player.health / player.maxHealth;
  ctx.fillStyle = player.health > 30 ? 'rgba(0, 200, 0, 0.9)' : 'rgba(255, 100, 0, 0.9)';
  ctx.fillRect(healthX, healthY, healthBarWidth * healthPercent, healthBarHeight);
  
  // Texto da vida
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.fillText(`❤️ ${player.health}/${player.maxHealth}`, healthX + 5, healthY + 9);
  
  // Status da zona segura
  if (player.inSafeZone) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
    ctx.font = '12px monospace';
    ctx.fillText('🛡️ ZONA SEGURA', BASE_W/2 - 60, BASE_H - 20);
    ctx.font = '8px monospace';
    ctx.fillText('Sem inimigos aqui!', BASE_W/2 - 40, BASE_H - 8);
  } else {
    ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
    ctx.font = '10px monospace';
    ctx.fillText('⚠️ ZONA DE PERIGO', BASE_W/2 - 60, BASE_H - 20);
    ctx.font = '8px monospace';
    ctx.fillText(`👹 Inimigos: ${enemies.length}`, BASE_W/2 - 35, BASE_H - 8);
  }
}

// Detectar interação com a porta para sair da casa
function checkDoorInteraction(playerX, playerY) {
  // Definição da porta e área de interação
  const doorX = 150; // Coordenada X da porta
  const doorY = 105; // Coordenada Y da porta
  const interactionRadius = 40; // Raio de interação bem maior para facilitar

  const distance = Math.sqrt((playerX - doorX) ** 2 + (playerY - doorY) ** 2);
  
  // Debug detalhado
  console.log(`Posição do jogador: (${Math.floor(playerX)}, ${Math.floor(playerY)})`);
  console.log(`Posição da porta: (${doorX}, ${doorY})`);
  console.log(`Distância: ${Math.floor(distance)}, Raio: ${interactionRadius}`);
  console.log(`Estado do jogo: ${state}`);

  // Destaque visual para área de interação (sempre visível)
  if (state === 'playing') {
    // Desenhar contorno da porta
    bctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';  // Dourado
    bctx.lineWidth = 2;
    bctx.strokeRect(doorX - 20, doorY - 15, 40, 30);
    
    // Desenhar ícone de porta
    bctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    bctx.font = '16px Arial';
    bctx.fillText('🚪', doorX - 8, doorY + 5);
    
    // Mostrar prompt visual quando dentro da área de interação
    if (distance <= interactionRadius) {
      // Efeito pulsante
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 250);
      
      bctx.fillStyle = `rgba(255, 255, 150, ${pulse})`;
      bctx.font = 'bold 12px Arial';
      bctx.fillText('Pressione E para sair', doorX - 60, doorY - 20);
      
      // Círculo de interação
      bctx.strokeStyle = `rgba(0, 255, 0, ${pulse})`;
      bctx.beginPath();
      bctx.arc(doorX, doorY, interactionRadius * pulse, 0, Math.PI * 2);
      bctx.stroke();
    }
  }

  if (distance <= interactionRadius) {
    console.log('INTERAGINDO COM A PORTA! Iniciando transição...');
    // Registrar evento de tentativa de transição
    window.doorInteractionAttempt = true;
    // Tocar som de porta abrindo (se disponível)
    if (audioConfig.sfxEnabled) {
      playMenuSelectSfx();
    }
    // Iniciar transição para o mundo
    transitionToWorld();
    return true;
  } else {
    console.log('Muito longe da porta para interagir');
    return false;
  }
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

} // Fecha a função initGame()
