// CharacterAnimations.js - Sistema de animações para personagens
// Implementa um sistema de sprite-based animation com estados para diferentes ações

// Namespace global para animações de personagens
window.CharacterAnimations = (function() {
    // Estado interno do sistema de animações
    const state = {
        currentAnimation: null,
        currentDirection: 'down',
        currentFrame: 0,
        frameTime: 0,
        playing: false,
        looping: true,
        finished: false,
        animationSpeed: 1.0,
        spriteSheets: {},
        sequences: {}
    };

    // Definições de animação
    const animations = {
        idle: {
            frames: 4,
            frameDuration: 0.25, // segundos por frame
            loop: true,
            spriteSheet: 'playerIdle'
        },
        walk: {
            frames: 6,
            frameDuration: 0.12,
            loop: true,
            spriteSheet: 'playerWalk'
        },
        run: {
            frames: 6,
            frameDuration: 0.08,
            loop: true,
            spriteSheet: 'playerRun'
        },
        jump: {
            frames: 8,
            frameDuration: 0.1,
            loop: false,
            spriteSheet: 'playerJump'
        },
        attackLight: {
            frames: 6,
            frameDuration: 0.08,
            loop: false,
            spriteSheet: 'playerAttackLight',
            onComplete: function() {
                console.log("Ataque leve completado");
            }
        },
        attackMedium: {
            frames: 8,
            frameDuration: 0.1,
            loop: false,
            spriteSheet: 'playerAttackMedium',
            onComplete: function() {
                console.log("Ataque médio completado");
            }
        },
        attackHeavy: {
            frames: 10,
            frameDuration: 0.12,
            loop: false, 
            spriteSheet: 'playerAttackHeavy',
            onComplete: function() {
                console.log("Ataque pesado completado");
            }
        }
    };

    // Criar sequências de sprites "virtuais" simulando frames de animação
    function initializeSpriteSequences() {
        // Para cada direção, criamos uma sequência de pontos para o corpo e espada
        const directions = ['up', 'down', 'left', 'right'];
        
        // Inicializar sequências
        state.sequences = {
            idle: {},
            walk: {},
            run: {},
            jump: {},
            attackLight: {},
            attackMedium: {},
            attackHeavy: {}
        };

        // Sequências de idle
        directions.forEach(dir => {
            state.sequences.idle[dir] = createIdleSequence(dir);
            state.sequences.walk[dir] = createWalkSequence(dir);
            state.sequences.run[dir] = createRunSequence(dir);
            state.sequences.jump[dir] = createJumpSequence(dir);
            state.sequences.attackLight[dir] = createAttackLightSequence(dir);
            state.sequences.attackMedium[dir] = createAttackMediumSequence(dir);
            state.sequences.attackHeavy[dir] = createAttackHeavySequence(dir);
        });
    }

    // Funções auxiliares para criar sequências
    function createIdleSequence(direction) {
        const sequence = [];
        // Exemplo: 4 frames de animação idle
        for (let i = 0; i < 4; i++) {
            sequence.push({
                bodyOffsetY: Math.sin(i * Math.PI/2) * 0.5,
                headBobbing: Math.sin(i * Math.PI/2) * 0.2,
                armRotation: Math.sin(i * Math.PI/2) * 0.05,
                breathingScale: 1 + Math.sin(i * Math.PI/2) * 0.03
            });
        }
        return sequence;
    }

    function createWalkSequence(direction) {
        const sequence = [];
        // 6 frames de animação de caminhada
        for (let i = 0; i < 6; i++) {
            const phase = i / 6;
            sequence.push({
                bodyOffsetY: Math.sin(phase * Math.PI * 2) * 1.0,
                headBobbing: Math.sin(phase * Math.PI * 2) * 0.5,
                armRotation: Math.sin(phase * Math.PI * 2 + Math.PI/4) * 0.3,
                legRotation: Math.sin(phase * Math.PI * 2) * 0.4,
                breathingScale: 1 + Math.sin(phase * Math.PI) * 0.05
            });
        }
        return sequence;
    }

    function createRunSequence(direction) {
        const sequence = [];
        // 6 frames de animação de corrida (mais intensa)
        for (let i = 0; i < 6; i++) {
            const phase = i / 6;
            sequence.push({
                bodyOffsetY: Math.sin(phase * Math.PI * 2) * 2.0,
                headBobbing: Math.sin(phase * Math.PI * 2) * 1.0,
                armRotation: Math.sin(phase * Math.PI * 2 + Math.PI/4) * 0.6,
                legRotation: Math.sin(phase * Math.PI * 2) * 0.8,
                bodyLean: 0.1, // Inclinação para frente
                breathingScale: 1 + Math.sin(phase * Math.PI) * 0.1
            });
        }
        return sequence;
    }

    function createJumpSequence(direction) {
        const sequence = [];
        // 8 frames de animação de pulo
        // Fase de preparação (2 frames)
        sequence.push({ bodyOffsetY: 1, headBobbing: 0.5, armRotation: -0.2, legRotation: 0.1 });
        sequence.push({ bodyOffsetY: 2, headBobbing: 1, armRotation: -0.4, legRotation: 0.3 });
        
        // Fase de subida (2 frames)
        sequence.push({ bodyOffsetY: -2, headBobbing: -1, armRotation: 0.3, legRotation: 0.5 });
        sequence.push({ bodyOffsetY: -4, headBobbing: -2, armRotation: 0.4, legRotation: 0.4 });
        
        // Ápice do pulo (1 frame)
        sequence.push({ bodyOffsetY: -5, headBobbing: -2, armRotation: 0.2, legRotation: 0.1 });
        
        // Fase de descida (3 frames)
        sequence.push({ bodyOffsetY: -3, headBobbing: -1.5, armRotation: -0.1, legRotation: -0.1 });
        sequence.push({ bodyOffsetY: 0, headBobbing: -0.5, armRotation: -0.3, legRotation: -0.3 });
        sequence.push({ bodyOffsetY: 2, headBobbing: 0.5, armRotation: -0.1, legRotation: -0.1 });
        
        return sequence;
    }

    function createAttackLightSequence(direction) {
        const sequence = [];
        // 6 frames de ataque leve com espada
        
        // Preparação (2 frames)
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: direction === 'left' ? 0.1 : direction === 'right' ? -0.1 : 0,
            armRotation: direction === 'left' ? -0.3 : direction === 'right' ? 0.3 : -0.2,
            swordVisible: true,
            swordRotation: direction === 'left' ? -0.5 : direction === 'right' ? 0.5 : -0.4,
            swordScale: 0.8
        });
        
        sequence.push({ 
            bodyOffsetY: 0.5, 
            bodyRotation: direction === 'left' ? 0.15 : direction === 'right' ? -0.15 : 0.05,
            armRotation: direction === 'left' ? -0.4 : direction === 'right' ? 0.4 : -0.3,
            swordVisible: true,
            swordRotation: direction === 'left' ? -0.7 : direction === 'right' ? 0.7 : -0.6,
            swordScale: 0.9
        });
        
        // Golpe (2 frames)
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: direction === 'left' ? -0.2 : direction === 'right' ? 0.2 : -0.1,
            armRotation: direction === 'left' ? 0.6 : direction === 'right' ? -0.6 : 0.5,
            swordVisible: true,
            swordRotation: direction === 'left' ? 0.8 : direction === 'right' ? -0.8 : 0.7,
            swordScale: 1.1,
            swordTrail: true
        });
        
        sequence.push({ 
            bodyOffsetY: -0.5, 
            bodyRotation: direction === 'left' ? -0.25 : direction === 'right' ? 0.25 : -0.15,
            armRotation: direction === 'left' ? 0.7 : direction === 'right' ? -0.7 : 0.6,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.0 : direction === 'right' ? -1.0 : 0.9,
            swordScale: 1.2,
            swordTrail: true
        });
        
        // Recuperação (2 frames)
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: direction === 'left' ? -0.1 : direction === 'right' ? 0.1 : -0.05,
            armRotation: direction === 'left' ? 0.3 : direction === 'right' ? -0.3 : 0.3,
            swordVisible: true,
            swordRotation: direction === 'left' ? 0.5 : direction === 'right' ? -0.5 : 0.4,
            swordScale: 1.0
        });
        
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: 0,
            armRotation: 0,
            swordVisible: true,
            swordRotation: 0,
            swordScale: 1.0
        });
        
        return sequence;
    }

    function createAttackMediumSequence(direction) {
        const sequence = [];
        // 8 frames de ataque médio com espada
        
        // Preparação (3 frames)
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: direction === 'left' ? 0.15 : direction === 'right' ? -0.15 : 0.05,
            armRotation: direction === 'left' ? -0.5 : direction === 'right' ? 0.5 : -0.4,
            swordVisible: true,
            swordRotation: direction === 'left' ? -0.8 : direction === 'right' ? 0.8 : -0.7,
            swordScale: 0.9
        });
        
        sequence.push({ 
            bodyOffsetY: 0.8, 
            bodyRotation: direction === 'left' ? 0.2 : direction === 'right' ? -0.2 : 0.1,
            armRotation: direction === 'left' ? -0.6 : direction === 'right' ? 0.6 : -0.5,
            swordVisible: true,
            swordRotation: direction === 'left' ? -1.0 : direction === 'right' ? 1.0 : -0.9,
            swordScale: 1.0,
            swordGlow: 0.3
        });
        
        sequence.push({ 
            bodyOffsetY: 1.0, 
            bodyRotation: direction === 'left' ? 0.25 : direction === 'right' ? -0.25 : 0.15,
            armRotation: direction === 'left' ? -0.7 : direction === 'right' ? 0.7 : -0.6,
            swordVisible: true,
            swordRotation: direction === 'left' ? -1.2 : direction === 'right' ? 1.2 : -1.1,
            swordScale: 1.1,
            swordGlow: 0.6
        });
        
        // Golpe (3 frames)
        sequence.push({ 
            bodyOffsetY: -0.5, 
            bodyRotation: direction === 'left' ? -0.3 : direction === 'right' ? 0.3 : -0.2,
            armRotation: direction === 'left' ? 0.8 : direction === 'right' ? -0.8 : 0.7,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.3 : direction === 'right' ? -1.3 : 1.2,
            swordScale: 1.2,
            swordTrail: true,
            swordGlow: 0.9
        });
        
        sequence.push({ 
            bodyOffsetY: -1.0, 
            bodyRotation: direction === 'left' ? -0.35 : direction === 'right' ? 0.35 : -0.25,
            armRotation: direction === 'left' ? 0.9 : direction === 'right' ? -0.9 : 0.8,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.5 : direction === 'right' ? -1.5 : 1.4,
            swordScale: 1.3,
            swordTrail: true,
            swordGlow: 1.0
        });
        
        sequence.push({ 
            bodyOffsetY: -0.7, 
            bodyRotation: direction === 'left' ? -0.25 : direction === 'right' ? 0.25 : -0.15,
            armRotation: direction === 'left' ? 0.7 : direction === 'right' ? -0.7 : 0.6,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.0 : direction === 'right' ? -1.0 : 0.9,
            swordScale: 1.2,
            swordTrail: true,
            swordGlow: 0.7
        });
        
        // Recuperação (2 frames)
        sequence.push({ 
            bodyOffsetY: -0.3, 
            bodyRotation: direction === 'left' ? -0.1 : direction === 'right' ? 0.1 : -0.05,
            armRotation: direction === 'left' ? 0.3 : direction === 'right' ? -0.3 : 0.2,
            swordVisible: true,
            swordRotation: direction === 'left' ? 0.4 : direction === 'right' ? -0.4 : 0.3,
            swordScale: 1.1,
            swordGlow: 0.3
        });
        
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: 0,
            armRotation: 0,
            swordVisible: true,
            swordRotation: 0,
            swordScale: 1.0
        });
        
        return sequence;
    }

    function createAttackHeavySequence(direction) {
        const sequence = [];
        // 10 frames de ataque pesado com espada
        
        // Preparação (4 frames)
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: direction === 'left' ? 0.2 : direction === 'right' ? -0.2 : 0.1,
            armRotation: direction === 'left' ? -0.6 : direction === 'right' ? 0.6 : -0.5,
            swordVisible: true,
            swordRotation: direction === 'left' ? -0.9 : direction === 'right' ? 0.9 : -0.8,
            swordScale: 1.0,
            swordGlow: 0.2
        });
        
        sequence.push({ 
            bodyOffsetY: 0.5, 
            bodyRotation: direction === 'left' ? 0.3 : direction === 'right' ? -0.3 : 0.2,
            armRotation: direction === 'left' ? -0.8 : direction === 'right' ? 0.8 : -0.7,
            swordVisible: true,
            swordRotation: direction === 'left' ? -1.1 : direction === 'right' ? 1.1 : -1.0,
            swordScale: 1.1,
            swordGlow: 0.4
        });
        
        sequence.push({ 
            bodyOffsetY: 1.0, 
            bodyRotation: direction === 'left' ? 0.4 : direction === 'right' ? -0.4 : 0.3,
            armRotation: direction === 'left' ? -1.0 : direction === 'right' ? 1.0 : -0.9,
            swordVisible: true,
            swordRotation: direction === 'left' ? -1.3 : direction === 'right' ? 1.3 : -1.2,
            swordScale: 1.2,
            swordGlow: 0.6
        });
        
        sequence.push({ 
            bodyOffsetY: 1.5, 
            bodyRotation: direction === 'left' ? 0.5 : direction === 'right' ? -0.5 : 0.4,
            armRotation: direction === 'left' ? -1.2 : direction === 'right' ? 1.2 : -1.1,
            swordVisible: true,
            swordRotation: direction === 'left' ? -1.5 : direction === 'right' ? 1.5 : -1.4,
            swordScale: 1.3,
            swordGlow: 0.8,
            swordCharge: true
        });
        
        // Golpe (4 frames)
        sequence.push({ 
            bodyOffsetY: -1.0, 
            bodyRotation: direction === 'left' ? -0.4 : direction === 'right' ? 0.4 : -0.3,
            armRotation: direction === 'left' ? 1.0 : direction === 'right' ? -1.0 : 0.9,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.4 : direction === 'right' ? -1.4 : 1.3,
            swordScale: 1.4,
            swordTrail: true,
            swordGlow: 1.0
        });
        
        sequence.push({ 
            bodyOffsetY: -1.5, 
            bodyRotation: direction === 'left' ? -0.5 : direction === 'right' ? 0.5 : -0.4,
            armRotation: direction === 'left' ? 1.2 : direction === 'right' ? -1.2 : 1.1,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.6 : direction === 'right' ? -1.6 : 1.5,
            swordScale: 1.5,
            swordTrail: true,
            swordGlow: 1.0,
            swordImpact: true
        });
        
        sequence.push({ 
            bodyOffsetY: -1.2, 
            bodyRotation: direction === 'left' ? -0.4 : direction === 'right' ? 0.4 : -0.3,
            armRotation: direction === 'left' ? 1.0 : direction === 'right' ? -1.0 : 0.9,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.4 : direction === 'right' ? -1.4 : 1.3,
            swordScale: 1.4,
            swordTrail: true,
            swordGlow: 0.8
        });
        
        sequence.push({ 
            bodyOffsetY: -0.8, 
            bodyRotation: direction === 'left' ? -0.3 : direction === 'right' ? 0.3 : -0.2,
            armRotation: direction === 'left' ? 0.8 : direction === 'right' ? -0.8 : 0.7,
            swordVisible: true,
            swordRotation: direction === 'left' ? 1.2 : direction === 'right' ? -1.2 : 1.1,
            swordScale: 1.3,
            swordTrail: true,
            swordGlow: 0.6
        });
        
        // Recuperação (2 frames)
        sequence.push({ 
            bodyOffsetY: -0.4, 
            bodyRotation: direction === 'left' ? -0.2 : direction === 'right' ? 0.2 : -0.1,
            armRotation: direction === 'left' ? 0.4 : direction === 'right' ? -0.4 : 0.3,
            swordVisible: true,
            swordRotation: direction === 'left' ? 0.6 : direction === 'right' ? -0.6 : 0.5,
            swordScale: 1.2,
            swordGlow: 0.3
        });
        
        sequence.push({ 
            bodyOffsetY: 0, 
            bodyRotation: 0,
            armRotation: 0,
            swordVisible: true,
            swordRotation: 0,
            swordScale: 1.0
        });
        
        return sequence;
    }

    // Aplicar a animação atual ao personagem
    function applyAnimation(character, deltaTime) {
        if (!state.playing || !state.currentAnimation) return;
        
        // Atualizar o tempo do frame
        state.frameTime += deltaTime * state.animationSpeed;
        
        // Obter a definição da animação atual
        const anim = animations[state.currentAnimation];
        
        // Verificar se é hora de avançar para o próximo frame
        if (state.frameTime >= anim.frameDuration) {
            state.frameTime = 0;
            state.currentFrame++;
            
            // Verificar se a animação terminou
            if (state.currentFrame >= anim.frames) {
                // Se for uma animação em loop, voltar ao início
                if (anim.loop) {
                    state.currentFrame = 0;
                } else {
                    // Animação não-loop terminou
                    state.currentFrame = anim.frames - 1;
                    state.finished = true;
                    state.playing = false;
                    
                    // Chamar callback de conclusão, se existir
                    if (anim.onComplete && typeof anim.onComplete === 'function') {
                        anim.onComplete();
                    }
                }
            }
        }
        
        // Aplicar os parâmetros da animação ao personagem
        applyAnimationFrame(character);
    }
    
    // Aplicar o frame atual da animação ao personagem
    function applyAnimationFrame(character) {
        if (!state.currentAnimation || !state.sequences[state.currentAnimation]) return;
        
        // Obter a sequência para a direção atual
        const sequence = state.sequences[state.currentAnimation][state.currentDirection];
        if (!sequence) return;
        
        // Garantir que o frame atual é válido
        const frameIndex = Math.min(state.currentFrame, sequence.length - 1);
        const frameData = sequence[frameIndex];
        
        // Aplicar os dados do frame ao personagem
        if (character && frameData) {
            // Atualizar as propriedades de animação do personagem
            character.animationData = {
                ...frameData,
                currentAnimation: state.currentAnimation,
                currentFrame: state.currentFrame
            };
        }
    }

    // Inicializar o sistema
    function init() {
        initializeSpriteSequences();
        console.log("Sistema de animações inicializado");
    }

    // API pública
    return {
        init: init,
        
        // Iniciar uma animação
        play: function(character, animationName, direction) {
            // Verificar se a animação existe
            if (!animations[animationName]) {
                console.error(`Animação '${animationName}' não encontrada`);
                return;
            }
            
            // Não reiniciar a mesma animação se já estiver tocando
            if (state.currentAnimation === animationName && 
                state.currentDirection === direction && 
                state.playing && 
                !state.finished) {
                return;
            }
            
            // Configurar a nova animação
            state.currentAnimation = animationName;
            state.currentDirection = direction || 'down';
            state.currentFrame = 0;
            state.frameTime = 0;
            state.playing = true;
            state.finished = false;
            
            // Aplicar o primeiro frame imediatamente
            applyAnimationFrame(character);
        },
        
        // Parar a animação atual
        stop: function() {
            state.playing = false;
        },
        
        // Pausar a animação
        pause: function() {
            state.playing = false;
        },
        
        // Retomar uma animação pausada
        resume: function() {
            if (state.currentAnimation) {
                state.playing = true;
            }
        },
        
        // Verificar se uma animação está sendo tocada
        isPlaying: function(animationName) {
            if (animationName) {
                return state.playing && state.currentAnimation === animationName;
            }
            return state.playing;
        },
        
        // Atualizar o sistema de animação
        update: function(character, deltaTime) {
            applyAnimation(character, deltaTime);
        },
        
        // Aplicar a animação atual ao personagem
        apply: function(character) {
            applyAnimationFrame(character);
        },
        
        // Obter o estado atual da animação
        getState: function() {
            return { ...state };
        },
        
        // Definir a velocidade de animação (1.0 = normal)
        setSpeed: function(speed) {
            state.animationSpeed = Math.max(0.1, speed);
        }
    };
})();

// Inicializar o sistema de animações quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.CharacterAnimations.init();
});
