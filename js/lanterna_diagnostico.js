// lanterna_diagnostico.js
// Ferramentas de diagnóstico para o sistema de lanterna

window.LanternaDiagnostico = (function() {
    
    // Configurações
    const config = {
        ativo: false,                  // Estado inicial do diagnóstico
        mostrarLog: true,              // Mostrar logs no console
        mostrarUI: false,              // Mostrar UI de diagnóstico na tela
        corBorda: 'rgba(255,0,0,0.5)', // Cor da borda de diagnóstico
        posicaoUI: 'bottom-right'      // Posição da UI de diagnóstico
    };
    
    // Estado interno
    let state = {
        iniciado: false,
        ultimoTeste: null,
        compatibilidades: {},
        modoComposicao: null,
        erros: [],
        fps: 0,
        ultimaRenderizacao: 0,
        contadorFrames: 0
    };
    
    // Inicializar
    function init() {
        if (state.iniciado) return;
        
        console.log("[Diagnóstico] Inicializando sistema de diagnóstico da lanterna");
        
        try {
            // Testar compatibilidade com modos de composição
            testarCompatibilidadeComposicao();
            
            // Adicionar hook para monitorar FPS
            window.requestAnimationFrame(monitorarFPS);
            
            // Monitorar erros relacionados à lanterna
            monitorarErros();
            
            state.iniciado = true;
        } catch (e) {
            console.error("[Diagnóstico] Erro ao inicializar:", e);
        }
    }
    
    // Testar compatibilidade com modos de composição
    function testarCompatibilidadeComposicao() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                state.compatibilidades.canvas = false;
                log("Canvas não suportado neste navegador");
                return;
            }
            
            state.compatibilidades.canvas = true;
            
            // Testar cada modo de composição
            const modos = ['source-over', 'lighter', 'destination-out', 'screen', 'multiply'];
            
            modos.forEach(modo => {
                ctx.globalCompositeOperation = modo;
                const suportado = ctx.globalCompositeOperation === modo;
                state.compatibilidades[modo] = suportado;
                
                log(`Modo de composição '${modo}': ${suportado ? 'Suportado' : 'Não suportado'}`);
            });
            
            state.ultimoTeste = new Date();
        } catch (e) {
            log("Erro ao testar compatibilidade: " + e.message, true);
        }
    }
    
    // Monitorar FPS
    function monitorarFPS(timestamp) {
        if (!state.ultimaRenderizacao) {
            state.ultimaRenderizacao = timestamp;
        }
        
        // Calcular FPS a cada segundo
        if (timestamp - state.ultimaRenderizacao >= 1000) {
            state.fps = state.contadorFrames;
            state.contadorFrames = 0;
            state.ultimaRenderizacao = timestamp;
            
            if (config.mostrarLog && config.ativo) {
                log(`FPS: ${state.fps}`);
            }
        }
        
        state.contadorFrames++;
        window.requestAnimationFrame(monitorarFPS);
    }
    
    // Monitorar erros
    function monitorarErros() {
        // Capturar erros globais
        window.addEventListener('error', function(event) {
            const erro = {
                mensagem: event.message,
                arquivo: event.filename,
                linha: event.lineno,
                coluna: event.colno,
                stack: event.error ? event.error.stack : null,
                data: new Date()
            };
            
            // Verificar se é relacionado à lanterna
            if (erro.arquivo && (erro.arquivo.includes('Lanterna') || 
                                erro.mensagem.includes('lanterna') ||
                                (erro.stack && erro.stack.includes('Lanterna')))) {
                state.erros.push(erro);
                log(`Erro relacionado à lanterna: ${erro.mensagem}`, true);
            }
        });
    }
    
    // Renderizar UI de diagnóstico
    function renderUI(ctx) {
        if (!config.ativo || !config.mostrarUI || !ctx) return;
        
        // Salvar estado do contexto
        ctx.save();
        
        // Definir estilo
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = config.corBorda;
        ctx.lineWidth = 2;
        
        // Definir posição
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        let x, y, w = 200, h = 150;
        
        switch (config.posicaoUI) {
            case 'top-left':
                x = 10;
                y = 10;
                break;
            case 'top-right':
                x = width - w - 10;
                y = 10;
                break;
            case 'bottom-left':
                x = 10;
                y = height - h - 10;
                break;
            case 'bottom-right':
            default:
                x = width - w - 10;
                y = height - h - 10;
                break;
        }
        
        // Desenhar painel
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        
        // Título
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('Diagnóstico da Lanterna', x + 10, y + 20);
        
        // Informações
        ctx.font = '10px Arial';
        let linha = y + 40;
        
        // FPS
        ctx.fillText(`FPS: ${state.fps}`, x + 10, linha);
        linha += 15;
        
        // Modo de composição
        const modoAtual = window.LanternaSystem && 
                         window.LanternaSystem.getModoComposicao ? 
                         window.LanternaSystem.getModoComposicao() : 
                         'desconhecido';
        
        ctx.fillText(`Modo Composição: ${modoAtual}`, x + 10, linha);
        linha += 15;
        
        // Estado lanterna
        const lanternaAtiva = window.LanternaSystem && 
                             window.LanternaSystem.isLanternaAtiva ? 
                             window.LanternaSystem.isLanternaAtiva() : 
                             false;
        
        ctx.fillText(`Lanterna ativa: ${lanternaAtiva ? 'Sim' : 'Não'}`, x + 10, linha);
        linha += 15;
        
        // Bateria
        const bateria = window.LanternaSystem && 
                       window.LanternaSystem.getBateria ? 
                       window.LanternaSystem.getBateria() : 
                       'N/A';
        
        ctx.fillText(`Bateria: ${bateria !== 'N/A' ? bateria.toFixed(1) + '%' : bateria}`, x + 10, linha);
        linha += 15;
        
        // Últimos erros
        if (state.erros.length > 0) {
            ctx.fillStyle = 'rgba(255,100,100,1)';
            ctx.fillText('Último erro:', x + 10, linha);
            linha += 15;
            
            const ultimoErro = state.erros[state.erros.length - 1];
            ctx.fillText(ultimoErro.mensagem.substring(0, 25) + '...', x + 10, linha);
        }
        
        // Restaurar contexto
        ctx.restore();
    }
    
    // Função interna para log
    function log(mensagem, isErro = false) {
        if (!config.mostrarLog && !isErro) return;
        
        const prefixo = isErro ? '[Diagnóstico ERROR]' : '[Diagnóstico]';
        
        if (isErro) {
            console.error(`${prefixo} ${mensagem}`);
        } else {
            console.log(`${prefixo} ${mensagem}`);
        }
    }
    
    // API pública
    return {
        init: init,
        renderUI: renderUI,
        
        ativar: function() {
            config.ativo = true;
            log("Diagnóstico da lanterna ativado");
        },
        
        desativar: function() {
            config.ativo = false;
            log("Diagnóstico da lanterna desativado");
        },
        
        isAtivo: function() {
            return config.ativo;
        },
        
        mostrarUI: function(mostrar = true) {
            config.mostrarUI = mostrar;
        },
        
        getInfo: function() {
            return {
                compatibilidades: state.compatibilidades,
                fps: state.fps,
                erros: state.erros.slice(-5) // Últimos 5 erros
            };
        },
        
        getEstadoLanterna: function() {
            if (!window.LanternaSystem) return null;
            
            return {
                ativa: window.LanternaSystem.isLanternaAtiva ? window.LanternaSystem.isLanternaAtiva() : null,
                bateria: window.LanternaSystem.getBateria ? window.LanternaSystem.getBateria() : null,
                config: window.LanternaSystem.getConfig ? window.LanternaSystem.getConfig() : null
            };
        }
    };
})();

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar com pequeno atraso para garantir que o sistema de lanterna já está carregado
    setTimeout(function() {
        window.LanternaDiagnostico.init();
    }, 500);
});
