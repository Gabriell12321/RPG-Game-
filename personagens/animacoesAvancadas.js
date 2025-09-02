// Módulo de animações avançadas para o personagem principal
const CharacterAnimations = {
    // Configurações de animação
    config: {
        frameDelay: 8,         // Tempo entre frames (menor = mais rápido)
        attackDuration: 20,    // Duração da animação de ataque
        dashDistance: 15,      // Distância do dash durante ataque
        dashDuration: 10,      // Duração do dash
        hitEffectDuration: 15, // Duração dos efeitos de impacto
        comboTimeout: 500,     // Tempo para encadear combos (ms)
    },
    
    // Estado de animação atual
    state: {
        currentFrame: 0,       // Frame atual da animação
        frameTimer: 0,         // Contador para troca de frames
        isAttacking: false,    // Se está atacando
        attackType: 'slash',   // Tipo de ataque (slash, thrust, heavy)
        attackPhase: 'startup', // Fase do ataque (startup, active, recovery)
        attackFrame: 0,        // Frame da animação de ataque
        attackTimer: 0,        // Tempo restante do ataque
        attackCombo: 0,        // Contador de combo atual
        lastAttackTime: 0,     // Momento do último ataque (para combos)
        dashTimer: 0,          // Tempo restante do dash
        hitEffects: [],        // Efeitos de impacto ativos
        breathEffect: 0,       // Efeito de respiração (0-100)
        idleTimer: 0,          // Tempo ocioso para animações especiais
        eyeBlinkTimer: 0,      // Temporizador para piscar os olhos
        hairSwayOffset: 0,     // Deslocamento da animação de cabelo
        sweatParticles: [],    // Partículas de suor/esforço
        directionVectors: {    // Vetores de direção para cada direção
            up: {x: 0, y: -1},
            down: {x: 0, y: 1},
            left: {x: -1, y: 0},
            right: {x: 1, y: 0}
        }
    },
    
    // Inicializar o sistema de animação
    init: function() {
        this.state.eyeBlinkTimer = Math.random() * 120 + 60;
        this.state.lastAttackTime = Date.now();
        return this;
    },
    
    // Atualizar animações
    update: function(jogador, tick) {
        const state = this.state;
        const config = this.config;
        
        // Atualizar temporizador de frames
        state.frameTimer++;
        
        // Atualizar animação de idle
        state.idleTimer = jogador.animacao.andando ? 0 : state.idleTimer + 1;
        
        // Atualizar efeito de respiração
        state.breathEffect = Math.sin(tick * 0.05) * 0.5;
        
        // Atualizar balanço do cabelo
        state.hairSwayOffset = Math.sin(tick * 0.03) * 0.7;
        
        // Atualizar piscada de olhos
        if (state.eyeBlinkTimer > 0) {
            state.eyeBlinkTimer--;
        } else {
            state.eyeBlinkTimer = Math.random() * 120 + 60;
        }
        
        // Gerenciar animação de ataque
        if (state.isAttacking) {
            state.attackTimer--;
            state.attackFrame = config.attackDuration - state.attackTimer;
            
            // Determinar a fase do ataque
            if (state.attackFrame < config.attackDuration * 0.2) {
                state.attackPhase = 'startup';
            } else if (state.attackFrame < config.attackDuration * 0.6) {
                state.attackPhase = 'active';
            } else {
                state.attackPhase = 'recovery';
            }
            
            // Aplicar dash durante a fase ativa do ataque
            if (state.attackPhase === 'active' && state.dashTimer > 0) {
                state.dashTimer--;
                
                // Mover jogador na direção do ataque
                const direction = state.directionVectors[jogador.animacao.direcao] || 
                                 state.directionVectors.down;
                
                const dashSpeed = (config.dashDistance / config.dashDuration) * 
                                 (1 - (config.dashDuration - state.dashTimer) / config.dashDuration);
                
                jogador.posicao.x += direction.x * dashSpeed;
                jogador.posicao.y += direction.y * dashSpeed;
                
                // Limitar posição para os limites da tela
                jogador.posicao.x = Math.max(jogador.sprite.width/2, 
                                          Math.min(320 - jogador.sprite.width/2, jogador.posicao.x));
                jogador.posicao.y = Math.max(jogador.sprite.height/2, 
                                          Math.min(180 - jogador.sprite.height/2, jogador.posicao.y));
            }
            
            // Finalizar ataque
            if (state.attackTimer <= 0) {
                state.isAttacking = false;
            }
        }
        
        // Atualizar efeitos de impacto
        for (let i = state.hitEffects.length - 1; i >= 0; i--) {
            state.hitEffects[i].duration--;
            if (state.hitEffects[i].duration <= 0) {
                state.hitEffects.splice(i, 1);
            }
        }
        
        // Atualizar partículas de suor
        for (let i = state.sweatParticles.length - 1; i >= 0; i--) {
            const particle = state.sweatParticles[i];
            particle.y += particle.vy;
            particle.opacity -= 0.05;
            
            if (particle.opacity <= 0) {
                state.sweatParticles.splice(i, 1);
            }
        }
        
        // Gerar partículas de suor quando estiver com vida baixa ou cansado
        if (jogador.vida < 30 && Math.random() < 0.03) {
            this.addSweatParticle(jogador);
        }
        
        // Verificar timeout do combo
        if (state.attackCombo > 0 && Date.now() - state.lastAttackTime > config.comboTimeout) {
            state.attackCombo = 0;
        }
        
        return this;
    },
    
    // Iniciar um ataque
    startAttack: function(jogador, type = 'slash') {
        const state = this.state;
        const config = this.config;
        
        // Verificar combo
        const now = Date.now();
        if (now - state.lastAttackTime < config.comboTimeout) {
            state.attackCombo = (state.attackCombo + 1) % 3;
        } else {
            state.attackCombo = 0;
        }
        
        state.lastAttackTime = now;
        state.isAttacking = true;
        state.attackType = type;
        state.attackTimer = config.attackDuration;
        state.attackFrame = 0;
        state.attackPhase = 'startup';
        state.dashTimer = config.dashDuration;
        
        return this;
    },
    
    // Adicionar efeito de impacto
    addHitEffect: function(x, y, size = 10, color = '#ffffff') {
        this.state.hitEffects.push({
            x: x,
            y: y,
            size: size,
            color: color,
            duration: this.config.hitEffectDuration
        });
        
        return this;
    },
    
    // Adicionar partícula de suor
    addSweatParticle: function(jogador) {
        const offsetX = (Math.random() * 6) - 3;
        const offsetY = -4 - (Math.random() * 2);
        
        this.state.sweatParticles.push({
            x: offsetX,
            y: offsetY,
            vy: 0.2 + Math.random() * 0.3,
            opacity: 0.7 + Math.random() * 0.3
        });
        
        return this;
    },
    
    // Renderizar o personagem com animações
    renderCharacter: function(ctx, jogador, tick) {
        const state = this.state;
        const x = jogador.posicao.x;
        const y = jogador.posicao.y;
        
        // Direção atual do jogador
        const direcao = jogador.animacao.direcao || 'down';
        
        // Offset de bobbing (subida e descida) quando andando
        const bobbing = jogador.animacao.andando ? 
            Math.sin(jogador.animacao.frame * Math.PI) * 0.7 : 
            Math.sin(tick * 0.05) * 0.3; // Respiração suave quando parado
        
        // Offset de ataque (usado para posições durante ataques)
        let attackOffsetX = 0;
        let attackOffsetY = 0;
        
        // Offsets de animação para partes do corpo
        const frameOffset = jogador.animacao.andando ? 
            Math.sin(jogador.animacao.frame * Math.PI / 2) * 0.5 : 0;
            
        let bracoOffset = jogador.animacao.andando ? 
            Math.sin(jogador.animacao.frame * Math.PI / 2) * 1.5 : 
            state.breathEffect * 0.5;
            
        let pernaOffset = jogador.animacao.andando ? 
            Math.sin(jogador.animacao.frame * Math.PI / 2) * 2 : 0;
        
        // Cores base do personagem
        const corPele = jogador.aparencia.corPele || '#FFD1B7';
        const corRoupa = jogador.vida > 50 ? 
            jogador.aparencia.corRoupa || '#4169E1' : 
            '#AA3333';
        const corCabelo = jogador.aparencia.corCabelo || '#8B4513';
        const corOlhos = jogador.aparencia.corOlhos || '#0066ff';
        
        // Modificadores de animação para ataque
        if (state.isAttacking) {
            const attackProgress = state.attackFrame / this.config.attackDuration;
            
            // Diferentes animações de ataque baseadas no tipo e fase
            if (state.attackType === 'slash') {
                if (state.attackPhase === 'startup') {
                    // Preparação para o golpe
                    bracoOffset = -3 - (state.attackFrame * 0.3);
                    
                    // Recuar um pouco antes do ataque
                    if (direcao === 'right') attackOffsetX = -2;
                    if (direcao === 'left') attackOffsetX = 2;
                    if (direcao === 'down') attackOffsetY = -1;
                    if (direcao === 'up') attackOffsetY = 1;
                    
                } else if (state.attackPhase === 'active') {
                    // Golpe rápido para frente
                    bracoOffset = 3 + (state.attackFrame * 0.2);
                    
                    // Movimento para frente durante o golpe
                    if (direcao === 'right') attackOffsetX = 3;
                    if (direcao === 'left') attackOffsetX = -3;
                    if (direcao === 'down') attackOffsetY = 2;
                    if (direcao === 'up') attackOffsetY = -2;
                    
                } else { // recovery
                    // Retorno à posição normal
                    bracoOffset = 2 - (state.attackFrame * 0.1);
                }
            } else if (state.attackType === 'thrust') {
                // Ataque de estocada
                if (state.attackPhase === 'startup') {
                    bracoOffset = -2;
                } else if (state.attackPhase === 'active') {
                    bracoOffset = 4;
                    // Movimento mais longo para frente
                    if (direcao === 'right') attackOffsetX = 4;
                    if (direcao === 'left') attackOffsetX = -4;
                    if (direcao === 'down') attackOffsetY = 3;
                    if (direcao === 'up') attackOffsetY = -3;
                } else {
                    bracoOffset = 1;
                }
            } else { // heavy
                // Ataque pesado
                if (state.attackPhase === 'startup') {
                    bracoOffset = -4;
                    // Recuo maior
                    if (direcao === 'right') attackOffsetX = -3;
                    if (direcao === 'left') attackOffsetX = 3;
                    if (direcao === 'down') attackOffsetY = -2;
                    if (direcao === 'up') attackOffsetY = 2;
                } else if (state.attackPhase === 'active') {
                    bracoOffset = 5;
                    // Movimento mais longo e forte
                    if (direcao === 'right') attackOffsetX = 5;
                    if (direcao === 'left') attackOffsetX = -5;
                    if (direcao === 'down') attackOffsetY = 4;
                    if (direcao === 'up') attackOffsetY = -4;
                } else {
                    bracoOffset = 2;
                }
            }
            
            // Modificar o offset das pernas durante o ataque
            pernaOffset = state.attackPhase === 'active' ? 2 : pernaOffset;
        }
        
        // Efeito de tremor quando está com pouca vida
        const healthShake = jogador.vida < 30 ? (Math.random() * 1.5 - 0.75) : 0;
        
        // Desenhar sombra abaixo do personagem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + attackOffsetX, y + 8 + attackOffsetY, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // === DESENHAR PERSONAGEM ===
        
        // Pernas
        // Perna esquerda
        ctx.fillStyle = '#333333'; // Calça escura
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y + 3 + bobbing + pernaOffset + attackOffsetY, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y + 5 + bobbing + pernaOffset + attackOffsetY, 3, 1);
        
        // Perna direita
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + attackOffsetX + healthShake, 
                   y + 3 + bobbing - pernaOffset + attackOffsetY, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(x + attackOffsetX + healthShake, 
                   y + 5 + bobbing - pernaOffset + attackOffsetY, 3, 1);
        
        // Sapatos
        ctx.fillStyle = '#111111'; // Sapatos pretos
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y + 8 + bobbing + pernaOffset + attackOffsetY, 3, 1);
        ctx.fillRect(x + attackOffsetX + healthShake, 
                   y + 8 + bobbing - pernaOffset + attackOffsetY, 3, 1);
        
        // Corpo (tronco)
        ctx.fillStyle = corRoupa;
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y - 2 + bobbing + attackOffsetY, 6, 6);
        
        // Detalhes da roupa
        if (direcao !== 'up' && direcao !== 'back') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + attackOffsetX + healthShake, 
                       y + bobbing + attackOffsetY, 1, 3);
        }
        
        // Cinto
        ctx.fillStyle = '#5E2C04';
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y + 3 + bobbing + attackOffsetY, 6, 1);
        
        // === BRAÇOS ===
        // Braço esquerdo
        ctx.save();
        ctx.translate(x - 3 + attackOffsetX + healthShake, 
                     y + bobbing + attackOffsetY);
        
        // Rotação do braço baseada na direção e ataque
        let rotacaoEsquerda = 0;
        
        if (state.isAttacking) {
            // Rotação específica para ataque
            if (direcao === 'right') {
                rotacaoEsquerda = Math.PI/4 + bracoOffset * 0.2;
            } else if (direcao === 'left') {
                rotacaoEsquerda = -Math.PI/3 + bracoOffset * 0.1;
            } else if (direcao === 'up') {
                rotacaoEsquerda = -Math.PI/4 + bracoOffset * 0.15;
            } else { // down
                rotacaoEsquerda = Math.PI/4 + bracoOffset * 0.15;
            }
        } else {
            // Rotação normal
            if (direcao === 'right' || direcao === 'left') {
                rotacaoEsquerda = direcao === 'right' ? Math.PI/6 : -Math.PI/6;
                rotacaoEsquerda += bracoOffset * 0.5;
            } else {
                rotacaoEsquerda = bracoOffset * 0.4;
            }
        }
        
        ctx.rotate(rotacaoEsquerda);
        ctx.fillStyle = corRoupa;
        ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
        ctx.fillStyle = corPele;
        ctx.fillRect(-1, 4, 2, 2); // Mão
        
        // Desenhar arma ou efeito de ataque no braço esquerdo
        if (state.isAttacking && (direcao === 'left' || direcao === 'up')) {
            // Desenhar efeito de corte
            if (state.attackPhase === 'active') {
                const slashColor = state.attackType === 'heavy' ? 
                    'rgba(255, 50, 50, 0.8)' : 'rgba(200, 200, 255, 0.8)';
                
                ctx.strokeStyle = slashColor;
                ctx.lineWidth = state.attackType === 'heavy' ? 3 : 2;
                
                // Arco do golpe
                ctx.beginPath();
                ctx.arc(0, 3, 8, -Math.PI/2, Math.PI/2, false);
                ctx.stroke();
                
                // Partículas do golpe
                for (let i = 0; i < 5; i++) {
                    const angle = -Math.PI/2 + (Math.PI * i / 4);
                    const dist = 8 + Math.random() * 3;
                    ctx.fillStyle = slashColor;
                    ctx.fillRect(Math.cos(angle) * dist - 1, 
                              3 + Math.sin(angle) * dist - 1, 
                              2, 2);
                }
            }
        }
        
        ctx.restore();
        
        // Braço direito
        ctx.save();
        ctx.translate(x + 3 + attackOffsetX + healthShake, 
                     y + bobbing + attackOffsetY);
        
        // Rotação para o braço direito
        let rotacaoDireita = 0;
        
        if (state.isAttacking) {
            // Rotação específica para ataque
            if (direcao === 'right') {
                rotacaoDireita = -Math.PI/3 + bracoOffset * 0.1;
            } else if (direcao === 'left') {
                rotacaoDireita = Math.PI/4 + bracoOffset * 0.2;
            } else if (direcao === 'up') {
                rotacaoDireita = Math.PI/4 + bracoOffset * 0.15;
            } else { // down
                rotacaoDireita = -Math.PI/4 + bracoOffset * 0.15;
            }
        } else {
            // Rotação normal
            if (direcao === 'right' || direcao === 'left') {
                rotacaoDireita = direcao === 'right' ? -Math.PI/6 : Math.PI/6;
                rotacaoDireita -= bracoOffset * 0.5;
            } else {
                rotacaoDireita = -bracoOffset * 0.4;
            }
        }
        
        ctx.rotate(rotacaoDireita);
        ctx.fillStyle = corRoupa;
        ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
        ctx.fillStyle = corPele;
        ctx.fillRect(-1, 4, 2, 2); // Mão
        
        // Desenhar arma ou efeito de ataque no braço direito
        if (state.isAttacking && (direcao === 'right' || direcao === 'down')) {
            // Desenhar efeito de corte
            if (state.attackPhase === 'active') {
                const slashColor = state.attackType === 'heavy' ? 
                    'rgba(255, 50, 50, 0.8)' : 'rgba(200, 200, 255, 0.8)';
                
                ctx.strokeStyle = slashColor;
                ctx.lineWidth = state.attackType === 'heavy' ? 3 : 2;
                
                // Arco do golpe
                ctx.beginPath();
                ctx.arc(0, 3, 8, -Math.PI/2, Math.PI/2, false);
                ctx.stroke();
                
                // Partículas do golpe
                for (let i = 0; i < 5; i++) {
                    const angle = -Math.PI/2 + (Math.PI * i / 4);
                    const dist = 8 + Math.random() * 3;
                    ctx.fillStyle = slashColor;
                    ctx.fillRect(Math.cos(angle) * dist - 1, 
                              3 + Math.sin(angle) * dist - 1, 
                              2, 2);
                }
            }
        }
        
        ctx.restore();
        
        // === CABEÇA E ROSTO ===
        ctx.fillStyle = corPele;
        ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                   y - 8 + bobbing + attackOffsetY, 6, 7);
        
        // Cabelo com animação baseada na direção
        ctx.fillStyle = corCabelo;
        
        const hairOffset = state.hairSwayOffset;
        
        if (direcao === 'up' || direcao === 'back') {
            // Parte de trás do cabelo (visível de costas)
            ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                       y - 8 + bobbing + attackOffsetY, 6, 2);
            ctx.fillRect(x - 4 + attackOffsetX + hairOffset + healthShake, 
                       y - 6 + bobbing + attackOffsetY, 8, 2);
        } else {
            // Frente e lados do cabelo com mais detalhes
            ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                       y - 9 + bobbing + attackOffsetY, 6, 2); // Franja
            
            // Lado esquerdo com movimento
            ctx.fillRect(x - 4 + attackOffsetX - hairOffset * 0.5 + healthShake, 
                       y - 7 + bobbing + attackOffsetY, 1, 4);
            
            // Lado direito com movimento
            ctx.fillRect(x + 3 + attackOffsetX + hairOffset * 0.5 + healthShake, 
                       y - 7 + bobbing + attackOffsetY, 1, 4);
        }
        
        // Expressão do rosto baseada na direção, vida e estado
        if (direcao !== 'up' && direcao !== 'back') {
            // Determinar expressão com base na vida/estado
            const isBlinking = state.eyeBlinkTimer < 5;
            const isInPain = jogador.vida < 30;
            const isScared = jogador.sanidade < 30;
            const isAttacking = state.isAttacking && state.attackPhase === 'active';
            
            // Olhos
            if (!isBlinking) {
                if (direcao === 'left') {
                    // Olhando para a esquerda
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 2);
                    
                    // Pupila com cor baseada no estado
                    ctx.fillStyle = isInPain ? '#ff0000' : 
                                   isScared ? '#ff00ff' :
                                   isAttacking ? '#ffaa00' : corOlhos;
                                   
                    ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 1, 1);
                    
                } else if (direcao === 'right') {
                    // Olhando para a direita
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 2);
                    
                    // Pupila com cor baseada no estado
                    ctx.fillStyle = isInPain ? '#ff0000' : 
                                   isScared ? '#ff00ff' :
                                   isAttacking ? '#ffaa00' : corOlhos;
                                   
                    ctx.fillRect(x + 2 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 1, 1);
                    
                } else {
                    // Olhando para frente
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x - 2 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 2);
                    ctx.fillRect(x + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 2);
                    
                    // Pupilas
                    ctx.fillStyle = isInPain ? '#ff0000' : 
                                   isScared ? '#ff00ff' :
                                   isAttacking ? '#ffaa00' : corOlhos;
                                   
                    // Durante o ataque, as pupilas se contraem
                    if (isAttacking) {
                        ctx.fillRect(x - 1 + attackOffsetX + healthShake, 
                                   y - 5 + bobbing + attackOffsetY, 1, 1);
                        ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                                   y - 5 + bobbing + attackOffsetY, 1, 1);
                    } else {
                        ctx.fillRect(x - 1 + attackOffsetX + healthShake, 
                                   y - 5 + bobbing + attackOffsetY, 1, 1);
                        ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                                   y - 5 + bobbing + attackOffsetY, 1, 1);
                    }
                }
            } else {
                // Olhos piscando
                if (direcao === 'left') {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 1);
                } else if (direcao === 'right') {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 1);
                } else {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - 2 + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 1);
                    ctx.fillRect(x + attackOffsetX + healthShake, 
                               y - 5 + bobbing + attackOffsetY, 2, 1);
                }
            }
            
            // Boca com expressão
            if (isInPain) {
                // Expressão de dor
                ctx.fillStyle = '#ff3333';
                ctx.fillRect(x - 1 + attackOffsetX + healthShake, 
                           y - 2 + bobbing + attackOffsetY, 2, 1);
            } else if (isScared) {
                // Expressão de medo
                ctx.strokeStyle = '#333333';
                ctx.beginPath();
                ctx.arc(x + attackOffsetX + healthShake, 
                      y - 2 + bobbing + attackOffsetY, 1, 0, Math.PI, false);
                ctx.stroke();
            } else if (isAttacking) {
                // Expressão de ataque (determinação)
                ctx.fillStyle = '#aa3333';
                ctx.fillRect(x - 2 + attackOffsetX + healthShake, 
                           y - 2 + bobbing + attackOffsetY, 4, 1);
            } else {
                // Expressão neutra
                ctx.fillStyle = '#cc6666';
                ctx.fillRect(x - 1 + attackOffsetX + healthShake, 
                           y - 2 + bobbing + attackOffsetY, 2, 1);
            }
            
            // Sobrancelhas expressivas durante ataque ou estados específicos
            if (isAttacking) {
                // Sobrancelhas determinadas (franzidas)
                ctx.fillStyle = corCabelo;
                ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                           y - 6 + bobbing + attackOffsetY, 2, 1);
                ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                           y - 6 + bobbing + attackOffsetY, 2, 1);
            } else if (isScared) {
                // Sobrancelhas elevadas (medo)
                ctx.fillStyle = corCabelo;
                ctx.fillRect(x - 3 + attackOffsetX + healthShake, 
                           y - 7 + bobbing + attackOffsetY, 2, 1);
                ctx.fillRect(x + 1 + attackOffsetX + healthShake, 
                           y - 7 + bobbing + attackOffsetY, 2, 1);
            }
        }
        
        // === PARTÍCULAS E EFEITOS ESPECIAIS ===
        
        // Partículas de suor
        for (const particle of state.sweatParticles) {
            ctx.fillStyle = `rgba(200, 230, 255, ${particle.opacity})`;
            ctx.fillRect(x + particle.x + attackOffsetX, 
                       y + particle.y + bobbing + attackOffsetY, 
                       1, 2);
        }
        
        // Efeitos de impacto dos ataques
        for (const effect of state.hitEffects) {
            const effectProgress = 1 - (effect.duration / this.config.hitEffectDuration);
            const size = effect.size * (1 + effectProgress);
            const alpha = 1 - effectProgress;
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
            ctx.stroke();
            
            // Linhas de impacto
            for (let i = 0; i < 4; i++) {
                const angle = Math.PI / 2 * i + (effectProgress * Math.PI / 4);
                const length = size * 1.2;
                
                ctx.beginPath();
                ctx.moveTo(effect.x + Math.cos(angle) * size,
                         effect.y + Math.sin(angle) * size);
                ctx.lineTo(effect.x + Math.cos(angle) * (size + length),
                         effect.y + Math.sin(angle) * (size + length));
                ctx.stroke();
            }
        }
        
        // Efeito de aura durante ataque
        if (state.isAttacking && state.attackPhase === 'active') {
            const attackType = state.attackType;
            const auraColor = attackType === 'slash' ? 'rgba(100, 100, 255, 0.3)' :
                             attackType === 'thrust' ? 'rgba(255, 255, 100, 0.3)' :
                             'rgba(255, 50, 50, 0.3)';
                             
            const auraSize = attackType === 'heavy' ? 18 : 12;
            
            ctx.fillStyle = auraColor;
            ctx.beginPath();
            ctx.arc(x + attackOffsetX, y + attackOffsetY, auraSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Linhas de força
            ctx.strokeStyle = auraColor.replace('0.3', '0.6');
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i + (tick * 0.01);
                ctx.beginPath();
                ctx.moveTo(x + attackOffsetX, y + attackOffsetY);
                ctx.lineTo(x + attackOffsetX + Math.cos(angle) * auraSize,
                         y + attackOffsetY + Math.sin(angle) * auraSize);
                ctx.stroke();
            }
        }
        
        // Efeito de trilha ao mover-se rapidamente ou durante dash de ataque
        if ((jogador.animacao.andando && jogador.velocidade > 1.5) || 
            (state.isAttacking && state.dashTimer > 0)) {
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            
            // Desenhar cópias fantasmas do personagem
            const ghostPositions = [
                {x: -attackOffsetX * 0.7, y: -attackOffsetY * 0.7},
                {x: -attackOffsetX * 0.4, y: -attackOffsetY * 0.4}
            ];
            
            for (const pos of ghostPositions) {
                // Silhueta simplificada
                ctx.fillRect(x + pos.x + healthShake - 2, 
                           y + pos.y + bobbing - 6, 4, 12);
            }
        }
        
        // Efeito de poeira ao caminhar ou atacar
        if ((jogador.animacao.andando && tick % 15 === 0) || 
            (state.isAttacking && state.attackPhase === 'active')) {
            
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            
            for (let i = 0; i < 3; i++) {
                const dustX = x + (Math.random() * 12 - 6);
                const dustY = y + 9 + (Math.random() * 2);
                const dustSize = 1 + Math.random();
                
                ctx.fillRect(dustX, dustY, dustSize, dustSize);
            }
        }
        
        return this;
    },
    
    // Renderizar efeitos de impacto separadamente (para ficarem acima de tudo)
    renderHitEffects: function(ctx) {
        for (const effect of this.state.hitEffects) {
            const progress = 1 - (effect.duration / this.config.hitEffectDuration);
            
            // Círculo de impacto com fadeout
            ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress) * 0.7})`;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size * (1 + progress), 0, Math.PI * 2);
            ctx.fill();
            
            // Partículas que se espalham
            const particleCount = 8;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 / particleCount) * i;
                const distance = effect.size * (1 + progress * 2);
                
                const px = effect.x + Math.cos(angle) * distance;
                const py = effect.y + Math.sin(angle) * distance;
                
                ctx.fillStyle = `rgba(255, 200, 150, ${(1 - progress) * 0.5})`;
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
        }
        
        return this;
    }
};

// Exportar o módulo
window.CharacterAnimations = CharacterAnimations;
