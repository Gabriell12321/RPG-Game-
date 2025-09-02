// Inicialização dos sistemas gráficos avançados
// Este arquivo configura e inicializa todos os novos sistemas visuais

(function(window) {
    // Verificar disponibilidade do GameSystem
    if (!window.GameSystem) {
        console.warn("GameSystem não encontrado! Usando valores padrão para inicialização gráfica.");
        // Criar objeto GameSystem com valores padrão se não existir
        window.GameSystem = {
            constants: {
                BASE_W: 400,
                BASE_H: 225
            },
            state: {
                graphicsQuality: 'high',
                usePostProcessing: true,
                useAdvancedLighting: true,
                useParticleEffects: true
            }
        };
    }
    
    // Constantes
    const BASE_W = window.GameSystem.constants.BASE_W || 400;
    const BASE_H = window.GameSystem.constants.BASE_H || 225;
    
    // Estado gráfico
    const graphicsSettings = {
        quality: window.GameSystem.state.graphicsQuality || 'high',
        postProcessing: window.GameSystem.state.usePostProcessing !== false,
        advancedLighting: window.GameSystem.state.useAdvancedLighting !== false,
        particleEffects: window.GameSystem.state.useParticleEffects !== false,
        use3DEffects: window.GameSystem.state.use3DEffects !== false
    };
    
    // Inicializar sistemas
    function init() {
        console.log("🖼️ Inicializando sistemas gráficos avançados...");
        
        // Aplicar configurações baseadas na qualidade
        applyQualitySettings();
        
        // Inicializar sistemas em sequência
        initLightingSystem();
        initPostProcessing();
        initParticleSystem();
        init3DEffects();
        
        console.log(`🖼️ Sistemas gráficos inicializados com qualidade: ${graphicsSettings.quality}`);
        
        // Adicionar eventos para controle de qualidade
        addQualityControlEvents();
    }
    
    // Configurar sistemas baseado na qualidade selecionada
    function applyQualitySettings() {
        switch (graphicsSettings.quality) {
            case 'low':
                graphicsSettings.postProcessing = false;
                graphicsSettings.advancedLighting = false;
                graphicsSettings.particleEffects = true;
                graphicsSettings.use3DEffects = false;
                break;
                
            case 'medium':
                graphicsSettings.postProcessing = true;
                graphicsSettings.advancedLighting = true;
                graphicsSettings.particleEffects = true;
                graphicsSettings.use3DEffects = false;
                break;
                
            case 'high':
                graphicsSettings.postProcessing = true;
                graphicsSettings.advancedLighting = true;
                graphicsSettings.particleEffects = true;
                graphicsSettings.use3DEffects = true;
                break;
                
            case 'ultra':
                graphicsSettings.postProcessing = true;
                graphicsSettings.advancedLighting = true;
                graphicsSettings.particleEffects = true;
                graphicsSettings.use3DEffects = true;
                // Configurações adicionais para ultra
                break;
        }
        
        // Atualizar estado global
        window.GameSystem.state.usePostProcessing = graphicsSettings.postProcessing;
        window.GameSystem.state.useAdvancedLighting = graphicsSettings.advancedLighting;
        window.GameSystem.state.useParticleEffects = graphicsSettings.particleEffects;
        window.GameSystem.state.use3DEffects = graphicsSettings.use3DEffects;
    }
    
    // Inicializar sistema de iluminação
    function initLightingSystem() {
        if (!graphicsSettings.advancedLighting) {
            console.log("Sistema de iluminação avançada desativado pela configuração de qualidade");
            return;
        }
        
        if (window.GameSystem.functions.lighting && window.GameSystem.functions.lighting.init) {
            window.GameSystem.functions.lighting.init();
            
            // Configurar iluminação baseada na qualidade
            switch (graphicsSettings.quality) {
                case 'medium':
                    window.GameSystem.functions.lighting.configure({
                        shadowIntensity: 0.5,
                        enableShadows: false,
                        fogEnabled: true,
                        fogDensity: 0.03
                    });
                    break;
                    
                case 'high':
                    window.GameSystem.functions.lighting.configure({
                        shadowIntensity: 0.7,
                        enableShadows: true,
                        fogEnabled: true,
                        fogDensity: 0.05
                    });
                    break;
                    
                case 'ultra':
                    window.GameSystem.functions.lighting.configure({
                        shadowIntensity: 0.8,
                        enableShadows: true,
                        fogEnabled: true,
                        fogDensity: 0.05,
                        useColoredLights: true
                    });
                    break;
            }
            
            console.log("Sistema de iluminação avançada inicializado");
        } else {
            console.warn("Sistema de iluminação avançada não encontrado");
        }
    }
    
    // Inicializar sistema de pós-processamento
    function initPostProcessing() {
        if (!graphicsSettings.postProcessing) {
            console.log("Sistema de pós-processamento desativado pela configuração de qualidade");
            return;
        }
        
        if (window.GameSystem.functions.postProcessing && window.GameSystem.functions.postProcessing.init) {
            window.GameSystem.functions.postProcessing.init();
            
            // Configurar efeitos baseados na qualidade
            switch (graphicsSettings.quality) {
                case 'medium':
                    window.GameSystem.functions.postProcessing.configure({
                        scanlines: true,
                        chromaShift: false,
                        vignette: true,
                        noise: true,
                        bloom: false,
                        motionBlur: false,
                        crtDistortion: false,
                        filmGrain: true,
                        aberration: false
                    });
                    break;
                    
                case 'high':
                    window.GameSystem.functions.postProcessing.configure({
                        scanlines: true,
                        chromaShift: false,
                        vignette: true,
                        noise: true,
                        bloom: true,
                        motionBlur: false,
                        crtDistortion: true,
                        filmGrain: true,
                        aberration: true
                    });
                    break;
                    
                case 'ultra':
                    window.GameSystem.functions.postProcessing.configure({
                        scanlines: true,
                        chromaShift: true,
                        vignette: true,
                        noise: true,
                        bloom: true,
                        motionBlur: true,
                        crtDistortion: true,
                        filmGrain: true,
                        aberration: true
                    });
                    break;
            }
            
            console.log("Sistema de pós-processamento inicializado");
        } else {
            console.warn("Sistema de pós-processamento não encontrado");
        }
    }
    
    // Inicializar sistema de partículas
    function initParticleSystem() {
        if (!graphicsSettings.particleEffects) {
            console.log("Sistema de partículas desativado pela configuração de qualidade");
            return;
        }
        
        if (window.GameSystem.functions.particles) {
            // Não há inicialização específica necessária para o sistema de partículas
            console.log("Sistema de partículas inicializado");
            
            // Inicializar efeitos ambientais baseados no ambiente atual
            // Exemplo: criar efeito de névoa ou poeira baseado no mapa atual
            setTimeout(() => {
                if (window.GameSystem.state.currentMap === 'floresta' || !window.GameSystem.state.currentMap) {
                    window.GameSystem.functions.particles.createAmbientEffect('dust', { intensity: 3 });
                }
            }, 2000);
        } else {
            console.warn("Sistema de partículas não encontrado");
        }
    }
    
    // Inicializar efeitos 3D
    function init3DEffects() {
        if (!graphicsSettings.use3DEffects) {
            console.log("Sistema de efeitos 3D desativado pela configuração de qualidade");
            return;
        }
        
        if (window.GameSystem.functions.render3D) {
            // Configurar perspectiva baseada na qualidade
            switch (graphicsSettings.quality) {
                case 'high':
                    window.GameSystem.functions.render3D.setPerspective({
                        enabled: true,
                        vanishingPointY: BASE_H * 0.4,
                        skew: 0.12,
                        heightScale: 0.7
                    });
                    break;
                    
                case 'ultra':
                    window.GameSystem.functions.render3D.setPerspective({
                        enabled: true,
                        vanishingPointY: BASE_H * 0.4,
                        skew: 0.15,
                        heightScale: 0.8
                    });
                    break;
            }
            
            console.log("Sistema de efeitos 3D inicializado");
        } else {
            console.warn("Sistema de efeitos 3D não encontrado");
        }
    }
    
    // Adicionar eventos para controle de qualidade visual
    function addQualityControlEvents() {
        // Tecla F7 para alternar qualidade gráfica
        document.addEventListener('keydown', function(event) {
            if (event.key === 'F7') {
                cycleQualitySettings();
                event.preventDefault();
            }
        });
    }
    
    // Alternar entre configurações de qualidade
    function cycleQualitySettings() {
        const qualities = ['low', 'medium', 'high', 'ultra'];
        const currentIndex = qualities.indexOf(graphicsSettings.quality);
        const nextIndex = (currentIndex + 1) % qualities.length;
        
        graphicsSettings.quality = qualities[nextIndex];
        window.GameSystem.state.graphicsQuality = graphicsSettings.quality;
        
        console.log(`Alterando qualidade gráfica para: ${graphicsSettings.quality}`);
        
        // Reaplicar configurações
        applyQualitySettings();
        
        // Exibir mensagem na tela
        showQualityChangeMessage();
    }
    
    // Exibir mensagem temporária na tela
    function showQualityChangeMessage() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            z-index: 9999;
            text-align: center;
        `;
        
        container.innerHTML = `
            <div>Qualidade Gráfica: ${graphicsSettings.quality.toUpperCase()}</div>
            <div style="font-size: 0.8em; margin-top: 5px;">PostFX: ${graphicsSettings.postProcessing ? 'ON' : 'OFF'} | 
            Luzes: ${graphicsSettings.advancedLighting ? 'ON' : 'OFF'} | 
            3D: ${graphicsSettings.use3DEffects ? 'ON' : 'OFF'}</div>
        `;
        
        document.body.appendChild(container);
        
        // Remover após alguns segundos
        setTimeout(() => {
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.5s';
            setTimeout(() => container.remove(), 500);
        }, 3000);
    }
    
    // Exportar funções para o escopo global
    window.GameSystem.functions.graphics = {
        init,
        getQuality: () => graphicsSettings.quality,
        setQuality: (quality) => {
            if (['low', 'medium', 'high', 'ultra'].includes(quality)) {
                graphicsSettings.quality = quality;
                window.GameSystem.state.graphicsQuality = quality;
                applyQualitySettings();
            }
        }
    };
    
    // Inicializar automaticamente se o DOM já estiver carregado
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
    }
    
})(window);
