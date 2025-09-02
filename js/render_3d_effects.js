// Sistema de renderização com efeitos 3D
// Adiciona perspectiva e profundidade ao mundo 2D pixelado
// Inspirado em "Enigma do Medo" com técnicas de 2.5D

(function(window) {
    // Constantes
    const TILE_SIZE = window.GameSystem?.constants?.TILE_SIZE || 16;
    const BASE_W = window.GameSystem?.constants?.BASE_W || 320;
    const BASE_H = window.GameSystem?.constants?.BASE_H || 180;
    
    // Sistema de layers para simular profundidade
    const layers = {
        background: 0,    // Céu, montanhas distantes
        farObjects: 1,    // Objetos distantes (prédios, árvores ao longe)
        midground: 2,     // Terreno principal
        objects: 3,       // Objetos de cenário
        characters: 4,    // Personagens e NPCs
        foreground: 5,    // Objetos em primeiro plano
        overlay: 6        // Efeitos de overlay (chuva, neblina)
    };
    
    // Cache de sprites com elevação
    const elevatedSprites = new Map();
    
    // Configurações de perspectiva
    let perspective = {
        enabled: true,
        vanishingPointY: BASE_H * 0.4,  // Ponto de fuga vertical
        skew: 0.15,                     // Distorção para simular perspectiva
        heightScale: 0.8                // Escala de altura dos objetos distantes
    };
    
    // Função para renderizar objetos com efeito de elevação
    function renderElevatedObject(ctx, sprite, x, y, width, height, elevation = 0) {
        if (!perspective.enabled || elevation <= 0) {
            // Renderização normal sem efeitos 3D
            ctx.drawImage(sprite, x, y, width, height);
            return;
        }
        
        // Chave para cache
        const cacheKey = `${sprite.src}_${width}_${height}_${elevation}`;
        
        // Verificar se já temos este sprite no cache
        if (!elevatedSprites.has(cacheKey)) {
            // Criar versão com sombra e elevação
            const elevatedCanvas = document.createElement('canvas');
            elevatedCanvas.width = width;
            elevatedCanvas.height = height + elevation;
            
            const elevCtx = elevatedCanvas.getContext('2d');
            
            // Desenhar sombra na base
            elevCtx.fillStyle = 'rgba(0,0,0,0.5)';
            elevCtx.beginPath();
            elevCtx.ellipse(width/2, height + elevation - 3, width/2.5, 4, 0, 0, Math.PI * 2);
            elevCtx.fill();
            
            // Desenhar face lateral (lado do objeto)
            elevCtx.fillStyle = darkenColor(getAverageColor(sprite), 50);
            elevCtx.fillRect(0, height, width, elevation);
            
            // Desenhar sprite principal no topo
            elevCtx.drawImage(sprite, 0, 0, width, height);
            
            // Armazenar no cache
            elevatedSprites.set(cacheKey, elevatedCanvas);
        }
        
        // Renderizar a versão em cache
        ctx.drawImage(elevatedSprites.get(cacheKey), x, y - elevation, width, height + elevation);
    }
    
    // Efeito de profundidade para objetos distantes
    function applyPerspective(x, y, z) {
        // z é a profundidade (0 = primeiro plano, 1 = horizonte)
        const scale = 1 - (z * perspective.heightScale);
        const yOffset = z * (perspective.vanishingPointY - y);
        
        return {
            x: x,
            y: y + yOffset,
            scale: scale
        };
    }
    
    // Efeito de paralaxe para camadas de fundo
    function renderParallaxLayer(ctx, layer, scrollSpeed, callback) {
        // Preservar contexto
        ctx.save();
        
        // Ajustar posição baseado na câmera e velocidade de paralaxe
        const offsetX = -(camera.x * scrollSpeed) % BASE_W;
        const offsetY = -(camera.y * scrollSpeed * 0.5) % BASE_H;
        
        ctx.translate(offsetX, offsetY);
        
        // Renderizar camada (chamada de callback)
        callback(ctx);
        
        // Repetir para cobrir tela inteira
        ctx.translate(BASE_W, 0);
        callback(ctx);
        ctx.translate(-BASE_W, BASE_H);
        callback(ctx);
        ctx.translate(BASE_W, 0);
        callback(ctx);
        
        // Restaurar contexto
        ctx.restore();
    }
    
    // Obter cor média de uma imagem (para uso em sombras e iluminação)
    function getAverageColor(image) {
        // Criar canvas temporário
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        
        // Reduzir imagem para 1x1 pixel para obter média
        ctx.drawImage(image, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        
        // Retornar cor média como string hex
        return `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`;
    }
    
    // Escurecer cor (mesma função do world_render_funcs.js)
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
    
    // Exportar funções para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.render3D = {
        renderElevatedObject,
        applyPerspective,
        renderParallaxLayer,
        layers,
        setPerspective: function(settings) {
            perspective = { ...perspective, ...settings };
        }
    };
    
})(window);
