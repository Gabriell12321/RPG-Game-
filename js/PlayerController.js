// PlayerController.js - Sistema de controle do jogador
// Implementa um sistema para controlar o jogador, incluindo movimentos e ataques

window.PlayerController = (function() {
    // Estado do controlador
    const state = {
        // Teclas pressionadas
        keys: {
            up: false,
            down: false,
            left: false,
            right: false,
            attack: false,
            run: false,
            jump: false
        },
        // Estado do movimento
        movement: {
            isMoving: false,
            isRunning: false,
            isJumping: false,
            isAttacking: false,
            attackType: null, // 'light', 'medium', 'heavy'
            comboStep: 0,     // Para combos de ataque
            lastAttackTime: 0 // Para timing de combos
        },
        // Histórico de comandos para combos
        commandHistory: [],
        historyTimeout: null
    };

    // Configurações do controlador
    const config = {
        moveSpeed: 2,       // Velocidade base de movimento
        runSpeed: 3.5,      // Velocidade de corrida
        jumpDuration: 0.5,  // Duração do pulo em segundos
        comboWindow: 800,   // Janela de tempo para combos (ms)
        comboMax: 3         // Número máximo de hits em um combo
    };

    // Inicializar o controlador
    function init() {
        // Configurar event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        console.log("Controlador do jogador inicializado");
    }

    // Handler para tecla pressionada
    function handleKeyDown(event) {
        switch(event.key.toLowerCase()) {
            case 'w': 
                state.keys.up = true; 
                break;
            case 's': 
                state.keys.down = true; 
                break;
            case 'a': 
                state.keys.left = true; 
                break;
            case 'd': 
                state.keys.right = true; 
                break;
            case ' ': 
                if (!state.keys.attack) {
                    startAttack();
                }
                state.keys.attack = true; 
                break;
            case 'shift': 
                state.keys.run = true; 
                break;
            case 'spacebar':
            case ' ':
                if (!state.keys.jump && !state.movement.isJumping) {
                    startJump();
                }
                state.keys.jump = true;
                break;
        }
    }

    // Handler para tecla solta
    function handleKeyUp(event) {
        switch(event.key.toLowerCase()) {
            case 'w': 
                state.keys.up = false; 
                break;
            case 's': 
                state.keys.down = false; 
                break;
            case 'a': 
                state.keys.left = false; 
                break;
            case 'd': 
                state.keys.right = false; 
                break;
            case ' ': 
                state.keys.attack = false; 
                break;
            case 'shift': 
                state.keys.run = false; 
                break;
            case 'spacebar':
            case ' ':
                state.keys.jump = false;
                break;
        }
    }

    // Iniciar um ataque
    function startAttack() {
        const now = Date.now();
        let attackType = 'light'; // Ataque padrão
        
        // Verificar se estamos em uma janela de combo
        if (now - state.movement.lastAttackTime < config.comboWindow) {
            state.movement.comboStep = (state.movement.comboStep + 1) % config.comboMax;
            
            // Determinar o tipo de ataque com base no passo do combo
            if (state.movement.comboStep === 1) {
                attackType = 'medium';
            } else if (state.movement.comboStep === 2) {
                attackType = 'heavy';
            }
        } else {
            // Reiniciar o combo
            state.movement.comboStep = 0;
        }
        
        // Atualizar o estado
        state.movement.isAttacking = true;
        state.movement.attackType = attackType;
        state.movement.lastAttackTime = now;
        
        // Adicionar ao histórico de comandos
        addToCommandHistory('attack_' + attackType);
    }

    // Iniciar um pulo
    function startJump() {
        if (!state.movement.isJumping) {
            state.movement.isJumping = true;
            state.movement.jumpStartTime = Date.now();
            
            // Adicionar ao histórico de comandos
            addToCommandHistory('jump');
            
            // Configurar timer para terminar o pulo
            setTimeout(() => {
                state.movement.isJumping = false;
            }, config.jumpDuration * 1000);
        }
    }

    // Adicionar comando ao histórico para detecção de combos
    function addToCommandHistory(command) {
        state.commandHistory.push({
            command: command,
            time: Date.now()
        });
        
        // Limitar o tamanho do histórico
        if (state.commandHistory.length > 10) {
            state.commandHistory.shift();
        }
        
        // Limpar o histórico após um tempo
        clearTimeout(state.historyTimeout);
        state.historyTimeout = setTimeout(() => {
            state.commandHistory = [];
        }, 2000);
        
        // Verificar padrões de comando
        checkCommandPatterns();
    }

    // Verificar padrões de comando para movimentos especiais
    function checkCommandPatterns() {
        // Exemplo: Verificar por um padrão como "left, right, attack" em rápida sucessão
        if (state.commandHistory.length >= 3) {
            const lastThree = state.commandHistory.slice(-3);
            
            // Verificar combo básico
            if (lastThree[0].command === 'attack_light' && 
                lastThree[1].command === 'attack_medium' && 
                lastThree[2].command === 'attack_heavy' &&
                lastThree[2].time - lastThree[0].time < 1200) {
                
                console.log("Combo de 3 golpes executado!");
                // Aqui poderia ativar algum efeito especial ou dano extra
            }
        }
    }

    // Atualizar o controlador
    function update(jogador, deltaTime) {
        // Determinar a direção de movimento
        let dx = 0, dy = 0;
        
        if (state.keys.up) dy -= 1;
        if (state.keys.down) dy += 1;
        if (state.keys.left) dx -= 1;
        if (state.keys.right) dx += 1;
        
        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
        }
        
        // Determinar se está em movimento
        state.movement.isMoving = (dx !== 0 || dy !== 0);
        
        // Determinar se está correndo
        state.movement.isRunning = state.keys.run && state.movement.isMoving;
        
        // Calcular a velocidade atual
        const speed = state.movement.isRunning ? config.runSpeed : config.moveSpeed;
        
        // Atualizar posição do jogador
        if (state.movement.isMoving) {
            jogador.posicao.x += dx * speed;
            jogador.posicao.y += dy * speed;
            
            // Atualizar direção do jogador
            if (Math.abs(dx) > Math.abs(dy)) {
                jogador.animacao.direcao = dx > 0 ? 'right' : 'left';
            } else {
                jogador.animacao.direcao = dy > 0 ? 'down' : 'up';
            }
            
            // Atualizar estado de animação
            jogador.animacao.andando = true;
        } else {
            jogador.animacao.andando = false;
        }
        
        // Atualizar animações com base no estado
        updateAnimation(jogador);
    }

    // Atualizar a animação do jogador com base no estado atual
    function updateAnimation(jogador) {
        // Verificar se o sistema de animações está disponível
        if (!window.CharacterAnimations) return;
        
        const direcao = jogador.animacao.direcao;
        
        // Prioridades de animação:
        // 1. Atacando
        // 2. Pulando
        // 3. Correndo
        // 4. Andando
        // 5. Parado
        
        if (state.movement.isAttacking) {
            // Selecionar o tipo de ataque
            let attackAnim = 'attackLight';
            if (state.movement.attackType === 'medium') {
                attackAnim = 'attackMedium';
            } else if (state.movement.attackType === 'heavy') {
                attackAnim = 'attackHeavy';
            }
            
            window.CharacterAnimations.play(jogador, attackAnim, direcao);
            
            // Resetar o estado após a animação
            if (!window.CharacterAnimations.isPlaying(attackAnim)) {
                state.movement.isAttacking = false;
                state.movement.attackType = null;
            }
        } 
        else if (state.movement.isJumping) {
            window.CharacterAnimations.play(jogador, 'jump', direcao);
        } 
        else if (state.movement.isRunning) {
            window.CharacterAnimations.play(jogador, 'run', direcao);
        } 
        else if (state.movement.isMoving) {
            window.CharacterAnimations.play(jogador, 'walk', direcao);
        } 
        else {
            window.CharacterAnimations.play(jogador, 'idle', direcao);
        }
    }

    // API pública
    return {
        init: init,
        update: update,
        getState: function() {
            return { ...state };
        },
        // Métodos para teste/debug
        startAttack: startAttack,
        startJump: startJump
    };
})();

// Inicializar o controlador quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.PlayerController.init();
});
