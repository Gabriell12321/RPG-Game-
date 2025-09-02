// Sistema de iluminação avançado
// Adiciona iluminação dinâmica, sombras, e efeitos atmosféricos

(function(window) {
    // Constantes
    const BASE_W = window.GameSystem?.constants?.BASE_W || 320;
    const BASE_H = window.GameSystem?.constants?.BASE_H || 180;
    
    // Sistema de luzes
    const lights = [];
    
    // Canvas para efeitos de iluminação
    let lightCanvas = null;
    let lightCtx = null;
    
    // Configurações de iluminação global
    const config = {
        ambientLight: 0.3,         // Luz ambiente (0-1)
        shadowIntensity: 0.7,      // Intensidade das sombras (reduzido para 0.7)
        lightFalloff: 1.3,         // Quão rápido a luz diminui com a distância (reduzido para 1.3)
        useColoredLights: true,    // Usar luzes coloridas
        enableShadows: true,       // Habilitar sombras dinâmicas
        fogEnabled: true,          // Habilitar efeito de névoa
        fogDensity: 0.04,          // Densidade da névoa (reduzido para 0.04)
        fogColor: '#111130'        // Cor da névoa (um pouco mais azulada)
    };
    
    // Inicializar sistema de iluminação
    function init() {
        // Criar canvas para iluminação
        lightCanvas = document.createElement('canvas');
        lightCanvas.width = BASE_W;
        lightCanvas.height = BASE_H;
        lightCtx = lightCanvas.getContext('2d');
        
        // Adicionar luz do jogador (lanterna)
        addLight({
            x: BASE_W / 2,
            y: BASE_H / 2,
            radius: 80,
            color: '#ffffcc',
            intensity: 0.8,
            flicker: true,
            isPlayerLight: true
        });
    }
    
    // Adicionar uma fonte de luz
    function addLight(lightConfig) {
        const light = {
            x: lightConfig.x || 0,
            y: lightConfig.y || 0,
            radius: lightConfig.radius || 50,
            color: lightConfig.color || '#ffffff',
            intensity: lightConfig.intensity || 1.0,
            flicker: lightConfig.flicker || false,
            flickerAmount: lightConfig.flickerAmount || 0.1,
            castShadows: lightConfig.castShadows || false,
            isPlayerLight: lightConfig.isPlayerLight || false,
            active: true,
            id: 'light_' + Date.now() + '_' + lights.length
        };
        
        lights.push(light);
        return light.id;
    }
    
    // Remover luz pelo ID
    function removeLight(id) {
        const index = lights.findIndex(light => light.id === id);
        if (index !== -1) {
            lights.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Atualizar posição da luz do jogador
    function updatePlayerLight() {
        const playerLight = lights.find(light => light.isPlayerLight);
        if (playerLight && window.player) {
            playerLight.x = window.player.x;
            playerLight.y = window.player.y;
            
            // Ajustar posição para direção do jogador (lanterna)
            if (window.player.lanterna && window.player.direction !== undefined) {
                const offsetX = [0, 20, 0, -20][window.player.direction];
                const offsetY = [-20, 0, 20, 0][window.player.direction];
                
                playerLight.x += offsetX;
                playerLight.y += offsetY;
                playerLight.radius = 120; // Aumentar raio quando é lanterna
            } else {
                playerLight.radius = 60; // Raio normal quando não é lanterna
            }
        }
    }
    
    // Renderizar iluminação
    function render(ctx) {
        // Limpar canvas de luz
        lightCtx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Atualizar luz do jogador
        updatePlayerLight();
        
        // Definir modo de composição para acumular luz
        lightCtx.globalCompositeOperation = 'lighter';
        
        // Luz ambiente (base)
        const ambientBrightness = Math.floor(config.ambientLight * 255);
        lightCtx.fillStyle = `rgb(${ambientBrightness}, ${ambientBrightness}, ${ambientBrightness})`;
        lightCtx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Adicionar todas as luzes
        for (const light of lights) {
            if (!light.active) continue;
            
            // Calcular intensidade com flicker
            let intensity = light.intensity;
            if (light.flicker) {
                intensity *= 1 - (light.flickerAmount * Math.random());
            }
            
            // Criar gradiente radial para a luz
            const gradient = lightCtx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            
            // Cor da luz com intensidade
            const color = parseColor(light.color);
            const r = Math.floor(color.r * intensity);
            const g = Math.floor(color.g * intensity);
            const b = Math.floor(color.b * intensity);
            
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            // Desenhar luz
            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            lightCtx.fill();
            
            // Renderizar sombras se habilitado
            if (config.enableShadows && light.castShadows) {
                renderShadows(light);
            }
        }
        
        // Aplicar efeito de névoa se habilitado
        if (config.fogEnabled) {
            applyFogEffect();
        }
        
        // Aplicar iluminação à cena principal
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lightCanvas, 0, 0, BASE_W, BASE_H);
        ctx.restore();
    }
    
    // Renderizar sombras projetadas
    function renderShadows(light) {
        // Implementação simplificada de sombras
        // Para cada objeto que projeta sombra, calcular e desenhar a sombra
        
        // Nesta versão, apenas simular sombras para demonstração
        lightCtx.save();
        lightCtx.globalCompositeOperation = 'destination-out';
        
        // Recuperar obstáculos do mundo atual
        const obstacles = window.worldObstacles || [];
        
        for (const obstacle of obstacles) {
            // Calcular vetor da luz ao obstáculo
            const dx = obstacle.x - light.x;
            const dy = obstacle.y - light.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Ignorar obstáculos muito distantes
            if (distance > light.radius * 1.5) continue;
            
            // Normalizar vetor
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Projetar sombra
            const shadowLength = light.radius * 0.5;
            const shadowX = obstacle.x + nx * shadowLength;
            const shadowY = obstacle.y + ny * shadowLength;
            
            // Desenhar sombra como um gradiente
            const gradient = lightCtx.createLinearGradient(
                obstacle.x, obstacle.y,
                shadowX, shadowY
            );
            
            gradient.addColorStop(0, 'rgba(0, 0, 0, ' + config.shadowIntensity + ')');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            lightCtx.fillStyle = gradient;
            
            // Desenhar a forma da sombra
            lightCtx.beginPath();
            lightCtx.moveTo(obstacle.x - ny * obstacle.width/2, obstacle.y + nx * obstacle.width/2);
            lightCtx.lineTo(obstacle.x + ny * obstacle.width/2, obstacle.y - nx * obstacle.width/2);
            lightCtx.lineTo(shadowX + ny * obstacle.width, shadowY - nx * obstacle.width);
            lightCtx.lineTo(shadowX - ny * obstacle.width, shadowY + nx * obstacle.width);
            lightCtx.closePath();
            lightCtx.fill();
        }
        
        lightCtx.restore();
    }
    
    // Aplicar efeito de névoa
    function applyFogEffect() {
        const fogColor = parseColor(config.fogColor);
        
        // Criar gradiente para névoa mais densa nas bordas
        const gradientX = lightCtx.createLinearGradient(0, 0, BASE_W, 0);
        gradientX.addColorStop(0, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity * 2})`);
        gradientX.addColorStop(0.5, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity})`);
        gradientX.addColorStop(1, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity * 2})`);
        
        lightCtx.save();
        lightCtx.globalCompositeOperation = 'source-atop';
        lightCtx.fillStyle = gradientX;
        lightCtx.fillRect(0, 0, BASE_W, BASE_H);
        
        const gradientY = lightCtx.createLinearGradient(0, 0, 0, BASE_H);
        gradientY.addColorStop(0, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity * 1.5})`);
        gradientY.addColorStop(0.5, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity * 0.8})`);
        gradientY.addColorStop(1, `rgba(${fogColor.r}, ${fogColor.g}, ${fogColor.b}, ${config.fogDensity * 2})`);
        
        lightCtx.fillStyle = gradientY;
        lightCtx.fillRect(0, 0, BASE_W, BASE_H);
        lightCtx.restore();
    }
    
    // Converter string de cor para objeto {r,g,b}
    function parseColor(color) {
        // Cor padrão se não puder ser parseada
        const defaultColor = {r: 255, g: 255, b: 255};
        
        if (!color) return defaultColor;
        
        // Formato hex #RRGGBB
        if (color.startsWith('#') && color.length === 7) {
            return {
                r: parseInt(color.slice(1, 3), 16),
                g: parseInt(color.slice(3, 5), 16),
                b: parseInt(color.slice(5, 7), 16)
            };
        }
        
        // Formato rgb(r,g,b)
        const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }
        
        return defaultColor;
    }
    
    // Configurar sistema
    function configure(newConfig) {
        Object.assign(config, newConfig);
    }
    
    // Exportar funções para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.lighting = {
        init,
        render,
        addLight,
        removeLight,
        configure,
        getLights: () => [...lights],
        getConfig: () => ({...config})
    };
    
})(window);
