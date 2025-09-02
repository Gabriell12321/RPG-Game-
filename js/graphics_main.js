/**
 * graphics_main.js
 * Script principal para integrar os sistemas gráficos avançados ao jogo
 */

// Função para inicializar os sistemas gráficos
function initializeGraphicsSystems() {
    console.log("Inicializando sistemas gráficos avançados...");
    
    // Tentar detectar automaticamente a capacidade de processamento
    const isLowEndDevice = detectLowEndDevice();
    const initialQuality = isLowEndDevice ? 'low' : 'medium';
    
    // Inicializar sistemas com configuração apropriada
    try {
        if (window.GraphicsIntegrationV2) {
            window.GraphicsIntegrationV2.initialize({
                visualEffects: true,
                particleSystem: true,
                initialQuality: initialQuality,
                autoQuality: true,
                enableEnvironment: !isLowEndDevice,
                debugMode: false
            });
            
            console.log("Sistema gráfico V2 inicializado com sucesso!");
            return true;
        } else {
            console.warn("Sistema gráfico V2 não encontrado, verificando alternativas...");
            
            if (window.VisualEffectsSystem && window.ParticleSystem) {
                // Configuração manual dos sistemas individuais
                window.VisualEffectsSystem.setQuality(initialQuality);
                window.visualEffects.addBloom(0.4, 0.6);
                window.visualEffects.addVignette(0.7, 'rgba(0,0,0,0.8)', 0.7);
                
                console.log("Sistemas individuais inicializados com sucesso!");
                return true;
            }
        }
    } catch (error) {
        console.error("Erro ao inicializar sistemas gráficos:", error);
    }
    
    console.warn("Falha ao inicializar sistemas gráficos avançados.");
    return false;
}

// Função para integrar sistemas gráficos ao loop principal do jogo
function integrateWithGameLoop() {
    // Preservar referência ao método de renderização original
    if (window.game && typeof window.game.render === 'function') {
        const originalRender = window.game.render;
        
        // Sobrescrever o método de renderização para incluir os efeitos
        window.game.render = function() {
            // Chamar o método original primeiro
            originalRender.apply(this, arguments);
            
            // Aplicar efeitos visuais após a renderização normal
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.renderEffects();
            } else if (window.VisualEffectsSystem) {
                // Fallback para sistemas individuais
                const canvas = window.canvas;
                const processedCanvas = window.VisualEffectsSystem.process(canvas);
                window.ctx.clearRect(0, 0, canvas.width, canvas.height);
                window.ctx.drawImage(processedCanvas, 0, 0);
            }
        };
        
        // Integrar atualização de partículas ao loop de atualização
        if (window.game && typeof window.game.update === 'function') {
            const originalUpdate = window.game.update;
            
            window.game.update = function(dt) {
                // Chamar o método original primeiro
                originalUpdate.apply(this, arguments);
                
                // Atualizar sistemas gráficos
                if (window.GraphicsIntegrationV2) {
                    window.GraphicsIntegrationV2.processGraphics(dt);
                } else if (window.ParticleSystem) {
                    window.ParticleSystem.update(dt);
                }
            };
        }
        
        console.log("Sistemas gráficos integrados ao loop do jogo com sucesso!");
        return true;
    } else {
        console.warn("Não foi possível encontrar o loop de renderização do jogo.");
        return false;
    }
}

// Função para detectar dispositivos de baixo desempenho
function detectLowEndDevice() {
    // Verificar número de cores de cores disponíveis (indicador aproximado de GPU)
    const colorDepth = window.screen.colorDepth || 24;
    
    // Verificar número de processadores lógicos
    const cpuCores = navigator.hardwareConcurrency || 4;
    
    // Verificar memória disponível (se disponível)
    let lowMemory = false;
    if (navigator.deviceMemory) {
        lowMemory = navigator.deviceMemory < 4; // Menos que 4GB
    }
    
    // Verificar se é um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Determinar se é um dispositivo de baixo desempenho
    return (colorDepth < 24 || cpuCores < 4 || lowMemory || isMobile);
}

// Função para adicionar controles de efeitos visuais na interface
function addGraphicsControls() {
    if (!document.getElementById('graphics-controls')) {
        // Criar elemento de controle
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'graphics-controls';
        controlsDiv.style.position = 'fixed';
        controlsDiv.style.bottom = '10px';
        controlsDiv.style.right = '10px';
        controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.borderRadius = '5px';
        controlsDiv.style.color = 'white';
        controlsDiv.style.fontFamily = 'Arial, sans-serif';
        controlsDiv.style.fontSize = '12px';
        controlsDiv.style.zIndex = '1000';
        
        // Adicionar controles
        controlsDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 5px; font-weight: bold;">Configurações Gráficas</div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <label>
                    <input type="checkbox" id="visual-effects-toggle" checked> Efeitos Visuais
                </label>
                <label>
                    <input type="checkbox" id="particles-toggle" checked> Partículas
                </label>
                <label>
                    Qualidade:
                    <select id="quality-select">
                        <option value="low">Baixa</option>
                        <option value="medium" selected>Média</option>
                        <option value="high">Alta</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" id="auto-quality-toggle" checked> Ajuste Automático
                </label>
                <label>
                    <input type="checkbox" id="debug-toggle"> Modo Debug
                </label>
            </div>
        `;
        
        document.body.appendChild(controlsDiv);
        
        // Adicionar event listeners
        document.getElementById('visual-effects-toggle').addEventListener('change', function(e) {
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.setVisualEffectsEnabled(e.target.checked);
            } else if (window.VisualEffectsSystem) {
                e.target.checked ? window.VisualEffectsSystem.enable() : window.VisualEffectsSystem.disable();
            }
        });
        
        document.getElementById('particles-toggle').addEventListener('change', function(e) {
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.setParticleSystemEnabled(e.target.checked);
            }
        });
        
        document.getElementById('quality-select').addEventListener('change', function(e) {
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.setQuality(e.target.value);
            } else if (window.VisualEffectsSystem) {
                window.VisualEffectsSystem.setQuality(e.target.value);
            }
        });
        
        document.getElementById('auto-quality-toggle').addEventListener('change', function(e) {
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.setAutoQuality(e.target.checked);
            }
        });
        
        document.getElementById('debug-toggle').addEventListener('change', function(e) {
            if (window.GraphicsIntegrationV2) {
                window.GraphicsIntegrationV2.setDebugMode(e.target.checked);
            }
        });
        
        console.log("Controles gráficos adicionados à interface!");
        return true;
    }
    
    return false;
}

// Funções de efeitos para serem usadas pelo jogo
const GameEffects = {
    // Efeito de teletransporte para o jogador
    playerTeleport: function(x, y) {
        if (window.GraphicsIntegrationV2) {
            // Efeito antes do teletransporte
            window.GraphicsIntegrationV2.createParticleEffect('teleport', x, y, 1.5, 1000);
            
            // Adicionar distorção de tela temporária
            const chromaticEffect = window.VisualEffectsSystem.getEffect('chromaticAberration');
            if (chromaticEffect) {
                const originalStrength = chromaticEffect.strength;
                chromaticEffect.strength = 1.0;
                
                setTimeout(() => {
                    chromaticEffect.strength = originalStrength;
                }, 1000);
            }
        }
    },
    
    // Efeito de explosão
    explosion: function(x, y, size = 1) {
        if (window.GraphicsIntegrationV2) {
            window.GraphicsIntegrationV2.createParticleEffect('explosion', x, y, size, 2000);
            
            // Adicionar brilho temporário
            const bloomEffect = window.VisualEffectsSystem.getEffect('bloom');
            if (bloomEffect) {
                const originalStrength = bloomEffect.strength;
                bloomEffect.strength = 0.8;
                
                setTimeout(() => {
                    bloomEffect.strength = originalStrength;
                }, 1000);
            }
        } else if (window.ParticleEffects) {
            window.ParticleEffects.explosion(x, y, size);
        }
    },
    
    // Efeito de cura para o jogador
    healing: function(x, y) {
        if (window.GraphicsIntegrationV2) {
            window.GraphicsIntegrationV2.createParticleEffect('heal', x, y, 1, 2000);
        } else if (window.ParticleEffects) {
            window.ParticleEffects.heal(x, y, 1);
        }
    },
    
    // Efeito de rastro para o jogador em movimento
    playerTrail: function(player, color = '#4CAF50') {
        if (window.GraphicsIntegrationV2 && player) {
            return window.GraphicsIntegrationV2.createTrailEffect(player, color, {
                rate: 10,
                size: 5,
                life: 500
            });
        }
        return null;
    },
    
    // Efeito de chuva
    startRain: function(intensity = 1) {
        if (window.GraphicsIntegrationV2) {
            return window.GraphicsIntegrationV2.createParticleEffect('rain', 0, 0, intensity);
        } else if (window.ParticleEffects) {
            return window.ParticleEffects.rain(window.canvas.width, window.canvas.height, intensity);
        }
        return null;
    },
    
    // Efeito de neve
    startSnow: function(intensity = 1) {
        if (window.GraphicsIntegrationV2) {
            return window.GraphicsIntegrationV2.createParticleEffect('snow', 0, 0, intensity);
        } else if (window.ParticleEffects) {
            return window.ParticleEffects.snow(window.canvas.width, window.canvas.height, intensity);
        }
        return null;
    },
    
    // Aplicar ciclo dia/noite
    setDayNightCycle: function(timeOfDay) {
        if (window.GraphicsIntegrationV2) {
            window.GraphicsIntegrationV2.setDayNightCycle(timeOfDay);
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar com um pequeno atraso para garantir que outros scripts carregaram
    setTimeout(() => {
        const initialized = initializeGraphicsSystems();
        
        if (initialized) {
            integrateWithGameLoop();
            addGraphicsControls();
            
            // Expor efeitos do jogo globalmente
            window.GameEffects = GameEffects;
            
            console.log("Sistema gráfico totalmente inicializado e pronto para uso!");
        }
    }, 500);
});

// Expor funções globalmente
window.initializeGraphicsSystems = initializeGraphicsSystems;
window.integrateWithGameLoop = integrateWithGameLoop;
window.addGraphicsControls = addGraphicsControls;
window.GameEffects = GameEffects;
