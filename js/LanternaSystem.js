// LanternaSystem.js - Sistema de lanterna para o jogador
// Implementa um sistema de iluminação dinâmica com lanterna que pode ser ativada/desativada

window.LanternaSystem = (function() {
    // Configurações
    const config = {
        // Configurações da lanterna
        lanterna: {
            ativa: false,           // Estado inicial da lanterna
            alcance: 180,           // Alcance da luz da lanterna (ajustado para mais realismo)
            anguloLuz: Math.PI/3,   // Ângulo do cone de luz (60 graus - mais realista)
            intensidade: 0.85,      // Intensidade da luz (ajustada para parecer mais natural)
            corLuz: '#FFF6C8',      // Cor amarelada realista da luz de lanterna
            bateria: 100,           // Bateria da lanterna (100%)
            consumoBateria: 0.008,  // Consumo de bateria por frame (mais lento, mais realista)
            consumoExtra: 0.002,    // Consumo extra quando a intensidade é maior
            tremor: 0.35,           // Quantidade de tremor da luz (ajustado para realismo)
            brilhoCentral: 1.2,     // Intensidade extra no centro do feixe de luz
            bordaSuave: true,       // Borda suave para transição mais realista
            sons: {
                ligar: 'lanterna_on',
                desligar: 'lanterna_off',
                semBateria: 'lanterna_empty'
            }   
        },
        // Configurações da escuridão ambiente
        escuridao: {
            intensidade: 0.6,       // Intensidade da escuridão (ajustada para mais realismo)
            corAmbiente: '#0A0A18', // Cor azulada escura para ambiente noturno (azul noturno mais realista)
            gradiente: true,        // Usar gradiente de escuridão
            variacao: 0.08,         // Variação da escuridão (respiração mais sutil)
            velocidadeVariacao: 0.015, // Velocidade da variação (mais lenta, mais natural)
            adaptacaoVisual: true,  // Sistema de adaptação visual realista
            tempoAdaptacao: 4000,   // Tempo para olhos se adaptarem à escuridão (em ms)
            luaCeu: {
                presente: false,    // Se há lua ou luzes do céu
                intensidade: 0.15,  // Intensidade da luz da lua/céu
                cor: '#2A3A5A'      // Cor azulada da luz noturna/luar
            }
        },
        // Configurações para efeitos atmosféricos
        atmosfera: {
            particulas: true,       // Ativar partículas no ar (poeira, umidade)
            densidade: 0.3,         // Densidade das partículas
            visibilidade: 0.8       // Afeta como a luz interage com o ar (efeito volumétrico)
        }
    };

    // Estado interno
    let state = {
        tick: 0,                    // Contador de frames
        keyPressed: false,          // Estado da tecla F
        ultimoPisca: 0,             // Contador para efeito de piscar da lanterna
        variationOffset: 0,         // Offset para variação da escuridão
        isShaking: false,           // Estado de tremor da lanterna (para momentos de susto)
        shakeIntensity: 0,          // Intensidade do tremor
        shakeDecay: 0.9,            // Decaimento do tremor
        flickerTimer: 0,            // Timer para efeito de falha da lanterna
        flickering: false,          // Estado de falha da lanterna
        direcaoAtual: 'down',       // Direção atual do jogador
        
        // Estados para efeitos mais realistas
        adaptacaoEscuridao: 0,      // Nível de adaptação à escuridão (0-1)
        inicioAdaptacao: 0,         // Timestamp do início da adaptação
        bateriaBaixa: false,        // Indica se bateria está baixa
        intensidadeAtual: 1.0,      // Intensidade atual da luz (pode variar com bateria)
        desgasteBateria: 1.0,       // Fator de desgaste da bateria (aumenta com o tempo)
        ultimoRuido: 0,             // Timer para ruídos da lanterna
        ambienteUmido: false,       // Se o ambiente tem umidade (afeta o feixe)
        particulasAr: [],           // Partículas visíveis no ar quando a luz incide
        ultimoTremor: {x: 0, y: 0}, // Último valor de tremor (para animação suave)
        
        // Configuração de renderização
        modoComposicaoPreferido: 'lighter', // Modo de composição preferido (será testado na inicialização)
        modoFallback: 'source-over',         // Modo de fallback caso o preferido não funcione
        renderizacaoFalhou: false            // Flag para indicar problema na renderização
    };

    // Inicialização do sistema
    function init() {
        // Adicionar listener para tecla F
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Verificar compatibilidade com modos de composição
        testarCompatibilidade();
        
        console.log("Sistema de lanterna inicializado");
    }
    
    // Testar compatibilidade do navegador com diferentes modos de composição
    function testarCompatibilidade() {
        try {
            const testCanvas = document.createElement('canvas');
            const testCtx = testCanvas.getContext('2d');
            
            if (!testCtx) {
                console.warn("Canvas não suportado, alguns efeitos visuais podem não funcionar");
                state.renderizacaoFalhou = true;
                return;
            }
            
            // Verificar suporte para diferentes modos de composição
            const modosDisponiveis = ['lighter', 'source-over', 'destination-out'];
            let modosSuportados = [];
            
            for (const modo of modosDisponiveis) {
                testCtx.globalCompositeOperation = modo;
                if (testCtx.globalCompositeOperation === modo) {
                    console.log(`Modo de composição '${modo}' suportado`);
                    modosSuportados.push(modo);
                } else {
                    console.warn(`Modo de composição '${modo}' não suportado`);
                }
            }
            
            // Definir modo preferido baseado no que é suportado
            if (modosSuportados.includes('lighter')) {
                state.modoComposicaoPreferido = 'lighter';
            } else if (modosSuportados.includes('source-over')) {
                state.modoComposicaoPreferido = 'source-over';
                console.warn("Usando modo de composição alternativo para a lanterna");
            } else {
                state.renderizacaoFalhou = true;
                console.error("Nenhum modo de composição compatível encontrado");
            }
        } catch (e) {
            console.error("Erro ao testar compatibilidade:", e);
            state.renderizacaoFalhou = true;
        }
    }

    // Handler para tecla pressionada
    function handleKeyDown(event) {
        if (event.key.toLowerCase() === 'f' && !state.keyPressed) {
            state.keyPressed = true;
            toggleLanterna();
        }
    }

    // Handler para tecla solta
    function handleKeyUp(event) {
        if (event.key.toLowerCase() === 'f') {
            state.keyPressed = false;
        }
    }

    // Alternar estado da lanterna
    function toggleLanterna() {
        // Verificar se há bateria
        if (!config.lanterna.ativa && config.lanterna.bateria <= 0) {
            // Tocar som de lanterna sem bateria
            playSound(config.lanterna.sons.semBateria);
            return;
        }
        
        // Alternar estado
        config.lanterna.ativa = !config.lanterna.ativa;
        
        // Tocar som apropriado
        playSound(config.lanterna.ativa ? 
                 config.lanterna.sons.ligar : 
                 config.lanterna.sons.desligar);
        
        console.log("Lanterna " + (config.lanterna.ativa ? "ligada" : "desligada") + 
                   " (Bateria: " + config.lanterna.bateria.toFixed(0) + "%)");
    }

    // Tocar som (usando sistema de áudio do jogo)
    function playSound(soundId) {
        // Verificar se o sistema de áudio existe
        if (window.GameSystem && window.GameSystem.audio && 
            typeof window.GameSystem.audio.playSound === 'function') {
            window.GameSystem.audio.playSound(soundId);
        }
    }

    // Atualizar o sistema de lanterna
    function update(deltaTime) {
        state.tick++;
        
        // Atualizar variação da escuridão
        state.variationOffset += config.escuridao.velocidadeVariacao;
        
        // Atualizar adaptação à escuridão
        if (config.escuridao.adaptacaoVisual) {
            updateAdaptacaoVisual();
        }
        
        // Atualizar partículas no ar
        if (config.atmosfera.particulas && config.lanterna.ativa) {
            updateParticulas();
        }
        
        // Atualizar bateria se a lanterna estiver ativa
        if (config.lanterna.ativa && config.lanterna.bateria > 0) {
            // Calcular consumo de bateria com fatores realistas
            let consumo = config.lanterna.consumoBateria;
            
            // Bateria gasta mais rápido com maior intensidade
            if (state.intensidadeAtual > 0.8) {
                consumo += config.lanterna.consumoExtra;
            }
            
            // Baterias antigas ou desgastadas gastam mais rápido
            consumo *= state.desgasteBateria;
            
            // Aplicar consumo
            config.lanterna.bateria -= consumo;
            
            // Verificar se a bateria acabou
            if (config.lanterna.bateria <= 0) {
                config.lanterna.bateria = 0;
                config.lanterna.ativa = false;
                playSound(config.lanterna.sons.semBateria);
            }
            
            // Verificar estado de bateria baixa (abaixo de 20%)
            if (config.lanterna.bateria < 20 && !state.bateriaBaixa) {
                state.bateriaBaixa = true;
                // Efeito sonoro de aviso de bateria baixa
                if (state.tick % 30 === 0) {
                    playSound('lanterna_low_battery');
                }
            } else if (config.lanterna.bateria >= 20) {
                state.bateriaBaixa = false;
            }
            
            // Efeito de piscar quando a bateria estiver fraca
            if (config.lanterna.bateria < 20) {
                state.ultimoPisca++;
                
                // Probabilidade de piscar aumenta conforme a bateria diminui
                const probabilidadePiscar = (20 - config.lanterna.bateria) / 20;
                
                if (Math.random() < probabilidadePiscar * 0.02 && !state.flickering) {
                    // Iniciar sequência de piscar
                    state.flickering = true;
                    state.flickerTimer = Math.floor(Math.random() * 5) + 3; // 3-7 frames
                }
                
                // Atualizar timer de piscar
                if (state.flickering) {
                    state.flickerTimer--;
                    if (state.flickerTimer <= 0) {
                        state.flickering = false;
                    }
                }
            }
        }
        
        // Atualizar tremor da lanterna
        if (state.isShaking) {
            state.shakeIntensity *= state.shakeDecay;
            if (state.shakeIntensity < 0.01) {
                state.isShaking = false;
                state.shakeIntensity = 0;
            }
        }
    }

    // Renderizar a escuridão e a lanterna
    function render(ctx, cameraX, cameraY) {
        // Se não temos contexto, não há o que renderizar
        if (!ctx) return;
        
        // Obter dimensões do canvas
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Calcular intensidade da escuridão com variação (respiração)
        const escuridaoBase = config.escuridao.intensidade;
        const variacao = Math.sin(state.variationOffset) * config.escuridao.variacao;
        const escuridaoAtual = Math.max(0, Math.min(1, escuridaoBase + variacao));
        
        // 1. Renderizar camada de escuridão
        ctx.save();
        
        // Ajustar escuridão com base na adaptação visual (se ativada)
        let escuridaoEfetiva = escuridaoAtual;
        if (config.escuridao.adaptacaoVisual && state.adaptacaoEscuridao > 0) {
            // Quando os olhos se adaptam, a escuridão parece menor
            escuridaoEfetiva = Math.max(0.2, escuridaoAtual - (state.adaptacaoEscuridao * 0.3));
        }
        
        // Criar gradiente radial ou cor sólida
        if (config.escuridao.gradiente) {
            // Criar um gradiente que é mais escuro nas bordas
            const gradiente = ctx.createRadialGradient(
                width/2, height/2, 0,
                width/2, height/2, Math.max(width, height) / 1.5
            );
            
            // Adicionar stops ao gradiente
            const escuridaoMaxima = Math.min(0.9, escuridaoEfetiva + 0.25);
            const corBase = config.escuridao.corAmbiente;
            
            // Efeito de luz ambiente ou luar (se presente)
            if (config.escuridao.luaCeu && config.escuridao.luaCeu.presente) {
                // Cor com leve tom azulado para simular luz da lua
                const corCentro = `rgba(15, 20, 35, ${escuridaoEfetiva * 0.5})`;
                const corBorda = `rgba(10, 15, 30, ${escuridaoMaxima})`;
                
                gradiente.addColorStop(0, corCentro);
                gradiente.addColorStop(1, corBorda);
                
                // Criar efeito adicional de raios de luz dispersos
                ctx.globalAlpha = config.escuridao.luaCeu.intensidade * 0.3;
                
                // Este efeito será sutilmente visível
                ctx.fillStyle = config.escuridao.luaCeu.cor;
                ctx.fillRect(0, 0, width, height);
                ctx.globalAlpha = 1.0;
            } else {
                // Escuridão normal sem luz ambiente
                gradiente.addColorStop(0, `rgba(10, 10, 25, ${escuridaoEfetiva * 0.6})`);
                gradiente.addColorStop(1, `rgba(5, 5, 15, ${escuridaoMaxima})`);
            }
            
            ctx.fillStyle = gradiente;
        } else {
            // Cor sólida de escuridão
            ctx.fillStyle = `rgba(5, 5, 15, ${escuridaoEfetiva})`;
        }
        
        // Desenhar retângulo cobrindo toda a tela com opacidade um pouco menor
        // para garantir melhor compatibilidade com diferentes navegadores
        ctx.globalAlpha = 0.9;  // Usar um pouco de transparência
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1.0;  // Restaurar para valor padrão
        
        // 2. Renderizar lanterna, se estiver ativa
        if (config.lanterna.ativa && !state.flickering) {
            // Verificar se houve falha na renderização
            if (state.renderizacaoFalhou) {
                // Usar método alternativo simplificado para renderização
                renderizarLanternaSimplificada(ctx, width, height);
            } else {
                // Usar composição conforme determinado na verificação de compatibilidade
                ctx.globalCompositeOperation = state.modoComposicaoPreferido;
                
                // Calcular ângulo com base na direção do jogador
                let angulo = 0;
                switch(state.direcaoAtual) {
                    case 'up': angulo = -Math.PI/2; break;
                    case 'down': angulo = Math.PI/2; break;
                    case 'left': angulo = Math.PI; break;
                    case 'right': angulo = 0; break;
                }
                
                // Adicionar tremor à posição e ângulo da lanterna
                let tremorX = 0, tremorY = 0, tremorAngulo = 0;
            
            // Tremor normal da lanterna (pequeno)
            if (config.lanterna.tremor > 0) {
                tremorX = (Math.random() * 2 - 1) * config.lanterna.tremor;
                tremorY = (Math.random() * 2 - 1) * config.lanterna.tremor;
                tremorAngulo = (Math.random() * 2 - 1) * 0.05 * config.lanterna.tremor;
            }
            
            // Tremor adicional se estiver em modo de tremor (susto)
            if (state.isShaking) {
                tremorX += (Math.random() * 2 - 1) * state.shakeIntensity * 5;
                tremorY += (Math.random() * 2 - 1) * state.shakeIntensity * 5;
                tremorAngulo += (Math.random() * 2 - 1) * state.shakeIntensity * 0.2;
            }
            
            // Aplicar ângulo final
            angulo += tremorAngulo;
            
            // Definir posição da lanterna como a posição central da tela
            // O jogador é sempre renderizado no centro da tela, com o mundo se movendo ao redor
            const x = width / 2;
            const y = height / 2;
            
            // Desenhar o cone de luz
            ctx.beginPath();
            ctx.moveTo(x + tremorX, y + tremorY);
            
            // Calcular pontos do arco
            const raio = config.lanterna.alcance;
            const anguloInicio = angulo - config.lanterna.anguloLuz / 2;
            const anguloFim = angulo + config.lanterna.anguloLuz / 2;
            
            // Desenhar o arco
            ctx.arc(x + tremorX, y + tremorY, raio, anguloInicio, anguloFim);
            ctx.lineTo(x + tremorX, y + tremorY);
            
            // Preencher com um gradiente para simular degradê da luz
            const gradiente = ctx.createRadialGradient(
                x + tremorX, y + tremorY, 0,
                x + tremorX, y + tremorY, raio
            );
            
            // Calcular intensidade atual da luz com base na bateria
            const intensidadeBase = config.lanterna.intensidade;
            let intensidadeAtual = intensidadeBase;
            
            // Reduzir intensidade se bateria estiver baixa
            if (config.lanterna.bateria < 30) {
                intensidadeAtual *= 0.7 + (config.lanterna.bateria / 30) * 0.3;
                
                // Chance de piscar quando bateria está muito baixa
                if (config.lanterna.bateria < 10 && Math.random() < 0.05) {
                    intensidadeAtual *= Math.random() * 0.5 + 0.2;
                }
            }
            
            // Aplicar adaptação visual se estiver implementada
            const adaptacao = config.escuridao.adaptacaoVisual ? state.adaptacaoEscuridao : 0;
            
            // Efetuar ruído na lanterna aleatoriamente para realismo
            gerarRuidoLanterna();
            
            // Aplicar brilho extra ao centro da luz (efeito de foco)
            const intensidadeCentro = intensidadeAtual * config.lanterna.brilhoCentral;
            const intensidadeBorda = intensidadeAtual * 0.75;
            
            // Usar cores realistas mais claras para o modo "lighter"
            // Com globalCompositeOperation="lighter", precisamos de cores mais intensas
            gradiente.addColorStop(0, `rgba(255, 255, 230, ${intensidadeCentro})`);  // Centro muito brilhante
            gradiente.addColorStop(0.3, `rgba(255, 245, 200, ${intensidadeAtual})`); // Meio do feixe
            gradiente.addColorStop(0.7, `rgba(255, 235, 180, ${intensidadeBorda})`); // Transição para a borda
            gradiente.addColorStop(1, 'rgba(255, 230, 150, 0)');                     // Borda completamente transparente
            
            // Aplicar o gradiente e preencher
            ctx.fillStyle = gradiente;
            ctx.fill();
            
            // Renderizar partículas no ar (se ativado)
            if (config.atmosfera.particulas) {
                renderizarParticulasNoAr(ctx, x, y, raio, angulo);
            }
            
            // Resetar composição
            ctx.globalCompositeOperation = 'source-over';
            
            // Renderizar o ícone da lanterna na interface
            renderLanternaUI(ctx, width, height);
        }
        
        ctx.restore();
    }
    
    // Renderizar UI da lanterna
    function renderLanternaUI(ctx, width, height) {
        // Posição no canto inferior direito
        const x = width - 50;
        const y = height - 20;
        
        // Efeito de brilho suave atrás da UI da lanterna
        if (config.lanterna.ativa) {
            const glowGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, 40
            );
            
            glowGradient.addColorStop(0, 'rgba(255, 240, 150, 0.2)');
            glowGradient.addColorStop(1, 'rgba(255, 240, 150, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, 40, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sombra para a UI
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Desenhar ícone da lanterna
        // Material metálico para o corpo da lanterna
        const lanternaGradient = ctx.createLinearGradient(x - 10, y - 8, x + 10, y + 8);
        lanternaGradient.addColorStop(0, '#888888');
        lanternaGradient.addColorStop(0.5, '#DDDDDD');
        lanternaGradient.addColorStop(1, '#888888');
        
        ctx.fillStyle = lanternaGradient;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Corpo da lanterna com forma mais detalhada
        ctx.beginPath();
        ctx.rect(x - 12, y - 8, 22, 16);
        ctx.fill();
        ctx.stroke();
        
        // Lente da lanterna com efeito de reflexo
        const lenteGradient = ctx.createRadialGradient(
            x + 10, y - 1, 1,
            x + 10, y, 5
        );
        
        // Cor da lente baseada no estado da lanterna
        if (config.lanterna.ativa) {
            lenteGradient.addColorStop(0, '#FFFFFF');
            lenteGradient.addColorStop(0.5, '#FFF7D6');
            lenteGradient.addColorStop(1, '#FFE080');
        } else {
            lenteGradient.addColorStop(0, '#AAAAAA');
            lenteGradient.addColorStop(1, '#555555');
        }
        
        ctx.fillStyle = lenteGradient;
        ctx.beginPath();
        ctx.arc(x + 10, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Pequeno reflexo na lente
        if (config.lanterna.ativa) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x + 9, y - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Remover sombra para o resto da UI
        ctx.shadowColor = 'transparent';
        
        // Desenhar indicador de bateria com estilo moderno
        const bateriaWidth = 40;
        const bateriaHeight = 8;
        const bateriaX = x - 30;
        const bateriaY = y - 5;
        
        // Fundo da bateria (escuro)
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.rect(bateriaX, bateriaY, bateriaWidth, bateriaHeight);
        ctx.fill();
        
        // Nível de bateria
        const nivelBateria = Math.max(0, Math.min(1, config.lanterna.bateria / 100));
        
        // Cor baseada no nível (verde -> amarelo -> vermelho)
        let corBateria;
        if (nivelBateria > 0.6) {
            corBateria = '#22DD22'; // Verde
        } else if (nivelBateria > 0.3) {
            corBateria = '#DDDD22'; // Amarelo
        } else {
            corBateria = '#DD2222'; // Vermelho
        }
        
        // Efeito de gradiente para a bateria
        const bateriaGradient = ctx.createLinearGradient(
            bateriaX, bateriaY,
            bateriaX, bateriaY + bateriaHeight
        );
        bateriaGradient.addColorStop(0, corBateria);
        bateriaGradient.addColorStop(1, corBateria);
        
        ctx.fillStyle = bateriaGradient;
        
        // Desenhar nível da bateria
        if (nivelBateria > 0) {
            const w = (bateriaWidth - 2) * nivelBateria;
            ctx.fillRect(bateriaX + 1, bateriaY + 1, w, bateriaHeight - 2);
        }
        
        // Efeito de piscar para bateria fraca
        if (nivelBateria < 0.2 && Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.rect(bateriaX, bateriaY, bateriaWidth, bateriaHeight);
            ctx.fill();
        }
    }
    
    // Causar tremor na lanterna (para sustos)
    function causarTremor(intensidade = 1.0, duracao = 0.5) {
        state.isShaking = true;
        state.shakeIntensity = intensidade;
        
        // Alterar o decaimento baseado na duração desejada
        // Quanto maior a duração, mais lento o decaimento
        state.shakeDecay = Math.pow(0.1, 1 / (duracao * 60)); // Assumindo 60 FPS
    }
    
    // Recarregar a bateria da lanterna
    function recarregarBateria(quantidade) {
        config.lanterna.bateria = Math.min(100, config.lanterna.bateria + quantidade);
        console.log("Bateria recarregada: " + config.lanterna.bateria.toFixed(0) + "%");
        
        // Reset no desgaste da bateria se for uma bateria nova
        if (quantidade >= 100) {
            state.desgasteBateria = 1.0;
        }
    }
    
    // Renderizar partículas no ar para efeito de volumetria da luz
    function renderizarParticulasNoAr(ctx, x, y, raio, angulo) {
        // Salvar contexto atual
        ctx.save();
        
        // Verificar se o modo de composição é compatível
        if (state.renderizacaoFalhou) {
            // Usar modo alternativo simplificado para as partículas
            ctx.globalAlpha = 0.4;
        } else {
            // Manter o modo atual, provavelmente 'lighter'
        }
        
        // Verificar se temos partículas para renderizar
        if (!state.particulasAr || state.particulasAr.length === 0) return;
        
        // Para cada partícula no array
        state.particulasAr.forEach(part => {
            // Converter posição relativa (0-1) para posição na tela dentro do cone
            // Ajustar com base no ângulo da lanterna
            const distancia = part.x * raio * 0.8; // 80% do raio total
            const anguloParticula = angulo - (config.lanterna.anguloLuz * 0.4) + (part.x * config.lanterna.anguloLuz * 0.8);
            
            const px = x + Math.cos(anguloParticula) * distancia;
            const py = y + Math.sin(anguloParticula) * distancia;
            
            // Só desenhar partículas que estejam no cone de luz
            const dentroDoAngulo = Math.abs(anguloParticula - angulo) <= config.lanterna.anguloLuz / 2;
            if (!dentroDoAngulo) return;
            
            // Desenhar a partícula como um círculo pequeno com brilho
            const tamanho = part.tamanho * (0.5 + part.y * 0.5); // Tamanho varia com profundidade
            const opacidade = part.opacidade * (1 - distancia/raio); // Opacidade diminui com a distância
            
            // Cores ajustadas conforme o modo de renderização
            let corParticula;
            if (state.renderizacaoFalhou) {
                // Cores mais sutis para o modo simplificado
                corParticula = Math.random() > 0.5 ? 
                    `rgba(255, 255, 220, ${opacidade * 0.5})` :  // Poeira dourada
                    `rgba(240, 250, 255, ${opacidade * 0.5})`;   // Umidade azulada
            } else {
                // Cores mais intensas para o modo 'lighter'
                corParticula = Math.random() > 0.5 ? 
                    `rgba(255, 255, 220, ${opacidade * 0.8})` :  // Poeira dourada
                    `rgba(240, 250, 255, ${opacidade * 0.8})`;   // Umidade azulada
            }
            
            ctx.beginPath();
            ctx.fillStyle = corParticula;
            ctx.arc(px, py, tamanho, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Restaurar contexto original
        ctx.restore();
    }
    
    // Método simplificado de renderização para casos onde o modo de composição normal falha
    function renderizarLanternaSimplificada(ctx, width, height) {
        try {
            // Calcular ângulo com base na direção do jogador
            let angulo = 0;
            switch(state.direcaoAtual) {
                case 'up': angulo = -Math.PI/2; break;
                case 'down': angulo = Math.PI/2; break;
                case 'left': angulo = Math.PI; break;
                case 'right': angulo = 0; break;
            }
            
            // Definir posição da lanterna como a posição central da tela
            const x = width / 2;
            const y = height / 2;
            
            // Desenhar círculo de luz simplificado
            const raio = config.lanterna.alcance * 0.6; // Menor para melhor desempenho
            
            // Usar globalAlpha para controlar a transparência
            ctx.globalAlpha = 0.7;
            
            // Desenhar o círculo de luz
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, Math.PI * 2);
            
            // Criar gradiente radial para o círculo
            const gradiente = ctx.createRadialGradient(
                x, y, 0,
                x, y, raio
            );
            
            // Cores mais suaves para o gradiente
            gradiente.addColorStop(0, 'rgba(255, 255, 220, 0.9)');  // Centro
            gradiente.addColorStop(0.7, 'rgba(255, 240, 180, 0.5)'); // Meio
            gradiente.addColorStop(1, 'rgba(255, 230, 150, 0)');    // Borda
            
            ctx.fillStyle = gradiente;
            ctx.fill();
            
            // Desenhar um cone de luz mais estreito na direção do jogador
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            // Calcular pontos do arco
            const anguloLuz = config.lanterna.anguloLuz * 0.8; // Cone mais estreito
            const anguloInicio = angulo - anguloLuz / 2;
            const anguloFim = angulo + anguloLuz / 2;
            
            // Desenhar o arco
            ctx.arc(x, y, raio * 1.5, anguloInicio, anguloFim);
            ctx.lineTo(x, y);
            
            // Criar gradiente para o cone
            const gradienteCone = ctx.createRadialGradient(
                x, y, 0,
                x, y, raio * 1.5
            );
            
            gradienteCone.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
            gradienteCone.addColorStop(1, 'rgba(255, 240, 150, 0)');
            
            ctx.fillStyle = gradienteCone;
            ctx.fill();
            
            // Restaurar alpha
            ctx.globalAlpha = 1.0;
            
            // Renderizar UI da lanterna
            renderLanternaUI(ctx, width, height);
        } catch (e) {
            console.error("Erro na renderização simplificada:", e);
        }
    }
    
    // Atualizar sistema de adaptação visual à escuridão
    function updateAdaptacaoVisual() {
        // Se a lanterna estiver desligada, começar a se adaptar à escuridão
        if (!config.lanterna.ativa) {
            // Se é a primeira vez que escurece, iniciar contagem
            if (state.adaptacaoEscuridao === 0) {
                state.inicioAdaptacao = Date.now();
            }
            
            // Calcular quanto tempo se passou desde que escureceu
            const tempoPassado = Date.now() - state.inicioAdaptacao;
            // Calcular nível de adaptação (0 a 1)
            state.adaptacaoEscuridao = Math.min(1, tempoPassado / config.escuridao.tempoAdaptacao);
        } else {
            // Quando a lanterna liga, perde-se instantaneamente a adaptação ao escuro
            state.adaptacaoEscuridao = 0;
        }
    }
    
    // Atualizar partículas no ar para efeito volumétrico da luz
    function updateParticulas() {
        try {
            // Inicializar array se não existir
            if (!state.particulasAr) {
                state.particulasAr = [];
            }
            
            // Manter um número constante de partículas (limitado para performance)
            const maxParticulas = Math.min(15, 25 * config.atmosfera.densidade);
            
            // Adicionar novas partículas se necessário
            while (state.particulasAr.length < maxParticulas) {
                state.particulasAr.push({
                    x: Math.random(),           // Posição horizontal relativa (0-1)
                    y: Math.random(),           // Posição vertical relativa (0-1)
                    tamanho: Math.random() * 1.5 + 0.5, // Tamanho da partícula (reduzido)
                    velocidade: Math.random() * 0.001 - 0.0005, // Velocidade de movimento (reduzida)
                    opacidade: Math.random() * 0.4 + 0.1       // Opacidade da partícula (reduzida)
                });
            }
            
            // Atualizar movimento das partículas
            state.particulasAr.forEach(part => {
                part.y += part.velocidade;
                
                // Partículas que saem do campo de visão voltam por cima
                if (part.y < 0) part.y = 1;
                if (part.y > 1) part.y = 0;
            });
        } catch (e) {
            console.error("Erro ao atualizar partículas:", e);
            // Resetar o estado para evitar erros contínuos
            state.particulasAr = [];
        }
    }
    
    // Sistema de ruído da lanterna para efeitos de falha realistas
    function gerarRuidoLanterna() {
        // Quanto menor a bateria, maior a chance de ruído
        const chanceRuido = state.bateriaBaixa ? 0.05 : 0.002;
        
        if (Math.random() < chanceRuido && state.tick - state.ultimoRuido > 30) {
            // Salvar timestamp do último ruído
            state.ultimoRuido = state.tick;
            
            // Gerar falha temporária na lanterna
            state.flickering = true;
            // Duração aleatória da falha
            const duracaoFalha = Math.floor(Math.random() * 5) + 2;
            
            setTimeout(() => {
                state.flickering = false;
            }, duracaoFalha * 16); // Converter frames para ms (approx)
            
            // Som de estática/falha na lanterna
            playSound('lanterna_ruido');
            
            return true;
        }
        
        return false;
    }

    // API pública
    return {
        init: init,
        update: update,
        render: render,
        toggleLanterna: toggleLanterna,
        causarTremor: causarTremor,
        recarregarBateria: recarregarBateria,
        
        // Getters/Setters
        isLanternaAtiva: function() {
            return config.lanterna.ativa && !state.flickering;
        },
        getBateria: function() {
            return config.lanterna.bateria;
        },
        setEscuridao: function(intensidade) {
            config.escuridao.intensidade = Math.max(0, Math.min(1, intensidade));
        },
        getConfig: function() {
            return {...config}; // Retorna uma cópia para evitar modificação externa
        },
        // Atualizar a direção atual do jogador
        setDirecao: function(novaDirecao) {
            if (['up', 'down', 'left', 'right'].includes(novaDirecao)) {
                state.direcaoAtual = novaDirecao;
            }
        },
        // Novas funções para controle avançado
        setAmbienteUmido: function(umido) {
            state.ambienteUmido = umido;
            // Ajustar densidade de partículas com base na umidade
            config.atmosfera.densidade = umido ? 0.5 : 0.3;
        },
        configurarLuz: function(configLuz) {
            // Permite ajustar parâmetros da luz em tempo real
            if (configLuz.alcance) config.lanterna.alcance = configLuz.alcance;
            if (configLuz.angulo) config.lanterna.anguloLuz = configLuz.angulo;
            if (configLuz.intensidade) config.lanterna.intensidade = configLuz.intensidade;
            if (configLuz.cor) config.lanterna.corLuz = configLuz.cor;
        },
        ativarLuar: function(intensidade = 0.15) {
            config.escuridao.luaCeu.presente = true;
            config.escuridao.luaCeu.intensidade = intensidade;
        },
        desativarLuar: function() {
            config.escuridao.luaCeu.presente = false;
        },
        // Funções de diagnóstico
        getModoComposicao: function() {
            return state.modoComposicaoPreferido;
        },
        getRenderizacaoFalhou: function() {
            return state.renderizacaoFalhou;
        },
        getEstadoDebug: function() {
            return {
                modoComposicao: state.modoComposicaoPreferido,
                renderizacaoFalhou: state.renderizacaoFalhou,
                bateria: config.lanterna.bateria,
                ativa: config.lanterna.ativa,
                flickering: state.flickering,
                particulasAtivas: config.atmosfera.particulas,
                numParticulas: state.particulasAr ? state.particulasAr.length : 0
            };
        }
    };
})();

// Inicializar o sistema quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.LanternaSystem.init();
});
