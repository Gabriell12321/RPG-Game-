/**
 * graphics_integration_v2.ts
 * Versão melhorada do sistema de integração de gráficos
 */

import { VisualEffectsSystem } from './visual_effects_system';
import { ParticleSystem, ParticleEffects } from './particle_system';

/**
 * Classe responsável por integrar os sistemas gráficos avançados com o jogo
 */
class GraphicsIntegrationV2 {
    private static instance: GraphicsIntegrationV2;
    private mainCanvas: HTMLCanvasElement;
    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;
    private autoQuality: boolean = true;
    private fpsHistory: number[] = [];
    private lastFrameTime: number = 0;
    private visualEffectsEnabled: boolean = true;
    private particleSystemEnabled: boolean = true;
    private environmentEffects: Map<string, any> = new Map();
    private debugMode: boolean = false;
    
    private constructor() {
        this.mainCanvas = window.canvas;
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = this.mainCanvas.width;
        this.tempCanvas.height = this.mainCanvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d')!;
        
        // Inicializar monitoramento de FPS
        this.lastFrameTime = performance.now();
        
        // Configurar handlers para redimensionamento
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Obtém a instância única da classe (Singleton)
     */
    public static getInstance(): GraphicsIntegrationV2 {
        if (!GraphicsIntegrationV2.instance) {
            GraphicsIntegrationV2.instance = new GraphicsIntegrationV2();
        }
        return GraphicsIntegrationV2.instance;
    }
    
    /**
     * Inicializa todos os sistemas gráficos com melhorias visuais
     * @param options Opções de inicialização
     */
    public initialize(options: {
        visualEffects?: boolean,
        particleSystem?: boolean,
        initialQuality?: 'low' | 'medium' | 'high',
        autoQuality?: boolean,
        enableEnvironment?: boolean,
        debugMode?: boolean
    } = {}): void {
        const {
            visualEffects = true,
            particleSystem = true,
            initialQuality = 'medium',
            autoQuality = true,
            enableEnvironment = true,
            debugMode = false
        } = options;
        
        this.visualEffectsEnabled = visualEffects;
        this.particleSystemEnabled = particleSystem;
        this.autoQuality = autoQuality;
        this.debugMode = debugMode;
        
        // Configurar qualidade inicial
        if (visualEffects) {
            window.VisualEffectsSystem.setQuality(initialQuality);
            
            // Adicionar efeitos visuais avançados
            window.visualEffects.addBloom(0.4, 0.6);
            window.visualEffects.addVignette(0.7, 'rgba(0,0,0,0.8)', 0.7);
            window.visualEffects.addChromaticAberration(1);
        }
        
        // Inicializar efeitos ambientais se habilitados
        if (enableEnvironment && particleSystem) {
            this.setupEnvironmentEffects();
        }
        
        // Log de inicialização
        console.log('%c🎮 Sistemas Gráficos Avançados V2 Inicializados!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.log(`- Efeitos Visuais: ${visualEffects ? '✅' : '❌'}`);
        console.log(`- Sistema de Partículas: ${particleSystem ? '✅' : '❌'}`);
        console.log(`- Qualidade Inicial: ${initialQuality}`);
        console.log(`- Ajuste Automático: ${autoQuality ? '✅' : '❌'}`);
        console.log(`- Efeitos Ambientais: ${enableEnvironment ? '✅' : '❌'}`);
        console.log(`- Modo Debug: ${debugMode ? '✅' : '❌'}`);
    }
    
    /**
     * Configura efeitos ambientais para melhorar a atmosfera do jogo
     */
    private setupEnvironmentEffects(): void {
        const width = this.mainCanvas.width;
        const height = this.mainCanvas.height;
        
        // Poeira no ar (partículas sutis)
        const dustEmitter = window.ParticleSystem.createEmitter('environment_dust', {
            position: {x: width / 2, y: height / 2},
            rate: 5,
            angle: {min: 0, max: Math.PI * 2},
            force: {min: 0.1, max: 0.3},
            maxParticles: 100,
            emissionShape: 'rectangle',
            emissionRect: {width: width * 0.8, height: height * 0.8},
            particleOptions: {
                color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.2)'],
                size: {min: 1, max: 3},
                life: {min: 5000, max: 10000},
                opacity: {min: 0.05, max: 0.15},
                gravity: -0.01,
                drag: 0.01,
                rotationSpeed: 0.02
            }
        });
        
        // Guardar referências para controle posterior
        this.environmentEffects.set('dust', dustEmitter);
    }
    
    /**
     * Handler para redimensionamento da janela
     */
    private handleResize(): void {
        if (this.mainCanvas && window.canvas) {
            this.mainCanvas = window.canvas;
            this.tempCanvas.width = this.mainCanvas.width;
            this.tempCanvas.height = this.mainCanvas.height;
        }
    }
    
    /**
     * Processa os gráficos do jogo antes da renderização final
     * @param dt Delta time (tempo desde o último frame)
     */
    public processGraphics(dt: number): void {
        // Cálculo do FPS atual
        const now = performance.now();
        const fps = 1000 / (now - this.lastFrameTime);
        this.lastFrameTime = now;
        
        // Atualizar histórico de FPS
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }
        
        // Ajuste automático de qualidade
        if (this.autoQuality && this.fpsHistory.length >= 30) {
            this.adjustQuality();
        }
        
        // Atualizar sistemas
        if (this.particleSystemEnabled) {
            window.ParticleSystem.update(dt);
        }
        
        // Renderizar informações de debug se ativado
        if (this.debugMode) {
            this.renderDebugInfo(fps);
        }
    }
    
    /**
     * Renderiza informações de debug no canvas
     */
    private renderDebugInfo(currentFps: number): void {
        const ctx = window.ctx;
        const avgFps = this.fpsHistory.length > 0 
            ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
            : 0;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 180, 100);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(`FPS: ${Math.round(currentFps)}`, 20, 30);
        ctx.fillText(`Média FPS: ${Math.round(avgFps)}`, 20, 50);
        ctx.fillText(`Partículas: ${window.ParticleSystem.emitters.size}`, 20, 70);
        
        const quality = window.VisualEffectsSystem.quality;
        ctx.fillStyle = quality === 'high' ? '#4CAF50' : quality === 'medium' ? '#FFC107' : '#F44336';
        ctx.fillText(`Qualidade: ${quality}`, 20, 90);
        
        ctx.restore();
    }
    
    /**
     * Renderiza os efeitos visuais e partículas no canvas final
     */
    public renderEffects(): void {
        const ctx = window.ctx;
        
        // Copiar o canvas principal para o temporário
        this.tempCanvas.width = this.mainCanvas.width;
        this.tempCanvas.height = this.mainCanvas.height;
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.tempCtx.drawImage(this.mainCanvas, 0, 0);
        
        // Renderizar partículas no canvas temporário
        if (this.particleSystemEnabled) {
            window.ParticleSystem.render(this.tempCtx);
        }
        
        // Aplicar efeitos visuais e renderizar no canvas principal
        if (this.visualEffectsEnabled) {
            const processedCanvas = window.VisualEffectsSystem.process(this.tempCanvas);
            ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            ctx.drawImage(processedCanvas, 0, 0);
        } else {
            ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
            ctx.drawImage(this.tempCanvas, 0, 0);
        }
    }
    
    /**
     * Cria um emissor de partículas com base em predefinições
     * @param type Tipo de efeito
     * @param x Posição X
     * @param y Posição Y
     * @param scale Escala do efeito
     * @param duration Duração em ms (opcional)
     * @returns ID do emissor criado
     */
    public createParticleEffect(
        type: 'fire' | 'smoke' | 'sparkles' | 'rain' | 'snow' | 'explosion' | 'teleport' | 'heal',
        x: number,
        y: number,
        scale: number = 1,
        duration: number = -1
    ): string {
        if (!this.particleSystemEnabled) return '';
        
        let emitter;
        const effectId = `${type}_${Date.now()}`;
        
        switch (type) {
            case 'fire':
                emitter = ParticleEffects.fire(x, y, scale);
                break;
            case 'smoke':
                emitter = ParticleEffects.smoke(x, y, scale);
                break;
            case 'sparkles':
                emitter = ParticleEffects.sparkles(x, y, scale);
                break;
            case 'rain':
                emitter = ParticleEffects.rain(this.mainCanvas.width, this.mainCanvas.height, scale);
                break;
            case 'snow':
                emitter = ParticleEffects.snow(this.mainCanvas.width, this.mainCanvas.height, scale);
                break;
            case 'explosion':
                emitter = ParticleEffects.explosion(x, y, scale);
                break;
            case 'teleport':
                emitter = ParticleEffects.teleport(x, y, scale);
                break;
            case 'heal':
                emitter = ParticleEffects.heal(x, y, scale);
                break;
        }
        
        // Configurar duração se especificada
        if (duration > 0 && emitter) {
            setTimeout(() => {
                window.ParticleSystem.removeEmitter(effectId);
            }, duration);
        }
        
        return effectId;
    }
    
    /**
     * Cria um efeito de rastro atrás de um objeto em movimento
     * @param objectData Dados do objeto a seguir (deve ter x, y)
     * @param color Cor do rastro (string ou array de cores)
     * @param options Opções adicionais
     * @returns ID do emissor
     */
    public createTrailEffect(
        objectData: {x: number, y: number},
        color: string | string[] = ['rgba(255,255,255,0.3)'],
        options: {
            rate?: number,
            size?: number,
            life?: number,
            fade?: boolean
        } = {}
    ): string {
        if (!this.particleSystemEnabled) return '';
        
        const trailId = `trail_${Date.now()}`;
        const {
            rate = 15,
            size = 5,
            life = 500,
            fade = true
        } = options;
        
        const trailEmitter = window.ParticleSystem.createEmitter(trailId, {
            position: {x: objectData.x, y: objectData.y},
            rate: rate,
            angle: 0,
            spread: Math.PI * 2,
            force: {min: 0, max: 0.1},
            maxParticles: 100,
            particleOptions: {
                color: Array.isArray(color) ? color : [color],
                size: {min: size * 0.7, max: size},
                life: {min: life * 0.7, max: life},
                opacity: {min: 0.3, max: 0.7},
                drag: 0.01,
                fade: fade,
                shrink: fade
            }
        });
        
        // Atualizar posição do emissor para seguir o objeto
        const updateInterval = setInterval(() => {
            if (trailEmitter && objectData) {
                trailEmitter.setPosition(objectData.x, objectData.y);
            } else {
                clearInterval(updateInterval);
                window.ParticleSystem.removeEmitter(trailId);
            }
        }, 16);
        
        return trailId;
    }
    
    /**
     * Aplica efeito de dia/noite com base no horário do jogo
     * @param timeOfDay Valor de 0 a 1 (0=noite, 0.5=meio-dia, 1=noite)
     */
    public setDayNightCycle(timeOfDay: number): void {
        if (!this.visualEffectsEnabled) return;
        
        // Ajustar vinheta com base no horário
        const vignetteEffect = window.VisualEffectsSystem.getEffect('vignette');
        if (vignetteEffect) {
            // Mais escuro à noite, mais claro durante o dia
            const nightStrength = Math.sin(timeOfDay * Math.PI) * 0.5 + 0.5;
            vignetteEffect.strength = 0.4 + (nightStrength * 0.5);
            
            // Cor azulada à noite, normal durante o dia
            const nightColor = 'rgba(0, 10, 30, 0.85)';
            const dayColor = 'rgba(0, 0, 0, 0.7)';
            vignetteEffect.color = timeOfDay < 0.25 || timeOfDay > 0.75 ? nightColor : dayColor;
        }
        
        // Ajustar aberração cromática à noite
        const chromaticEffect = window.VisualEffectsSystem.getEffect('chromaticAberration');
        if (chromaticEffect) {
            chromaticEffect.strength = timeOfDay < 0.25 || timeOfDay > 0.75 ? 0.7 : 0.3;
        }
    }
    
    /**
     * Adiciona efeito de iluminação em uma posição específica
     * @param x Posição X
     * @param y Posição Y
     * @param color Cor da luz
     * @param radius Raio da luz
     * @param intensity Intensidade
     * @param flicker Oscilação da luz
     * @param duration Duração (-1 para permanente)
     * @returns ID do efeito
     */
    public addLightSource(
        x: number,
        y: number,
        color: string = '#ffcc00',
        radius: number = 50,
        intensity: number = 0.7,
        flicker: boolean = false,
        duration: number = -1
    ): string {
        if (!this.particleSystemEnabled) return '';
        
        const lightId = `light_${Date.now()}`;
        const lightEmitter = window.ParticleSystem.createEmitter(lightId, {
            position: {x, y},
            rate: 10,
            angle: 0,
            spread: Math.PI * 2,
            force: {min: 0, max: 0.5},
            maxParticles: 10,
            particleOptions: {
                color: [color],
                size: {min: radius * 0.8, max: radius * 1.2},
                life: {min: 300, max: 600},
                opacity: {min: intensity * 0.7, max: intensity},
                blendMode: 'lighter',
                onUpdate: (particle, dt) => {
                    if (flicker) {
                        // Adicionar oscilação à opacidade
                        particle.opacity = particle.originalOpacity * 
                            (0.7 + 0.3 * Math.sin(performance.now() * 0.01));
                    }
                }
            }
        });
        
        // Remover após duração especificada
        if (duration > 0) {
            setTimeout(() => {
                window.ParticleSystem.removeEmitter(lightId);
            }, duration);
        }
        
        return lightId;
    }
    
    /**
     * Ativa ou desativa efeitos visuais
     * @param enabled Estado de ativação
     */
    public setVisualEffectsEnabled(enabled: boolean): void {
        this.visualEffectsEnabled = enabled;
        if (enabled) {
            window.VisualEffectsSystem.enable();
        } else {
            window.VisualEffectsSystem.disable();
        }
    }
    
    /**
     * Ativa ou desativa o sistema de partículas
     * @param enabled Estado de ativação
     */
    public setParticleSystemEnabled(enabled: boolean): void {
        this.particleSystemEnabled = enabled;
        if (!enabled) {
            window.ParticleSystem.clear();
        }
    }
    
    /**
     * Define a qualidade dos efeitos visuais
     * @param quality Nível de qualidade
     */
    public setQuality(quality: 'low' | 'medium' | 'high'): void {
        window.VisualEffectsSystem.setQuality(quality);
    }
    
    /**
     * Ativa ou desativa o ajuste automático de qualidade
     * @param enabled Estado de ativação
     */
    public setAutoQuality(enabled: boolean): void {
        this.autoQuality = enabled;
    }
    
    /**
     * Ativa ou desativa o modo debug
     * @param enabled Estado de ativação
     */
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }
    
    /**
     * Ajusta automaticamente a qualidade com base no FPS
     */
    private adjustQuality(): void {
        const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
        
        if (avgFPS < 30) {
            window.VisualEffectsSystem.setQuality('low');
        } else if (avgFPS > 55) {
            window.VisualEffectsSystem.setQuality('high');
        } else {
            window.VisualEffectsSystem.setQuality('medium');
        }
    }
}

// Expor como objeto global
window.GraphicsIntegrationV2 = GraphicsIntegrationV2.getInstance();

// Funções para facilitar a integração com o código JavaScript existente
export function initializeGraphicsV2(options = {}): void {
    GraphicsIntegrationV2.getInstance().initialize(options);
}

export function processGraphicsV2(dt: number): void {
    GraphicsIntegrationV2.getInstance().processGraphics(dt);
}

export function renderGraphicsEffectsV2(): void {
    GraphicsIntegrationV2.getInstance().renderEffects();
}

export function createParticleEffectV2(
    type: 'fire' | 'smoke' | 'sparkles' | 'rain' | 'snow' | 'explosion' | 'teleport' | 'heal',
    x: number,
    y: number,
    scale: number = 1,
    duration: number = -1
): string {
    return GraphicsIntegrationV2.getInstance().createParticleEffect(type, x, y, scale, duration);
}

export function createTrailEffectV2(
    objectData: {x: number, y: number},
    color: string | string[] = ['rgba(255,255,255,0.3)'],
    options = {}
): string {
    return GraphicsIntegrationV2.getInstance().createTrailEffect(objectData, color, options);
}

export function setDayNightCycleV2(timeOfDay: number): void {
    GraphicsIntegrationV2.getInstance().setDayNightCycle(timeOfDay);
}

export function addLightSourceV2(
    x: number,
    y: number,
    color: string = '#ffcc00',
    radius: number = 50,
    intensity: number = 0.7,
    flicker: boolean = false,
    duration: number = -1
): string {
    return GraphicsIntegrationV2.getInstance().addLightSource(x, y, color, radius, intensity, flicker, duration);
}

export function setGraphicsQualityV2(quality: 'low' | 'medium' | 'high'): void {
    GraphicsIntegrationV2.getInstance().setQuality(quality);
}

export function toggleVisualEffectsV2(enabled: boolean): void {
    GraphicsIntegrationV2.getInstance().setVisualEffectsEnabled(enabled);
}

export function toggleParticleSystemV2(enabled: boolean): void {
    GraphicsIntegrationV2.getInstance().setParticleSystemEnabled(enabled);
}

export function toggleDebugModeV2(enabled: boolean): void {
    GraphicsIntegrationV2.getInstance().setDebugMode(enabled);
}

// Exportar a classe para uso em TypeScript
export { GraphicsIntegrationV2 };
