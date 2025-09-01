// Funções auxiliares para o sistema de renderização do mundo
(function(window){

// Acessar constantes globais (escopo local para evitar redeclaração)
const TILE_SIZE = window.GameSystem?.constants?.TILE_SIZE || 16;
const WORLD_CHUNK_SIZE = window.GameSystem?.constants?.WORLD_CHUNK_SIZE || 16;

// Funções auxiliares para manipulação de cores
function lightenColor(color, amount) {
  if (!color.startsWith('#')) return color;
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function darkenColor(color, amount) {
  if (!color.startsWith('#')) return color;
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Aplicar iluminação a uma cor
function applyLighting(color, factor) {
  if (!color.startsWith('#')) {
    return color; // Retornar a cor original se não for hex
  }
  
  // Converter hex para RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Aplicar fator de luz
  const newR = Math.floor(r * factor);
  const newG = Math.floor(g * factor);
  const newB = Math.floor(b * factor);
  
  // Garantir que os valores estejam no intervalo 0-255
  const clampedR = Math.max(0, Math.min(255, newR));
  const clampedG = Math.max(0, Math.min(255, newG));
  const clampedB = Math.max(0, Math.min(255, newB));
  
  // Converter de volta para hex
  return `rgb(${clampedR}, ${clampedG}, ${clampedB})`;
}


// Função para obter um tile na posição mundial
function getTile(worldTileX, worldTileY) {
  if (typeof worldChunks === 'undefined') return null;
  
  // Calcular qual chunk contém este tile
  const chunkSize = WORLD_CHUNK_SIZE;
  const chunkX = Math.floor(worldTileX / chunkSize);
  const chunkY = Math.floor(worldTileY / chunkSize);
  
  // Posição local dentro do chunk
  const localX = (worldTileX % chunkSize + chunkSize) % chunkSize;
  const localY = (worldTileY % chunkSize + chunkSize) % chunkSize;
  
  // Obter o chunk correto
  const chunkKey = `${chunkX},${chunkY}`;
  const chunk = worldChunks.get(chunkKey);
  
  if (!chunk || !chunk.tiles || !chunk.tiles[localY]) return null;
  
  return chunk.tiles[localY][localX];
}

// Calcular iluminação em um ponto
function calculateTileLighting(worldX, worldY, ambientLight) {
  // Luz ambiente padrão
  let lightLevel = ambientLight || 0.7;
  
  // Ciclo dia/noite
  if (typeof lighting !== 'undefined' && typeof lighting.timeOfDay !== 'undefined') {
    const dayNightMultiplier = Math.max(0.1, Math.sin(lighting.timeOfDay * Math.PI));
    lightLevel *= dayNightMultiplier;
  }
  
  // Lanterna do jogador
  if (typeof player !== 'undefined' && player.lanterna) {
    const playerWorldX = player.worldX || 0;
    const playerWorldY = player.worldY || 0;
    const dist = Math.sqrt((worldX - playerWorldX) ** 2 + (worldY - playerWorldY) ** 2);
    const maxDist = 100;
    if (dist < maxDist) {
      const flashlightStrength = Math.max(0, 1 - (dist / maxDist));
      lightLevel += flashlightStrength * 0.9;
    }
  }
  
  return Math.min(1, lightLevel);
}

// Renderizar um tile com efeito 3D
function renderTile3D(ctx, tile, x, y, lightLevel) {
  if (!tile) return;
  
  // Definir cores base para cada tipo de tile
  let baseColor = tile.color || '#7aab67';
  let topColor = lightenColor(baseColor, 20);
  let sideColor = darkenColor(baseColor, 20);
  
  // Altura do tile para efeito 3D (baseado na propriedade height do tile)
  const tileHeight = tile.height || 0;
  
  // Desenhar base do tile
  ctx.fillStyle = applyLighting(baseColor, lightLevel);
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // Se o tile tiver altura, desenhar efeito 3D
  if (tileHeight > 0) {
    // Topo
    ctx.fillStyle = applyLighting(topColor, lightLevel * 1.2);
    ctx.fillRect(x, y - tileHeight, TILE_SIZE, tileHeight);
    
    // Lado direito (sombra)
    ctx.fillStyle = applyLighting(sideColor, lightLevel * 0.7);
    ctx.fillRect(x + TILE_SIZE - 3, y - tileHeight, 3, tileHeight + TILE_SIZE);
  }
  
  // Adicionar detalhes específicos para tipos de tiles
  if (tile.type === 'water') {
    // Ondulação na água
    ctx.fillStyle = applyLighting(lightenColor(baseColor, 10), lightLevel * 1.1);
    const time = Date.now() * 0.003;
    const wave1 = Math.sin(time + x * 0.1) * 2;
    const wave2 = Math.cos(time + y * 0.1) * 2;
    ctx.fillRect(x + 2 + wave1, y + 2 + wave2, 4, 2);
    ctx.fillRect(x + 8 + wave2, y + 8 + wave1, 4, 2);
  } else if (tile.type === 'lava') {
    // Efeito de brilho para lava
    ctx.fillStyle = applyLighting('#FF4500', lightLevel * 0.5 + 0.5); // Lava brilha
    const time = Date.now() * 0.005;
    const bubble1 = Math.sin(time + x * 0.2) * 3;
    const bubble2 = Math.cos(time + y * 0.2) * 3;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE/2 + bubble1, y + TILE_SIZE/2 + bubble2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (tile.type === 'flower') {
    // Flores coloridas
    ctx.fillStyle = applyLighting('#FF69B4', lightLevel);
    ctx.fillRect(x + 6, y + 6, 4, 4);
    ctx.fillStyle = applyLighting('#FFD700', lightLevel);
    ctx.fillRect(x + 7, y + 7, 2, 2);
  } else if (tile.type === 'grass' && Math.random() < 0.3) {
    // Detalhe de grama alta
    ctx.fillStyle = applyLighting(lightenColor(baseColor, 15), lightLevel);
    ctx.fillRect(x + 3, y + 2, 1, 4);
    ctx.fillRect(x + 7, y + 3, 1, 3);
    ctx.fillRect(x + 12, y + 1, 1, 5);
  }
}

// Registrar funções no objeto global para acesso de outros scripts
window.GameSystem = window.GameSystem || { functions: {}, constants: {} };
window.GameSystem.functions = window.GameSystem.functions || {};
window.GameSystem.functions.renderTile3D = renderTile3D;
window.GameSystem.functions.calculateTileLighting = calculateTileLighting;
window.GameSystem.functions.applyLighting = applyLighting;
window.GameSystem.functions.getTile = getTile;
window.GameSystem.functions.lightenColor = lightenColor;
window.GameSystem.functions.darkenColor = darkenColor;
// --- Entity rendering helpers ---

// Render a world entity with simple pseudo-3D styling
function renderEntity(entity, screenX, screenY, lightLevel) {
  if (!entity || !window.GameSystem) return;
  const ctx = (window.bctx || window.base?.getContext?.('2d'));
  if (!ctx) return;

  const size = TILE_SIZE; // base footprint per tile
  switch (entity.type) {
    case 'tree':
      renderTree(ctx, screenX, screenY, lightLevel, entity.variant || 0);
      break;
    case 'pine':
      renderPineTree(ctx, screenX, screenY, lightLevel, entity.variant || 0);
      break;
    case 'cactus':
      renderCactus(ctx, screenX, screenY, lightLevel, entity.variant || 0);
      break;
    case 'rock':
      renderRock(ctx, screenX, screenY, lightLevel, entity.variant || 0);
      break;
    case 'flower':
    case 'snowplant':
    case 'deadbush':
      renderPlant(ctx, screenX, screenY, lightLevel, entity.type, entity.variant || 0);
      break;
    case 'structure':
      renderStructure(ctx, screenX, screenY, lightLevel, entity);
      break;
    default:
      // fallback as a colored box
      ctx.fillStyle = applyLighting('#888888', lightLevel);
      ctx.fillRect(screenX, screenY, size, size);
  }
}

// Ponte para compatibilidade com código que referencia helpers no escopo global
if (!window.getTile) window.getTile = getTile;
if (!window.calculateTileLighting) window.calculateTileLighting = calculateTileLighting;
if (!window.renderTile3D) window.renderTile3D = renderTile3D;
if (!window.applyLighting) window.applyLighting = applyLighting;
if (!window.lightenColor) window.lightenColor = lightenColor;
if (!window.darkenColor) window.darkenColor = darkenColor;


function renderTree(ctx, x, y, light, variant) {
  const trunkW = 3;
  const trunkH = 10;
  const crownH = 10 + (variant % 3) * 2;
  // trunk
  ctx.fillStyle = applyLighting('#8B4513', light);
  ctx.fillRect(x + (TILE_SIZE - trunkW) / 2, y + TILE_SIZE - trunkH, trunkW, trunkH);
  // crown (top volume)
  ctx.fillStyle = applyLighting('#228B22', light * 1.05);
  ctx.fillRect(x + 2, y + TILE_SIZE - trunkH - crownH, TILE_SIZE - 4, crownH);
  // side shadow
  ctx.fillStyle = applyLighting('#006400', light * 0.7);
  ctx.fillRect(x + TILE_SIZE - 3, y + TILE_SIZE - trunkH - crownH, 2, crownH + trunkH);
}

function renderPineTree(ctx, x, y, light, variant) {
  const height = 16 + (variant % 3) * 4;
  // trunk
  ctx.fillStyle = applyLighting('#8B5A2B', light);
  ctx.fillRect(x + TILE_SIZE / 2 - 1, y + TILE_SIZE - 6, 2, 6);
  // layered triangle foliage
  const levels = 3 + (variant % 2);
  for (let i = 0; i < levels; i++) {
    const levelWidth = TILE_SIZE - i * 4;
    const levelHeight = 5;
    const ly = y + TILE_SIZE - 6 - (i + 1) * levelHeight;
    const lx = x + (TILE_SIZE - levelWidth) / 2;
    ctx.fillStyle = applyLighting('#2E8B57', light * (1 - i * 0.05));
    ctx.fillRect(lx, ly, levelWidth, levelHeight);
  }
}

function renderCactus(ctx, x, y, light, variant) {
  const bodyW = 6;
  const bodyH = 14;
  // main body
  ctx.fillStyle = applyLighting('#2E8B57', light);
  ctx.fillRect(x + (TILE_SIZE - bodyW) / 2, y + TILE_SIZE - bodyH, bodyW, bodyH);
  // arms
  ctx.fillRect(x + 4, y + TILE_SIZE - 10, 2, 6);
  ctx.fillRect(x + TILE_SIZE - 6, y + TILE_SIZE - 12, 2, 6);
  // side shadow
  ctx.fillStyle = applyLighting('#1f5f3c', light * 0.7);
  ctx.fillRect(x + (TILE_SIZE + bodyW) / 2 - 1, y + TILE_SIZE - bodyH, 1, bodyH);
}

function renderRock(ctx, x, y, light, variant) {
  const h = 6 + (variant % 2) * 2;
  ctx.fillStyle = applyLighting('#7f7f7f', light);
  ctx.fillRect(x + 3, y + TILE_SIZE - h, TILE_SIZE - 6, h);
  // highlight
  ctx.fillStyle = applyLighting('#aaaaaa', light * 1.1);
  ctx.fillRect(x + 4, y + TILE_SIZE - h + 1, TILE_SIZE - 8, 2);
}

function renderPlant(ctx, x, y, light, kind, variant) {
  if (kind === 'deadbush') {
    ctx.fillStyle = applyLighting('#8B4513', light);
    ctx.fillRect(x + 7, y + TILE_SIZE - 6, 2, 6);
    ctx.fillRect(x + 5, y + TILE_SIZE - 8, 2, 4);
    ctx.fillRect(x + 9, y + TILE_SIZE - 8, 2, 4);
  } else if (kind === 'snowplant') {
    ctx.fillStyle = applyLighting('#e8f0f0', light);
    ctx.fillRect(x + 7, y + TILE_SIZE - 5, 2, 5);
    ctx.fillStyle = applyLighting('#b3e0e5', light);
    ctx.fillRect(x + 6, y + TILE_SIZE - 6, 4, 2);
  } else {
    // flower
    ctx.fillStyle = applyLighting('#2e7d32', light);
    ctx.fillRect(x + 7, y + TILE_SIZE - 5, 2, 5);
    const petals = ['#FF69B4', '#FFD700', '#ADFF2F', '#87CEFA'][variant % 4];
    ctx.fillStyle = applyLighting(petals, light);
    ctx.fillRect(x + 5, y + TILE_SIZE - 8, 6, 3);
  }
}

function renderStructure(ctx, x, y, light, entity) {
  const size = (entity.size || 2) * TILE_SIZE;
  const color = entity.color || '#8c8c8c';
  ctx.fillStyle = applyLighting(color, light);
  ctx.fillRect(x - TILE_SIZE / 2, y - TILE_SIZE / 2, size, size / 2);
  // simple depth
  ctx.fillStyle = applyLighting(darkenColor(color, 30), light * 0.8);
  ctx.fillRect(x - TILE_SIZE / 2 + size - 3, y - TILE_SIZE / 2, 3, size / 2);
}

// export entity renderers
window.GameSystem.functions.renderEntity = renderEntity;
window.GameSystem.functions.renderTree = renderTree;
window.GameSystem.functions.renderPineTree = renderPineTree;
window.GameSystem.functions.renderCactus = renderCactus;
window.GameSystem.functions.renderRock = renderRock;
window.GameSystem.functions.renderPlant = renderPlant;
window.GameSystem.functions.renderStructure = renderStructure;

console.log('Funções de renderização do mundo carregadas.');

})(window);
