// Coleção de mobs/inimigos do jogo
const mobs = {
    // Inimigo básico
    sombra: {
        nome: "Sombra Espreitadora",
        tipo: "espectro",
        stats: {
            vida: 30,
            dano: 10,
            velocidade: 2,
            experiencia: 15,
            visaoDistancia: 5
        },
        comportamento: {
            agressivo: true,
            persegue: true,
            distanciaAtaque: 1,
            medoPorLuz: true,
            emboscada: true
        },
        ataques: [
            {
                nome: "Toque Gélido",
                dano: 10,
                efeito: "diminui sanidade",
                alcance: 1
            },
            {
                nome: "Sussurro Aterrador",
                dano: 5,
                efeito: "paralisia temporária",
                alcance: 3
            }
        ],
        fraquezas: ["luz", "itens sagrados"],
        sprites: {
            parado: null,
            movendo: null,
            atacando: null,
            morrendo: null
        },
        sons: {
            deteccao: null,
            ataque: null,
            morte: null,
            ambiente: null
        },
        drops: [
            {
                item: "essência sombria",
                chance: 0.3
            },
            {
                item: "fragmento espectral",
                chance: 0.1
            }
        ],
        descricao: "Uma forma escura e translúcida que se move pelas sombras. Parece se alimentar do medo de suas vítimas."
    },
    
    // Inimigo médio
    cadaver: {
        nome: "Cadáver Reanimado",
        tipo: "morto-vivo",
        stats: {
            vida: 60,
            dano: 15,
            velocidade: 1,
            experiencia: 25,
            visaoDistancia: 4
        },
        comportamento: {
            agressivo: true,
            persegue: true,
            distanciaAtaque: 1,
            medoPorLuz: false,
            emboscada: false
        },
        ataques: [
            {
                nome: "Golpe Pútrido",
                dano: 15,
                efeito: "envenenamento",
                alcance: 1
            },
            {
                nome: "Mordida Infecciosa",
                dano: 20,
                efeito: "sangramento",
                alcance: 1
            }
        ],
        fraquezas: ["fogo", "ataques contundentes"],
        sprites: {
            parado: null,
            movendo: null,
            atacando: null,
            morrendo: null
        },
        sons: {
            deteccao: null,
            ataque: null,
            morte: null,
            ambiente: null
        },
        drops: [
            {
                item: "carne podre",
                chance: 0.5
            },
            {
                item: "osso quebrado",
                chance: 0.3
            },
            {
                item: "amuleto corrompido",
                chance: 0.05
            }
        ],
        descricao: "Um corpo em decomposição que se move com movimentos rígidos e descoordenados. Seus olhos brancos e sem vida parecem fixos em você."
    },
    
    // Inimigo forte
    carniceiro: {
        nome: "O Carniceiro",
        tipo: "abominação",
        stats: {
            vida: 150,
            dano: 30,
            velocidade: 1.5,
            experiencia: 100,
            visaoDistancia: 6
        },
        comportamento: {
            agressivo: true,
            persegue: true,
            distanciaAtaque: 2,
            medoPorLuz: false,
            emboscada: false
        },
        ataques: [
            {
                nome: "Golpe de Cutelo",
                dano: 30,
                efeito: "sangramento grave",
                alcance: 2
            },
            {
                nome: "Arremesso de Gancho",
                dano: 20,
                efeito: "puxa o jogador",
                alcance: 4
            },
            {
                nome: "Grito Ensurdecedor",
                dano: 15,
                efeito: "atordoamento",
                alcance: 3,
                areaEfeito: true
            }
        ],
        fraquezas: ["ataques à cabeça", "fogo"],
        sprites: {
            parado: null,
            movendo: null,
            atacando: null,
            morrendo: null
        },
        sons: {
            deteccao: null,
            ataque: null,
            morte: null,
            ambiente: null
        },
        drops: [
            {
                item: "cutelo enferrujado",
                chance: 0.8
            },
            {
                item: "pedaço de carne humana",
                chance: 0.4
            },
            {
                item: "chave do porão",
                chance: 0.2
            }
        ],
        descricao: "Um homem enorme e deformado, com a pele coberta de cicatrizes e um avental ensanguentado. Carrega um cutelo gigante e tem um sorriso maníaco no rosto parcialmente coberto por uma máscara de couro."
    },
    
    // Chefe
    pesadelo: {
        nome: "O Pesadelo",
        tipo: "entidade",
        chefe: true,
        stats: {
            vida: 300,
            dano: 40,
            velocidade: 3,
            experiencia: 500,
            visaoDistancia: 10,
            fases: 3
        },
        comportamento: {
            agressivo: true,
            persegue: true,
            distanciaAtaque: 3,
            teleporta: true,
            invocaMobs: true,
            transformacao: true
        },
        ataques: [
            {
                nome: "Garras da Escuridão",
                dano: 40,
                efeito: "sangramento",
                alcance: 3
            },
            {
                nome: "Visão do Abismo",
                dano: 30,
                efeito: "terror extremo",
                alcance: 5,
                areaEfeito: true
            },
            {
                nome: "Aniquilação Psíquica",
                dano: 60,
                efeito: "confusão",
                alcance: 7,
                cooldown: 30
            }
        ],
        fraquezas: ["luz intensa", "relíquia sagrada"],
        sprites: {
            fase1: {
                parado: null,
                movendo: null,
                atacando: null,
                especial: null
            },
            fase2: {
                parado: null,
                movendo: null,
                atacando: null,
                especial: null
            },
            fase3: {
                parado: null,
                movendo: null,
                atacando: null,
                especial: null
            }
        },
        sons: {
            deteccao: null,
            ataque: null,
            transformacao: null,
            morte: null,
            especial: null
        },
        drops: [
            {
                item: "essência do pesadelo",
                chance: 1.0
            },
            {
                item: "amuleto da escuridão",
                chance: 0.5
            },
            {
                item: "coração pulsante",
                chance: 0.3
            }
        ],
        descricao: "Uma figura amorfa que muda constantemente entre formas humanoides e monstruosas. Sua mera presença causa distorções na realidade e instila um medo primordial em qualquer um que o veja."
    }
};

// Função para inicializar um mob
function criarMob(tipo, nivel = 1) {
    if (!mobs[tipo]) {
        console.error(`Tipo de mob "${tipo}" não encontrado!`);
        return null;
    }
    
    // Clonar o mob base
    const novoMob = JSON.parse(JSON.stringify(mobs[tipo]));
    
    // Ajustar estatísticas baseado no nível
    if (nivel > 1) {
        const fatorEscala = 1 + (nivel - 1) * 0.2;
        novoMob.stats.vida = Math.floor(novoMob.stats.vida * fatorEscala);
        novoMob.stats.dano = Math.floor(novoMob.stats.dano * fatorEscala);
        novoMob.stats.experiencia = Math.floor(novoMob.stats.experiencia * fatorEscala);
    }
    
    // Adicionar propriedades específicas da instância
    novoMob.id = Date.now() + Math.floor(Math.random() * 1000);
    novoMob.nivel = nivel;
    novoMob.vidaAtual = novoMob.stats.vida;
    novoMob.estado = {
        alerta: false,
        atacando: false,
        morto: false,
        atordoado: false,
        ultimoAtaque: 0
    };
    novoMob.posicao = {
        x: 0,
        y: 0,
        direcao: 'sul'
    };
    
    // Adicionar métodos
    novoMob.atacar = function(alvo) {
        if (this.estado.morto || this.estado.atordoado) return 0;
        
        // Escolher ataque aleatório
        const ataque = this.ataques[Math.floor(Math.random() * this.ataques.length)];
        const danoBase = ataque.dano;
        
        // Aplicar modificadores
        const danoFinal = Math.floor(danoBase * (1 + (this.nivel - 1) * 0.1));
        
        // Registrar último ataque
        this.estado.ultimoAtaque = Date.now();
        
        return {
            dano: danoFinal,
            efeito: ataque.efeito,
            nome: ataque.nome
        };
    };
    
    novoMob.receberDano = function(quantidade) {
        this.vidaAtual = Math.max(0, this.vidaAtual - quantidade);
        
        if (this.vidaAtual <= 0) {
            this.estado.morto = true;
            return true; // Morto
        }
        
        // Entrar em modo de alerta se atacado
        this.estado.alerta = true;
        
        return false; // Ainda vivo
    };
    
    return novoMob;
}

// Expor no escopo global (ambiente sem módulos ES)
window.mobs = mobs;
window.criarMob = criarMob;
