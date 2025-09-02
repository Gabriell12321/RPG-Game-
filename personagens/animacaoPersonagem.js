// Sistema de animação avançado para o personagem principal
// Inclui animações de espada, ataque, pulo, corrida e movimentos

(function(window) {
    // Constantes e configurações
    const SPRITE_SIZE = 32; // Tamanho base dos sprites em pixels
    const FRAMES_PER_SECOND = 60;
    
    // Estados de animação
    const ANIMATION_STATES = {
        IDLE: 'idle',
        WALK: 'walk',
        RUN: 'run',
        JUMP: 'jump',
        FALL: 'fall',
        ATTACK_SLASH: 'attack_slash',
        ATTACK_THRUST: 'attack_thrust',
        ATTACK_OVERHEAD: 'attack_overhead',
        BLOCK: 'block',
        HURT: 'hurt',
        DEATH: 'death',
        DODGE: 'dodge'
    };
    
    // Configurações de animação para cada estado
    const ANIMATIONS = {
        [ANIMATION_STATES.IDLE]: {
            frames: 4,
            frameDuration: 0.25, // segundos por frame
            loop: true,
            showWeapon: true
        },
        [ANIMATION_STATES.WALK]: {
            frames: 6,
            frameDuration: 0.12,
            loop: true,
            showWeapon: true
        },
        [ANIMATION_STATES.RUN]: {
            frames: 6,
            frameDuration: 0.08,
            loop: true,
            showWeapon: true
        },
        [ANIMATION_STATES.JUMP]: {
            frames: 6,
            frameDuration: 0.1,
            loop: false,
            showWeapon: true
        },
        [ANIMATION_STATES.FALL]: {
            frames: 3,
            frameDuration: 0.15,
            loop: true,
            showWeapon: true
        },
        [ANIMATION_STATES.ATTACK_SLASH]: {
            frames: 6,
            frameDuration: 0.06,
            loop: false,
            showWeapon: true,
            hitFrame: 3 // frame onde o golpe conecta
        },
        [ANIMATION_STATES.ATTACK_THRUST]: {
            frames: 5,
            frameDuration: 0.06,
            loop: false,
            showWeapon: true,
            hitFrame: 2
        },
        [ANIMATION_STATES.ATTACK_OVERHEAD]: {
            frames: 7,
            frameDuration: 0.07,
            loop: false,
            showWeapon: true,
            hitFrame: 4
        },
        [ANIMATION_STATES.BLOCK]: {
            frames: 3,
            frameDuration: 0.1,
            loop: false,
            showWeapon: true
        },
        [ANIMATION_STATES.HURT]: {
            frames: 3,
            frameDuration: 0.08,
            loop: false,
            showWeapon: true
        },
        [ANIMATION_STATES.DEATH]: {
            frames: 8,
            frameDuration: 0.15,
            loop: false,
            showWeapon: false
        },
        [ANIMATION_STATES.DODGE]: {
            frames: 5,
            frameDuration: 0.07,
            loop: false,
            showWeapon: true
        }
    };
    
    // Direções do personagem
    const DIRECTIONS = {
        DOWN: 0,
        RIGHT: 1,
        UP: 2,
        LEFT: 3
    };
    
    // Tipos de armas
    const WEAPON_TYPES = {
        NONE: 'none',
        SWORD: 'sword',
        DAGGER: 'dagger',
        AXE: 'axe',
        MACE: 'mace',
        SPEAR: 'spear'
    };
    
    // Definição das armas
    const WEAPONS = {
        [WEAPON_TYPES.SWORD]: {
            width: 16,
            height: 32,
            pivot: {x: 4, y: 28}, // ponto de fixação na mão
            damage: 15,
            speed: 1.0,
            color: "#C0C0C0", // prateada
            guardColor: "#8B4513", // cabo marrom
            attackReach: 1.5,
            traits: ['slash', 'thrust', 'overhead']
        },
        [WEAPON_TYPES.DAGGER]: {
            width: 10,
            height: 18,
            pivot: {x: 3, y: 15},
            damage: 8,
            speed: 1.4,
            color: "#A0A0A0",
            guardColor: "#2F4F4F",
            attackReach: 0.8,
            traits: ['slash', 'thrust']
        },
        [WEAPON_TYPES.AXE]: {
            width: 20,
            height: 28,
            pivot: {x: 6, y: 25},
            damage: 20,
            speed: 0.8,
            color: "#A0A0A0",
            guardColor: "#8B4513",
            attackReach: 1.3,
            traits: ['slash', 'overhead']
        }
    };
    
    // Classe de animação do personagem
    class CharacterAnimator {
        constructor() {
            // Estado atual
            this.state = {
                animationState: ANIMATION_STATES.IDLE,
                direction: DIRECTIONS.DOWN,
                currentFrame: 0,
                frameTimer: 0,
                inAir: false,
                isMoving: false,
                isRunning: false,
                isAttacking: false,
                attackComboCount: 0,
                lastAttackTime: 0,
                attackCooldown: false,
                weaponType: WEAPON_TYPES.SWORD,
                weaponVisible: true,
                hitEffects: [],
                breathingOffset: 0,
                breathingDirection: 1,
                jumpVelocity: 0,
                verticalPosition: 0,
                groundLevel: 0
            };
            
            // Configurações
            this.config = {
                comboTimeWindow: 800, // ms para registrar próximo ataque no combo
                attackCooldown: 300,  // ms de cooldown entre ataques
                jumpHeight: 40,       // altura máxima do pulo em pixels
                jumpSpeed: 200,       // velocidade inicial do pulo
                gravity: 800,         // gravidade aplicada durante o pulo
                runSpeedThreshold: 0.7 // velocidade mínima para considerar corrida
            };
            
            // Cores do personagem
            this.colors = {
                skin: "#FFD1B7",       // pele
                hair: "#8B4513",       // cabelo
                eyes: "#0066ff",       // olhos
                shirt: "#4169E1",      // camisa
                pants: "#333333",      // calça
                shoes: "#111111",      // sapatos
                armor: "#8090A0",      // armadura (se tiver)
                detail: "#AA3333"      // detalhes/acessórios
            };
            
            // Inicializar respiração
            this._initBreathing();
        }
        
        // Inicializar efeito de respiração
        _initBreathing() {
            this.state.breathingOffset = 0;
            this.state.breathingDirection = 1;
            
            // Atualizar a respiração a cada 50ms
            setInterval(() => {
                this.state.breathingOffset += 0.05 * this.state.breathingDirection;
                
                // Inverter direção nos limites
                if (this.state.breathingOffset >= 1) {
                    this.state.breathingDirection = -1;
                } else if (this.state.breathingOffset <= 0) {
                    this.state.breathingDirection = 1;
                }
            }, 50);
        }
        
        // Atualizar estado da animação
        update(deltaTime, inputs) {
            // Inputs deve ser um objeto com as seguintes propriedades:
            // { 
            //   moving: bool, 
            //   direction: DIRECTIONS, 
            //   running: bool, 
            //   jumping: bool, 
            //   attacking: bool,
            //   attackType: string (opcional)
            // }
            
            const state = this.state;
            
            // Atualizar direção se estiver se movendo
            if (inputs.direction !== undefined) {
                state.direction = inputs.direction;
            }
            
            // Atualizar estado de movimento
            state.isMoving = inputs.moving || false;
            state.isRunning = inputs.running || false;
            
            // Processar salto
            if (inputs.jumping && !state.inAir) {
                this._startJump();
            }
            
            // Atualizar física do salto
            if (state.inAir) {
                this._updateJump(deltaTime);
            }
            
            // Processar ataque
            if (inputs.attacking && !state.attackCooldown) {
                this._startAttack(inputs.attackType);
            }
            
            // Atualizar cooldown de ataque
            if (state.attackCooldown) {
                state.lastAttackTime += deltaTime * 1000;
                if (state.lastAttackTime > this.config.attackCooldown) {
                    state.attackCooldown = false;
                }
            }
            
            // Determinar estado de animação atual
            this._determineAnimationState();
            
            // Atualizar frame atual
            this._updateAnimationFrame(deltaTime);
            
            // Atualizar efeitos de impacto
            this._updateHitEffects(deltaTime);
        }
        
        // Iniciar um salto
        _startJump() {
            this.state.inAir = true;
            this.state.jumpVelocity = this.config.jumpSpeed;
            this.state.verticalPosition = 0;
            this.state.animationState = ANIMATION_STATES.JUMP;
            this.state.currentFrame = 0;
            this.state.frameTimer = 0;
        }
        
        // Atualizar física do salto
        _updateJump(deltaTime) {
            // Aplicar gravidade à velocidade vertical
            this.state.jumpVelocity -= this.config.gravity * deltaTime;
            
            // Atualizar posição vertical
            this.state.verticalPosition += this.state.jumpVelocity * deltaTime;
            
            // Verificar colisão com o chão
            if (this.state.verticalPosition <= 0) {
                this.state.verticalPosition = 0;
                this.state.inAir = false;
                this.state.jumpVelocity = 0;
                // Adicionar efeito de impacto ao pousar
                this._addHitEffect(0, 0, 'land');
            }
            
            // Atualizar estado de animação
            if (this.state.jumpVelocity < 0 && this.state.animationState !== ANIMATION_STATES.FALL) {
                // Começando a cair
                this.state.animationState = ANIMATION_STATES.FALL;
                this.state.currentFrame = 0;
                this.state.frameTimer = 0;
            }
        }
        
        // Iniciar um ataque
        _startAttack(attackType) {
            const now = Date.now();
            const timeSinceLastAttack = now - this.state.lastAttackTime;
            
            // Verificar combo
            if (this.state.isAttacking && timeSinceLastAttack < this.config.comboTimeWindow) {
                this.state.attackComboCount = (this.state.attackComboCount + 1) % 3;
            } else {
                this.state.attackComboCount = 0;
            }
            
            // Determinar tipo de ataque
            let attackAnimation;
            if (attackType) {
                // Usar tipo específico fornecido
                switch (attackType) {
                    case 'slash': 
                        attackAnimation = ANIMATION_STATES.ATTACK_SLASH; 
                        break;
                    case 'thrust': 
                        attackAnimation = ANIMATION_STATES.ATTACK_THRUST; 
                        break;
                    case 'overhead': 
                        attackAnimation = ANIMATION_STATES.ATTACK_OVERHEAD; 
                        break;
                    default: 
                        attackAnimation = ANIMATION_STATES.ATTACK_SLASH;
                }
            } else {
                // Alternar entre tipos baseado no combo
                switch (this.state.attackComboCount) {
                    case 0: 
                        attackAnimation = ANIMATION_STATES.ATTACK_SLASH; 
                        break;
                    case 1: 
                        attackAnimation = ANIMATION_STATES.ATTACK_THRUST; 
                        break;
                    case 2: 
                        attackAnimation = ANIMATION_STATES.ATTACK_OVERHEAD; 
                        break;
                }
            }
            
            // Configurar estado de ataque
            this.state.isAttacking = true;
            this.state.animationState = attackAnimation;
            this.state.currentFrame = 0;
            this.state.frameTimer = 0;
            this.state.lastAttackTime = now;
            
            // Adicionar efeito de impacto
            const animation = ANIMATIONS[attackAnimation];
            if (animation.hitFrame) {
                // Programar efeito de hit para o frame correto
                setTimeout(() => {
                    if (this.state.animationState === attackAnimation) {
                        // Direção do hit baseada na direção do personagem
                        let hitX = 0, hitY = 0;
                        const reach = WEAPONS[this.state.weaponType].attackReach || 1;
                        
                        switch (this.state.direction) {
                            case DIRECTIONS.DOWN:
                                hitY = SPRITE_SIZE * reach;
                                break;
                            case DIRECTIONS.UP:
                                hitY = -SPRITE_SIZE * reach;
                                break;
                            case DIRECTIONS.LEFT:
                                hitX = -SPRITE_SIZE * reach;
                                break;
                            case DIRECTIONS.RIGHT:
                                hitX = SPRITE_SIZE * reach;
                                break;
                        }
                        
                        this._addHitEffect(hitX, hitY, 'weapon');
                    }
                }, animation.frameDuration * animation.hitFrame * 1000);
            }
        }
        
        // Determinar o estado de animação atual
        _determineAnimationState() {
            // Se já estiver em uma animação que não deve ser interrompida, manter
            if (this.state.isAttacking || this.state.inAir) {
                return;
            }
            
            // Selecionar estado baseado no movimento
            if (this.state.isMoving) {
                this.state.animationState = this.state.isRunning ? 
                    ANIMATION_STATES.RUN : ANIMATION_STATES.WALK;
            } else {
                this.state.animationState = ANIMATION_STATES.IDLE;
            }
        }
        
        // Atualizar o frame atual da animação
        _updateAnimationFrame(deltaTime) {
            const currentAnimation = ANIMATIONS[this.state.animationState];
            if (!currentAnimation) return;
            
            // Atualizar temporizador de frame
            this.state.frameTimer += deltaTime;
            
            // Verificar se é hora de avançar para o próximo frame
            if (this.state.frameTimer >= currentAnimation.frameDuration) {
                this.state.frameTimer = 0;
                this.state.currentFrame++;
                
                // Verificar fim da animação
                if (this.state.currentFrame >= currentAnimation.frames) {
                    if (currentAnimation.loop) {
                        // Reiniciar animação em loop
                        this.state.currentFrame = 0;
                    } else {
                        // Encerrar animação sem loop
                        this.state.currentFrame = currentAnimation.frames - 1;
                        
                        // Lidar com o fim de animações específicas
                        if (this.state.isAttacking && 
                            [ANIMATION_STATES.ATTACK_SLASH, 
                             ANIMATION_STATES.ATTACK_THRUST, 
                             ANIMATION_STATES.ATTACK_OVERHEAD].includes(this.state.animationState)) {
                            // Fim do ataque
                            this.state.isAttacking = false;
                            this.state.attackCooldown = true;
                            // Voltar para estado neutro
                            this._determineAnimationState();
                        }
                    }
                }
            }
        }
        
        // Adicionar um efeito de impacto
        _addHitEffect(x, y, type) {
            this.state.hitEffects.push({
                x: x,
                y: y,
                type: type,
                frame: 0,
                maxFrames: type === 'weapon' ? 5 : 3,
                duration: 0.05, // segundos por frame
                timer: 0
            });
        }
        
        // Atualizar efeitos de impacto
        _updateHitEffects(deltaTime) {
            for (let i = this.state.hitEffects.length - 1; i >= 0; i--) {
                const effect = this.state.hitEffects[i];
                
                // Atualizar timer
                effect.timer += deltaTime;
                
                // Avançar frame se necessário
                if (effect.timer >= effect.duration) {
                    effect.timer = 0;
                    effect.frame++;
                    
                    // Remover efeito quando terminar
                    if (effect.frame >= effect.maxFrames) {
                        this.state.hitEffects.splice(i, 1);
                    }
                }
            }
        }
        
        // Desenhar o personagem com animação
        render(ctx, x, y, width, height) {
            // Ajustar para o deslocamento vertical (pulo/queda)
            const drawY = y - this.state.verticalPosition;
            
            ctx.save();
            
            // Desenhar sombra no chão
            this._drawShadow(ctx, x, y, width);
            
            // Desenhar corpo base
            this._drawCharacterBody(ctx, x, drawY, width, height);
            
            // Desenhar arma se necessário
            if (ANIMATIONS[this.state.animationState].showWeapon && this.state.weaponType !== WEAPON_TYPES.NONE) {
                this._drawWeapon(ctx, x, drawY, width, height);
            }
            
            // Desenhar efeitos de hit
            this._drawHitEffects(ctx, x, drawY);
            
            ctx.restore();
        }
        
        // Desenhar sombra
        _drawShadow(ctx, x, y, width) {
            const shadowWidth = width * 0.7;
            const shadowHeight = width * 0.2;
            
            // Calcular opacidade baseada na altura do pulo
            const shadowOpacity = Math.max(0.1, 0.5 - (this.state.verticalPosition / (this.config.jumpHeight * 2)));
            
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
            ctx.beginPath();
            ctx.ellipse(
                x + (width / 2), 
                y + (width / 4), 
                shadowWidth / 2, 
                shadowHeight / 2, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
        
        // Desenhar o corpo do personagem
        _drawCharacterBody(ctx, x, y, width, height) {
            const halfWidth = width / 2;
            const direction = this.state.direction;
            const animState = this.state.animationState;
            const frame = this.state.currentFrame;
            
            // Ajustes de respiração
            const breathOffset = this.state.breathingOffset * 0.5;
            
            // Ajustes de animação baseados no estado atual
            let headBobOffset = 0;
            let bodyAngle = 0;
            let armOffset = 0;
            let legOffset = 0;
            
            // Aplicar diferentes ajustes baseado no estado de animação
            switch (animState) {
                case ANIMATION_STATES.WALK:
                    // Efeito de caminhada
                    headBobOffset = Math.sin(frame * 0.5) * 1.5;
                    armOffset = Math.sin(frame * 0.5 + 0.5) * 3;
                    legOffset = Math.sin(frame * 0.5) * 5;
                    break;
                    
                case ANIMATION_STATES.RUN:
                    // Efeito de corrida (mais pronunciado)
                    headBobOffset = Math.sin(frame * 0.7) * 3;
                    bodyAngle = Math.sin(frame * 0.7) * 0.1;
                    armOffset = Math.sin(frame * 0.7 + 0.8) * 6;
                    legOffset = Math.sin(frame * 0.7) * 10;
                    break;
                    
                case ANIMATION_STATES.JUMP:
                    // Efeito de pulo
                    bodyAngle = 0.1;
                    armOffset = 5 - (frame * 2);
                    legOffset = frame < 3 ? frame * 5 : 15 - (frame * 2);
                    break;
                    
                case ANIMATION_STATES.FALL:
                    // Efeito de queda
                    bodyAngle = -0.1;
                    armOffset = 5 + Math.sin(frame * 0.5) * 3;
                    legOffset = -5;
                    break;
                    
                case ANIMATION_STATES.ATTACK_SLASH:
                    // Efeito de ataque de corte
                    bodyAngle = Math.sin(frame / 6 * Math.PI) * 0.2;
                    armOffset = frame < 3 ? frame * 8 : 24 - (frame * 4);
                    break;
                    
                case ANIMATION_STATES.ATTACK_THRUST:
                    // Efeito de ataque de estocada
                    bodyAngle = frame < 3 ? frame * 0.05 : 0.15 - (frame * 0.03);
                    armOffset = frame < 2 ? frame * 15 : 30 - (frame * 5);
                    break;
                    
                case ANIMATION_STATES.ATTACK_OVERHEAD:
                    // Efeito de ataque de cima para baixo
                    bodyAngle = Math.sin(frame / 7 * Math.PI) * 0.3;
                    armOffset = frame < 4 ? -20 + (frame * 10) : 20 - ((frame - 4) * 5);
                    break;
                    
                case ANIMATION_STATES.IDLE:
                default:
                    // Efeito de respiração suave
                    headBobOffset = breathOffset;
                    break;
            }
            
            // Aplicar transformações baseadas na direção
            ctx.save();
            ctx.translate(x + halfWidth, y + height * 0.8);
            ctx.rotate(bodyAngle);
            ctx.translate(-(x + halfWidth), -(y + height * 0.8));
            
            // Desenhar pernas
            this._drawLegs(ctx, x, y, width, height, legOffset, direction);
            
            // Desenhar torso
            this._drawTorso(ctx, x, y, width, height, direction);
            
            // Desenhar braços
            this._drawArms(ctx, x, y, width, height, armOffset, direction);
            
            // Desenhar cabeça
            this._drawHead(ctx, x, y - headBobOffset, width, height, direction);
            
            ctx.restore();
        }
        
        // Desenhar cabeça do personagem
        _drawHead(ctx, x, y, width, height, direction) {
            const headSize = width * 0.7;
            const headX = x + (width - headSize) / 2;
            const headY = y + height * 0.1;
            
            // Desenhar forma da cabeça
            ctx.fillStyle = this.colors.skin;
            ctx.beginPath();
            ctx.arc(
                headX + headSize / 2,
                headY + headSize / 2,
                headSize / 2,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Desenhar cabelo
            ctx.fillStyle = this.colors.hair;
            
            // Diferente estilo de cabelo por direção
            switch (direction) {
                case DIRECTIONS.DOWN:
                    // Cabelo visto de frente
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize / 2,
                        headY + headSize * 0.4,
                        headSize / 2,
                        Math.PI, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                    
                case DIRECTIONS.UP:
                    // Cabelo visto de costas (cobre mais da cabeça)
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize / 2,
                        headY + headSize * 0.4,
                        headSize / 2.1,
                        Math.PI, Math.PI * 2
                    );
                    ctx.rect(
                        headX, 
                        headY + headSize * 0.4, 
                        headSize, 
                        headSize * 0.3
                    );
                    ctx.fill();
                    break;
                    
                case DIRECTIONS.LEFT:
                case DIRECTIONS.RIGHT:
                    // Cabelo visto de lado
                    const flipFactor = direction === DIRECTIONS.LEFT ? -1 : 1;
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize / 2,
                        headY + headSize * 0.4,
                        headSize / 2,
                        Math.PI, Math.PI * 2
                    );
                    // Adicionar volume lateral
                    ctx.rect(
                        headX + (flipFactor > 0 ? headSize * 0.5 : 0),
                        headY + headSize * 0.4,
                        headSize * 0.5,
                        headSize * 0.4
                    );
                    ctx.fill();
                    break;
            }
            
            // Desenhar olhos (depende da direção)
            this._drawEyes(ctx, headX, headY, headSize, direction);
        }
        
        // Desenhar olhos
        _drawEyes(ctx, headX, headY, headSize, direction) {
            const eyeSize = headSize * 0.15;
            
            ctx.fillStyle = this.colors.eyes;
            
            switch (direction) {
                case DIRECTIONS.DOWN:
                    // Olhos para frente
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.35,
                        headY + headSize * 0.5,
                        eyeSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.65,
                        headY + headSize * 0.5,
                        eyeSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Pupilas
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.35,
                        headY + headSize * 0.5,
                        eyeSize * 0.5,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.65,
                        headY + headSize * 0.5,
                        eyeSize * 0.5,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                    
                case DIRECTIONS.LEFT:
                    // Olho esquerdo visível
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.3,
                        headY + headSize * 0.5,
                        eyeSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Pupila
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.25,
                        headY + headSize * 0.5,
                        eyeSize * 0.5,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                    
                case DIRECTIONS.RIGHT:
                    // Olho direito visível
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.7,
                        headY + headSize * 0.5,
                        eyeSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Pupila
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(
                        headX + headSize * 0.75,
                        headY + headSize * 0.5,
                        eyeSize * 0.5,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                    
                case DIRECTIONS.UP:
                    // Nenhum olho visível (de costas)
                    break;
            }
        }
        
        // Desenhar torso
        _drawTorso(ctx, x, y, width, height, direction) {
            const torsoWidth = width * 0.6;
            const torsoHeight = height * 0.3;
            const torsoX = x + (width - torsoWidth) / 2;
            const torsoY = y + height * 0.3;
            
            // Desenhar forma do torso
            ctx.fillStyle = this.colors.shirt;
            ctx.beginPath();
            ctx.roundRect(
                torsoX,
                torsoY,
                torsoWidth,
                torsoHeight,
                width * 0.1
            );
            ctx.fill();
            
            // Adicionar detalhes ao torso
            switch (direction) {
                case DIRECTIONS.DOWN:
                    // Detalhes frontais (fivelas, cinto, etc)
                    ctx.fillStyle = this.colors.detail;
                    ctx.fillRect(
                        torsoX + torsoWidth * 0.4,
                        torsoY,
                        torsoWidth * 0.2,
                        torsoHeight * 0.3
                    );
                    break;
                    
                case DIRECTIONS.UP:
                    // Detalhes traseiros
                    break;
                    
                case DIRECTIONS.LEFT:
                case DIRECTIONS.RIGHT:
                    // Detalhes laterais
                    break;
            }
        }
        
        // Desenhar braços
        _drawArms(ctx, x, y, width, height, armOffset, direction) {
            const armWidth = width * 0.2;
            const armHeight = height * 0.3;
            const shoulderY = y + height * 0.3;
            
            // Ajustar posição baseada na direção
            let leftArmX, rightArmX;
            
            switch (direction) {
                case DIRECTIONS.DOWN:
                    leftArmX = x + width * 0.15;
                    rightArmX = x + width * 0.65;
                    break;
                    
                case DIRECTIONS.UP:
                    leftArmX = x + width * 0.15;
                    rightArmX = x + width * 0.65;
                    break;
                    
                case DIRECTIONS.LEFT:
                    // Braço visível à direita
                    rightArmX = x + width * 0.7;
                    leftArmX = x + width * 0.1; // Parcialmente oculto
                    break;
                    
                case DIRECTIONS.RIGHT:
                    // Braço visível à esquerda
                    leftArmX = x + width * 0.1;
                    rightArmX = x + width * 0.7; // Parcialmente oculto
                    break;
            }
            
            // Aplicar offset de animação
            const leftArmY = shoulderY + armOffset;
            const rightArmY = shoulderY - armOffset;
            
            // Desenhar braços
            ctx.fillStyle = this.colors.skin;
            
            // Braço esquerdo
            ctx.beginPath();
            ctx.roundRect(
                leftArmX,
                leftArmY,
                armWidth,
                armHeight,
                width * 0.05
            );
            ctx.fill();
            
            // Braço direito
            ctx.beginPath();
            ctx.roundRect(
                rightArmX,
                rightArmY,
                armWidth,
                armHeight,
                width * 0.05
            );
            ctx.fill();
            
            // Adicionar manga da camisa
            ctx.fillStyle = this.colors.shirt;
            
            // Manga esquerda
            ctx.beginPath();
            ctx.roundRect(
                leftArmX,
                leftArmY,
                armWidth,
                armHeight * 0.4,
                width * 0.05
            );
            ctx.fill();
            
            // Manga direita
            ctx.beginPath();
            ctx.roundRect(
                rightArmX,
                rightArmY,
                armWidth,
                armHeight * 0.4,
                width * 0.05
            );
            ctx.fill();
        }
        
        // Desenhar pernas
        _drawLegs(ctx, x, y, width, height, legOffset, direction) {
            const legWidth = width * 0.2;
            const legHeight = height * 0.3;
            const hipY = y + height * 0.6;
            
            // Ajustar posição baseada na direção
            const leftLegX = x + width * 0.25;
            const rightLegX = x + width * 0.55;
            
            // Aplicar offset de animação
            const leftLegY = hipY + legOffset;
            const rightLegY = hipY - legOffset;
            
            // Desenhar calças
            ctx.fillStyle = this.colors.pants;
            
            // Perna esquerda
            ctx.beginPath();
            ctx.roundRect(
                leftLegX,
                leftLegY,
                legWidth,
                legHeight,
                width * 0.05
            );
            ctx.fill();
            
            // Perna direita
            ctx.beginPath();
            ctx.roundRect(
                rightLegX,
                rightLegY,
                legWidth,
                legHeight,
                width * 0.05
            );
            ctx.fill();
            
            // Desenhar sapatos
            ctx.fillStyle = this.colors.shoes;
            
            // Sapato esquerdo
            ctx.beginPath();
            ctx.roundRect(
                leftLegX - legWidth * 0.1,
                leftLegY + legHeight - legHeight * 0.2,
                legWidth * 1.2,
                legHeight * 0.2,
                width * 0.03
            );
            ctx.fill();
            
            // Sapato direito
            ctx.beginPath();
            ctx.roundRect(
                rightLegX - legWidth * 0.1,
                rightLegY + legHeight - legHeight * 0.2,
                legWidth * 1.2,
                legHeight * 0.2,
                width * 0.03
            );
            ctx.fill();
        }
        
        // Desenhar arma (espada, etc)
        _drawWeapon(ctx, x, y, width, height, direction) {
            const weaponConfig = WEAPONS[this.state.weaponType];
            if (!weaponConfig) return;
            
            // Determinar a posição da mão do personagem
            let handX, handY;
            const direction = this.state.direction;
            
            // Ajustar com base na direção e animação
            switch (direction) {
                case DIRECTIONS.DOWN:
                    handX = x + width * 0.7;
                    handY = y + height * 0.55;
                    break;
                    
                case DIRECTIONS.UP:
                    handX = x + width * 0.7;
                    handY = y + height * 0.45;
                    break;
                    
                case DIRECTIONS.LEFT:
                    handX = x + width * 0.25;
                    handY = y + height * 0.5;
                    break;
                    
                case DIRECTIONS.RIGHT:
                    handX = x + width * 0.75;
                    handY = y + height * 0.5;
                    break;
            }
            
            // Ajustar para a animação atual
            let weaponAngle = 0;
            let weaponFlip = direction === DIRECTIONS.LEFT ? -1 : 1;
            
            // Modificar ângulo baseado no estado de animação
            switch (this.state.animationState) {
                case ANIMATION_STATES.ATTACK_SLASH:
                    // Animação de corte horizontal
                    const slashProgress = this.state.currentFrame / ANIMATIONS[ANIMATION_STATES.ATTACK_SLASH].frames;
                    weaponAngle = (slashProgress - 0.5) * Math.PI * weaponFlip;
                    break;
                    
                case ANIMATION_STATES.ATTACK_THRUST:
                    // Animação de estocada
                    const thrustProgress = this.state.currentFrame / ANIMATIONS[ANIMATION_STATES.ATTACK_THRUST].frames;
                    weaponAngle = weaponFlip > 0 ? Math.PI * 0.1 : Math.PI * 0.9;
                    // Ajustar posição para "esticar" durante a estocada
                    if (thrustProgress > 0.2 && thrustProgress < 0.7) {
                        handX += weaponFlip * width * 0.2;
                    }
                    break;
                    
                case ANIMATION_STATES.ATTACK_OVERHEAD:
                    // Animação de golpe de cima para baixo
                    const overheadProgress = this.state.currentFrame / ANIMATIONS[ANIMATION_STATES.ATTACK_OVERHEAD].frames;
                    weaponAngle = Math.PI * (-0.5 + overheadProgress) * weaponFlip;
                    break;
                    
                case ANIMATION_STATES.IDLE:
                    // Posição de descanso
                    weaponAngle = Math.PI * 0.2 * weaponFlip;
                    break;
                    
                case ANIMATION_STATES.WALK:
                case ANIMATION_STATES.RUN:
                    // Posição durante movimento
                    weaponAngle = Math.PI * 0.25 * weaponFlip;
                    // Adicionar leve balanço
                    weaponAngle += Math.sin(this.state.currentFrame * 0.5) * 0.1 * weaponFlip;
                    break;
                    
                case ANIMATION_STATES.JUMP:
                case ANIMATION_STATES.FALL:
                    // Posição no ar
                    weaponAngle = Math.PI * 0.3 * weaponFlip;
                    break;
            }
            
            // Desenhar a arma
            ctx.save();
            ctx.translate(handX, handY);
            ctx.rotate(weaponAngle);
            
            // Escala da arma baseada no tamanho do personagem
            const weaponScale = width / SPRITE_SIZE;
            
            // Ajustar posição para o ponto de pivot da arma
            ctx.translate(-weaponConfig.pivot.x * weaponScale, -weaponConfig.pivot.y * weaponScale);
            
            // Desenhar espada
            if (this.state.weaponType === WEAPON_TYPES.SWORD) {
                // Lâmina
                ctx.fillStyle = weaponConfig.color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(weaponConfig.width * weaponScale, 0);
                ctx.lineTo(weaponConfig.width * 0.8 * weaponScale, weaponConfig.height * 0.8 * weaponScale);
                ctx.lineTo(weaponConfig.width * 0.5 * weaponScale, weaponConfig.height * weaponScale);
                ctx.lineTo(weaponConfig.width * 0.2 * weaponScale, weaponConfig.height * 0.8 * weaponScale);
                ctx.closePath();
                ctx.fill();
                
                // Guarda (cruz da espada)
                ctx.fillStyle = weaponConfig.guardColor;
                ctx.beginPath();
                ctx.rect(
                    -weaponConfig.width * 0.5 * weaponScale,
                    weaponConfig.height * 0.05 * weaponScale,
                    weaponConfig.width * 2 * weaponScale,
                    weaponConfig.height * 0.1 * weaponScale
                );
                ctx.fill();
                
                // Cabo
                ctx.fillStyle = weaponConfig.guardColor;
                ctx.beginPath();
                ctx.rect(
                    weaponConfig.width * 0.3 * weaponScale,
                    weaponConfig.height * 0.15 * weaponScale,
                    weaponConfig.width * 0.4 * weaponScale,
                    weaponConfig.height * 0.3 * weaponScale
                );
                ctx.fill();
            } else if (this.state.weaponType === WEAPON_TYPES.DAGGER) {
                // Desenho de adaga
                // (código similar, mas com formas diferentes)
            } else if (this.state.weaponType === WEAPON_TYPES.AXE) {
                // Desenho de machado
                // (código similar, mas com formas diferentes)
            }
            
            ctx.restore();
        }
        
        // Desenhar efeitos de impacto
        _drawHitEffects(ctx, x, y) {
            for (const effect of this.state.hitEffects) {
                ctx.save();
                
                // Posição do efeito
                const effectX = x + effect.x;
                const effectY = y + effect.y;
                
                if (effect.type === 'weapon') {
                    // Efeito de impacto de arma (faísca/corte)
                    const size = 30 - effect.frame * 5;
                    
                    // Gradiente para o brilho
                    const gradient = ctx.createRadialGradient(
                        effectX, effectY, 0,
                        effectX, effectY, size
                    );
                    
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.7)');
                    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(effectX, effectY, size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Linhas de impacto
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 2;
                    
                    for (let i = 0; i < 4; i++) {
                        const angle = Math.PI * 2 * (i / 4);
                        const length = size * 1.5;
                        
                        ctx.beginPath();
                        ctx.moveTo(effectX, effectY);
                        ctx.lineTo(
                            effectX + Math.cos(angle) * length,
                            effectY + Math.sin(angle) * length
                        );
                        ctx.stroke();
                    }
                } else if (effect.type === 'land') {
                    // Efeito de pouso
                    const size = 20 - effect.frame * 5;
                    
                    // Círculos de poeira
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
                    
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.PI * 2 * (i / 5);
                        const distance = size * 0.5;
                        
                        ctx.beginPath();
                        ctx.arc(
                            effectX + Math.cos(angle) * distance,
                            effectY + Math.sin(angle) * distance,
                            size * 0.3,
                            0, Math.PI * 2
                        );
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        }
        
        // Ajustar tipo de arma
        setWeapon(type) {
            if (WEAPONS[type]) {
                this.state.weaponType = type;
            } else {
                console.warn(`Tipo de arma desconhecido: ${type}`);
            }
        }
    }
    
    // Exportar para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.CharacterAnimator = CharacterAnimator;
    window.GameSystem.constants = window.GameSystem.constants || {};
    window.GameSystem.constants.DIRECTIONS = DIRECTIONS;
    window.GameSystem.constants.ANIMATION_STATES = ANIMATION_STATES;
    window.GameSystem.constants.WEAPON_TYPES = WEAPON_TYPES;
    
})(window);
