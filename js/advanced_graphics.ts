/**
 * advanced_graphics.ts
 * Sistema de efeitos visuais avançados para melhorar a qualidade gráfica do jogo
 */

// Namespace para efeitos gráficos avançados
window.AdvancedGraphics = (function() {
    // Tipos e interfaces
    type ShaderType = 'bloom' | 'blur' | 'godrays' | 'water' | 'shadow';
    
    interface ShaderConfig {
        intensity: number;
        quality: 'low' | 'medium' | 'high';
        enabled: boolean;
    }
    
    interface PostProcessingEffect {
        name: string;
        render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
        update: (deltaTime: number) => void;
        setIntensity: (value: number) => void;
        isEnabled: () => boolean;
        toggle: () => void;
    }
    
    // Configurações
    const config = {
        enabled: true,
        renderScale: 1.0,
        postProcessing: {
            bloom: {
                enabled: true,
                intensity: 0.35,
                threshold: 0.5,
                quality: 'medium' as const
            },
            blur: {
                enabled: true,
                intensity: 0.2,
                radius: 3,
                quality: 'medium' as const
            },
            godrays: {
                enabled: true,
                intensity: 0.5,
                exposure: 0.6,
                decay: 0.9,
                density: 0.8,
                weight: 0.65
            },
            pixelation: {
                enabled: false,
                pixelSize: 2
            },
            chromaticAberration: {
                enabled: true,
                intensity: 0.008,
                quality: 'high' as const
            },
            vignette: {
                enabled: true,
                size: 0.8,
                intensity: 0.25,
                smoothness: 0.5
            }
        },
        shader: {
            enabled: true,
            water: {
                enabled: false,
                intensity: 0.5,
                quality: 'medium' as ShaderConfig['quality']
            },
            shadow: {
                enabled: true,
                intensity: 0.7,
                quality: 'high' as ShaderConfig['quality'],
                softness: 5.0
            }
        },
        particleSystems: {
            dust: {
                enabled: true,
                maxParticles: 100,
                spawnRate: 2,
                size: {min: 0.5, max: 2.5},
                opacity: {min: 0.1, max: 0.5},
                lifetime: {min: 3000, max: 8000},
                colors: ['#fffaf0', '#f5f5dc', '#fdf5e6']
            },
            smoke: {
                enabled: true,
                maxParticles: 50,
                spawnRate: 1,
                size: {min: 3, max: 8},
                opacity: {min: 0.1, max: 0.3},
                lifetime: {min: 5000, max: 10000},
                colors: ['#222222', '#444444', '#666666']
            },
            fireflies: {
                enabled: true,
                maxParticles: 30,
                spawnRate: 0.5,
                size: {min: 0.5, max: 1.5},
                opacity: {min: 0.3, max: 0.8},
                lifetime: {min: 6000, max: 15000},
                colors: ['#ffff99', '#ffffcc', '#fffacd']
            }
        }
    };
    
    // Estado
    const state = {
        initialized: false,
        canvasBuffers: {
            main: null as HTMLCanvasElement | null,
            bloom: null as HTMLCanvasElement | null,
            blur: null as HTMLCanvasElement | null,
            final: null as HTMLCanvasElement | null
        },
        contexts: {
            main: null as CanvasRenderingContext2D | null,
            bloom: null as CanvasRenderingContext2D | null,
            blur: null as CanvasRenderingContext2D | null,
            final: null as CanvasRenderingContext2D | null
        },
        particles: {
            dust: [] as Particle[],
            smoke: [] as Particle[],
            fireflies: [] as Particle[]
        },
        shaders: {
            loaded: false,
            instances: {}
        },
        effects: [] as PostProcessingEffect[],
        performance: {
            lastFpsUpdate: 0,
            frameCount: 0,
            fps: 0,
            renderTime: 0
        }
    };
    
    // Classe para partículas
    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        growRate: number;
        maxSize: number;
        opacity: number;
        fadeRate: number;
        color: string;
        age: number;
        lifetime: number;
        active: boolean;
        
        constructor(x: number, y: number, options: any) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * options.speed || 0.2;
            this.vy = (Math.random() - 0.5) * options.speed || 0.2;
            
            this.size = options.size.min + Math.random() * (options.size.max - options.size.min);
            this.growRate = Math.random() * 0.01 - 0.005;
            this.maxSize = this.size * (1 + Math.random());
            
            this.opacity = options.opacity.min + Math.random() * (options.opacity.max - options.opacity.min);
            this.fadeRate = this.opacity / (options.lifetime.min + Math.random() * (options.lifetime.max - options.lifetime.min));
            
            this.color = options.colors[Math.floor(Math.random() * options.colors.length)];
            this.age = 0;
            this.lifetime = options.lifetime.min + Math.random() * (options.lifetime.max - options.lifetime.min);
            this.active = true;
        }
        
        update(deltaTime: number) {
            this.age += deltaTime;
            
            if (this.age >= this.lifetime) {
                this.active = false;
                return;
            }
            
            // Movimento
            this.x += this.vx * deltaTime * 0.01;
            this.y += this.vy * deltaTime * 0.01;
            
            // Tamanho
            this.size += this.growRate * deltaTime * 0.1;
            if (this.size > this.maxSize || this.size < 0) {
                this.growRate *= -1;
            }
            
            // Fade out quando próximo do fim da vida
            if (this.age > this.lifetime * 0.7) {
                this.opacity = Math.max(0, this.opacity - this.fadeRate * deltaTime);
            }
        }
        
        render(ctx: CanvasRenderingContext2D) {
            if (!this.active) return;
            
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            
            if (this.color.includes('ff')) {
                // Para partículas como vagalumes, desenhe com brilho
                ctx.shadowColor = this.color;
                ctx.shadowBlur = this.size * 2;
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    // Inicialização
    function init(mainCanvas: HTMLCanvasElement) {
        if (state.initialized) return;
        
        console.log("Inicializando sistema de gráficos avançados...");
        
        // Configurar canvas de buffer
        setupBuffers(mainCanvas.width, mainCanvas.height);
        
        // Inicializar efeitos de pós-processamento
        initPostProcessingEffects();
        
        // Inicializar sistemas de partículas
        initParticleSystems();
        
        state.initialized = true;
        console.log("Sistema de gráficos avançados inicializado com sucesso");
    }
    
    // Configurar buffers de canvas
    function setupBuffers(width: number, height: number) {
        // Canvas principal
        state.canvasBuffers.main = document.createElement('canvas');
        state.canvasBuffers.main.width = width;
        state.canvasBuffers.main.height = height;
        state.contexts.main = state.canvasBuffers.main.getContext('2d');
        
        // Canvas para bloom
        state.canvasBuffers.bloom = document.createElement('canvas');
        state.canvasBuffers.bloom.width = width;
        state.canvasBuffers.bloom.height = height;
        state.contexts.bloom = state.canvasBuffers.bloom.getContext('2d');
        
        // Canvas para blur
        state.canvasBuffers.blur = document.createElement('canvas');
        state.canvasBuffers.blur.width = width;
        state.canvasBuffers.blur.height = height;
        state.contexts.blur = state.canvasBuffers.blur.getContext('2d');
        
        // Canvas final
        state.canvasBuffers.final = document.createElement('canvas');
        state.canvasBuffers.final.width = width;
        state.canvasBuffers.final.height = height;
        state.contexts.final = state.canvasBuffers.final.getContext('2d');
    }
    
    // Inicializar efeitos de pós-processamento
    function initPostProcessingEffects() {
        // Efeito de Bloom
        state.effects.push({
            name: 'bloom',
            render: renderBloomEffect,
            update: () => {},
            setIntensity: (value: number) => { config.postProcessing.bloom.intensity = value; },
            isEnabled: () => config.postProcessing.bloom.enabled,
            toggle: () => { config.postProcessing.bloom.enabled = !config.postProcessing.bloom.enabled; }
        });
        
        // Efeito de Blur
        state.effects.push({
            name: 'blur',
            render: renderBlurEffect,
            update: () => {},
            setIntensity: (value: number) => { config.postProcessing.blur.intensity = value; },
            isEnabled: () => config.postProcessing.blur.enabled,
            toggle: () => { config.postProcessing.blur.enabled = !config.postProcessing.blur.enabled; }
        });
        
        // Efeito de Vignette
        state.effects.push({
            name: 'vignette',
            render: renderVignetteEffect,
            update: () => {},
            setIntensity: (value: number) => { config.postProcessing.vignette.intensity = value; },
            isEnabled: () => config.postProcessing.vignette.enabled,
            toggle: () => { config.postProcessing.vignette.enabled = !config.postProcessing.vignette.enabled; }
        });
        
        // Efeito de Aberração Cromática
        state.effects.push({
            name: 'chromaticAberration',
            render: renderChromaticAberrationEffect,
            update: () => {},
            setIntensity: (value: number) => { config.postProcessing.chromaticAberration.intensity = value; },
            isEnabled: () => config.postProcessing.chromaticAberration.enabled,
            toggle: () => { config.postProcessing.chromaticAberration.enabled = !config.postProcessing.chromaticAberration.enabled; }
        });
        
        // Efeito de Raios de Luz (God Rays)
        state.effects.push({
            name: 'godrays',
            render: renderGodRaysEffect,
            update: () => {},
            setIntensity: (value: number) => { config.postProcessing.godrays.intensity = value; },
            isEnabled: () => config.postProcessing.godrays.enabled,
            toggle: () => { config.postProcessing.godrays.enabled = !config.postProcessing.godrays.enabled; }
        });
    }
    
    // Inicializar sistemas de partículas
    function initParticleSystems() {
        // Inicializar arrays de partículas
        state.particles.dust = [];
        state.particles.smoke = [];
        state.particles.fireflies = [];
    }
    
    // Atualizar partículas
    function updateParticles(deltaTime: number, cameraX: number, cameraY: number, width: number, height: number) {
        // Atualizar partículas de poeira
        if (config.particleSystems.dust.enabled) {
            updateParticleSystem('dust', deltaTime, cameraX, cameraY, width, height);
        }
        
        // Atualizar partículas de fumaça
        if (config.particleSystems.smoke.enabled) {
            updateParticleSystem('smoke', deltaTime, cameraX, cameraY, width, height);
        }
        
        // Atualizar vagalumes
        if (config.particleSystems.fireflies.enabled) {
            updateParticleSystem('fireflies', deltaTime, cameraX, cameraY, width, height);
        }
    }
    
    // Atualizar sistema de partículas específico
    function updateParticleSystem(type: 'dust' | 'smoke' | 'fireflies', deltaTime: number, cameraX: number, cameraY: number, width: number, height: number) {
        const system = config.particleSystems[type];
        const particles = state.particles[type];
        
        // Remover partículas inativas
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].active) {
                particles.splice(i, 1);
            }
        }
        
        // Criar novas partículas se necessário
        if (particles.length < system.maxParticles && Math.random() < system.spawnRate * (deltaTime / 1000)) {
            // Posição aleatória dentro da área visível
            const x = cameraX + Math.random() * width;
            const y = cameraY + Math.random() * height;
            
            particles.push(new Particle(x, y, system));
        }
        
        // Atualizar partículas existentes
        particles.forEach(particle => particle.update(deltaTime));
    }
    
    // Renderizar partículas
    function renderParticles(ctx: CanvasRenderingContext2D) {
        if (!config.enabled) return;
        
        // Renderizar partículas de poeira
        if (config.particleSystems.dust.enabled) {
            state.particles.dust.forEach(particle => particle.render(ctx));
        }
        
        // Renderizar partículas de fumaça
        if (config.particleSystems.smoke.enabled) {
            state.particles.smoke.forEach(particle => particle.render(ctx));
        }
        
        // Renderizar vagalumes
        if (config.particleSystems.fireflies.enabled) {
            // Efeito de brilho para vagalumes
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            state.particles.fireflies.forEach(particle => particle.render(ctx));
            ctx.restore();
        }
    }
    
    // Funções de renderização de efeitos
    
    // Efeito de Bloom
    function renderBloomEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        if (!config.postProcessing.bloom.enabled || !state.contexts.bloom) return;
        
        const bloomCtx = state.contexts.bloom;
        const threshold = config.postProcessing.bloom.threshold;
        const intensity = config.postProcessing.bloom.intensity;
        
        // Limpar o canvas de bloom
        bloomCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Extrair as partes brilhantes
        bloomCtx.save();
        bloomCtx.drawImage(canvas, 0, 0);
        bloomCtx.globalCompositeOperation = 'lighter';
        bloomCtx.filter = `brightness(${1 + intensity}) contrast(${1 + intensity})`;
        bloomCtx.drawImage(canvas, 0, 0);
        bloomCtx.restore();
        
        // Aplicar blur ao bloom
        applyBlur(state.canvasBuffers.bloom!, 5);
        
        // Combinar com a imagem original
        ctx.save();
        ctx.globalAlpha = intensity;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(state.canvasBuffers.bloom!, 0, 0);
        ctx.restore();
    }
    
    // Efeito de Blur
    function renderBlurEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        if (!config.postProcessing.blur.enabled) return;
        
        applyBlur(canvas, config.postProcessing.blur.radius * config.postProcessing.blur.intensity);
    }
    
    // Função helper para aplicar blur
    function applyBlur(canvas: HTMLCanvasElement, radius: number) {
        const ctx = canvas.getContext('2d')!;
        ctx.filter = `blur(${radius}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
    }
    
    // Efeito de Vignette
    function renderVignetteEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        if (!config.postProcessing.vignette.enabled) return;
        
        const { size, intensity, smoothness } = config.postProcessing.vignette;
        
        ctx.save();
        
        // Criar gradiente radial para o efeito vignette
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * size / 2
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1 - smoothness, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }
    
    // Efeito de Aberração Cromática
    function renderChromaticAberrationEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        if (!config.postProcessing.chromaticAberration.enabled || !state.contexts.main) return;
        
        const intensity = config.postProcessing.chromaticAberration.intensity;
        const mainCtx = state.contexts.main;
        
        // Limpar canvas principal
        mainCtx.clearRect(0, 0, canvas.width, canvas.height);
        mainCtx.drawImage(canvas, 0, 0);
        
        // Desenhar canais de cor separados
        ctx.save();
        
        // Canal vermelho
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.drawImage(canvas, -intensity * canvas.width, 0);
        
        // Canal verde
        ctx.fillStyle = 'rgb(0,255,0)';
        ctx.drawImage(canvas, 0, 0);
        
        // Canal azul
        ctx.fillStyle = 'rgb(0,0,255)';
        ctx.drawImage(canvas, intensity * canvas.width, 0);
        
        ctx.restore();
    }
    
    // Efeito de God Rays (raios de luz)
    function renderGodRaysEffect(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        if (!config.postProcessing.godrays.enabled || !state.contexts.blur || !state.canvasBuffers.blur) return;
        
        const { intensity, exposure, decay, density, weight } = config.postProcessing.godrays;
        const blurCtx = state.contexts.blur;
        
        // Encontrar fontes de luz (simplificação - assume-se que são partículas brilhantes)
        const lightSources = findLightSources(canvas);
        
        if (lightSources.length === 0) return;
        
        // Limpar canvas de blur
        blurCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Para cada fonte de luz, criar raios
        lightSources.forEach(light => {
            const samples = 64;
            const rayLength = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            
            blurCtx.save();
            blurCtx.globalCompositeOperation = 'lighter';
            
            for (let i = 0; i < samples; i++) {
                const angle = Math.random() * Math.PI * 2;
                const rayX = Math.cos(angle) * rayLength;
                const rayY = Math.sin(angle) * rayLength;
                
                blurCtx.strokeStyle = `rgba(255,255,200,${intensity * 0.05})`;
                blurCtx.lineWidth = 1 + Math.random() * 2;
                blurCtx.beginPath();
                blurCtx.moveTo(light.x, light.y);
                blurCtx.lineTo(light.x + rayX, light.y + rayY);
                blurCtx.stroke();
            }
            
            blurCtx.restore();
        });
        
        // Aplicar blur aos raios
        applyBlur(state.canvasBuffers.blur, 10);
        
        // Combinar com a imagem original
        ctx.save();
        ctx.globalAlpha = intensity * 0.5;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(state.canvasBuffers.blur, 0, 0);
        ctx.restore();
    }
    
    // Encontrar fontes de luz na imagem
    function findLightSources(canvas: HTMLCanvasElement): {x: number, y: number, intensity: number}[] {
        // Simplificação - poderíamos analisar o canvas para encontrar pixels brilhantes
        // mas neste exemplo, usamos as partículas de vagalume como fontes de luz
        return state.particles.fireflies
            .filter(p => p.active && p.opacity > 0.5)
            .map(p => ({
                x: p.x,
                y: p.y,
                intensity: p.opacity
            }));
    }
    
    // Função principal de renderização
    function render(mainCtx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement) {
        if (!config.enabled || !state.initialized) {
            return;
        }
        
        const startTime = performance.now();
        
        // Copiar o conteúdo do canvas de origem para o buffer principal
        if (state.contexts.main) {
            state.contexts.main.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            state.contexts.main.drawImage(sourceCanvas, 0, 0);
        }
        
        // Aplicar efeitos de pós-processamento em sequência
        const finalCtx = state.contexts.final;
        
        if (finalCtx) {
            // Limpar o canvas final
            finalCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            
            // Começar com a imagem original
            finalCtx.drawImage(sourceCanvas, 0, 0);
            
            // Aplicar cada efeito habilitado
            state.effects.forEach(effect => {
                if (effect.isEnabled()) {
                    effect.render(finalCtx, state.canvasBuffers.final!);
                }
            });
            
            // Copiar o resultado de volta para o canvas original
            mainCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            mainCtx.drawImage(state.canvasBuffers.final!, 0, 0);
        }
        
        // Monitorar performance
        state.performance.renderTime = performance.now() - startTime;
        state.performance.frameCount++;
        
        if (performance.now() - state.performance.lastFpsUpdate > 1000) {
            state.performance.fps = state.performance.frameCount;
            state.performance.frameCount = 0;
            state.performance.lastFpsUpdate = performance.now();
        }
    }
    
    // Atualização principal
    function update(deltaTime: number, cameraX: number, cameraY: number, width: number, height: number) {
        if (!config.enabled || !state.initialized) {
            return;
        }
        
        // Atualizar sistemas de partículas
        updateParticles(deltaTime, cameraX, cameraY, width, height);
        
        // Atualizar efeitos
        state.effects.forEach(effect => effect.update(deltaTime));
    }
    
    // API pública
    return {
        init,
        render,
        update,
        renderParticles,
        
        getConfig: () => ({...config}),
        
        setQuality: (level: 'low' | 'medium' | 'high') => {
            switch (level) {
                case 'low':
                    config.renderScale = 0.75;
                    config.postProcessing.bloom.quality = 'low';
                    config.postProcessing.blur.quality = 'low';
                    config.particleSystems.dust.maxParticles = 30;
                    config.particleSystems.smoke.maxParticles = 15;
                    config.particleSystems.fireflies.maxParticles = 10;
                    break;
                    
                case 'medium':
                    config.renderScale = 1.0;
                    config.postProcessing.bloom.quality = 'medium';
                    config.postProcessing.blur.quality = 'medium';
                    config.particleSystems.dust.maxParticles = 70;
                    config.particleSystems.smoke.maxParticles = 30;
                    config.particleSystems.fireflies.maxParticles = 20;
                    break;
                    
                case 'high':
                    config.renderScale = 1.0;
                    config.postProcessing.bloom.quality = 'high';
                    config.postProcessing.blur.quality = 'high';
                    config.particleSystems.dust.maxParticles = 100;
                    config.particleSystems.smoke.maxParticles = 50;
                    config.particleSystems.fireflies.maxParticles = 30;
                    break;
            }
        },
        
        enableEffect: (effectName: string, enabled: boolean) => {
            const effect = state.effects.find(e => e.name === effectName);
            if (effect) {
                effect.toggle();
            }
        },
        
        setEffectIntensity: (effectName: string, intensity: number) => {
            const effect = state.effects.find(e => e.name === effectName);
            if (effect) {
                effect.setIntensity(Math.max(0, Math.min(1, intensity)));
            }
        },
        
        enableParticleSystem: (system: 'dust' | 'smoke' | 'fireflies', enabled: boolean) => {
            if (config.particleSystems[system]) {
                config.particleSystems[system].enabled = enabled;
            }
        },
        
        getPerformanceMetrics: () => ({
            fps: state.performance.fps,
            renderTime: state.performance.renderTime.toFixed(2),
            particleCount: {
                dust: state.particles.dust.length,
                smoke: state.particles.smoke.length,
                fireflies: state.particles.fireflies.length,
                total: state.particles.dust.length + state.particles.smoke.length + state.particles.fireflies.length
            }
        })
    };
})();

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Vamos inicializar o sistema quando o jogo começar
    console.log("Advanced Graphics module loaded - waiting for game canvas");
});
