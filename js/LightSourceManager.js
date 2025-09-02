// LightSourceManager.js - Sistema de gerenciamento de fontes de luz
// Detecta e gerencia diferentes fontes de luz no ambiente, como fogueiras, tochas, etc.

window.LightSourceManager = (function() {
    // Lista de fontes de luz no ambiente
    const lightSources = [];
    
    // Configurações
    const config = {
        detectionRadius: 200,      // Raio de detecção para fontes de luz
        updateInterval: 5,         // Intervalo de atualização em frames
        lightTypes: {
            fogueira: {
                radius: 100,        // Raio da luz
                color: '#FF9933',   // Cor laranja/amarelada
                intensity: 0.8,     // Intensidade
                flicker: true,      // Piscar/tremular
                flickerAmount: 0.2, // Quantidade de tremulação
                height: 20,         // Altura (para sombras)
                ambient: 0.4        // Contribuição para luz ambiente
            },
            tocha: {
                radius: 60,
                color: '#FFCC66',
                intensity: 0.7,
                flicker: true,
                flickerAmount: 0.3,
                height: 15,
                ambient: 0.2
            },
            lamparina: {
                radius: 40,
                color: '#FFFFCC',
                intensity: 0.5,
                flicker: true,
                flickerAmount: 0.1,
                height: 5,
                ambient: 0.1
            },
            lampada: {
                radius: 80,
                color: '#FFFFFF',
                intensity: 0.7,
                flicker: false,
                flickerAmount: 0,
                height: 10,
                ambient: 0.3
            },
            janela: {
                radius: 70,
                color: '#BBDDFF',
                intensity: 0.6,
                flicker: false,
                flickerAmount: 0,
                height: 15,
                ambient: 0.25
            },
            // Luzes para os inimigos
            sombra: {
                radius: 30,
                color: '#6600CC',
                intensity: 0.4,
                flicker: true,
                flickerAmount: 0.3,
                height: 5,
                ambient: 0.05
            },
            fantasma: {
                radius: 40,
                color: '#66CCFF',
                intensity: 0.5,
                flicker: true,
                flickerAmount: 0.2,
                height: 5,
                ambient: 0.1
            }
        }
    };
    
    // Contadores e estado
    let frameCount = 0;
    let ambientLightLevel = 0.2; // Nível de luz ambiente base
    
    // Padrões para detecção de objetos que emitem luz
    const lightPatterns = {
        fogueira: [
            { type: 'color', color: '#FF6600', threshold: 0.8 },
            { type: 'color', color: '#FFCC00', threshold: 0.7 },
            { type: 'shape', width: 10, height: 15, minArea: 80 }
        ],
        tocha: [
            { type: 'color', color: '#FFAA33', threshold: 0.75 },
            { type: 'shape', width: 6, height: 12, minArea: 40 }
        ],
        lamparina: [
            { type: 'color', color: '#FFFFCC', threshold: 0.7 },
            { type: 'shape', width: 8, height: 8, minArea: 30 }
        ]
    };
    
    // Inicialização
    function init() {
        console.log("Sistema de gerenciamento de fontes de luz inicializado");
    }
    
    // Detectar fontes de luz no ambiente
    // Nota: Esta é uma versão simplificada que detecta objetos específicos pelo nome/sprite
    function detectLightSources(ctx, objects) {
        // Limpar fontes de luz antigas que não existem mais
        clearInvalidLightSources(objects);
        
        // Processar apenas a cada N frames para economia de performance
        if (frameCount % config.updateInterval !== 0) {
            frameCount++;
            return;
        }
        
        frameCount++;
        
        // Se temos objetos para analisar
        if (objects && Array.isArray(objects) && objects.length) {
            objects.forEach(obj => {
                // Verificar se o objeto já está registrado como fonte de luz
                const existingLightIndex = lightSources.findIndex(light => 
                    light.objectId === (obj.id || obj.nome)
                );
                
                // Se já existe, pular
                if (existingLightIndex >= 0) return;
                
                // Detectar por nome do objeto/sprite
                let lightType = null;
                
                // Verificação simplificada por nome ou tipo
                const objName = obj.nome?.toLowerCase() || obj.tipo?.toLowerCase() || '';
                
                if (objName.includes('fogueira') || objName.includes('fogo') || objName.includes('fire')) {
                    lightType = 'fogueira';
                } else if (objName.includes('tocha') || objName.includes('torch')) {
                    lightType = 'tocha';
                } else if (objName.includes('lamparina') || objName.includes('lantern')) {
                    lightType = 'lamparina';
                } else if (objName.includes('lampada') || objName.includes('lamp')) {
                    lightType = 'lampada';
                } else if (objName.includes('janela') || objName.includes('window')) {
                    lightType = 'janela';
                } else if (obj.tipo === 'sombra' || obj.tipo === 'fantasma') {
                    // Adicionar efeito de luz fraca para inimigos
                    lightType = 'sombra';
                }
                
                // Se foi identificado como fonte de luz, adicionar à lista
                if (lightType) {
                    const lightConfig = config.lightTypes[lightType] || {
                        radius: 40,
                        color: '#6666FF',
                        intensity: 0.3,
                        flicker: true,
                        flickerAmount: 0.2,
                        ambient: 0.1
                    };
                    
                    addLightSource({
                        x: obj.x || obj.posicao?.x,
                        y: obj.y || obj.posicao?.y,
                        type: lightType,
                        objectId: obj.id || obj.nome,
                        radius: lightConfig.radius,
                        color: lightConfig.color,
                        intensity: lightConfig.intensity,
                        flicker: lightConfig.flicker,
                        flickerAmount: lightConfig.flickerAmount,
                        ambient: lightConfig.ambient
                    });
                }
            });
        }
        
        // Atualizar o nível de luz ambiente baseado nas fontes de luz
        updateAmbientLight();
    }
    
    // Adicionar uma fonte de luz
    function addLightSource(lightSource) {
        // Verificar se já existe uma fonte de luz para este objeto
        const existingIndex = lightSources.findIndex(light => 
            light.objectId === lightSource.objectId
        );
        
        if (existingIndex >= 0) {
            // Atualizar propriedades da luz existente
            lightSources[existingIndex] = {
                ...lightSources[existingIndex],
                ...lightSource
            };
        } else {
            // Adicionar nova fonte de luz
            lightSource.id = 'light_' + Date.now() + '_' + lightSources.length;
            lightSource.active = true;
            lightSource.flickerOffset = Math.random() * 1000; // Offset para que luzes não pisquem sincronizadas
            
            lightSources.push(lightSource);
        }
    }
    
    // Limpar fontes de luz inválidas (objetos que não existem mais)
    function clearInvalidLightSources(currentObjects) {
        if (!currentObjects || !Array.isArray(currentObjects)) return;
        
        // Criar um mapa de IDs de objetos para verificação rápida
        const objectIds = new Set(currentObjects.map(obj => obj.id || obj.nome));
        
        // Filtrar apenas luzes associadas a objetos que ainda existem
        for (let i = lightSources.length - 1; i >= 0; i--) {
            const light = lightSources[i];
            if (light.objectId && !objectIds.has(light.objectId)) {
                lightSources.splice(i, 1);
            }
        }
    }
    
    // Atualizar o nível de luz ambiente com base nas fontes de luz ativas
    function updateAmbientLight() {
        // Começar com o nível base
        let newAmbientLevel = 0.2;
        
        // Cada fonte de luz contribui para o nível ambiente global
        lightSources.forEach(light => {
            if (light.active) {
                newAmbientLevel += light.ambient || 0;
            }
        });
        
        // Limitar o valor máximo
        ambientLightLevel = Math.min(0.8, newAmbientLevel);
        
        // Se temos o sistema de lanterna, atualizar a intensidade da escuridão
        if (window.LanternaSystem) {
            // Inverter o valor - quanto maior a luz ambiente, menor a escuridão
            const escuridao = Math.max(0.1, 1 - ambientLightLevel);
            window.LanternaSystem.setEscuridao(escuridao);
        }
    }
    
    // Atualizar as fontes de luz (tremulação, etc)
    function update(deltaTime) {
        const time = Date.now() / 1000;
        
        lightSources.forEach(light => {
            if (light.active && light.flicker) {
                // Calcular intensidade com tremulação
                const flickerSpeed = 2 + Math.random();
                const flickerAmount = light.flickerAmount || 0.1;
                
                // Usar offset diferente para cada luz
                const flickerTime = time + (light.flickerOffset || 0);
                
                // Tremulação com componentes de frequência diferentes para mais naturalidade
                light.currentIntensity = light.intensity * (
                    1 + 
                    flickerAmount * Math.sin(flickerTime * flickerSpeed) * 0.5 +
                    flickerAmount * Math.sin(flickerTime * flickerSpeed * 2.5) * 0.3 +
                    flickerAmount * Math.random() * 0.2
                );
            } else {
                light.currentIntensity = light.intensity;
            }
        });
    }
    
    // Renderizar as luzes das fontes
    function render(ctx, playerX, playerY) {
        // Se não há contexto ou fontes de luz, não há o que renderizar
        if (!ctx || lightSources.length === 0) return;
        
        // Para cada fonte de luz
        lightSources.forEach(light => {
            if (!light.active) return;
            
            // Obter posição
            const x = light.x;
            const y = light.y;
            
            // Verificar distância do jogador (para otimização)
            const dx = x - playerX;
            const dy = y - playerY;
            const distSq = dx*dx + dy*dy;
            
            // Só renderizar luzes próximas do jogador
            const maxDistSq = Math.pow(light.radius * 1.5, 2);
            if (distSq > maxDistSq) return;
            
            // Salvar contexto
            ctx.save();
            
            // Usar composição para que a luz "remova" a escuridão
            ctx.globalCompositeOperation = 'destination-out';
            
            // Criar gradiente radial para a luz
            const radius = light.radius;
            const gradiente = ctx.createRadialGradient(
                x, y, 0,
                x, y, radius
            );
            
            // Intensidade atual (considerando tremulação)
            const intensity = light.currentIntensity || light.intensity;
            
            // Adicionar stops ao gradiente
            gradiente.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
            gradiente.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.5})`);
            gradiente.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Desenhar círculo de luz
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Restaurar contexto
            ctx.restore();
        });
    }
    
    // API pública
    return {
        init: init,
        update: update,
        render: render,
        detectLightSources: detectLightSources,
        addLightSource: addLightSource,
        getLightSources: function() {
            return [...lightSources];
        },
        getAmbientLight: function() {
            return ambientLightLevel;
        }
    };
})();

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.LightSourceManager.init();
});
