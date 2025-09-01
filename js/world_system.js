// Sistema de mundo procedural infinito estilo Minecraft
// Este arquivo contém as funções de geração de mundo
(function(window){

// Acessar constantes globais (escopo local para evitar conflitos de const globais)
const WORLD_CHUNK_SIZE = window.GameSystem?.constants?.WORLD_CHUNK_SIZE || 16;
const VISIBLE_CHUNKS_RADIUS = window.GameSystem?.constants?.VISIBLE_CHUNKS_RADIUS || 2;
const WORLD_SEED = window.GameSystem?.constants?.WORLD_SEED || (Math.random() * 10000 | 0);
const TILE_SIZE = window.GameSystem?.constants?.TILE_SIZE || 16;

// Map de chunks global (usar referência da window para compartilhar com o jogo)
const worldChunks = window.worldChunks || (window.worldChunks = new Map());

console.log("Sistema de Mundo carregado. Seed:", WORLD_SEED);

// Função principal para gerar um chunk do mundo
function generateChunk(chunkX, chunkY) {
  try {
    console.log(`Gerando chunk em ${chunkX}, ${chunkY}`);
    
    // Determinar o bioma do chunk baseado na posição
    const biome = determineBiome(chunkX, chunkY);
    console.log(`Bioma para chunk ${chunkX},${chunkY}: ${biome}`);
    
    // Criar estrutura do chunk
    const chunk = {
      x: chunkX,
      y: chunkY,
      biome: biome,
      tiles: [],
      entities: []
    };
  
  // Gerar altura do terreno e umidade para todo o chunk
  const heightMap = generateHeightMap(chunkX, chunkY);
  const moistureMap = generateMoistureMap(chunkX, chunkY);
  
  // Gerar tiles para o chunk
  for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
    chunk.tiles[y] = [];
    for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
      // Criar tile baseado no terreno e bioma
      chunk.tiles[y][x] = generateTileFromTerrain(
        heightMap[y][x], 
        moistureMap[y][x], 
        biome
      );
      
      // Salvar as coordenadas globais para o tile
      chunk.tiles[y][x].worldX = chunkX * WORLD_CHUNK_SIZE + x;
      chunk.tiles[y][x].worldY = chunkY * WORLD_CHUNK_SIZE + y;
    }
  }
  
  // Gerar entidades do chunk (árvores, pedras, etc)
  generateEntitiesForChunk(chunk, biome);
  
  console.log(`Chunk ${chunkX},${chunkY} gerado com sucesso.`);
  return chunk;
  
  } catch (error) {
    console.error(`ERRO ao gerar chunk ${chunkX},${chunkY}:`, error);
    // Retornar um chunk vazio em caso de erro
    return {
      x: chunkX,
      y: chunkY,
      biome: 'plains',
      tiles: Array(WORLD_CHUNK_SIZE).fill().map(() => Array(WORLD_CHUNK_SIZE).fill({
        type: 'grass',
        walkable: true,
        color: '#7aab67',
        elevation: 0
      })),
      entities: []
    };
  }
}

// (exports moved to end of file)

// Gerar tipo de tile baseado no terreno e bioma
function generateTileFromTerrain(terrainValue, moisture, biome) {
  // Configurar propriedades do tile
  let tile = {
    type: 'grass',
    walkable: true,
    color: '#4d8a3d',
    elevation: Math.floor(terrainValue * 10),
    hasTree: false,
    hasRock: false,
    variant: Math.floor(Math.random() * 3)
  };
  
  // Determinar tipo de tile baseado no bioma e valores do terreno
  switch (biome) {
    case 'desert':
      tile.type = 'sand';
      tile.color = '#dbd28e';
      if (terrainValue > 0.7) {
        tile.type = 'dune';
        tile.color = '#d6c97b';
        tile.elevation += 2;
      }
      break;
      
    case 'plains':
      tile.type = 'grass';
      tile.color = '#7aab67';
      if (moisture > 0.7) {
        tile.type = 'flower';
        tile.color = '#8ab979';
      }
      break;
      
    case 'forest':
      tile.type = 'grass';
      tile.color = '#4d8a3d';
      tile.hasTree = (Math.random() < 0.3);
      if (tile.hasTree) {
        tile.walkable = false;
      }
      break;
      
    case 'mountains':
      if (terrainValue > 0.6) {
        tile.type = 'mountain';
        tile.color = '#6b6b6b';
        tile.walkable = false;
        tile.elevation += 5;
      } else {
        tile.type = 'stone';
        tile.color = '#8e8e8e';
      }
      break;
      
    case 'snowlands':
      tile.type = 'snow';
      tile.color = '#e8f0f0';
      if (terrainValue > 0.7) {
        tile.type = 'ice';
        tile.color = '#b3e0e5';
      }
      break;
  }
  
  // Adicionar água quando moisture é muito alta
  if (moisture > 0.85 && terrainValue < 0.4) {
    tile.type = 'water';
    tile.color = '#266691';
    tile.walkable = false;
    tile.elevation = 0;
  }
  
  return tile;
}

// Determinar o bioma baseado na posição do chunk
function determineBiome(chunkX, chunkY) {
  // Usar ruído para criar grandes áreas contínuas de biomas
  const biomeNoise = simplex2(chunkX * 0.05, chunkY * 0.05);
  const temperatureNoise = simplex2(chunkX * 0.03 + 500, chunkY * 0.03 + 500);
  
  // Usar a temperatura e biomeNoise para determinar o bioma
  if (temperatureNoise > 0.5) {
    // Regiões quentes
    if (biomeNoise < -0.3) {
      return 'desert';
    } else {
      return 'plains';
    }
  } else if (temperatureNoise > 0) {
    // Regiões temperadas
    if (biomeNoise > 0.2) {
      return 'forest';
    } else {
      return 'plains';
    }
  } else if (temperatureNoise > -0.5) {
    // Regiões frias
    if (biomeNoise > 0.1) {
      return 'mountains';
    } else {
      return 'plains';
    }
  } else {
    // Regiões congeladas
    return 'snowlands';
  }
}

// Gerar entidades para o chunk (árvores, pedras, etc)
function generateEntitiesForChunk(chunk, biome) {
  const entities = [];
  
  // Iterar por cada tile no chunk
  for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
    for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
      const tile = chunk.tiles[y][x];
      
      // Verificar se pode gerar entidades neste tile
      if (!tile.walkable) continue;
      
      // Chance de gerar entidades baseada no bioma
      let treeChance = 0, rockChance = 0, plantChance = 0;
      
      switch (biome) {
        case 'forest':
          treeChance = 0.15;
          rockChance = 0.03;
          plantChance = 0.08;
          break;
          
        case 'plains':
          treeChance = 0.03;
          rockChance = 0.02;
          plantChance = 0.1;
          break;
          
        case 'desert':
          treeChance = 0.01; // Cactos
          rockChance = 0.08;
          plantChance = 0.02;
          break;
          
        case 'mountains':
          treeChance = 0.05;
          rockChance = 0.2;
          plantChance = 0.03;
          break;
          
        case 'snowlands':
          treeChance = 0.07;
          rockChance = 0.06;
          plantChance = 0.01;
          break;
      }
      
      // Adicionar árvore
      if (Math.random() < treeChance) {
        entities.push({
          type: biome === 'desert' ? 'cactus' : 
                biome === 'snowlands' ? 'pine' : 'tree',
          x: x,
          y: y,
          worldX: chunk.x * WORLD_CHUNK_SIZE + x,
          worldY: chunk.y * WORLD_CHUNK_SIZE + y,
          walkable: false,
          variant: Math.floor(Math.random() * 3)
        });
        continue; // Não adicionar outras entidades aqui
      }
      
      // Adicionar rocha
      if (Math.random() < rockChance) {
        entities.push({
          type: 'rock',
          x: x,
          y: y,
          worldX: chunk.x * WORLD_CHUNK_SIZE + x,
          worldY: chunk.y * WORLD_CHUNK_SIZE + y,
          walkable: false,
          variant: Math.floor(Math.random() * 2)
        });
        continue;
      }
      
      // Adicionar planta/flor
      if (Math.random() < plantChance) {
        entities.push({
          type: biome === 'desert' ? 'deadbush' : 
                biome === 'snowlands' ? 'snowplant' : 'flower',
          x: x,
          y: y,
          worldX: chunk.x * WORLD_CHUNK_SIZE + x,
          worldY: chunk.y * WORLD_CHUNK_SIZE + y,
          walkable: true,
          variant: Math.floor(Math.random() * 4)
        });
      }
    }
  }
  
  chunk.entities = entities;
}

// Função de ruído Simplex para geração de terreno
// Implementação simplificada do algoritmo de ruído Simplex
function simplex2(x, y) {
  // Gerar número pseudoaleatório baseado na seed e coordenadas
  const n = (WORLD_SEED + x * 1301 + y * 2707) % 1000 / 1000;
  
  // Misturar alguns ruídos para tornar o terreno mais interessante
  const noise1 = Math.sin(x * 0.1 + n) * Math.cos(y * 0.1 + n * 2);
  const noise2 = Math.sin(x * 0.2 + y * 0.3 + n * 3) * 0.5;
  const noise3 = Math.cos(x * 0.05 - y * 0.07 + n * 4) * 0.25;
  
  return (noise1 + noise2 + noise3) / 1.75;
}

// Gerar mapa de altura para o chunk
function generateHeightMap(chunkX, chunkY) {
  const heightMap = [];
  
  for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
    heightMap[y] = [];
    for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
      // Coordenadas globais do tile
      const worldX = chunkX * WORLD_CHUNK_SIZE + x;
      const worldY = chunkY * WORLD_CHUNK_SIZE + y;
      
      // Diferentes escalas de ruído para criar terreno mais variado
      const largeScale = simplex2(worldX * 0.05, worldY * 0.05);
      const mediumScale = simplex2(worldX * 0.1, worldY * 0.1) * 0.5;
      const smallScale = simplex2(worldX * 0.2, worldY * 0.2) * 0.25;
      
      // Combinar escalas
      let height = (largeScale + mediumScale + smallScale) * 0.5 + 0.5;
      
      // Garantir que o valor esteja entre 0 e 1
      height = Math.max(0, Math.min(1, height));
      
      heightMap[y][x] = height;
    }
  }
  
  return heightMap;
}

// Gerar mapa de umidade para o chunk
function generateMoistureMap(chunkX, chunkY) {
  const moistureMap = [];
  
  for (let y = 0; y < WORLD_CHUNK_SIZE; y++) {
    moistureMap[y] = [];
    for (let x = 0; x < WORLD_CHUNK_SIZE; x++) {
      // Coordenadas globais do tile
      const worldX = chunkX * WORLD_CHUNK_SIZE + x;
      const worldY = chunkY * WORLD_CHUNK_SIZE + y;
      
      // Offset diferente para descorrelacionar da altura
      const moisture = simplex2(worldX * 0.08 + 500, worldY * 0.08 + 500);
      
      // Normalizar para o range 0-1
      moistureMap[y][x] = (moisture + 1) * 0.5;
    }
  }
  
  return moistureMap;
}

// Função para gerar chunks ao redor do jogador
function generateChunksAroundPlayer() {
  // Verificar se o player existe
  const player = window.player || window.GameSystem?.state?.player;
  
  if (!player) {
    console.error("Player não encontrado para gerar chunks!");
    return;
  }
  
  // Determinar o chunk atual do jogador
  const playerChunkX = Math.floor(player.worldX / (WORLD_CHUNK_SIZE * TILE_SIZE));
  const playerChunkY = Math.floor(player.worldY / (WORLD_CHUNK_SIZE * TILE_SIZE));
  
  console.log(`Gerando chunks ao redor do jogador em chunk (${playerChunkX}, ${playerChunkY})`);
  
  // Gerar chunks em um raio ao redor do jogador
  for (let cy = playerChunkY - VISIBLE_CHUNKS_RADIUS; cy <= playerChunkY + VISIBLE_CHUNKS_RADIUS; cy++) {
    for (let cx = playerChunkX - VISIBLE_CHUNKS_RADIUS; cx <= playerChunkX + VISIBLE_CHUNKS_RADIUS; cx++) {
      const chunkKey = `${cx},${cy}`;
      
      // Verificar se o chunk já existe
      if (!worldChunks.has(chunkKey)) {
        worldChunks.set(chunkKey, generateChunk(cx, cy));
      }
    }
  }
  
  console.log(`Chunks gerados ao redor do jogador. Total de chunks: ${worldChunks.size}`);
}

// Adicionar entidades ao chunk (árvores, pedras, etc.)
function generateEntitiesForChunk(chunk) {
  const biome = chunk.biome;
  const chunkWorldX = chunk.x * WORLD_CHUNK_SIZE;
  const chunkWorldY = chunk.y * WORLD_CHUNK_SIZE;
  
  // Quantidade de entidades baseada no bioma
  let treeCount = 0;
  let rockCount = 0;
  let specialCount = 0;
  
  switch (biome) {
    case 'desert':
      treeCount = 1; // Cactus raros
      rockCount = 5;
      break;
    case 'plains':
      treeCount = 3;
      rockCount = 2;
      break;
    case 'forest':
      treeCount = 15; // Muitas árvores
      rockCount = 3;
      break;
    case 'mountains':
      treeCount = 2;
      rockCount = 8; // Muitas pedras
      break;
    case 'snowlands':
      treeCount = 4;
      rockCount = 5;
      break;
  }
  
  // Adicionar árvores
  for (let i = 0; i < treeCount; i++) {
    const x = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
    const y = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
    
    // Verificar se o tile pode ter uma árvore
    if (chunk.tiles[y] && chunk.tiles[y][x] && chunk.tiles[y][x].walkable) {
      chunk.entities.push({
        type: biome === 'desert' ? 'cactus' : 'tree',
        x: x,
        y: y,
        worldX: chunkWorldX + x,
        worldY: chunkWorldY + y,
        variant: Math.floor(Math.random() * 3)
      });
      
      // Marcar o tile como não atravessável
      chunk.tiles[y][x].walkable = false;
    }
  }
  
  // Adicionar pedras
  for (let i = 0; i < rockCount; i++) {
    const x = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
    const y = Math.floor(Math.random() * WORLD_CHUNK_SIZE);
    
    if (chunk.tiles[y] && chunk.tiles[y][x] && chunk.tiles[y][x].walkable) {
      chunk.entities.push({
        type: 'rock',
        x: x,
        y: y,
        worldX: chunkWorldX + x,
        worldY: chunkWorldY + y,
        variant: Math.floor(Math.random() * 2)
      });
      
      // Pedras pequenas são atravessáveis
      if (Math.random() > 0.3) {
        chunk.tiles[y][x].walkable = false;
      }
    }
  }
  
  // Chance de gerar estruturas especiais
  if (Math.random() < 0.05) {
    generateSpecialStructure(chunk);
  }
}

// Gera estruturas especiais como templos, ruínas, etc.
function generateSpecialStructure(chunk) {
  const structureX = Math.floor(Math.random() * (WORLD_CHUNK_SIZE - 4)) + 2;
  const structureY = Math.floor(Math.random() * (WORLD_CHUNK_SIZE - 4)) + 2;
  
  // Tipos de estruturas
  const structures = [
    { type: 'ruins', color: '#8c8c8c' },
    { type: 'temple', color: '#d4bc7a' },
    { type: 'camp', color: '#964b00' },
    { type: 'grave', color: '#666666' }
  ];
  
  const structure = structures[Math.floor(Math.random() * structures.length)];
  
  // Adicionar a estrutura como entidade especial
  chunk.entities.push({
    type: 'structure',
    structureType: structure.type,
    x: structureX,
    y: structureY,
    worldX: chunk.x * WORLD_CHUNK_SIZE + structureX,
    worldY: chunk.y * WORLD_CHUNK_SIZE + structureY,
    color: structure.color,
    size: 2 + Math.floor(Math.random() * 3)
  });
  
  // Marcar os tiles como não atravessáveis
  for (let sy = -1; sy <= 1; sy++) {
    for (let sx = -1; sx <= 1; sx++) {
      const tx = structureX + sx;
      const ty = structureY + sy;
      
      if (chunk.tiles[ty] && chunk.tiles[ty][tx]) {
        chunk.tiles[ty][tx].walkable = false;
        chunk.tiles[ty][tx].isStructure = true;
        chunk.tiles[ty][tx].structureType = structure.type;
      }
    }
  }
  
  console.log(`Estrutura especial '${structure.type}' gerada no chunk [${chunk.x}, ${chunk.y}]`);
}

// Expor funções principais no escopo global (somente se ainda não estiverem definidas)
window.generateChunk = window.generateChunk || generateChunk;
window.generateTileFromTerrain = window.generateTileFromTerrain || generateTileFromTerrain;
window.generateChunksAroundPlayer = window.generateChunksAroundPlayer || generateChunksAroundPlayer;
window.determineBiome = window.determineBiome || determineBiome;
window.generateMoistureMap = window.generateMoistureMap || generateMoistureMap;
window.generateHeightMap = window.generateHeightMap || generateHeightMap;

})(window);
