// Sistema de gestão de personagens (sem módulos ES)
(function(window){
    const personagemPrincipal = window.personagemPrincipal;
    const mobs = window.mobs;
    const criarMob = window.criarMob;

    // Classe principal de gerenciamento de personagens
    class GerenciadorPersonagens {
        constructor() {
            // Jogador
            this.jogador = personagemPrincipal;
            // NPCs amigáveis ou neutros
            this.npcsAtivos = [];
            // Lista de NPCs e inimigos ativos no jogo
            this.mobsAtivos = [];
            // Cache de sprites e recursos
            this.recursos = {
                sprites: {},
                sons: {}
            };
        }
    
    // Inicialização
    inicializar() {
        // Inicializar jogador
        this.jogador.inicializar();
        console.log("Gerenciador de personagens inicializado");
    }
    
    // Carregar recursos para um tipo de mob
    carregarRecursosMob(tipo) {
        // Se já carregamos, retornar
        if (this.recursos.sprites[tipo]) return;
        
        // Simular carregamento (posteriormente implementar carregamento real)
        console.log(`Carregando recursos para ${tipo}...`);
        this.recursos.sprites[tipo] = {
            parado: "sprite_placeholder",
            movendo: "sprite_placeholder",
            atacando: "sprite_placeholder"
        };
        
        this.recursos.sons[tipo] = {
            ataque: "som_placeholder",
            dano: "som_placeholder",
            morte: "som_placeholder"
        };
    }
    
    // Spawnar um novo mob
    spawnarMob(tipo, nivel, posicaoX, posicaoY) {
        // Verificar se o tipo existe
        if (!mobs[tipo]) {
            console.error(`Tipo de mob "${tipo}" não encontrado`);
            return null;
        }
        
        // Carregar recursos necessários
        this.carregarRecursosMob(tipo);
        
        // Criar nova instância
        const novoMob = criarMob(tipo, nivel);
        
        // Definir posição
        novoMob.posicao.x = posicaoX;
        novoMob.posicao.y = posicaoY;
        
        // Adicionar à lista de mobs ativos
        this.mobsAtivos.push(novoMob);
        
        console.log(`Mob ${novoMob.nome} (Nível ${nivel}) spawnado em [${posicaoX}, ${posicaoY}]`);
        return novoMob;
    }
    
    // Remover mob morto
    removerMob(idMob) {
        const index = this.mobsAtivos.findIndex(mob => mob.id === idMob);
        if (index !== -1) {
            const mob = this.mobsAtivos[index];
            console.log(`Removendo ${mob.nome} (ID: ${mob.id})`);
            this.mobsAtivos.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // Obter inimigos próximos ao jogador
    getInimigosProximos(raio) {
        return this.mobsAtivos.filter(mob => {
            const distX = Math.abs(mob.posicao.x - this.jogador.posicao.x);
            const distY = Math.abs(mob.posicao.y - this.jogador.posicao.y);
            const distancia = Math.sqrt(distX * distX + distY * distY);
            return distancia <= raio && !mob.estado.morto;
        });
    }
    
    // Atualizar todos os personagens
    atualizar(delta) {
        // Atualizar jogador (lógica específica do jogador seria implementada no objeto jogador)
        
        // Atualizar mobs
        for (let i = this.mobsAtivos.length - 1; i >= 0; i--) {
            const mob = this.mobsAtivos[i];
            
            // Pular mobs mortos que estão aguardando remoção
            if (mob.estado.morto) continue;
            
            // Verificar se o mob está em alcance de visão do jogador
            const distX = Math.abs(mob.posicao.x - this.jogador.posicao.x);
            const distY = Math.abs(mob.posicao.y - this.jogador.posicao.y);
            const distancia = Math.sqrt(distX * distX + distY * distY);
            
            // Comportamento baseado na distância e estado
            if (distancia <= mob.stats.visaoDistancia) {
                // Jogador em alcance de visão, entrar em alerta
                mob.estado.alerta = true;
                
                // Se estiver em alcance de ataque, atacar
                if (distancia <= mob.comportamento.distanciaAtaque) {
                    const agora = Date.now();
                    // Verificar cooldown de ataque (assume 1 segundo entre ataques)
                    if (agora - mob.estado.ultimoAtaque > 1000) {
                        mob.estado.atacando = true;
                        // O ataque real seria processado pelo sistema de combate
                    }
                } else if (mob.comportamento.persegue) {
                    // Mover em direção ao jogador se não estiver em alcance de ataque
                    this.moverMobEmDirecaoAoJogador(mob, delta);
                }
            } else if (mob.estado.alerta && mob.comportamento.persegue) {
                // Continuar perseguindo se já estava em alerta
                this.moverMobEmDirecaoAoJogador(mob, delta);
            } else {
                // Comportamento padrão (movimento aleatório, patrulha, etc.)
                this.comportamentoPadrao(mob, delta);
            }
        }
        
        // Atualizar NPCs (quando implementados)
    }
    
    // Movimento do mob em direção ao jogador
    moverMobEmDirecaoAoJogador(mob, delta) {
        // Calcular direção
        const dirX = this.jogador.posicao.x - mob.posicao.x;
        const dirY = this.jogador.posicao.y - mob.posicao.y;
        
        // Normalizar
        const comprimento = Math.sqrt(dirX * dirX + dirY * dirY);
        const normalX = dirX / comprimento;
        const normalY = dirY / comprimento;
        
        // Mover
        const velocidade = mob.stats.velocidade * delta;
        mob.posicao.x += normalX * velocidade;
        mob.posicao.y += normalY * velocidade;
        
        // Atualizar direção visual
        if (Math.abs(normalX) > Math.abs(normalY)) {
            mob.posicao.direcao = normalX > 0 ? 'leste' : 'oeste';
        } else {
            mob.posicao.direcao = normalY > 0 ? 'sul' : 'norte';
        }
    }
    
    // Comportamento padrão quando não está em combate
    comportamentoPadrao(mob, delta) {
        // Implementar movimento aleatório, patrulha, etc.
        // Simplificado para este exemplo
        
        // 1% de chance de mudar de direção a cada atualização
        if (Math.random() < 0.01) {
            const direcoes = ['norte', 'sul', 'leste', 'oeste'];
            mob.posicao.direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
        }
        
        // Mover na direção atual
        const velocidade = mob.stats.velocidade * delta * 0.5; // Mais lento quando não está perseguindo
        
        switch(mob.posicao.direcao) {
            case 'norte':
                mob.posicao.y -= velocidade;
                break;
            case 'sul':
                mob.posicao.y += velocidade;
                break;
            case 'leste':
                mob.posicao.x += velocidade;
                break;
            case 'oeste':
                mob.posicao.x -= velocidade;
                break;
        }
    }
    
    // Renderizar todos os personagens
    renderizar(ctx) {
        // Implementar lógica de renderização
        // Esta é uma versão simplificada que seria substituída por renderização real
        
        // Renderizar mobs
        for (const mob of this.mobsAtivos) {
            if (mob.estado.morto) continue;
            
            // Placeholder para renderização
            ctx.fillStyle = mob.chefe ? 'red' : 'orange';
            ctx.fillRect(mob.posicao.x, mob.posicao.y, 10, 10);
            
            // Barra de vida
            const vidaPct = mob.vidaAtual / mob.stats.vida;
            ctx.fillStyle = 'black';
            ctx.fillRect(mob.posicao.x - 1, mob.posicao.y - 6, 12, 4);
            ctx.fillStyle = vidaPct > 0.5 ? 'green' : vidaPct > 0.25 ? 'yellow' : 'red';
            ctx.fillRect(mob.posicao.x, mob.posicao.y - 5, vidaPct * 10, 2);
        }
        
        // Renderizar jogador
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.jogador.posicao.x, this.jogador.posicao.y, 10, 10);
    }
    }

    // Expor no escopo global
    window.GerenciadorPersonagens = GerenciadorPersonagens;
})(window);
