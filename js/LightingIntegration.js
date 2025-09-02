// LightingIntegration.js - Sistema de integração de iluminação
// Conecta o sistema de lanterna com detecção automática de fontes de luz

window.LightingSystem = (function() {
    // Configurações do sistema
    const config = {
        // Lista de nomes de objetos que podem ser fontes de luz
        fontesDeLuz: {
            fogueira: {
                keywords: ['fogueira', 'fire', 'campfire', 'fogo'],
                tipo: 'fogueira',
                raio: 120,
                intensidade: 0.8,
                cor: '#FF9933',
                tremor: true,
                contribuicaoAmbiente: 0.3
            },
            tocha: {
                keywords: ['tocha', 'torch', 'antorcha'],
                tipo: 'tocha',
                raio: 80,
                intensidade: 0.7,
                cor: '#FFCC66',
                tremor: true,
                contribuicaoAmbiente: 0.2
            },
            lamparina: {
                keywords: ['lamparina', 'lantern', 'oil lamp', 'lamparão'],
                tipo: 'lamparina',
                raio: 60,
                intensidade: 0.6,
                cor: '#FFFFCC',
                tremor: true,
                contribuicaoAmbiente: 0.15
            },
            lampada: {
                keywords: ['lampada', 'lamp', 'luz', 'light bulb'],
                tipo: 'lampada',
                raio: 100,
                intensidade: 0.9,
                cor: '#FFFFFF',
                tremor: false,
                contribuicaoAmbiente: 0.25
            }
        },
        // Configurações de detecção
        deteccao: {
            raioDeteccao: 300,       // Raio máximo para detecção de fontes de luz
            intervaloAtualizacao: 30, // Frames entre cada verificação (para performance)
            distanciaMinima: 50       // Distância mínima entre fontes de luz
        },
        // Configurações de iluminação ambiente
        ambiente: {
            padrao: 0.2,              // Nível padrão de luz ambiente (0-1)
            maxima: 0.8,              // Nível máximo de luz ambiente
            transicao: 0.05           // Velocidade de transição
        }
    };
    
    // Estado do sistema
    let state = {
        fontesAtivas: [],           // Lista de fontes de luz ativas
        luzAmbiente: 0.2,           // Nível atual de luz ambiente
        tempoAtualizacao: 0,        // Contador para atualização
        ultimaDeteccao: 0,          // Timestamp da última detecção
        sistemaInicializado: false  // Flag de inicialização
    };
    
    // Inicialização do sistema
    function init() {
        console.log("Sistema de integração de iluminação inicializado");
        state.sistemaInicializado = true;
        state.ultimaDeteccao = Date.now();
        
        // Verificar se os sistemas necessários estão disponíveis
        if (!window.LanternaSystem) {
            console.warn("Aviso: LanternaSystem não encontrado, algumas funções de iluminação podem não funcionar corretamente.");
        }
    }
    
    // Detectar fontes de luz próximas ao jogador
    function detectarFontesDeLuz(gameState) {
        if (!gameState) return;
        
        // Garantir que temos estruturas válidas
        if (!gameState.jogador || !gameState.jogador.posicao) {
            console.warn("LightingSystem: jogador não encontrado ou sem posição");
            return;
        }
        
        if (!gameState.mapa) {
            gameState.mapa = { objetos: [] };
        }
        
        if (!gameState.mapa.objetos) {
            gameState.mapa.objetos = [];
        }
        
        // Verificar se é hora de atualizar a detecção
        state.tempoAtualizacao++;
        if (state.tempoAtualizacao < config.deteccao.intervaloAtualizacao) {
            return;
        }
        
        state.tempoAtualizacao = 0;
        state.ultimaDeteccao = Date.now();
        
        // Limpar fontes antigas que não são mais válidas
        try {
            state.fontesAtivas = state.fontesAtivas.filter(fonte => 
                !fonte.objeto || gameState.mapa.objetos.includes(fonte.objeto)
            );
        } catch (e) {
            console.warn("LightingSystem: erro ao limpar fontes antigas", e);
            // Reiniciar lista de fontes para evitar problemas
            state.fontesAtivas = [];
        }
        
        // Obter posição do jogador
        const jogadorX = gameState.jogador.posicao.x;
        const jogadorY = gameState.jogador.posicao.y;
        
        // Procurar por objetos que podem ser fontes de luz
        const objetos = gameState.mapa.objetos || [];
        
        objetos.forEach(objeto => {
            // Ignorar objetos sem nome ou posição
            if (!objeto.nome || (!objeto.posicao && (!objeto.x || !objeto.y))) return;
            
            // Verificar se este objeto já está na lista de fontes ativas
            const objetoJaRegistrado = state.fontesAtivas.some(fonte => fonte.objeto === objeto);
            if (objetoJaRegistrado) return;
            
            // Calcular distância do jogador
            const objX = objeto.x || objeto.posicao.x;
            const objY = objeto.y || objeto.posicao.y;
            
            const dx = objX - jogadorX;
            const dy = objY - jogadorY;
            const distancia = Math.sqrt(dx*dx + dy*dy);
            
            // Ignorar objetos muito distantes
            if (distancia > config.deteccao.raioDeteccao) return;
            
            // Verificar se o objeto corresponde a alguma fonte de luz conhecida
            const nomeLowerCase = objeto.nome.toLowerCase();
            
            for (const [tipoFonte, configFonte] of Object.entries(config.fontesDeLuz)) {
                // Verificar se alguma palavra-chave está no nome do objeto
                const ehFonteDeLuz = configFonte.keywords.some(keyword => 
                    nomeLowerCase.includes(keyword)
                );
                
                if (ehFonteDeLuz) {
                    // Adicionar à lista de fontes ativas
                    state.fontesAtivas.push({
                        tipo: tipoFonte,
                        objeto: objeto,
                        posicao: { x: objX, y: objY },
                        raio: configFonte.raio,
                        intensidade: configFonte.intensidade,
                        cor: configFonte.cor,
                        tremor: configFonte.tremor,
                        contribuicaoAmbiente: configFonte.contribuicaoAmbiente,
                        ativa: true,
                        ultimaAtualizacao: Date.now()
                    });
                    
                    console.log(`Fonte de luz detectada: ${tipoFonte} em ${objX}, ${objY}`);
                    break;
                }
            }
        });
        
        // Atualizar o nível de luz ambiente
        atualizarLuzAmbiente();
    }
    
    // Atualizar o nível de luz ambiente com base nas fontes ativas
    function atualizarLuzAmbiente() {
        // Começar com o nível padrão
        let novoNivel = config.ambiente.padrao;
        
        // Adicionar contribuição de cada fonte ativa
        state.fontesAtivas.forEach(fonte => {
            if (fonte.ativa) {
                novoNivel += fonte.contribuicaoAmbiente;
            }
        });
        
        // Limitar ao máximo configurado
        novoNivel = Math.min(config.ambiente.maxima, novoNivel);
        
        // Aplicar transição suave
        if (Math.abs(state.luzAmbiente - novoNivel) > config.ambiente.transicao) {
            if (state.luzAmbiente < novoNivel) {
                state.luzAmbiente += config.ambiente.transicao;
            } else {
                state.luzAmbiente -= config.ambiente.transicao;
            }
        } else {
            state.luzAmbiente = novoNivel;
        }
        
        // Aplicar ao sistema de lanterna
        if (window.LanternaSystem) {
            // Quanto maior a luz ambiente, menor a escuridão
            const nivelEscuridao = 1.0 - state.luzAmbiente;
            window.LanternaSystem.setEscuridao(nivelEscuridao);
        }
    }
    
    // Atualizar as fontes de luz
    function update(gameState) {
        if (!state.sistemaInicializado) {
            init();
        }
        
        // Detectar fontes de luz próximas
        detectarFontesDeLuz(gameState);
        
        // Atualizar efeitos visuais das fontes
        const tempo = Date.now() / 1000;
        
        state.fontesAtivas.forEach(fonte => {
            if (fonte.tremor) {
                // Adicionar variação para fontes com tremor
                fonte.intensidadeAtual = fonte.intensidade * (
                    0.85 + 0.15 * Math.sin(tempo * 3 + fonte.posicao.x) +
                    0.05 * Math.random()
                );
            } else {
                fonte.intensidadeAtual = fonte.intensidade;
            }
        });
    }
    
    // Renderizar as fontes de luz no canvas de iluminação
    function render(ctx, cameraX, cameraY) {
        if (!ctx) return;
        
        // Verificar se existem fontes ativas
        if (state.fontesAtivas.length === 0) return;
        
        // Salvar estado do contexto
        ctx.save();
        
        // Configurar composição para que as luzes "removam" a escuridão
        ctx.globalCompositeOperation = 'destination-out';
        
        // Renderizar cada fonte de luz
        state.fontesAtivas.forEach(fonte => {
            if (!fonte.ativa) return;
            
            // Calcular posição na tela
            const screenX = fonte.posicao.x - cameraX + ctx.canvas.width / 2;
            const screenY = fonte.posicao.y - cameraY + ctx.canvas.height / 2;
            
            // Criar gradiente para a luz
            const gradiente = ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, fonte.raio
            );
            
            // Intensidade atual (com tremulação)
            const intensidade = fonte.intensidadeAtual || fonte.intensidade;
            
            // Configurar gradiente
            gradiente.addColorStop(0, `rgba(255, 255, 255, ${intensidade})`);
            gradiente.addColorStop(0.7, `rgba(255, 255, 255, ${intensidade * 0.5})`);
            gradiente.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Desenhar círculo de luz
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.arc(screenX, screenY, fonte.raio, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Restaurar contexto
        ctx.restore();
    }
    
    // Adicionar uma fonte de luz manualmente
    function adicionarFonteDeLuz(tipo, x, y, raio) {
        if (!config.fontesDeLuz[tipo]) {
            console.error(`Tipo de fonte de luz desconhecido: ${tipo}`);
            return;
        }
        
        const fonte = config.fontesDeLuz[tipo];
        
        state.fontesAtivas.push({
            tipo: tipo,
            objeto: null, // Fonte manual, não associada a um objeto
            posicao: { x, y },
            raio: raio || fonte.raio,
            intensidade: fonte.intensidade,
            cor: fonte.cor,
            tremor: fonte.tremor,
            contribuicaoAmbiente: fonte.contribuicaoAmbiente,
            ativa: true,
            ultimaAtualizacao: Date.now(),
            manual: true // Flag para indicar que foi adicionada manualmente
        });
        
        // Atualizar o nível de luz ambiente
        atualizarLuzAmbiente();
        
        return state.fontesAtivas.length - 1; // Retorna o índice da nova fonte
    }
    
    // Remover uma fonte de luz
    function removerFonteDeLuz(indice) {
        if (indice >= 0 && indice < state.fontesAtivas.length) {
            state.fontesAtivas.splice(indice, 1);
            atualizarLuzAmbiente();
            return true;
        }
        return false;
    }
    
    // API pública
    return {
        init: init,
        update: update,
        render: render,
        adicionarFonteDeLuz: adicionarFonteDeLuz,
        removerFonteDeLuz: removerFonteDeLuz,
        getFontesAtivas: function() {
            return [...state.fontesAtivas];
        },
        getLuzAmbiente: function() {
            return state.luzAmbiente;
        },
        setLuzAmbientePadrao: function(nivel) {
            config.ambiente.padrao = Math.max(0, Math.min(1, nivel));
            atualizarLuzAmbiente();
        }
    };
})();

// Inicializar o sistema quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (window.LightingSystem) {
        window.LightingSystem.init();
    }
});
