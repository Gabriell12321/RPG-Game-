// Controlador do Personagem Principal
// Integra o sistema de animação com o sistema de controle do jogo

(function(window) {
    // Verificar GameSystem
    if (!window.GameSystem) {
        console.error("GameSystem não encontrado! Sistema de controle de personagem não pode ser inicializado.");
        return;
    }
    
    // Referências
    const ANIMATION_STATES = window.GameSystem.constants.ANIMATION_STATES;
    const DIRECTIONS = window.GameSystem.constants.DIRECTIONS;
    const WEAPON_TYPES = window.GameSystem.constants.WEAPON_TYPES;
    
    // Estado do controlador
    const controllerState = {
        isInitialized: false,
        characterAnimator: null,
        lastUpdateTime: 0,
        isJumping: false,
        jumpCooldown: 0,
        attackCooldown: 0,
        keys: {
            up: false,
            down: false,
            left: false,
            right: false,
            run: false,
            jump: false,
            attack: false,
            interact: false
        },
        attackCombo: 0,
        lastAttackTime: 0,
        comboTimeout: 800, // ms para encadear um combo
        playerSize: 32,
        movementSpeed: 2,
        runSpeedMultiplier: 1.7
    };
    
    // Inicializar o controlador
    function init() {
        if (controllerState.isInitialized) return;
        
        // Criar instância do animador
        if (window.GameSystem.functions.CharacterAnimator) {
            controllerState.characterAnimator = new window.GameSystem.functions.CharacterAnimator();
            
            // Configurar arma inicial
            controllerState.characterAnimator.setWeapon(WEAPON_TYPES.SWORD);
            
            // Configurar inputs
            setupInputHandlers();
            
            controllerState.isInitialized = true;
            controllerState.lastUpdateTime = Date.now();
            
            console.log("Controlador do personagem principal inicializado com sucesso!");
        } else {
            console.error("Sistema de animação não encontrado!");
        }
    }
    
    // Configurar handlers de input
    function setupInputHandlers() {
        // Capturar teclas
        document.addEventListener('keydown', function(event) {
            updateKeyState(event, true);
            event.preventDefault();
        });
        
        document.addEventListener('keyup', function(event) {
            updateKeyState(event, false);
        });
    }
    
    // Atualizar estado das teclas
    function updateKeyState(event, isPressed) {
        const keys = controllerState.keys;
        
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                keys.up = isPressed;
                break;
                
            case 's':
            case 'arrowdown':
                keys.down = isPressed;
                break;
                
            case 'a':
            case 'arrowleft':
                keys.left = isPressed;
                break;
                
            case 'd':
            case 'arrowright':
                keys.right = isPressed;
                break;
                
            case 'shift':
                keys.run = isPressed;
                break;
                
            case ' ':
                keys.jump = isPressed;
                // Impedir múltiplos pulos ao segurar a tecla
                if (isPressed && !controllerState.isJumping && controllerState.jumpCooldown <= 0) {
                    controllerState.isJumping = true;
                    controllerState.jumpCooldown = 500; // 500ms de cooldown
                }
                break;
                
            case 'e':
                keys.interact = isPressed;
                break;
                
            case 'f':
                // Alternar lanterna (se aplicável)
                if (isPressed && window.player) {
                    window.player.lanterna = !window.player.lanterna;
                }
                break;
                
            // Ataques
            case 'j': // Ataque normal
                keys.attack = isPressed;
                if (isPressed && controllerState.attackCooldown <= 0) {
                    handleAttack('slash');
                }
                break;
                
            case 'k': // Ataque de estocada
                if (isPressed && controllerState.attackCooldown <= 0) {
                    handleAttack('thrust');
                }
                break;
                
            case 'l': // Ataque de cima para baixo
                if (isPressed && controllerState.attackCooldown <= 0) {
                    handleAttack('overhead');
                }
                break;
        }
    }
    
    // Lidar com ataques e combos
    function handleAttack(attackType) {
        const now = Date.now();
        
        // Verificar combo
        if (now - controllerState.lastAttackTime < controllerState.comboTimeout) {
            controllerState.attackCombo = (controllerState.attackCombo + 1) % 3;
        } else {
            controllerState.attackCombo = 0;
        }
        
        // Atualizar timer de ataque
        controllerState.lastAttackTime = now;
        controllerState.attackCooldown = 300; // 300ms de cooldown entre ataques
    }
    
    // Atualizar o controlador
    function update() {
        if (!controllerState.isInitialized) return;
        
        const now = Date.now();
        const deltaTime = (now - controllerState.lastUpdateTime) / 1000; // em segundos
        controllerState.lastUpdateTime = now;
        
        // Atualizar cooldowns
        if (controllerState.jumpCooldown > 0) {
            controllerState.jumpCooldown -= deltaTime * 1000;
        }
        
        if (controllerState.attackCooldown > 0) {
            controllerState.attackCooldown -= deltaTime * 1000;
        }
        
        // Verificar se tem referência ao jogador
        if (!window.player) return;
        
        // Atualizar movimento do jogador
        updatePlayerMovement(deltaTime);
        
        // Preparar inputs para o animador
        const animatorInputs = {
            moving: controllerState.keys.up || controllerState.keys.down || 
                    controllerState.keys.left || controllerState.keys.right,
            running: controllerState.keys.run,
            jumping: controllerState.isJumping,
            attacking: controllerState.keys.attack,
            direction: getPlayerDirection()
        };
        
        // Atualizar animador
        controllerState.characterAnimator.update(deltaTime, animatorInputs);
        
        // Resetar flag de pulo quando o jogador tocar o chão
        if (controllerState.isJumping && !controllerState.characterAnimator.state.inAir) {
            controllerState.isJumping = false;
        }
    }
    
    // Atualizar movimento do jogador
    function updatePlayerMovement(deltaTime) {
        const keys = controllerState.keys;
        const baseSpeed = controllerState.movementSpeed;
        const runMultiplier = keys.run ? controllerState.runSpeedMultiplier : 1;
        
        let dx = 0, dy = 0;
        
        // Calcular movimento
        if (keys.up) dy -= baseSpeed * runMultiplier;
        if (keys.down) dy += baseSpeed * runMultiplier;
        if (keys.left) dx -= baseSpeed * runMultiplier;
        if (keys.right) dx += baseSpeed * runMultiplier;
        
        // Normalizar diagonal (evitar movimento mais rápido na diagonal)
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = dx / length * baseSpeed * runMultiplier;
            dy = dy / length * baseSpeed * runMultiplier;
        }
        
        // Aplicar movimento
        if (window.player && !controllerState.characterAnimator.state.isAttacking) {
            window.player.x += dx;
            window.player.y += dy;
            
            // Atualizar flag de movimento para o sistema original
            window.player.isMoving = (dx !== 0 || dy !== 0);
        }
    }
    
    // Obter direção do jogador baseada nas teclas pressionadas
    function getPlayerDirection() {
        const keys = controllerState.keys;
        
        if (keys.up && !keys.down) return DIRECTIONS.UP;
        if (keys.down && !keys.up) return DIRECTIONS.DOWN;
        if (keys.left && !keys.right) return DIRECTIONS.LEFT;
        if (keys.right && !keys.left) return DIRECTIONS.RIGHT;
        
        // Se nenhuma tecla de direção ou combinações contraditórias,
        // manter a direção atual do animador
        return controllerState.characterAnimator.state.direction;
    }
    
    // Renderizar o jogador
    function render(ctx) {
        if (!controllerState.isInitialized || !window.player) return;
        
        // Renderizar usando o animador
        controllerState.characterAnimator.render(
            ctx, 
            window.player.x - controllerState.playerSize / 2, 
            window.player.y - controllerState.playerSize,
            controllerState.playerSize, 
            controllerState.playerSize * 2
        );
    }
    
    // Exportar funções para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.PlayerController = {
        init,
        update,
        render,
        getAnimator: () => controllerState.characterAnimator
    };
    
    // Inicializar automaticamente quando o DOM estiver pronto
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 500); // Pequeno delay para garantir que os outros sistemas estejam prontos
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    }
    
})(window);
