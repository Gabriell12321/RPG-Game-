/**
 * particle_system.ts
 * Sistema de partículas avançado para efeitos visuais
 */

// Tipos e interfaces
interface ParticleOptions {
    position: {x: number, y: number};
    velocity?: {x: number, y: number};
    acceleration?: {x: number, y: number};
    color: string | string[];
    size: number | {min: number, max: number};
    life: number | {min: number, max: number};
    opacity?: number | {min: number, max: number};
    rotation?: number;
    rotationSpeed?: number;
    blendMode?: GlobalCompositeOperation;
    gravity?: number;
    drag?: number;
    fade?: boolean;
    shrink?: boolean;
    shape?: 'circle' | 'square' | 'triangle' | 'image';
    imageSource?: string | HTMLImageElement;
    onUpdate?: (particle: Particle, deltaTime: number) => void;
    onDeath?: (particle: Particle) => void;
}

interface EmitterOptions {
    position: {x: number, y: number};
    rate: number; // partículas por segundo
    burst?: {
        count: number;
        interval: number;
        enabled: boolean;
    };
    angle?: number | {min: number, max: number};
    spread?: number;
    force?: number | {min: number, max: number};
    maxParticles?: number;
    duration?: number; // -1 para infinito
    particleOptions: Omit<ParticleOptions, 'position'>;
    emissionShape?: 'point' | 'circle' | 'rectangle' | 'line';
    emissionRadius?: number;
    emissionRect?: {width: number, height: number};
    emissionLine?: {x1: number, y1: number, x2: number, y2: number};
    active?: boolean;
    onEmit?: (particle: Particle) => void;
}

class Particle {
    position: {x: number, y: number};
    velocity: {x: number, y: number};
    acceleration: {x: number, y: number};
    color: string;
    originalColor: string;
    size: number;
    originalSize: number;
    life: number;
    maxLife: number;
    opacity: number;
    originalOpacity: number;
    rotation: number;
    rotationSpeed: number;
    blendMode: GlobalCompositeOperation;
    gravity: number;
    drag: number;
    fade: boolean;
    shrink: boolean;
    shape: 'circle' | 'square' | 'triangle' | 'image';
    image: HTMLImageElement | null;
    onUpdate: ((particle: Particle, deltaTime: number) => void) | null;
    onDeath: ((particle: Particle) => void) | null;
    active: boolean;
    
    constructor(options: ParticleOptions) {
        this.position = {x: options.position.x, y: options.position.y};
        this.velocity = options.velocity || {x: 0, y: 0};
        this.acceleration = options.acceleration || {x: 0, y: 0};
        
        // Suporte a cores múltiplas
        if (Array.isArray(options.color)) {
            const index = Math.floor(Math.random() * options.color.length);
            this.color = options.color[index];
        } else {
            this.color = options.color;
        }
        this.originalColor = this.color;
        
        // Suporte a tamanhos aleatórios
        if (typeof options.size === 'object') {
            this.size = options.size.min + Math.random() * (options.size.max - options.size.min);
        } else {
            this.size = options.size;
        }
        this.originalSize = this.size;
        
        // Suporte a vida útil aleatória
        if (typeof options.life === 'object') {
            this.life = options.life.min + Math.random() * (options.life.max - options.life.min);
        } else {
            this.life = options.life;
        }
        this.maxLife = this.life;
        
        // Suporte a opacidade aleatória
        if (typeof options.opacity === 'object') {
            this.opacity = options.opacity.min + Math.random() * (options.opacity.max - options.opacity.min);
        } else {
            this.opacity = options.opacity || 1.0;
        }
        this.originalOpacity = this.opacity;
        
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.blendMode = options.blendMode || 'source-over';
        this.gravity = options.gravity || 0;
        this.drag = options.drag || 0;
        this.fade = options.fade !== undefined ? options.fade : true;
        this.shrink = options.shrink !== undefined ? options.shrink : false;
        this.shape = options.shape || 'circle';
        this.image = null;
        this.onUpdate = options.onUpdate || null;
        this.onDeath = options.onDeath || null;
        this.active = true;
        
        // Carregar imagem se necessário
        if (this.shape === 'image' && options.imageSource) {
            if (typeof options.imageSource === 'string') {
                this.image = new Image();
                this.image.src = options.imageSource;
            } else {
                this.image = options.imageSource;
            }
        }
    }
    
    update(deltaTime: number): void {
        if (!this.active) return;
        
        // Atualizar vida
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            if (this.onDeath) {
                this.onDeath(this);
            }
            return;
        }
        
        // Chamar função personalizada de atualização
        if (this.onUpdate) {
            this.onUpdate(this, deltaTime);
        }
        
        // Aplicar gravidade
        this.velocity.y += this.gravity * (deltaTime / 1000);
        
        // Aplicar arrasto
        if (this.drag > 0) {
            this.velocity.x *= Math.pow(1 - this.drag, deltaTime / 16);
            this.velocity.y *= Math.pow(1 - this.drag, deltaTime / 16);
        }
        
        // Aplicar aceleração
        this.velocity.x += this.acceleration.x * (deltaTime / 1000);
        this.velocity.y += this.acceleration.y * (deltaTime / 1000);
        
        // Atualizar posição
        this.position.x += this.velocity.x * (deltaTime / 16);
        this.position.y += this.velocity.y * (deltaTime / 16);
        
        // Atualizar rotação
        this.rotation += this.rotationSpeed * (deltaTime / 16);
        
        // Diminuir tamanho se shrink ativado
        if (this.shrink) {
            const lifeRatio = this.life / this.maxLife;
            this.size = this.originalSize * lifeRatio;
        }
        
        // Fade out se fade ativado
        if (this.fade) {
            const lifeRatio = this.life / this.maxLife;
            this.opacity = this.originalOpacity * lifeRatio;
        }
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;
        
        ctx.save();
        
        // Aplicar modo de mesclagem
        ctx.globalCompositeOperation = this.blendMode;
        ctx.globalAlpha = this.opacity;
        
        // Aplicar transformações
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        // Renderizar forma
        ctx.fillStyle = this.color;
        
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;
                
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.lineTo(this.size, this.size);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'image':
                if (this.image && this.image.complete) {
                    ctx.drawImage(
                        this.image,
                        -this.size,
                        -this.size,
                        this.size * 2,
                        this.size * 2
                    );
                }
                break;
        }
        
        ctx.restore();
    }
}

class ParticleEmitter {
    options: EmitterOptions;
    particles: Particle[];
    emissionTimer: number;
    burstTimer: number;
    active: boolean;
    elapsed: number;
    
    constructor(options: EmitterOptions) {
        this.options = {
            ...options,
            burst: options.burst || {count: 0, interval: 1000, enabled: false},
            angle: options.angle || 0,
            spread: options.spread || 0,
            force: options.force || 1,
            maxParticles: options.maxParticles || 100,
            duration: options.duration !== undefined ? options.duration : -1,
            emissionShape: options.emissionShape || 'point',
            active: options.active !== undefined ? options.active : true
        };
        this.particles = [];
        this.emissionTimer = 0;
        this.burstTimer = 0;
        this.active = this.options.active || true;
        this.elapsed = 0;
    }
    
    update(deltaTime: number): void {
        if (!this.active) return;
        
        // Verificar duração
        if (this.options.duration > 0) {
            this.elapsed += deltaTime;
            if (this.elapsed >= this.options.duration) {
                this.active = false;
                return;
            }
        }
        
        // Atualizar partículas existentes
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (!particle.active) {
                this.particles.splice(i, 1);
            }
        }
        
        // Emissão contínua
        this.emissionTimer += deltaTime;
        const emissionInterval = 1000 / this.options.rate;
        
        while (this.emissionTimer >= emissionInterval && this.particles.length < this.options.maxParticles!) {
            this.emitParticle();
            this.emissionTimer -= emissionInterval;
        }
        
        // Emissão em burst
        if (this.options.burst && this.options.burst.enabled) {
            this.burstTimer += deltaTime;
            
            if (this.burstTimer >= this.options.burst.interval) {
                for (let i = 0; i < this.options.burst.count; i++) {
                    if (this.particles.length < this.options.maxParticles!) {
                        this.emitParticle();
                    }
                }
                this.burstTimer = 0;
            }
        }
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        // Renderizar todas as partículas
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }
    
    emitParticle(): void {
        if (this.particles.length >= this.options.maxParticles!) return;
        
        // Determinar posição inicial com base na forma de emissão
        let position = {x: this.options.position.x, y: this.options.position.y};
        
        switch (this.options.emissionShape) {
            case 'circle':
                if (this.options.emissionRadius) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * this.options.emissionRadius;
                    position.x += Math.cos(angle) * radius;
                    position.y += Math.sin(angle) * radius;
                }
                break;
                
            case 'rectangle':
                if (this.options.emissionRect) {
                    position.x += (Math.random() - 0.5) * this.options.emissionRect.width;
                    position.y += (Math.random() - 0.5) * this.options.emissionRect.height;
                }
                break;
                
            case 'line':
                if (this.options.emissionLine) {
                    const t = Math.random();
                    const {x1, y1, x2, y2} = this.options.emissionLine;
                    position.x = x1 + t * (x2 - x1);
                    position.y = y1 + t * (y2 - y1);
                }
                break;
        }
        
        // Determinar ângulo e força
        let angle: number;
        if (typeof this.options.angle === 'object') {
            angle = this.options.angle.min + Math.random() * (this.options.angle.max - this.options.angle.min);
        } else {
            angle = this.options.angle!;
        }
        
        // Adicionar spread aleatório
        angle += (Math.random() - 0.5) * this.options.spread!;
        
        // Determinar força
        let force: number;
        if (typeof this.options.force === 'object') {
            force = this.options.force.min + Math.random() * (this.options.force.max - this.options.force.min);
        } else {
            force = this.options.force!;
        }
        
        // Calcular velocidade
        const velocity = {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
        };
        
        // Criar partícula
        const particleOptions: ParticleOptions = {
            ...this.options.particleOptions,
            position,
            velocity
        };
        
        const particle = new Particle(particleOptions);
        this.particles.push(particle);
        
        // Chamar callback onEmit se existir
        if (this.options.onEmit) {
            this.options.onEmit(particle);
        }
    }
    
    setPosition(x: number, y: number): void {
        this.options.position.x = x;
        this.options.position.y = y;
    }
    
    setActive(active: boolean): void {
        this.active = active;
    }
    
    stop(): void {
        this.active = false;
    }
    
    start(): void {
        this.active = true;
        this.elapsed = 0;
    }
    
    clear(): void {
        this.particles = [];
    }
}

class ParticleSystem {
    emitters: Map<string, ParticleEmitter>;
    paused: boolean;
    
    constructor() {
        this.emitters = new Map();
        this.paused = false;
    }
    
    createEmitter(id: string, options: EmitterOptions): ParticleEmitter {
        const emitter = new ParticleEmitter(options);
        this.emitters.set(id, emitter);
        return emitter;
    }
    
    removeEmitter(id: string): boolean {
        return this.emitters.delete(id);
    }
    
    getEmitter(id: string): ParticleEmitter | undefined {
        return this.emitters.get(id);
    }
    
    update(deltaTime: number): void {
        if (this.paused) return;
        
        for (const emitter of this.emitters.values()) {
            emitter.update(deltaTime);
        }
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        for (const emitter of this.emitters.values()) {
            emitter.render(ctx);
        }
    }
    
    pause(): void {
        this.paused = true;
    }
    
    resume(): void {
        this.paused = false;
    }
    
    clear(): void {
        for (const emitter of this.emitters.values()) {
            emitter.clear();
        }
    }
    
    clearAll(): void {
        this.emitters.clear();
    }
}

// Expor como variável global
window.ParticleSystem = new ParticleSystem();

// Exemplos de efeitos comuns pré-definidos
const ParticleEffects = {
    fire: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('fire_' + Date.now(), {
            position: {x, y},
            rate: 30 * scale,
            angle: -Math.PI/2, // Para cima
            spread: Math.PI/4,
            force: {min: 1, max: 3},
            maxParticles: 100 * scale,
            emissionShape: 'circle',
            emissionRadius: 5 * scale,
            particleOptions: {
                color: ['#ff4500', '#ff7f50', '#ff8c00', '#ffa500'],
                size: {min: 3 * scale, max: 8 * scale},
                life: {min: 500, max: 1500},
                opacity: {min: 0.6, max: 0.9},
                gravity: -0.05,
                drag: 0.01,
                blendMode: 'lighter',
                fade: true,
                shrink: true
            }
        });
    },
    
    smoke: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('smoke_' + Date.now(), {
            position: {x, y},
            rate: 10 * scale,
            angle: -Math.PI/2, // Para cima
            spread: Math.PI/6,
            force: {min: 0.5, max: 1.5},
            maxParticles: 50 * scale,
            emissionShape: 'circle',
            emissionRadius: 5 * scale,
            particleOptions: {
                color: ['#666666', '#777777', '#888888', '#999999'],
                size: {min: 10 * scale, max: 20 * scale},
                life: {min: 2000, max: 4000},
                opacity: {min: 0.1, max: 0.3},
                gravity: -0.01,
                drag: 0.01,
                fade: true,
                shrink: false,
                rotationSpeed: 0.05
            }
        });
    },
    
    sparkles: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('sparkles_' + Date.now(), {
            position: {x, y},
            rate: 15 * scale,
            angle: {min: 0, max: Math.PI * 2},
            force: {min: 1, max: 5},
            maxParticles: 50 * scale,
            burst: {
                count: 20 * scale,
                interval: 100,
                enabled: true
            },
            duration: 500,
            particleOptions: {
                color: ['#fff9c4', '#ffee58', '#ffd54f', '#ffca28'],
                size: {min: 1 * scale, max: 3 * scale},
                life: {min: 300, max: 1000},
                opacity: {min: 0.6, max: 1.0},
                blendMode: 'lighter',
                gravity: 0.05,
                drag: 0.01,
                fade: true,
                shrink: true
            }
        });
    },
    
    rain: (width: number, height: number, intensity: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('rain_' + Date.now(), {
            position: {x: width/2, y: -20},
            rate: 50 * intensity,
            angle: Math.PI/2 + Math.PI/16, // Ligeiramente inclinado
            spread: Math.PI/32,
            force: {min: 7, max: 15},
            maxParticles: 500 * intensity,
            emissionShape: 'line',
            emissionLine: {x1: 0, y1: -20, x2: width, y2: -20},
            particleOptions: {
                color: ['rgba(200, 200, 230, 0.5)', 'rgba(180, 180, 210, 0.6)'],
                size: {min: 1, max: 3},
                life: {min: 500, max: 1500},
                opacity: {min: 0.3, max: 0.6},
                gravity: 0.1,
                drag: 0.02
            }
        });
    },
    
    snow: (width: number, height: number, intensity: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('snow_' + Date.now(), {
            position: {x: width/2, y: -20},
            rate: 20 * intensity,
            angle: Math.PI/2,
            spread: Math.PI/8,
            force: {min: 0.5, max: 2},
            maxParticles: 300 * intensity,
            emissionShape: 'line',
            emissionLine: {x1: 0, y1: -20, x2: width, y2: -20},
            particleOptions: {
                color: ['rgba(255, 255, 255, 0.8)', 'rgba(230, 240, 255, 0.9)'],
                size: {min: 2, max: 5},
                life: {min: 3000, max: 6000},
                opacity: {min: 0.5, max: 0.9},
                gravity: 0.03,
                drag: 0.01,
                rotationSpeed: 0.01,
                onUpdate: (particle, deltaTime) => {
                    // Movimento de oscilação para os flocos de neve
                    particle.velocity.x += Math.sin(particle.life * 0.001) * 0.01;
                }
            }
        });
    },
    
    explosion: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('explosion_' + Date.now(), {
            position: {x, y},
            rate: 0,
            burst: {
                count: 50 * scale,
                interval: 100,
                enabled: true
            },
            angle: {min: 0, max: Math.PI * 2},
            force: {min: 5, max: 15},
            maxParticles: 100 * scale,
            duration: 100,
            particleOptions: {
                color: ['#ff4500', '#ff7f50', '#ffa500', '#ffcc00', '#ff8c00'],
                size: {min: 2 * scale, max: 8 * scale},
                life: {min: 500, max: 1500},
                opacity: {min: 0.6, max: 1.0},
                blendMode: 'lighter',
                gravity: 0.05,
                drag: 0.02,
                fade: true,
                shrink: true
            }
        });
    },
    
    teleport: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('teleport_' + Date.now(), {
            position: {x, y},
            rate: 40 * scale,
            angle: {min: 0, max: Math.PI * 2},
            force: {min: 1, max: 3},
            maxParticles: 80 * scale,
            duration: 1000,
            emissionShape: 'circle',
            emissionRadius: 10 * scale,
            particleOptions: {
                color: ['#9c27b0', '#ce93d8', '#ba68c8', '#7b1fa2'],
                size: {min: 3 * scale, max: 8 * scale},
                life: {min: 500, max: 1000},
                opacity: {min: 0.5, max: 0.9},
                blendMode: 'lighter',
                gravity: -0.05,
                drag: 0.01,
                fade: true,
                shrink: true
            }
        });
    },
    
    heal: (x: number, y: number, scale: number = 1): ParticleEmitter => {
        return window.ParticleSystem.createEmitter('heal_' + Date.now(), {
            position: {x, y},
            rate: 20 * scale,
            angle: -Math.PI/2, // Para cima
            spread: Math.PI,
            force: {min: 1, max: 2},
            maxParticles: 50 * scale,
            duration: 1000,
            emissionShape: 'circle',
            emissionRadius: 20 * scale,
            particleOptions: {
                color: ['#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'],
                size: {min: 5 * scale, max: 10 * scale},
                life: {min: 800, max: 1500},
                opacity: {min: 0.6, max: 0.9},
                blendMode: 'lighter',
                gravity: -0.05,
                drag: 0.01,
                fade: true,
                shrink: true,
                shape: 'circle'
            }
        });
    }
};

// Expor efeitos pré-definidos
window.ParticleEffects = ParticleEffects;

// Exportar tipos para uso em TypeScript
export {
    Particle,
    ParticleEmitter,
    ParticleSystem,
    ParticleEffects,
    ParticleOptions,
    EmitterOptions
};
