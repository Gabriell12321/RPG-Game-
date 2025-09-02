// Sistema avançado de partículas
// Cria efeitos visuais 2D/3D para ambientes, ataques, e atmosferas

(function(window) {
    // Constantes
    const BASE_W = window.GameSystem?.constants?.BASE_W || 320;
    const BASE_H = window.GameSystem?.constants?.BASE_H || 180;
    
    // Sistemas de partículas ativos
    const particleSystems = [];
    
    // Tipos de partículas predefinidos
    const particleTypes = {
        // Ambientais
        DUST: {
            color: ['#887766', '#998877', '#aa9988'],
            size: { min: 1, max: 2 },
            alpha: { start: 0.3, end: 0 },
            lifespan: { min: 2000, max: 4000 },
            speed: { min: 5, max: 20 },
            gravity: -0.01,
            rotation: true,
            shape: 'circle',
        },
        
        EMBERS: {
            color: ['#ff7700', '#ff9900', '#ffaa00', '#ff5500'],
            size: { min: 1, max: 3 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 1000, max: 3000 },
            speed: { min: 10, max: 30 },
            gravity: -0.05,
            glow: true,
            shape: 'circle',
        },
        
        RAIN: {
            color: ['#8899aa', '#7788aa'],
            size: { min: 1, max: 2 },
            stretch: { x: 1, y: 3 },
            alpha: { start: 0.5, end: 0.3 },
            lifespan: { min: 500, max: 1000 },
            speed: { min: 80, max: 120 },
            direction: { min: 80, max: 100 },
            gravity: 0.2,
            shape: 'line',
            collide: true,
            splash: true
        },
        
        SNOW: {
            color: ['#ffffff', '#eeeeff'],
            size: { min: 1, max: 3 },
            alpha: { start: 0.8, end: 0.5 },
            lifespan: { min: 3000, max: 6000 },
            speed: { min: 10, max: 30 },
            direction: { min: 80, max: 100 },
            gravity: 0.01,
            drift: 0.2,
            rotation: true,
            shape: 'flake',
        },
        
        FOG: {
            color: ['#aabbcc', '#99aabb', '#8899aa'],
            size: { min: 30, max: 80 },
            alpha: { start: 0.1, end: 0 },
            lifespan: { min: 5000, max: 10000 },
            speed: { min: 5, max: 15 },
            direction: { min: -20, max: 20 },
            drift: 0.1,
            shape: 'cloud',
        },
        
        // Efeitos de ação
        BLOOD: {
            color: ['#880000', '#990000', '#aa0000'],
            size: { min: 2, max: 4 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 800, max: 1500 },
            speed: { min: 20, max: 60 },
            gravity: 0.1,
            shape: 'circle',
            collide: true,
            splat: true
        },
        
        EXPLOSION: {
            color: ['#ff9900', '#ff7700', '#ff5500', '#ff0000'],
            size: { min: 4, max: 12 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 400, max: 1000 },
            speed: { min: 30, max: 100 },
            acceleration: 0.9,
            glow: true,
            shape: 'circle',
        },
        
        SPARKS: {
            color: ['#ffffff', '#ffffaa', '#ffff77'],
            size: { min: 1, max: 2 },
            alpha: { start: 1, end: 0 },
            lifespan: { min: 300, max: 800 },
            speed: { min: 60, max: 120 },
            gravity: 0.1,
            glow: true,
            shape: 'line',
        },
        
        MAGIC: {
            color: ['#5500ff', '#7700ff', '#9900ff'],
            size: { min: 3, max: 6 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 1000, max: 2000 },
            speed: { min: 10, max: 40 },
            gravity: -0.05,
            glow: true,
            pulse: true,
            shape: 'star',
        },
        
        SMOKE: {
            color: ['#555555', '#666666', '#777777'],
            size: { min: 8, max: 16 },
            growth: { start: 0.5, end: 2 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 2000, max: 4000 },
            speed: { min: 10, max: 30 },
            gravity: -0.03,
            rotation: true,
            shape: 'cloud',
        }
    };
    
    // Classe para partícula individual
    class Particle {
        constructor(config) {
            // Posição e movimento
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.z = config.z || 0; // Para simular profundidade
            
            // Velocidade inicial
            const speed = config.speed || { min: 10, max: 20 };
            const actualSpeed = speed.min + Math.random() * (speed.max - speed.min);
            
            // Direção
            const direction = config.direction || { min: 0, max: 360 };
            const angle = (direction.min + Math.random() * (direction.max - direction.min)) * Math.PI / 180;
            
            this.velocity = {
                x: Math.cos(angle) * actualSpeed,
                y: Math.sin(angle) * actualSpeed,
                z: 0
            };
            
            // Aparência
            this.color = Array.isArray(config.color) 
                ? config.color[Math.floor(Math.random() * config.color.length)] 
                : config.color || '#ffffff';
                
            // Tamanho
            const size = config.size || { min: 2, max: 4 };
            this.size = size.min + Math.random() * (size.max - size.min);
            this.originalSize = this.size;
            
            // Crescimento ao longo do tempo
            this.growth = config.growth || { start: 1, end: 1 };
            
            // Stretch (para formas não circulares)
            this.stretch = config.stretch || { x: 1, y: 1 };
            
            // Transparência
            this.alpha = config.alpha?.start || 1;
            this.startAlpha = config.alpha?.start || 1;
            this.endAlpha = config.alpha?.end || 0;
            
            // Duração da vida
            const lifespan = config.lifespan || { min: 1000, max: 2000 };
            this.lifespan = lifespan.min + Math.random() * (lifespan.max - lifespan.min);
            this.age = 0;
            
            // Física
            this.gravity = config.gravity || 0;
            this.acceleration = config.acceleration || 1;
            this.drift = config.drift || 0;
            
            // Rotação
            this.rotation = config.rotation ? Math.random() * Math.PI * 2 : 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
            
            // Efeitos especiais
            this.glow = config.glow || false;
            this.pulse = config.pulse || false;
            this.pulsePhase = Math.random() * Math.PI * 2;
            
            // Colisão
            this.collide = config.collide || false;
            this.splat = config.splat || false;
            this.splash = config.splash || false;
            
            // Forma
            this.shape = config.shape || 'circle';
        }
        
        update(deltaTime) {
            // Envelhecer
            this.age += deltaTime;
            
            // Atualizar posição
            this.x += this.velocity.x * (deltaTime / 1000);
            this.y += this.velocity.y * (deltaTime / 1000);
            this.z += this.velocity.z * (deltaTime / 1000);
            
            // Aplicar gravidade
            this.velocity.y += this.gravity * deltaTime;
            
            // Aplicar desaceleração
            this.velocity.x *= Math.pow(this.acceleration, deltaTime / 1000);
            this.velocity.y *= Math.pow(this.acceleration, deltaTime / 1000);
            
            // Aplicar deriva (movimento aleatório)
            if (this.drift > 0) {
                this.velocity.x += (Math.random() - 0.5) * this.drift * deltaTime / 1000;
                this.velocity.y += (Math.random() - 0.5) * this.drift * deltaTime / 1000;
            }
            
            // Atualizar rotação
            if (this.rotationSpeed) {
                this.rotation += this.rotationSpeed * deltaTime / 1000;
            }
            
            // Calcular progressão da vida (0 a 1)
            const lifeProgress = Math.min(1, this.age / this.lifespan);
            
            // Interpolar transparência
            this.alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * lifeProgress;
            
            // Interpolar tamanho (crescimento)
            const growthFactor = this.growth.start + (this.growth.end - this.growth.start) * lifeProgress;
            this.size = this.originalSize * growthFactor;
            
            // Pulso (variação de tamanho ao longo do tempo)
            if (this.pulse) {
                const pulseFactor = 0.2 * Math.sin(this.pulsePhase + lifeProgress * Math.PI * 6);
                this.size *= (1 + pulseFactor);
            }
            
            // Verificar colisões
            if (this.collide && this.y > BASE_H - 10) {
                // Colisão com o chão
                this.y = BASE_H - 10;
                
                if (this.splash) {
                    // Efeito de splash (gota de chuva)
                    this.velocity.y = -this.velocity.y * 0.2;
                    this.velocity.x *= 0.8;
                    this.size *= 0.8;
                } else if (this.splat) {
                    // Efeito de splat (sangue)
                    this.shape = 'splat';
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                    this.lifespan = this.age + 500; // Permanece mais um pouco
                } else {
                    // Rebater
                    this.velocity.y = -this.velocity.y * 0.5;
                    this.velocity.x *= 0.9;
                }
            }
            
            // Verificar se ainda está viva
            return this.age < this.lifespan;
        }
        
        render(ctx) {
            if (this.alpha <= 0) return;
            
            ctx.save();
            
            // Posição
            ctx.translate(this.x, this.y);
            
            // Rotação
            if (this.rotation) {
                ctx.rotate(this.rotation);
            }
            
            // Configurar opacidade
            ctx.globalAlpha = this.alpha;
            
            // Efeito de brilho
            if (this.glow) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = this.size * 2;
            }
            
            // Desenhar baseado na forma
            ctx.fillStyle = this.color;
            
            switch (this.shape) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'square':
                    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                    break;
                    
                case 'line':
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size * this.stretch.y);
                    ctx.lineTo(0, this.size * this.stretch.y);
                    ctx.lineWidth = this.size * this.stretch.x;
                    ctx.strokeStyle = this.color;
                    ctx.stroke();
                    break;
                    
                case 'star':
                    drawStar(ctx, 0, 0, 5, this.size, this.size/2);
                    break;
                    
                case 'flake':
                    drawSnowflake(ctx, 0, 0, this.size);
                    break;
                    
                case 'cloud':
                    drawCloud(ctx, 0, 0, this.size);
                    break;
                    
                case 'splat':
                    drawSplat(ctx, 0, 0, this.size);
                    break;
            }
            
            ctx.restore();
        }
    }
    
    // Classe para sistema de partículas
    class ParticleSystem {
        constructor(config) {
            this.particles = [];
            this.emitter = {
                x: config.x || 0,
                y: config.y || 0,
                width: config.width || 0,
                height: config.height || 0,
                depth: config.depth || 0
            };
            
            this.particleConfig = config.particleConfig || {};
            this.maxParticles = config.maxParticles || 100;
            this.emissionRate = config.emissionRate || 5; // Partículas por segundo
            this.duration = config.duration || -1; // -1 para infinito
            
            this.lastEmission = 0;
            this.age = 0;
            this.active = true;
            
            // Para efeitos de jitter na emissão
            this.burstMin = config.burstMin || 1;
            this.burstMax = config.burstMax || 1;
            
            // Eventos
            this.onComplete = config.onComplete;
        }
        
        update(deltaTime) {
            // Envelhecer o sistema
            this.age += deltaTime;
            
            // Verificar se o sistema deve terminar
            if (this.duration > 0 && this.age > this.duration) {
                this.active = false;
            }
            
            // Atualizar partículas existentes
            for (let i = this.particles.length - 1; i >= 0; i--) {
                // Se a partícula morreu, removê-la
                if (!this.particles[i].update(deltaTime)) {
                    this.particles.splice(i, 1);
                }
            }
            
            // Emitir novas partículas se ativo
            if (this.active) {
                this.lastEmission += deltaTime;
                const emissionInterval = 1000 / this.emissionRate;
                
                while (this.lastEmission > emissionInterval && this.particles.length < this.maxParticles) {
                    // Determinar quantas partículas emitir neste burst
                    const burstSize = Math.floor(this.burstMin + Math.random() * (this.burstMax - this.burstMin + 1));
                    
                    for (let i = 0; i < burstSize; i++) {
                        if (this.particles.length >= this.maxParticles) break;
                        
                        // Posição de emissão (dentro da área do emissor)
                        const x = this.emitter.x + (Math.random() - 0.5) * this.emitter.width;
                        const y = this.emitter.y + (Math.random() - 0.5) * this.emitter.height;
                        const z = (Math.random() - 0.5) * this.emitter.depth;
                        
                        // Criar partícula com configuração
                        const particleConfig = { ...this.particleConfig, x, y, z };
                        this.particles.push(new Particle(particleConfig));
                    }
                    
                    this.lastEmission -= emissionInterval;
                }
            }
            
            // Verificar se o sistema está completamente inativo
            if (!this.active && this.particles.length === 0) {
                if (this.onComplete) this.onComplete();
                return false; // Sinal para remover o sistema
            }
            
            return true; // Manter o sistema ativo
        }
        
        render(ctx) {
            // Renderizar todas as partículas
            for (const particle of this.particles) {
                particle.render(ctx);
            }
        }
        
        stop() {
            this.active = false;
        }
    }
    
    // Funções auxiliares para desenhar formas complexas
    
    function drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            
            const pointX = x + Math.cos(angle) * radius;
            const pointY = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(pointX, pointY);
            } else {
                ctx.lineTo(pointX, pointY);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    function drawSnowflake(ctx, x, y, size) {
        const branches = 6;
        const length = size;
        
        for (let i = 0; i < branches; i++) {
            const angle = (Math.PI * 2 * i) / branches;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            
            // Tronco principal
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, length);
            ctx.lineWidth = size / 5;
            ctx.stroke();
            
            // Ramificações
            const branchCount = 2;
            const branchLength = length * 0.4;
            
            for (let j = 1; j <= branchCount; j++) {
                const branchY = length * j / (branchCount + 1);
                
                // Ramo esquerdo
                ctx.beginPath();
                ctx.moveTo(0, branchY);
                ctx.lineTo(-branchLength, branchY + branchLength * 0.5);
                ctx.lineWidth = size / 7;
                ctx.stroke();
                
                // Ramo direito
                ctx.beginPath();
                ctx.moveTo(0, branchY);
                ctx.lineTo(branchLength, branchY + branchLength * 0.5);
                ctx.lineWidth = size / 7;
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    function drawCloud(ctx, x, y, size) {
        const bubbleCount = 3 + Math.floor(size / 4);
        
        // Círculo central
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculos adicionais ao redor
        for (let i = 0; i < bubbleCount; i++) {
            const angle = (Math.PI * 2 * i) / bubbleCount;
            const distance = size * 0.3;
            
            const bubbleX = x + Math.cos(angle) * distance;
            const bubbleY = y + Math.sin(angle) * distance;
            const bubbleSize = size * (0.3 + Math.random() * 0.3);
            
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawSplat(ctx, x, y, size) {
        // Forma principal
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Respingos
        const splatCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < splatCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = size * (1 + Math.random() * 0.5);
            
            const splatX = x + Math.cos(angle) * distance;
            const splatY = y + Math.sin(angle) * distance;
            const splatSize = size * (0.2 + Math.random() * 0.3);
            
            ctx.beginPath();
            ctx.arc(splatX, splatY, splatSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Linha conectando ao splat principal
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(splatX, splatY);
            ctx.lineWidth = splatSize * 0.7;
            ctx.stroke();
        }
    }
    
    // Criar efeito de partículas
    function createEffect(type, x, y, options = {}) {
        // Verificar se o tipo existe
        if (!particleTypes[type]) {
            console.error(`Tipo de partícula desconhecido: ${type}`);
            return null;
        }
        
        // Mesclar configuração básica com opções personalizadas
        const particleConfig = { ...particleTypes[type], ...options.particleOverrides };
        
        // Configurar sistema de partículas
        const systemConfig = {
            x: x,
            y: y,
            width: options.width || 0,
            height: options.height || 0,
            depth: options.depth || 0,
            particleConfig: particleConfig,
            maxParticles: options.maxParticles || 100,
            emissionRate: options.emissionRate || 10,
            duration: options.duration || -1,
            burstMin: options.burstMin || 1,
            burstMax: options.burstMax || 1,
            onComplete: options.onComplete
        };
        
        // Criar e adicionar sistema
        const system = new ParticleSystem(systemConfig);
        particleSystems.push(system);
        
        return system;
    }
    
    // Atualizar todos os sistemas de partículas
    function update(deltaTime) {
        // Atualizar sistemas e remover os inativos
        for (let i = particleSystems.length - 1; i >= 0; i--) {
            if (!particleSystems[i].update(deltaTime)) {
                particleSystems.splice(i, 1);
            }
        }
    }
    
    // Renderizar todos os sistemas de partículas
    function render(ctx) {
        for (const system of particleSystems) {
            system.render(ctx);
        }
    }
    
    // Limpar todos os sistemas
    function clear() {
        particleSystems.length = 0;
    }
    
    // Criar efeitos ambientais
    function createAmbientEffect(type, options = {}) {
        switch (type) {
            case 'rain':
                return createEffect('RAIN', BASE_W/2, -10, {
                    width: BASE_W * 1.2,
                    height: 5,
                    emissionRate: options.intensity || 100,
                    maxParticles: options.intensity * 3 || 300,
                    duration: -1
                });
                
            case 'snow':
                return createEffect('SNOW', BASE_W/2, -10, {
                    width: BASE_W * 1.2,
                    height: 5,
                    emissionRate: options.intensity || 30,
                    maxParticles: options.intensity * 5 || 150,
                    duration: -1
                });
                
            case 'fog':
                return createEffect('FOG', BASE_W/2, BASE_H - 30, {
                    width: BASE_W,
                    height: 20,
                    emissionRate: options.intensity || 2,
                    maxParticles: options.intensity * 10 || 20,
                    duration: -1
                });
                
            case 'dust':
                return createEffect('DUST', BASE_W/2, BASE_H/2, {
                    width: BASE_W,
                    height: BASE_H,
                    emissionRate: options.intensity || 5,
                    maxParticles: options.intensity * 8 || 40,
                    duration: -1
                });
                
            case 'embers':
                return createEffect('EMBERS', options.x || BASE_W/2, options.y || BASE_H/2, {
                    width: options.width || 20,
                    height: options.height || 5,
                    emissionRate: options.intensity || 8,
                    maxParticles: options.intensity * 3 || 24,
                    duration: -1
                });
        }
    }
    
    // Exportar funções para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.particles = {
        createEffect,
        createAmbientEffect,
        update,
        render,
        clear,
        getActiveSystems: () => particleSystems.length,
        particleTypes
    };
    
})(window);
