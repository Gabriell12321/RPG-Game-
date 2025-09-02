// RenderizacaoJogador.js - Sistema de renderização avançada para o jogador
// Implementa um sistema de renderização que suporta animações, espada e efeitos visuais

window.RenderizacaoJogador = (function() {
    // Configurações visuais
    const config = {
        // Cores padrão
        cores: {
            pele: '#FFD1B7',
            cabelo: '#8B4513',
            roupa: '#4169E1',
            espada: {
                lamina: '#C0C0C0',
                cabo: '#8B4513',
                detalhe: '#FFD700'
            }
        },
        // Efeitos visuais
        efeitos: {
            trail: {
                frames: 5,           // Número de frames do rastro
                alpha: 0.7,          // Alpha inicial
                fadeRate: 0.15       // Taxa de desvanecimento
            },
            glow: {
                radius: 5,           // Raio do brilho
                color: '#FFFFFF'     // Cor do brilho
            },
            impact: {
                size: 20,            // Tamanho do impacto
                particles: 8,        // Número de partículas
                duration: 0.5        // Duração em segundos
            }
        },
        // Rastros de efeitos visuais
        trailHistory: []
    };

    // Histórico de animação para efeitos
    let lastPositions = [];

    // Renderiza a espada do personagem
    function renderizarEspada(ctx, character, animData) {
        // Verificar se a espada deve ser exibida
        if (!animData || !animData.swordVisible) return;
        
        const x = character.x;
        const y = character.y;
        const direcao = character.direcao || 'down';
        
        // Salvar o contexto para aplicar transformações
        ctx.save();
        
        // Obter parâmetros da animação
        const swordRotation = animData.swordRotation || 0;
        const swordScale = animData.swordScale || 1.0;
        const swordGlow = animData.swordGlow || 0;
        const swordTrail = animData.swordTrail || false;
        const swordImpact = animData.swordImpact || false;
        
        // Posição base da espada (depende da direção)
        let swordX = x;
        let swordY = y;
        
        // Ajustar posição com base na direção
        switch (direcao) {
            case 'up':
                swordX += 5;
                swordY -= 5;
                break;
            case 'down':
                swordX += 5;
                swordY += 5;
                break;
            case 'left':
                swordX -= 5;
                swordY += 0;
                break;
            case 'right':
                swordX += 5;
                swordY += 0;
                break;
        }
        
        // Aplicar rotação
        ctx.translate(swordX, swordY);
        ctx.rotate(swordRotation);
        ctx.scale(swordScale, swordScale);
        
        // Renderizar rastro da espada se necessário
        if (swordTrail) {
            renderizarRastroEspada(ctx, 0, 0, direcao);
        }
        
        // Adicionar brilho se necessário
        if (swordGlow > 0) {
            ctx.shadowColor = 'rgba(255, 255, 200, ' + swordGlow + ')';
            ctx.shadowBlur = 5 * swordGlow;
        }
        
        // Lâmina da espada
        ctx.fillStyle = config.cores.espada.lamina;
        ctx.fillRect(-1, -12, 2, 10);
        
        // Guarda da espada
        ctx.fillStyle = config.cores.espada.detalhe;
        ctx.fillRect(-2, -3, 4, 1);
        
        // Cabo da espada
        ctx.fillStyle = config.cores.espada.cabo;
        ctx.fillRect(-1, -2, 2, 4);
        
        // Renderizar impacto se necessário
        if (swordImpact) {
            renderizarImpactoEspada(ctx, 0, -12, direcao);
        }
        
        // Restaurar o contexto
        ctx.restore();
    }
    
    // Renderiza o rastro da espada para efeito visual
    function renderizarRastroEspada(ctx, x, y, direcao) {
        // Adicionar a posição atual ao histórico
        lastPositions.unshift({ x, y, direcao });
        
        // Limitar o tamanho do histórico
        if (lastPositions.length > config.efeitos.trail.frames) {
            lastPositions.pop();
        }
        
        // Renderizar o rastro com transparência gradual
        ctx.globalAlpha = config.efeitos.trail.alpha;
        
        // Desenhar o rastro da lâmina
        for (let i = 1; i < lastPositions.length; i++) {
            const alpha = config.efeitos.trail.alpha - (i * config.efeitos.trail.fadeRate);
            if (alpha <= 0) continue;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(255, 255, 220, ' + alpha + ')';
            ctx.fillRect(-1, -12, 2, 10);
        }
        
        // Restaurar a transparência
        ctx.globalAlpha = 1.0;
    }
    
    // Renderiza o efeito de impacto da espada
    function renderizarImpactoEspada(ctx, x, y, direcao) {
        // Adicionar um efeito de impacto circular
        const gradiente = ctx.createRadialGradient(x, y, 0, x, y, config.efeitos.impact.size);
        gradiente.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradiente.addColorStop(0.5, 'rgba(255, 255, 100, 0.5)');
        gradiente.addColorStop(1, 'rgba(255, 200, 0, 0)');
        
        ctx.fillStyle = gradiente;
        ctx.beginPath();
        ctx.arc(x, y, config.efeitos.impact.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Adicionar partículas de impacto
        for (let i = 0; i < config.efeitos.impact.particles; i++) {
            const angle = (i / config.efeitos.impact.particles) * Math.PI * 2;
            const particleX = x + Math.cos(angle) * config.efeitos.impact.size * 0.6;
            const particleY = y + Math.sin(angle) * config.efeitos.impact.size * 0.6;
            
            ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
            ctx.beginPath();
            ctx.arc(particleX, particleY, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Renderiza o personagem com animações avançadas
    function renderizarPersonagem(ctx, character) {
        // Obter posição base
        const x = character.x;
        const y = character.y;
        
        // Obter direção e dados de animação
        const direcao = character.direcao || 'down';
        const animData = character.animationData || {};
        
        // Offsets da animação
        const bodyOffsetY = animData.bodyOffsetY || 0;
        const headBobbing = animData.headBobbing || 0;
        const armRotation = animData.armRotation || 0;
        const legRotation = animData.legRotation || 0;
        const bodyRotation = animData.bodyRotation || 0;
        const bodyLean = animData.bodyLean || 0;
        const breathingScale = animData.breathingScale || 1.0;
        
        // Sombra do personagem (oval)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + 8, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Salvar o contexto para rotação do corpo
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(bodyRotation);
        ctx.scale(breathingScale, 1);
        
        // Pernas (por baixo de tudo)
        ctx.save();
        ctx.translate(0, bodyOffsetY);
        
        // Perna esquerda com rotação
        ctx.save();
        ctx.translate(-1.5, 3);
        ctx.rotate(legRotation);
        
        ctx.fillStyle = '#333333'; // Calça escura
        ctx.fillRect(-1.5, 0, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(-1.5, 2, 3, 1);
        // Sapato
        ctx.fillStyle = '#111111'; // Sapato preto
        ctx.fillRect(-1.5, 5, 3, 1);
        
        ctx.restore();
        
        // Perna direita com rotação
        ctx.save();
        ctx.translate(1.5, 3);
        ctx.rotate(-legRotation);
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(-1.5, 0, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(-1.5, 2, 3, 1);
        // Sapato
        ctx.fillStyle = '#111111'; // Sapato preto
        ctx.fillRect(-1.5, 5, 3, 1);
        
        ctx.restore();
        ctx.restore();
        
        // Corpo (tronco)
        ctx.fillStyle = config.cores.roupa;
        // Aplicar inclinação baseada na direção e animação
        ctx.save();
        ctx.translate(0, bodyOffsetY);
        
        // Usar transform para simular shear (não existe ctx.shear nativo)
        // transform(a, b, c, d, e, f) onde 'c' é o valor de shear horizontal
        ctx.transform(1, 0, bodyLean, 1, 0, 0);
        
        // Corpo principal
        ctx.fillRect(-3, -2, 6, 6);
        
        // Detalhes da roupa (botões ou zíper)
        ctx.fillStyle = direcao === 'back' ? config.cores.roupa : '#FFFFFF';
        ctx.fillRect(0, 0, 1, 3);
        
        // Cinto
        ctx.fillStyle = '#5E2C04';
        ctx.fillRect(-3, 3, 6, 1);
        
        ctx.restore();
        
        // Braços com rotação
        ctx.save();
        ctx.translate(0, bodyOffsetY);
        
        // Braço esquerdo
        ctx.save();
        ctx.translate(-3, 0);
        ctx.rotate(armRotation);
        
        ctx.fillStyle = config.cores.roupa;
        ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
        ctx.fillStyle = config.cores.pele;
        ctx.fillRect(-1, 4, 2, 2); // Mão
        
        ctx.restore();
        
        // Braço direito
        ctx.save();
        ctx.translate(3, 0);
        ctx.rotate(-armRotation);
        
        ctx.fillStyle = config.cores.roupa;
        ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
        ctx.fillStyle = config.cores.pele;
        ctx.fillRect(-1, 4, 2, 2); // Mão
        
        ctx.restore();
        ctx.restore();
        
        // Cabeça e rosto
        ctx.save();
        ctx.translate(0, -8 + headBobbing + bodyOffsetY);
        
        // Cabeça
        ctx.fillStyle = config.cores.pele;
        ctx.fillRect(-3, 0, 6, 7); // Cabeça mais oval
        
        // Cabelo baseado na direção
        ctx.fillStyle = config.cores.cabelo;
        if (direcao === 'back' || direcao === 'up') {
            // Parte de trás do cabelo (visível de costas)
            ctx.fillRect(-3, 0, 6, 2);
            ctx.fillRect(-4, 2, 8, 2);
        } else {
            // Frente e lados
            ctx.fillRect(-3, -1, 6, 2); // Franja
            ctx.fillRect(-4, 1, 1, 4); // Lado esquerdo
            ctx.fillRect(3, 1, 1, 4); // Lado direito
        }
        
        // Detalhes do rosto baseados na direção
        if (direcao !== 'back' && direcao !== 'up') {
            // Olhos
            ctx.fillStyle = 'white';
            
            if (direcao === 'left') {
                // Olhando para a esquerda
                ctx.fillRect(-3, 3, 2, 2);
                ctx.fillStyle = '#0066ff';
                ctx.fillRect(-3, 3, 1, 1);
            } else if (direcao === 'right') {
                // Olhando para a direita
                ctx.fillStyle = 'white';
                ctx.fillRect(1, 3, 2, 2);
                ctx.fillStyle = '#0066ff';
                ctx.fillRect(2, 3, 1, 1);
            } else {
                // Olhando para frente
                ctx.fillStyle = 'white';
                ctx.fillRect(-2, 3, 2, 2);
                ctx.fillRect(0, 3, 2, 2);
                
                ctx.fillStyle = '#0066ff';
                ctx.fillRect(-1, 3, 1, 1);
                ctx.fillRect(1, 3, 1, 1);
            }
        }
        
        ctx.restore();
        
        // Restaurar o contexto original
        ctx.restore();
        
        // Renderizar a espada, se aplicável
        renderizarEspada(ctx, character, animData);
    }

    // API pública
    return {
        // Renderiza o jogador com animações
        renderizar: function(ctx, jogador) {
            renderizarPersonagem(ctx, jogador);
        },
        
        // Define as cores do personagem
        definirCores: function(novasCores) {
            config.cores = { ...config.cores, ...novasCores };
        },
        
        // Limpa o histórico de posições para os efeitos
        limparHistorico: function() {
            lastPositions = [];
        }
    };
})();
