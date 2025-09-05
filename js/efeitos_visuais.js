// Sistema de Efeitos Visuais
// Gerencia partículas, tremores de tela, flashes e outros efeitos visuais

const EfeitosVisuais = (function() {
    // Configurações
    const config = {
        maxParticulas: 200,    // Número máximo de partículas simultâneas
        debug: false           // Mostrar informações de debug
    };
    
    // Estado do sistema
    const state = {
        particulas: [],        // Lista de partículas ativas
        tremores: [],          // Lista de efeitos de tremor ativos
        flashes: [],           // Lista de efeitos de flash ativos
        rastrosArma: []        // Lista de rastros de arma ativos
    };
    
    // Classes de efeitos
    
    // Classe Partícula
    class Particula {
        constructor(x, y, cor, tamanho, velocidade, vida, gravidade = 0, tipo = 'circular') {
            this.x = x;
            this.y = y;
            this.cor = cor;
            this.tamanho = tamanho;
            this.tamanhoOriginal = tamanho;
            this.velocidade = velocidade;
            this.vida = vida;  // em milissegundos
            this.vidaMaxima = vida;
            this.nascimento = Date.now();
            this.gravidade = gravidade;
            this.tipo = tipo;  // 'circular', 'quadrada', 'linha', etc.
            this.rotacao = Math.random() * Math.PI * 2;
            this.velocidadeRotacao = (Math.random() - 0.5) * 0.2;
        }
        
        atualizar(delta) {
            // Atualizar posição
            this.x += this.velocidade.x * delta;
            this.y += this.velocidade.y * delta;
            
            // Aplicar gravidade
            if (this.gravidade !== 0) {
                this.velocidade.y += this.gravidade * delta;
            }
            
            // Atualizar rotação
            this.rotacao += this.velocidadeRotacao * delta;
            
            // Diminuir tamanho ao longo do tempo
            const vidaRestante = 1 - ((Date.now() - this.nascimento) / this.vida);
            this.tamanho = this.tamanhoOriginal * vidaRestante;
            
            // Verificar se a partícula ainda está viva
            return (Date.now() - this.nascimento) < this.vida;
        }
        
        desenhar(ctx) {
            const alpha = 1 - ((Date.now() - this.nascimento) / this.vida);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotacao);
            
            if (this.tipo === 'circular') {
                ctx.beginPath();
                ctx.fillStyle = this.cor;
                ctx.arc(0, 0, this.tamanho, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.tipo === 'quadrada') {
                ctx.fillStyle = this.cor;
                ctx.fillRect(-this.tamanho/2, -this.tamanho/2, this.tamanho, this.tamanho);
            } else if (this.tipo === 'linha') {
                ctx.strokeStyle = this.cor;
                ctx.lineWidth = this.tamanho / 3;
                ctx.beginPath();
                ctx.moveTo(-this.tamanho, 0);
                ctx.lineTo(this.tamanho, 0);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    // Classe Tremor
    class Tremor {
        constructor(intensidade, duracao) {
            this.intensidade = intensidade;  // Intensidade do tremor (0-1)
            this.duracao = duracao;          // Duração em milissegundos
            this.inicio = Date.now();
            this.deslocamentoX = 0;
            this.deslocamentoY = 0;
        }
        
        atualizar() {
            const tempoDecorrido = Date.now() - this.inicio;
            const progresso = tempoDecorrido / this.duracao;
            
            // Tremor diminui com o tempo
            const intensidadeAtual = this.intensidade * (1 - progresso);
            
            // Gerar valores aleatórios para o deslocamento
            this.deslocamentoX = (Math.random() * 2 - 1) * intensidadeAtual * 15;
            this.deslocamentoY = (Math.random() * 2 - 1) * intensidadeAtual * 15;
            
            // Verificar se o tremor ainda está ativo
            return tempoDecorrido < this.duracao;
        }
        
        aplicar(ctx) {
            ctx.translate(this.deslocamentoX, this.deslocamentoY);
        }
    }
    
    // Classe Flash
    class Flash {
        constructor(cor, duracao, intensidade = 0.5) {
            this.cor = cor;
            this.duracao = duracao;
            this.intensidade = intensidade;
            this.inicio = Date.now();
        }
        
        atualizar() {
            const tempoDecorrido = Date.now() - this.inicio;
            return tempoDecorrido < this.duracao;
        }
        
        desenhar(ctx, canvas) {
            const tempoDecorrido = Date.now() - this.inicio;
            const progresso = tempoDecorrido / this.duracao;
            const alpha = this.intensidade * (1 - progresso);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.cor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    }
    
    // Classe RastroArma
    class RastroArma {
        constructor(x, y, direcao, cor, intensidade = 1) {
            this.x = x;
            this.y = y;
            this.direcao = direcao;
            this.cor = cor;
            this.intensidade = intensidade;
            this.duracao = 400 * intensidade;  // Mais intenso = mais duradouro
            this.inicio = Date.now();
            this.comprimento = 50 * intensidade;
            this.largura = 15 * intensidade;
        }
        
        atualizar() {
            const tempoDecorrido = Date.now() - this.inicio;
            return tempoDecorrido < this.duracao;
        }
        
        desenhar(ctx) {
            const tempoDecorrido = Date.now() - this.inicio;
            const progresso = tempoDecorrido / this.duracao;
            const alpha = 1 - progresso;
            
            // Calcular pontos de início e fim do rastro
            let xInicio = this.x;
            let yInicio = this.y;
            let xFim, yFim;
            
            switch(this.direcao) {
                case 'right':
                    xFim = xInicio + this.comprimento;
                    yFim = yInicio;
                    break;
                case 'left':
                    xFim = xInicio - this.comprimento;
                    yFim = yInicio;
                    break;
                case 'up':
                    xFim = xInicio;
                    yFim = yInicio - this.comprimento;
                    break;
                case 'down':
                default:
                    xFim = xInicio;
                    yFim = yInicio + this.comprimento;
                    break;
            }
            
            // Criar gradiente
            const gradient = ctx.createLinearGradient(xInicio, yInicio, xFim, yFim);
            gradient.addColorStop(0, this.cor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.lineWidth = this.largura * (1 - progresso * 0.7);
            ctx.lineCap = 'round';
            ctx.strokeStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(xInicio, yInicio);
            ctx.lineTo(xFim, yFim);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // Métodos públicos
    return {
        // Inicializar o sistema
        init: function() {
            console.log('Sistema de efeitos visuais inicializado');
        },
        
        // Atualizar todos os efeitos ativos
        atualizar: function(delta = 1) {
            // Atualizar partículas
            state.particulas = state.particulas.filter(p => p.atualizar(delta));
            
            // Atualizar tremores
            state.tremores = state.tremores.filter(t => t.atualizar());
            
            // Atualizar flashes
            state.flashes = state.flashes.filter(f => f.atualizar());
            
            // Atualizar rastros de arma
            state.rastrosArma = state.rastrosArma.filter(r => r.atualizar());
        },
        
        // Renderizar todos os efeitos ativos
        renderizar: function(ctx, canvas) {
            // Aplicar tremores de tela
            ctx.save();
            state.tremores.forEach(tremor => tremor.aplicar(ctx));
            
            // Renderizar rastros de arma
            state.rastrosArma.forEach(rastro => rastro.desenhar(ctx));
            
            // Renderizar partículas
            state.particulas.forEach(particula => particula.desenhar(ctx));
            
            // Renderizar flashes
            state.flashes.forEach(flash => flash.desenhar(ctx, canvas));
            
            ctx.restore();
            
            // Mostrar informações de debug se habilitado
            if (config.debug) {
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.fillText(`Partículas: ${state.particulas.length}`, 10, 20);
                ctx.fillText(`Tremores: ${state.tremores.length}`, 10, 40);
                ctx.fillText(`Flashes: ${state.flashes.length}`, 10, 60);
                ctx.fillText(`Rastros: ${state.rastrosArma.length}`, 10, 80);
                ctx.restore();
            }
        },
        
        // Criar explosão de partículas
        criarExplosao: function(x, y, cor = '#FF9900', quantidade = 20, tamanho = 5, vida = 1000, gravidade = 0.05) {
            // Limitar o número máximo de partículas
            if (state.particulas.length > config.maxParticulas - quantidade) {
                // Remover partículas mais antigas se estiver chegando ao limite
                state.particulas.splice(0, quantidade);
            }
            
            for (let i = 0; i < quantidade; i++) {
                const angulo = Math.random() * Math.PI * 2;
                const velocidade = 0.5 + Math.random() * 2;
                const tamanhoVariacao = tamanho * (0.5 + Math.random() * 0.5);
                const vidaVariacao = vida * (0.5 + Math.random() * 0.5);
                
                state.particulas.push(new Particula(
                    x,
                    y,
                    cor,
                    tamanhoVariacao,
                    {
                        x: Math.cos(angulo) * velocidade,
                        y: Math.sin(angulo) * velocidade
                    },
                    vidaVariacao,
                    gravidade,
                    Math.random() > 0.7 ? 'quadrada' : 'circular'
                ));
            }
        },
        
        // Criar rastro de sangue
        criarSangue: function(x, y, quantidade = 10, tamanho = 3) {
            const corBase = '#AA0000';
            const cores = [
                '#AA0000', '#990000', '#880000', '#BB0000'
            ];
            
            for (let i = 0; i < quantidade; i++) {
                const angulo = Math.random() * Math.PI * 2;
                const velocidade = 0.3 + Math.random() * 1.5;
                const cor = cores[Math.floor(Math.random() * cores.length)];
                
                state.particulas.push(new Particula(
                    x + (Math.random() * 10 - 5),
                    y + (Math.random() * 10 - 5),
                    cor,
                    tamanho * (0.5 + Math.random()),
                    {
                        x: Math.cos(angulo) * velocidade,
                        y: Math.sin(angulo) * velocidade
                    },
                    1000 + Math.random() * 2000,
                    0.1,
                    'circular'
                ));
            }
        },
        
        // Criar rastro de arma
        criarRastroArma: function(x, y, direcao, cor = '#FFFFFF', intensidade = 1) {
            state.rastrosArma.push(new RastroArma(x, y, direcao, cor, intensidade));
        },
        
        // Criar tremor de tela
        criarTremor: function(intensidade = 0.5, duracao = 500) {
            state.tremores.push(new Tremor(intensidade, duracao));
        },
        
        // Criar efeito de cura
        criarCura: function(x, y, quantidade = 20, tamanho = 4) {
            const cores = [
                '#66ff66', '#88ff88', '#aaffaa', '#ccffcc'
            ];
            
            for (let i = 0; i < quantidade; i++) {
                const angulo = Math.random() * Math.PI * 2;
                const velocidade = 0.5 + Math.random() * 1.5;
                const cor = cores[Math.floor(Math.random() * cores.length)];
                
                state.particulas.push(new Particula(
                    x + (Math.random() * 20 - 10),
                    y + (Math.random() * 20 - 10),
                    cor,
                    tamanho * (0.5 + Math.random()),
                    {
                        x: Math.cos(angulo) * velocidade,
                        y: Math.sin(angulo) * velocidade - 1 // Tendência para subir
                    },
                    1500 + Math.random() * 1000,
                    -0.05, // Gravidade negativa (sobe)
                    'circular'
                ));
            }
        },
        
        // Criar efeito de nivel up
        criarLevelUp: function(x, y) {
            // Explosão dourada
            for (let i = 0; i < 30; i++) {
                const angulo = (i / 30) * Math.PI * 2;
                const velocidade = 1 + Math.random() * 2;
                const cor = `hsl(${45 + Math.random() * 30}, 100%, ${60 + Math.random() * 30}%)`;
                
                state.particulas.push(new Particula(
                    x, y, cor,
                    3 + Math.random() * 4,
                    {
                        x: Math.cos(angulo) * velocidade,
                        y: Math.sin(angulo) * velocidade
                    },
                    2000,
                    0.02,
                    'circular'
                ));
            }
            
            // Estrelas que sobem
            for (let i = 0; i < 15; i++) {
                const velocidade = {
                    x: (Math.random() - 0.5) * 0.5,
                    y: -1 - Math.random() * 1.5
                };
                
                state.particulas.push(new Particula(
                    x + (Math.random() * 40 - 20),
                    y + (Math.random() * 20 - 10),
                    '#ffff00',
                    2 + Math.random() * 2,
                    velocidade,
                    3000,
                    -0.01,
                    'circular'
                ));
            }
        },
        
        // Criar efeito de magia
        criarMagia: function(x, y, cor = '#8844ff', quantidade = 25) {
            for (let i = 0; i < quantidade; i++) {
                const angulo = Math.random() * Math.PI * 2;
                const velocidade = 0.3 + Math.random() * 1.2;
                const tamanho = 2 + Math.random() * 3;
                
                state.particulas.push(new Particula(
                    x + (Math.random() * 30 - 15),
                    y + (Math.random() * 30 - 15),
                    cor,
                    tamanho,
                    {
                        x: Math.cos(angulo) * velocidade,
                        y: Math.sin(angulo) * velocidade
                    },
                    2000 + Math.random() * 1500,
                    Math.random() * 0.02 - 0.01, // Gravidade aleatória
                    Math.random() > 0.5 ? 'circular' : 'linha'
                ));
            }
        },
        
        // Criar efeito de impacto crítico
        criarCritico: function(x, y) {
            // Explosão vermelha intensa
            this.criarExplosao(x, y, '#ff0040', 40, 8, 1500, 0.08);
            
            // Linhas de impacto radiantes
            for (let i = 0; i < 8; i++) {
                const angulo = (i / 8) * Math.PI * 2;
                const comprimento = 20 + Math.random() * 15;
                
                state.particulas.push(new Particula(
                    x, y,
                    '#ffffff',
                    comprimento,
                    {
                        x: Math.cos(angulo) * 2,
                        y: Math.sin(angulo) * 2
                    },
                    400,
                    0,
                    'linha'
                ));
            }
            
            // Flash branco
            this.criarFlash('#ffffff', 150, 0.3);
            
            // Tremor forte
            this.criarTremor(0.6, 400);
        },
        
        // Criar rastro de movimento
        criarRastroMovimento: function(x, y, direcao, cor = '#ffffff') {
            const quantidade = 8;
            
            for (let i = 0; i < quantidade; i++) {
                let velocidadeX = 0;
                let velocidadeY = 0;
                
                // Direção oposta ao movimento
                switch(direcao) {
                    case 'up':
                        velocidadeX = (Math.random() - 0.5) * 0.5;
                        velocidadeY = 0.5 + Math.random() * 1;
                        break;
                    case 'down':
                        velocidadeX = (Math.random() - 0.5) * 0.5;
                        velocidadeY = -0.5 - Math.random() * 1;
                        break;
                    case 'left':
                        velocidadeX = 0.5 + Math.random() * 1;
                        velocidadeY = (Math.random() - 0.5) * 0.5;
                        break;
                    case 'right':
                        velocidadeX = -0.5 - Math.random() * 1;
                        velocidadeY = (Math.random() - 0.5) * 0.5;
                        break;
                }
                
                state.particulas.push(new Particula(
                    x + (Math.random() * 8 - 4),
                    y + (Math.random() * 8 - 4),
                    cor,
                    1 + Math.random() * 2,
                    { x: velocidadeX, y: velocidadeY },
                    300 + Math.random() * 200,
                    0,
                    'circular'
                ));
            }
        },
        
        // Criar chuva de estrelas
        criarChuvaEstrelas: function(area = { x: 0, y: 0, width: 320, height: 180 }) {
            for (let i = 0; i < 15; i++) {
                const x = area.x + Math.random() * area.width;
                const y = area.y - 20 - Math.random() * 30;
                
                state.particulas.push(new Particula(
                    x, y,
                    '#ffff88',
                    1 + Math.random() * 2,
                    {
                        x: (Math.random() - 0.5) * 0.5,
                        y: 2 + Math.random() * 3
                    },
                    3000 + Math.random() * 2000,
                    0.02,
                    'circular'
                ));
            }
        },
        
        // Limpar todos os efeitos
        limpar: function() {
            state.particulas = [];
            state.tremores = [];
            state.flashes = [];
            state.rastrosArma = [];
        },
        
        // Configurações
        setDebug: function(enabled) {
            config.debug = enabled;
        },
        
        // Obter estatísticas
        getStats: function() {
            return {
                particulas: state.particulas.length,
                tremores: state.tremores.length,
                flashes: state.flashes.length,
                rastrosArma: state.rastrosArma.length
            };
        }
    };
})();

// Disponibilizar no escopo global para browsers
if (typeof window !== 'undefined') {
    window.EfeitosVisuais = EfeitosVisuais;
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EfeitosVisuais;
}
