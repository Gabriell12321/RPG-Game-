// Sistema de renderização do mundo infinito
// Este arquivo contém as funções de renderização do mundo 3D
(function(window){

// Acessar constantes globais
// Essas constantes são alternativas caso o GameSystem não esteja disponível
const WORLD_CHUNK_SIZE = window.GameSystem?.constants?.WORLD_CHUNK_SIZE || 16;
const VISIBLE_CHUNKS_RADIUS = window.GameSystem?.constants?.VISIBLE_CHUNKS_RADIUS || 2;
const TILE_SIZE = window.GameSystem?.constants?.TILE_SIZE || 16;
const BASE_W = window.GameSystem?.constants?.BASE_W || 320;
const BASE_H = window.GameSystem?.constants?.BASE_H || 180;
const SCREEN_W = window.GameSystem?.constants?.SCREEN_W || 960;
const SCREEN_H = window.GameSystem?.constants?.SCREEN_H || 540;

// Verificar se as variáveis globais já foram definidas em game.js
// Se não existirem, criar versões locais
if (typeof worldChunks === 'undefined') {
  var worldChunks = new Map(); // Map usando coordenadas de chunk como chave
}

if (typeof camera === 'undefined') {
  var camera = {
    x: 0,
    y: 0
  };
}

if (typeof lighting === 'undefined') {
  var lighting = {
    timeOfDay: 0.5, // 0.0 a 1.0 (0 = meia-noite, 0.25 = amanhecer, 0.5 = meio-dia, 0.75 = pôr do sol)
    ambientLight: 0.7,
    weather: 'clear', // clear, rain, fog, snow
    wind: {x: 0, y: 0}
  };
}

if (typeof player === 'undefined') {
  var player = {
    x: BASE_W / 2,
    y: BASE_H / 2,
    width: TILE_SIZE,
    height: TILE_SIZE * 1.5,
    color: '#ff0000',
    worldX: 0,
    worldY: 0,
    inSafeZone: false,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    lanterna: false,
    direction: 2, // 0=norte, 1=leste, 2=sul, 3=oeste
    isMoving: false,
    animFrame: 0
  };
}

if (typeof safeZones === 'undefined') {
  var safeZones = [{
    name: "Casa do Jogador",
    x: -10 * TILE_SIZE,
    y: -10 * TILE_SIZE,
    width: 20 * TILE_SIZE,
    height: 20 * TILE_SIZE,
    isPlayerHouse: true,
    active: true
  }];
}

if (typeof enemies === 'undefined') {
  var enemies = [];
}

// Sistema de partículas do mundo
var worldParticles = [];

if (typeof base === 'undefined') {
  var base = document.createElement('canvas');
  base.width = BASE_W;
  base.height = BASE_H;
  var bctx = base.getContext('2d');
}

if (typeof ctx === 'undefined') {
  var canvas = document.getElementById('screen');
  if (canvas) {
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    var ctx = canvas.getContext('2d');
  } else {
    console.error('Canvas element não encontrado!');
  }
}

// Renderizar o mundo infinito
function renderWorld() {
  try {
    // Limpar o canvas
    if (!bctx) {
      console.error('ERRO: bctx não está definido!');
      if (!base) {
        console.error('ERRO: canvas base não está definido!');
        base = document.createElement('canvas');
        base.width = BASE_W;
        base.height = BASE_H;
        bctx = base.getContext('2d');
      } else {
        bctx = base.getContext('2d');
      }
    }
    
    // Verificar se state está disponível
    if (typeof state === 'undefined') {
      console.warn('Variável state não está definida, usando "world" como padrão');
      var state = 'world';
    }
    
    // Sanear câmera
    if (!camera || !Number.isFinite(camera.x) || !Number.isFinite(camera.y)) {
      console.warn('Camera inválida, resetando para 0,0');
      camera = { x: 0, y: 0 };
    }

    // Atualizar hora do dia - ciclo dia/noite (com guardas)
    if (state === 'world') {
      const t = Number.isFinite(lighting.timeOfDay) ? lighting.timeOfDay : 0.5;
      lighting.timeOfDay = (t + 0.0001) % 1;
    }

    // Calcular luminosidade baseada no ciclo dia/noite, com fallback seguro
    const tod = Number.isFinite(lighting.timeOfDay) ? lighting.timeOfDay : 0.5;
    let skyBrightness = Math.sin(tod * Math.PI);
    if (!Number.isFinite(skyBrightness)) skyBrightness = 0.5;
    skyBrightness = Math.max(0.15, skyBrightness);
    lighting.ambientLight = skyBrightness * 0.7 + 0.3;
    
    // Cor do céu baseada na hora do dia
    let skyR = Math.floor(135 * skyBrightness);
    let skyG = Math.floor(206 * skyBrightness);
    let skyB = Math.floor(235 * skyBrightness);
    
    // Céu avermelhado durante o amanhecer/entardecer
    if (lighting.timeOfDay < 0.2 || lighting.timeOfDay > 0.8) {
      skyR += Math.floor(120 * (1 - skyBrightness));
      skyG += Math.floor(60 * (1 - skyBrightness));
    }
    
    // Cor do céu
  // Sanear valores de cor
  skyR = Number.isFinite(skyR) ? skyR : 0;
  skyG = Number.isFinite(skyG) ? skyG : 0;
  skyB = Number.isFinite(skyB) ? skyB : 0;
  const skyColor = `rgb(${skyR}, ${skyG}, ${skyB})`;
    
    // Desenhar céu
    bctx.fillStyle = skyColor;
    bctx.fillRect(0, 0, BASE_W, BASE_H);
    
    // Desenhar sol/lua
    drawCelestialBodies(lighting.timeOfDay);
    
    // Desenhar nuvens
    drawClouds();
    
    // Renderizar montanhas distantes no horizonte
    renderHorizon();
    
    // Garantir que existam chunks para renderizar
    try {
      if (worldChunks && worldChunks.size === 0) {
        if (typeof window.generateChunksAroundPlayer === 'function') {
          window.generateChunksAroundPlayer();
        } else if (typeof window.generateChunk === 'function') {
          const cx = Math.floor((player.worldX || 0) / (WORLD_CHUNK_SIZE * TILE_SIZE));
          const cy = Math.floor((player.worldY || 0) / (WORLD_CHUNK_SIZE * TILE_SIZE));
          const key = `${cx},${cy}`;
          if (!worldChunks.has(key)) worldChunks.set(key, window.generateChunk(cx, cy));
        } else {
          // Fallback extremo: criar chunk plano visível
          const chunk = { x: 0, y: 0, tiles: [], entities: [], biome: 'plains' };
          for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
            const row = [];
            for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
              row.push({ type: 'grass', walkable: true, color: '#7aab67', height: 0 });
            }
            chunk.tiles.push(row);
          }
          worldChunks.set('0,0', chunk);
        }
      }
    } catch (e) { console.warn('Falha ao bootstrap de chunks', e); }

    // Calcular quais chunks estão visíveis baseados na posição da câmera
    renderVisibleChunks(lighting.ambientLight);
    
    // Renderizar o jogador em 3D
    renderPlayer3D(bctx);
    
    // Renderizar inimigos
    renderEnemies(bctx);
    
    // Verificar zona segura
    checkSafeZone();
    
    // Renderizar efeitos do mundo (chuva, neve, etc)
    renderWeatherEffects();
    
    // Renderizar UI
    renderWorldUI();
    
    // Aplicar iluminação global
    applyLightingEffect(skyBrightness);
    
    // Debug: mostrar coordenadas do mundo
    bctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    bctx.font = '8px monospace';
    bctx.fillText(`Mundo: X=${Math.floor(player.worldX)}, Y=${Math.floor(player.worldY)}`, 10, BASE_H - 10);
    bctx.fillText(`Bioma: ${getCurrentBiome()}`, 10, BASE_H - 20);
    
  // Pequeno watermark para confirmar render ativo
  bctx.fillStyle = 'rgba(255,255,255,0.15)';
  bctx.fillRect(BASE_W - 18, BASE_H - 8, 2, 2);

  // Atualizar o canvas principal
    if (!ctx) {
      const canvasEl = document.getElementById('screen');
      if (canvasEl) {
        ctx = canvasEl.getContext('2d');
      }
    }
    if (ctx) {
      ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
    } else {
      console.error('ERRO: ctx não está definido!');
    }
  } catch (renderError) {
    console.error('ERRO na renderização do mundo:', renderError);
    
    // Exibir mensagem de erro na tela
    if (bctx) {
      bctx.fillStyle = '#300';
      bctx.fillRect(0, 0, BASE_W, BASE_H);
      bctx.fillStyle = '#f00';
      bctx.font = '10px Arial';
      bctx.fillText('ERRO NA RENDERIZAÇÃO: ' + renderError.message, 10, 30);
      
      // Ainda tentar atualizar o canvas principal
      if (ctx) {
        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
      }
    }
  }
}

// Expor função principal de render (apenas se não existir)
if (!window.renderWorld) {
  window.renderWorld = renderWorld;
}

})(window);

// Renderizar o jogador em 3D
function renderPlayer3D(ctx) {
  // Verificar se o player existe no escopo global, senão usar o do GameSystem
  const playerObj = window.player || window.GameSystem?.state?.player || {
    x: BASE_W / 2,
    y: BASE_H / 2,
    width: TILE_SIZE,
    height: TILE_SIZE * 1.5,
    color: '#ff0000',
    direction: 2,
    isMoving: false,
    animFrame: 0
  };
  
  // Calcular o ponto central do jogador
  const centerX = playerObj.x;
  const centerY = playerObj.y;
  
  // Calcular iluminação na posição do jogador
  const lightLevel = GameSystem.functions.calculateTileLighting(
    playerObj.worldX || 0, 
    playerObj.worldY || 0, 
    lighting.ambientLight
  );
  
  // Altura 3D do jogador
  const playerHeight3D = 8;
  
  // Sombra do jogador (oval abaixo)
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.4, 0.3 * lightLevel)})`;
  ctx.beginPath();
  ctx.ellipse(
    centerX, 
    centerY + playerObj.height / 2 - 2, 
    playerObj.width / 2, 
    playerObj.width / 4, 
    0, 0, Math.PI * 2
  );
  ctx.fill();
  
  // Cor do jogador baseada na iluminação
  const playerColor = GameSystem.functions.applyLighting(playerObj.color || '#ff0000', lightLevel);
  
  // Corpo do jogador
  ctx.fillStyle = playerColor;
  ctx.fillRect(
    centerX - playerObj.width / 2,
    centerY - playerObj.height / 2,
    playerObj.width,
    playerObj.height
  );
  
  // Altura 3D (cabeça)
  ctx.fillStyle = GameSystem.functions.applyLighting(GameSystem.functions.lightenColor(playerObj.color, 30), lightLevel * 1.1);
  ctx.fillRect(
    centerX - playerObj.width / 2,
    centerY - playerObj.height / 2 - playerHeight3D,
    playerObj.width,
    playerHeight3D
  );
  
  // Sombras laterais para efeito 3D
  ctx.fillStyle = GameSystem.functions.applyLighting(GameSystem.functions.darkenColor(playerObj.color, 30), lightLevel * 0.7);
  ctx.fillRect(
    centerX + playerObj.width / 2 - 2,
    centerY - playerObj.height / 2 - playerHeight3D,
    2,
    playerObj.height + playerHeight3D
  );
  
  // Renderizar lanterna se estiver ativa
  if (playerObj.lanterna) {
    const flashlightX = centerX;
    const flashlightY = centerY - playerObj.height / 2 - playerHeight3D + 4;
    
    // Luz da lanterna
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(flashlightX, flashlightY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Raio de luz na direção que o jogador está olhando
    let rayEndX = flashlightX;
    let rayEndY = flashlightY;
    
    // Direção do raio de luz baseado na direção do jogador
    const rayLength = 60;
    switch(playerObj.direction) {
      case 0: // Norte
        rayEndY -= rayLength;
        break;
      case 1: // Leste
        rayEndX += rayLength;
        break;
      case 2: // Sul
        rayEndY += rayLength;
        break;
      case 3: // Oeste
        rayEndX -= rayLength;
        break;
    }
    
    // Desenhar feixe de luz
    const gradient = ctx.createLinearGradient(flashlightX, flashlightY, rayEndX, rayEndY);
    gradient.addColorStop(0, 'rgba(255, 255, 150, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
    
    ctx.beginPath();
    ctx.moveTo(flashlightX, flashlightY);
    ctx.lineTo(rayEndX, rayEndY);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 15;
    ctx.stroke();
  }
  
  // Adicionar animação de caminhada se o jogador estiver se movendo
  if (playerObj.isMoving) {
    // Animação baseada no frame atual
    const frameOffset = Math.sin((playerObj.animFrame || 0) * Math.PI / 2) * 2;
    
    // Aplicar efeito de balanço durante a caminhada
    if (playerObj.direction === 1 || playerObj.direction === 3) { // Leste ou Oeste
      ctx.fillStyle = playerColor;
      ctx.fillRect(
        centerX - playerObj.width / 2,
        centerY + playerObj.height / 2 - 4 + frameOffset,
        playerObj.width,
        4 - frameOffset
      );
    } else { // Norte ou Sul
      ctx.fillStyle = playerColor;
      ctx.fillRect(
        centerX - playerObj.width / 2,
        centerY + playerObj.height / 2 - 4 + frameOffset,
        playerObj.width,
        4 - frameOffset
      );
    }
  }
  
  // Desenhar indicador de direção
  const dirIndicatorSize = 3;
  let dirX = centerX;
  let dirY = centerY;
  
  switch(playerObj.direction) {
    case 0: // Norte
      dirY -= playerObj.height / 2;
      break;
    case 1: // Leste
      dirX += playerObj.width / 2 - dirIndicatorSize;
      break;
    case 2: // Sul
      dirY += playerObj.height / 2 - dirIndicatorSize;
      break;
    case 3: // Oeste
      dirX -= playerObj.width / 2;
      break;
  }
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    dirX - dirIndicatorSize,
    dirY - dirIndicatorSize,
    dirIndicatorSize * 2,
    dirIndicatorSize * 2
  );
}

// Determinar o bioma atual baseado na posição do jogador
function getCurrentBiome() {
  const playerChunkX = Math.floor(player.worldX / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const playerChunkY = Math.floor(player.worldY / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const chunkKey = `${playerChunkX},${playerChunkY}`;
  
  const currentChunk = worldChunks.get(chunkKey);
  if (currentChunk) {
    return currentChunk.biome.charAt(0).toUpperCase() + currentChunk.biome.slice(1);
  }
  
  return "Desconhecido";
}

// Renderizar os chunks visíveis
function renderVisibleChunks(ambientLight) {
  try {
    // Calcular range de chunks visíveis baseados na posição da câmera
    const cameraChunkX = Math.floor(camera.x / (WORLD_CHUNK_SIZE * TILE_SIZE));
    const cameraChunkY = Math.floor(camera.y / (WORLD_CHUNK_SIZE * TILE_SIZE));
    
    const chunksVisibleX = Math.ceil(BASE_W / (WORLD_CHUNK_SIZE * TILE_SIZE)) + 1;
    const chunksVisibleY = Math.ceil(BASE_H / (WORLD_CHUNK_SIZE * TILE_SIZE)) + 1;
    
    // Renderizar os chunks no campo de visão
    for (let cy = cameraChunkY - 1; cy <= cameraChunkY + chunksVisibleY; cy++) {
      for (let cx = cameraChunkX - 1; cx <= cameraChunkX + chunksVisibleX; cx++) {
        const chunkKey = `${cx},${cy}`;
      
      // Se o chunk não existe, gerar um novo
      if (!worldChunks.has(chunkKey)) {
        worldChunks.set(chunkKey, generateChunk(cx, cy));
      }
      
      // Renderizar o chunk
      renderChunk(worldChunks.get(chunkKey), ambientLight);
    }
  }
  
  // Limpar chunks muito distantes para economizar memória
  cleanUpDistantChunks(cameraChunkX, cameraChunkY);
  
  } catch (chunksError) {
    console.error('ERRO ao renderizar chunks:', chunksError);
  }
}

// Remover chunks distantes para economizar memória
function cleanUpDistantChunks(centerX, centerY) {
  const maxChunks = 100; // Limitar número total de chunks
  const cleanupRadius = VISIBLE_CHUNKS_RADIUS + 5; // Distância para manter chunks
  
  // Se temos muitos chunks, remover os mais distantes
  if (worldChunks.size > maxChunks) {
    const chunksToRemove = [];
    
    for (const [key, chunk] of worldChunks.entries()) {
      const dx = chunk.x - centerX;
      const dy = chunk.y - centerY;
      const distanceSquared = dx * dx + dy * dy;
      
      if (distanceSquared > cleanupRadius * cleanupRadius) {
        chunksToRemove.push(key);
      }
    }
    
    // Remover chunks distantes
    chunksToRemove.forEach(key => worldChunks.delete(key));
    
    if (chunksToRemove.length > 0) {
      console.log(`Liberando memória: ${chunksToRemove.length} chunks removidos`);
    }
  }
}

// Renderizar um único chunk do mundo
function renderChunk(chunk, ambientLight) {
  const chunkScreenX = chunk.x * WORLD_CHUNK_SIZE * TILE_SIZE - camera.x;
  const chunkScreenY = chunk.y * WORLD_CHUNK_SIZE * TILE_SIZE - camera.y;
  
  // Verificar se o chunk está visível na tela
  if (chunkScreenX > BASE_W || chunkScreenY > BASE_H || 
      chunkScreenX + WORLD_CHUNK_SIZE * TILE_SIZE < 0 || 
      chunkScreenY + WORLD_CHUNK_SIZE * TILE_SIZE < 0) {
    return; // Chunk fora da tela, não precisa renderizar
  }
  
  // Renderizar tiles do chunk
  for (let y = 0; y < chunk.tiles.length; y++) {
    for (let x = 0; x < chunk.tiles[y].length; x++) {
      const tile = chunk.tiles[y][x];
      
      // Calcular posição do tile na tela
      const tileWorldX = chunk.x * WORLD_CHUNK_SIZE + x;
      const tileWorldY = chunk.y * WORLD_CHUNK_SIZE + y;
      
      const tileScreenX = tileWorldX * TILE_SIZE - camera.x;
      const tileScreenY = tileWorldY * TILE_SIZE - camera.y;
      
      // Verificar se o tile está visível na tela
      if (tileScreenX > -TILE_SIZE && tileScreenY > -TILE_SIZE &&
          tileScreenX < BASE_W && tileScreenY < BASE_H) {
        
        // Calcular iluminação
        const lightLevel = GameSystem.functions.calculateTileLighting(tileWorldX, tileWorldY, ambientLight);
        
        // Renderizar tile com efeito 3D baseado na elevação (com fallback seguro)
        const safeRenderTile3D = (GameSystem && GameSystem.functions && GameSystem.functions.renderTile3D)
          ? GameSystem.functions.renderTile3D
          : function(ctx, t, px, py, ll){
              ctx.fillStyle = (t && t.color) ? t.color : '#7aab67';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            };
        safeRenderTile3D(bctx, tile, tileScreenX, tileScreenY, lightLevel);
      }
    }
  }
  
  // Renderizar entidades do chunk (árvores, pedras, etc.)
  for (const entity of chunk.entities) {
    const entityScreenX = (chunk.x * WORLD_CHUNK_SIZE + entity.x) * TILE_SIZE - camera.x;
    const entityScreenY = (chunk.y * WORLD_CHUNK_SIZE + entity.y) * TILE_SIZE - camera.y;
    
    // Verificar se a entidade está visível na tela
    if (entityScreenX > -TILE_SIZE * 2 && entityScreenY > -TILE_SIZE * 3 &&
        entityScreenX < BASE_W && entityScreenY < BASE_H) {
      
      const lightLevel = GameSystem.functions.calculateTileLighting(entity.worldX, entity.worldY, ambientLight);
      GameSystem.functions.renderEntity(entity, entityScreenX, entityScreenY, lightLevel);
    }
  }
}

// Desenhar corpos celestes (sol/lua)
function drawCelestialBodies(timeOfDay) {
  // Posição baseada na hora do dia
  const angleRad = timeOfDay * Math.PI * 2;
  const celestialX = BASE_W/2 + Math.cos(angleRad) * BASE_W * 0.7;
  const celestialY = BASE_H/2 + Math.sin(angleRad - Math.PI/2) * BASE_H * 0.5;
  
  // Decidir se é sol ou lua
  if (timeOfDay > 0.25 && timeOfDay < 0.75) {
    // Sol
    const sunGradient = bctx.createRadialGradient(
      celestialX, celestialY, 0,
      celestialX, celestialY, 15
    );
    sunGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    sunGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)');
    sunGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
    
    bctx.fillStyle = sunGradient;
    bctx.beginPath();
    bctx.arc(celestialX, celestialY, 15, 0, Math.PI * 2);
    bctx.fill();
  } else {
    // Lua
    bctx.fillStyle = '#E6E6FA';
    bctx.beginPath();
    bctx.arc(celestialX, celestialY, 10, 0, Math.PI * 2);
    bctx.fill();
    
    // Crateras da lua
    bctx.fillStyle = '#DCDCDC';
    bctx.beginPath();
    bctx.arc(celestialX - 3, celestialY - 2, 2, 0, Math.PI * 2);
    bctx.fill();
    
    bctx.beginPath();
    bctx.arc(celestialX + 3, celestialY + 3, 1.5, 0, Math.PI * 2);
    bctx.fill();
    
    // Brilho ao redor da lua
    const moonGlow = bctx.createRadialGradient(
      celestialX, celestialY, 10,
      celestialX, celestialY, 20
    );
    moonGlow.addColorStop(0, 'rgba(230, 230, 250, 0.3)');
    moonGlow.addColorStop(1, 'rgba(230, 230, 250, 0)');
    
    bctx.fillStyle = moonGlow;
    bctx.beginPath();
    bctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
    bctx.fill();
  }
}

// Verificar se o jogador está em uma zona segura
function checkSafeZone() {
  // Usar a função do game.js se estiver disponível
  if (typeof window.GameSystem?.functions?.checkSafeZone === 'function') {
    return window.GameSystem.functions.checkSafeZone();
  }
  
  // Implementação simplificada caso a função principal não esteja disponível
  const oldSafeState = player.inSafeZone;
  player.inSafeZone = false;
  
  // Verificar zonas seguras
  for (let zone of safeZones) {
    if (zone.active) {
      let playerInZone = false;
      
      if (zone.isPlayerHouse) {
        // Checar se o jogador está na casa usando worldX/worldY
        playerInZone = (
          player.worldX >= zone.x && 
          player.worldX < zone.x + zone.width &&
          player.worldY >= zone.y && 
          player.worldY < zone.y + zone.height
        );
      } else {
        // Para zonas na tela, usar coordenadas de tela
        playerInZone = (
          player.x >= zone.x && 
          player.x < zone.x + zone.width &&
          player.y >= zone.y && 
          player.y < zone.y + zone.height
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
  
  return player.inSafeZone;
}

// Renderizar a interface do usuário no mundo
function renderWorldUI() {
  // Painel principal
  bctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  bctx.fillRect(5, 5, 200, 80);
  
  bctx.fillStyle = '#ffffff';
  bctx.font = '8px monospace';
  
  bctx.fillText('🌍 Mundo Aberto 3D', 10, 20);
  bctx.fillText(`📍 Pos: ${Math.floor(player.worldX/TILE_SIZE)}, ${Math.floor(player.worldY/TILE_SIZE)}`, 10, 35);
  
  // Indicador de iluminação e hora do dia
  const lightLevel = 0.7 + (lighting.timeOfDay > 0.3 && lighting.timeOfDay < 0.7 ? 0.3 : 0);
  bctx.fillText(`💡 Iluminação: ${Math.floor(lightLevel * 100)}%`, 10, 50);
  bctx.fillText(`🔦 Lanterna: ${player.lanterna ? '✅' : '❌'}`, 10, 65);
  
  const timeStr = lighting.timeOfDay < 0.3 ? '🌙 Noite' : 
               lighting.timeOfDay < 0.7 ? '☀️ Dia' : '🌅 Crepúsculo';
  bctx.fillText(timeStr, 10, 80);
  
  // Barra de vida do jogador no mundo
  const healthBarWidth = 120;
  const healthBarHeight = 10;
  const healthX = BASE_W - healthBarWidth - 10;
  const healthY = 10;
  
  // Fundo da barra de vida
  bctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  bctx.fillRect(healthX - 5, healthY - 5, healthBarWidth + 10, healthBarHeight + 10);
  
  // Barra de vida vazia
  bctx.fillStyle = '#333';
  bctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);
  
  // Barra de vida atual
  const healthPercent = player.health / player.maxHealth;
  const healthBarFill = healthBarWidth * healthPercent;
  
  const healthColor = healthPercent > 0.6 ? '#4caf50' : 
                     healthPercent > 0.3 ? '#ff9800' : '#f44336';
  
  bctx.fillStyle = healthColor;
  bctx.fillRect(healthX, healthY, healthBarFill, healthBarHeight);
  
  // Texto da vida
  bctx.fillStyle = '#fff';
  bctx.font = '8px monospace';
  bctx.fillText(`${Math.ceil(player.health)}/${player.maxHealth}`, healthX + healthBarWidth/2 - 15, healthY + 8);
  
  // Indicador de zona segura
  if (player.inSafeZone) {
    bctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    bctx.fillRect(BASE_W - 100, 35, 90, 20);
    bctx.fillStyle = '#4caf50';
    bctx.fillText('✅ ZONA SEGURA', BASE_W - 95, 48);
  }
}

// Renderizar os inimigos no mundo 3D
function renderEnemies(ctx) {
  // Verificar se existem inimigos para renderizar
  if (typeof enemies === 'undefined' || enemies.length === 0) {
    return;
  }
  
  // Renderizar apenas se o jogador não estiver em zona segura
  if (player.inSafeZone) {
    return;
  }
  
  // Renderizar cada inimigo
  for (const enemy of enemies) {
    // Calcular posição na tela
    const screenX = enemy.x - camera.x;
    const screenY = enemy.y - camera.y;
    
    // Pular inimigos fora da tela
    if (screenX < -TILE_SIZE || screenY < -TILE_SIZE || 
        screenX > BASE_W + TILE_SIZE || screenY > BASE_H + TILE_SIZE) {
      continue;
    }
    
    // Calcular iluminação na posição do inimigo
    const lightLevel = GameSystem.functions.calculateTileLighting(
      enemy.worldX || enemy.x, 
      enemy.worldY || enemy.y, 
      lighting.ambientLight
    );
    
    // Altura 3D do inimigo
    const enemyHeight3D = 6;
    
    // Sombra do inimigo
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.3, 0.2 * lightLevel)})`;
    ctx.beginPath();
    ctx.ellipse(
      screenX + enemy.width / 2,
      screenY + enemy.height,
      enemy.width / 2,
      enemy.width / 4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Cor do inimigo baseada na iluminação
    const enemyColor = GameSystem.functions.applyLighting(enemy.color || '#8B0000', lightLevel);
    
    // Corpo do inimigo
    ctx.fillStyle = enemyColor;
    ctx.fillRect(screenX, screenY, enemy.width, enemy.height);
    
    // Altura 3D (cabeça)
    ctx.fillStyle = GameSystem.functions.applyLighting(GameSystem.functions.lightenColor(enemy.color || '#8B0000', 20), lightLevel * 1.1);
    ctx.fillRect(screenX, screenY - enemyHeight3D, enemy.width, enemyHeight3D);
    
    // Sombras laterais para efeito 3D
    ctx.fillStyle = GameSystem.functions.applyLighting(GameSystem.functions.darkenColor(enemy.color || '#8B0000', 30), lightLevel * 0.7);
    ctx.fillRect(
      screenX + enemy.width - 2,
      screenY - enemyHeight3D,
      2,
      enemy.height + enemyHeight3D
    );
    
    // Olhos brilhantes para efeito de terror
    const eyeSize = 2;
    const eyeSpacing = 4;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(
      screenX + enemy.width / 2 - eyeSpacing / 2 - eyeSize / 2,
      screenY - enemyHeight3D / 2,
      eyeSize,
      eyeSize
    );
    ctx.fillRect(
      screenX + enemy.width / 2 + eyeSpacing / 2 - eyeSize / 2,
      screenY - enemyHeight3D / 2,
      eyeSize,
      eyeSize
    );
    
    // Barra de vida (somente se o inimigo tiver saúde definida)
    if (typeof enemy.health !== 'undefined' && typeof enemy.maxHealth !== 'undefined') {
      const barWidth = enemy.width * 1.2;
      const barHeight = 3;
      const barX = screenX + enemy.width / 2 - barWidth / 2;
      const barY = screenY - enemyHeight3D - 6;
      
      // Fundo da barra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Barra de vida
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = `rgb(${Math.floor(255 * (1 - healthPercent))}, ${Math.floor(255 * healthPercent)}, 0)`;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
    
    // Animação de movimento (se disponível)
    if (enemy.isMoving) {
      const frameOffset = Math.sin((enemy.animFrame || 0) * Math.PI / 2) * 2;
      
      ctx.fillStyle = enemyColor;
      ctx.fillRect(
        screenX,
        screenY + enemy.height - 4 + frameOffset,
        enemy.width,
        4 - frameOffset
      );
    }
  }
}

// Aplicar efeito de iluminação global
function applyLightingEffect(brightness) {
  // Overlay para hora do dia
  bctx.fillStyle = `rgba(0, 0, 40, ${Math.max(0, 0.7 - brightness)})`;
  bctx.fillRect(0, 0, BASE_W, BASE_H);
  
  // Adicionar efeito de lanterna se ativada
  if (player.lanterna) {
    const gradient = bctx.createRadialGradient(
      player.x, player.y, 10,
      player.x, player.y, 100
    );
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    bctx.fillStyle = gradient;
    bctx.fillRect(0, 0, BASE_W, BASE_H);
  }
}

// Desenhar nuvens
function drawClouds() {
  // Movimento das nuvens baseado no tempo
  const cloudOffset = (Date.now() * 0.01) % BASE_W;
  
  // Camadas de nuvens
  for (let layer = 0; layer < 3; layer++) {
    const y = 30 + layer * 20;
    const speed = 0.5 + layer * 0.3;
    const offset = (cloudOffset * speed) % (BASE_W * 2);
    
    // Cor das nuvens baseada na hora do dia
    const brightness = Math.max(0.2, Math.sin(lighting.timeOfDay * Math.PI));
    const alpha = 0.4 + layer * 0.1;
    
    bctx.fillStyle = `rgba(${200 * brightness}, ${200 * brightness}, ${230 * brightness}, ${alpha})`;
    
    // Nuvens procedurais
    for (let cloudIndex = 0; cloudIndex < 5; cloudIndex++) {
      const cloudX = ((cloudIndex * BASE_W / 2) - offset) % (BASE_W * 2) - BASE_W / 2;
      
      // Tamanho baseado na camada
      const cloudWidth = 60 + layer * 20 + cloudIndex * 10;
      const cloudHeight = 10 + layer * 5;
      
      drawCloud(cloudX, y, cloudWidth, cloudHeight);
    }
  }
}

// Desenhar uma nuvem individual
function drawCloud(x, y, width, height) {
  // Formato básico da nuvem
  bctx.beginPath();
  bctx.ellipse(x + width/2, y, width/2, height, 0, 0, Math.PI*2);
  bctx.fill();
  
  // Adicionar algumas bolhas para dar forma à nuvem
  const bubbles = 3 + Math.floor(width / 20);
  for (let i = 0; i < bubbles; i++) {
    const bubbleX = x + (i / bubbles) * width;
    const bubbleY = y - height/2 + Math.sin(i) * height/4;
    const bubbleSize = height * (0.8 + Math.random() * 0.4);
    
    bctx.beginPath();
    bctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI*2);
    bctx.fill();
  }
}
