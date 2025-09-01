// Personagem Principal
const personagemPrincipal = {
    nome: "Protagonista",
    // Estatísticas básicas
    stats: {
        vida: 100,
        vidaMaxima: 100,
        sanidade: 100,
        sanidadeMaxima: 100,
        stamina: 100,
        staminaMaxima: 100
    },
    
    // Atributos
    atributos: {
        força: 5,
        agilidade: 5,
        inteligência: 5,
        percepção: 5,
        vontade: 5
    },
    
    // Inventário
    inventario: {
        itens: [],
        capacidadeMaxima: 10,
        equipados: {
            mão: null,
            corpo: null,
            cabeça: null,
            acessorio: null
        }
    },
    
    // Estado atual
    estado: {
        envenenado: false,
        sangrando: false,
        alucinando: false,
        exausto: false,
        ferido: false
    },
    
    // Posição no mapa
    posicao: {
        x: 0,
        y: 0,
        mapa: "inicioJogo",
        direcao: "sul"
    },
    
    // Habilidades desbloqueadas
    habilidades: [],
    
    // Conhecimento (para puzzles e história)
    conhecimento: {
        notasEncontradas: [],
        segredosDesvendados: [],
        pessoasConhecidas: []
    },
    
    // Renderização
    sprites: {
        parado: {
            norte: null,
            sul: null,
            leste: null,
            oeste: null
        },
        andando: {
            norte: null,
            sul: null,
            leste: null,
            oeste: null
        },
        correndo: {
            norte: null,
            sul: null,
            leste: null,
            oeste: null
        },
        atacando: {
            norte: null,
            sul: null,
            leste: null,
            oeste: null
        }
    },
    
    // Métodos
    mover: function(direcao) {
        // Lógica de movimento
        this.posicao.direcao = direcao;
        
        // Atualizar posição baseado na direção
        switch(direcao) {
            case "norte":
                this.posicao.y--;
                break;
            case "sul":
                this.posicao.y++;
                break;
            case "leste":
                this.posicao.x++;
                break;
            case "oeste":
                this.posicao.x--;
                break;
        }
    },
    
    atacar: function(alvo) {
        // Lógica de combate básica
        const dano = this.atributos.força * 2;
        return dano;
    },
    
    receberDano: function(quantidade) {
        this.stats.vida = Math.max(0, this.stats.vida - quantidade);
        
        // Verificar efeitos de ferimento
        if (this.stats.vida < this.stats.vidaMaxima * 0.3) {
            this.estado.ferido = true;
        }
        
        // Verificar morte
        if (this.stats.vida <= 0) {
            // Lógica de morte ou game over
            return true; // Morto
        }
        return false; // Ainda vivo
    },
    
    curar: function(quantidade) {
        this.stats.vida = Math.min(this.stats.vidaMaxima, this.stats.vida + quantidade);
        
        // Remover estado de ferido se tiver bastante vida
        if (this.stats.vida > this.stats.vidaMaxima * 0.5) {
            this.estado.ferido = false;
        }
    },
    
    perderSanidade: function(quantidade) {
        this.stats.sanidade = Math.max(0, this.stats.sanidade - quantidade);
        
        // Efeitos de baixa sanidade
        if (this.stats.sanidade < this.stats.sanidadeMaxima * 0.3) {
            this.estado.alucinando = true;
        }
        
        // Colapso mental
        if (this.stats.sanidade <= 0) {
            // Lógica de colapso mental
            return true;
        }
        return false;
    },
    
    recuperarSanidade: function(quantidade) {
        this.stats.sanidade = Math.min(this.stats.sanidadeMaxima, this.stats.sanidade + quantidade);
        
        // Remover alucinações se recuperar sanidade suficiente
        if (this.stats.sanidade > this.stats.sanidadeMaxima * 0.5) {
            this.estado.alucinando = false;
        }
    },
    
    adicionarItemAoInventario: function(item) {
        if (this.inventario.itens.length < this.inventario.capacidadeMaxima) {
            this.inventario.itens.push(item);
            return true;
        }
        return false;
    },
    
    removerItemDoInventario: function(indiceItem) {
        if (indiceItem >= 0 && indiceItem < this.inventario.itens.length) {
            return this.inventario.itens.splice(indiceItem, 1)[0];
        }
        return null;
    },
    
    equiparItem: function(indiceItem) {
        const item = this.inventario.itens[indiceItem];
        if (!item) return false;
        
        // Equipar o item baseado no tipo
        if (item.tipo === "arma") {
            // Guardar item atual se existir
            const itemAtual = this.inventario.equipados.mão;
            if (itemAtual) {
                this.inventario.itens.push(itemAtual);
            }
            this.inventario.equipados.mão = item;
            this.removerItemDoInventario(indiceItem);
            return true;
        }
        // Lógica similar para outros tipos de itens...
        
        return false;
    },
    
    usarItem: function(indiceItem) {
        const item = this.inventario.itens[indiceItem];
        if (!item) return false;
        
        // Usar o item baseado no tipo
        if (item.tipo === "consumivel") {
            // Aplicar efeitos do item
            if (item.efeitos.cura) {
                this.curar(item.efeitos.cura);
            }
            if (item.efeitos.sanidade) {
                this.recuperarSanidade(item.efeitos.sanidade);
            }
            // Consumir o item
            this.removerItemDoInventario(indiceItem);
            return true;
        }
        
        return false;
    },
    
    interagir: function(objeto) {
        // Lógica de interação com objetos do mundo
        if (objeto.tipo === "porta") {
            if (objeto.trancada) {
                // Verificar se o jogador tem a chave
                const chave = this.inventario.itens.find(item => item.id === objeto.idChave);
                if (chave) {
                    objeto.trancada = false;
                    return "Você destrancou a porta.";
                } else {
                    return "A porta está trancada. Você precisa de uma chave.";
                }
            } else {
                return "Você abriu a porta.";
            }
        }
        // Mais lógicas de interação...
        
        return "Você não pode interagir com isso.";
    },
    
    inicializar: function() {
        // Configuração inicial do personagem
        console.log("Personagem inicializado: " + this.nome);
    }
};

// Expor no escopo global para ambiente sem módulos
window.personagemPrincipal = personagemPrincipal;
