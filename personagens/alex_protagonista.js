// PERSONAGEM PRINCIPAL - Sistema de Aparência e Sprites
const PersonagemPrincipal = {
    // Informações básicas
    info: {
        nome: "Alex",
        idade: 25,
        profissao: "Investigador",
        descricao: "Um jovem investigador que veio à cidade para descobrir a verdade sobre os eventos sobrenaturais."
    },
    
    // Aparência física
    aparencia: {
        // Características físicas
        altura: "1.75m",
        peso: "70kg",
        corCabelo: "#2c1810", // Castanho escuro
        corOlhos: "#4a6741", // Verde escuro
        corPele: "#d4a574", // Tom de pele natural
        
        // Estilo visual
        roupa: {
            cor_principal: "#1a1a2e", // Azul escuro
            cor_secundaria: "#16213e", // Azul mais escuro
            cor_detalhes: "#0f3460", // Azul médio
            tipo: "Casaco de investigador, calça jeans, botas"
        },
        
        // Acessórios
        acessorios: [
            "Relógio de pulso",
            "Mochila pequena",
            "Lanterna no cinto"
        ]
    },
    
    // Sistema de sprites (pixel art)
    sprites: {
        // Tamanho base do sprite
        largura: 16,
        altura: 24,
        
        // Paleta de cores principal
        paleta: {
            cabelo: "#2c1810",
            pele: "#d4a574",
            roupa_escura: "#1a1a2e",
            roupa_media: "#16213e", 
            roupa_clara: "#0f3460",
            sapatos: "#0d0d0d",
            detalhes: "#ffffff"
        },
        
        // Direções de movimento
        direcoes: {
            // Olhando para baixo (sul)
            sul: {
                parado: [
                    "0000222222220000", // Linha 1 - cabelo
                    "0002222222222000", // Linha 2 - cabelo
                    "0022333333332200", // Linha 3 - testa
                    "0223333333333220", // Linha 4 - rosto
                    "2233344444333322", // Linha 5 - olhos
                    "2333344444333332", // Linha 6 - nariz
                    "2333333333333332", // Linha 7 - boca
                    "0223333333332200", // Linha 8 - queixo
                    "0002222222220000", // Linha 9 - pescoço
                    "0055555555550000", // Linha 10 - gola
                    "0555555555555000", // Linha 11 - peito
                    "5555555555555555", // Linha 12 - torso
                    "5555666666555555", // Linha 13 - cinto
                    "5555555555555555", // Linha 14 - quadril
                    "0555555555555000", // Linha 15 - coxa
                    "0055555555550000", // Linha 16 - joelho
                    "0055555555550000", // Linha 17 - canela
                    "0777777777777000", // Linha 18 - sapatos
                    "7777777777777777", // Linha 19 - base sapatos
                    "0000000000000000"  // Linha 20 - sombra
                ],
                
                andando_frame1: [
                    "0000222222220000",
                    "0002222222222000", 
                    "0022333333332200",
                    "0223333333333220",
                    "2233344444333322",
                    "2333344444333332", 
                    "2333333333333332",
                    "0223333333332200",
                    "0002222222220000",
                    "0055555555550000",
                    "0555555555555000",
                    "5555555555555555",
                    "5555666666555555",
                    "0555555555555500", // Perna esquerda à frente
                    "0055555555550000",
                    "0005555555500000",
                    "0000555555000000",
                    "0007777777700000",
                    "0777777777777000",
                    "0000000000000000"
                ],
                
                andando_frame2: [
                    "0000222222220000",
                    "0002222222222000",
                    "0022333333332200", 
                    "0223333333333220",
                    "2233344444333322",
                    "2333344444333332",
                    "2333333333333332",
                    "0223333333332200",
                    "0002222222220000",
                    "0055555555550000",
                    "0555555555555000",
                    "5555555555555555",
                    "5555666666555555",
                    "0055555555555000", // Perna direita à frente  
                    "0000555555550000",
                    "0000055555550000",
                    "0000005555500000",
                    "0000777777700000",
                    "0007777777777000",
                    "0000000000000000"
                ]
            },
            
            // Olhando para cima (norte)
            norte: {
                parado: [
                    "0000222222220000",
                    "0002222222222000",
                    "0022222222222200",
                    "0222222222222220",
                    "2222222222222222",
                    "2222333333222222", // Parte de trás da cabeça
                    "2223333333322222",
                    "0222333333222200",
                    "0002222222220000",
                    "0055555555550000",
                    "0555555555555000",
                    "5555555555555555",
                    "5555666666555555",
                    "5555555555555555",
                    "0555555555555000",
                    "0055555555550000",
                    "0055555555550000",
                    "0777777777777000",
                    "7777777777777777",
                    "0000000000000000"
                ]
            },
            
            // Olhando para a direita (leste)
            leste: {
                parado: [
                    "0000002222220000",
                    "0000222222222000",
                    "0002233333322200",
                    "0022333333333220",
                    "0223334444333322", // Perfil do rosto
                    "0233334444333322",
                    "0233333333333322",
                    "0022333333332200",
                    "0000222222220000",
                    "0055555555550000",
                    "0555555555555000",
                    "5555555555555555",
                    "5555666666555555",
                    "5555555555555555",
                    "0555555555555000",
                    "0055555555550000",
                    "0055555555550000",
                    "0777777777777000",
                    "7777777777777777",
                    "0000000000000000"
                ]
            },
            
            // Olhando para a esquerda (oeste) - espelhar leste
            oeste: {
                parado: "ESPELHAR_LESTE"
            }
        }
    },
    
    // Estados visuais especiais
    estadosVisuais: {
        ferido: {
            modificadores: {
                postura: "curvado",
                animacao: "mancando",
                efeitos: ["sangue", "respiracao_pesada"]
            }
        },
        
        enlouquecendo: {
            modificadores: {
                olhos: "vermelhos",
                postura: "tremula",
                efeitos: ["distorcao", "sombras_extras"]
            }
        },
        
        correndo: {
            modificadores: {
                velocidade_animacao: 2.0,
                efeitos: ["particulas_poeira"]
            }
        },
        
        atacando: {
            modificadores: {
                postura: "agressiva",
                bracos: "estendidos",
                efeitos: ["movimento_rapido"]
            }
        }
    },
    
    // Função para renderizar o sprite
    renderizar: function(ctx, x, y, direcao = 'sul', estado = 'parado', frame = 0) {
        const spriteData = this.sprites.direcoes[direcao][estado];
        const cores = this.sprites.paleta;
        
        // Mapear cores para o canvas
        const mapeamentoCores = {
            '0': 'transparent',
            '1': cores.detalhes,
            '2': cores.cabelo, 
            '3': cores.pele,
            '4': cores.olhos,
            '5': cores.roupa_escura,
            '6': cores.roupa_media,
            '7': cores.sapatos
        };
        
        // Renderizar pixel por pixel
        if (Array.isArray(spriteData)) {
            for (let linha = 0; linha < spriteData.length; linha++) {
                const linhaPixels = spriteData[linha];
                for (let coluna = 0; coluna < linhaPixels.length; coluna++) {
                    const pixel = linhaPixels[coluna];
                    const cor = mapeamentoCores[pixel];
                    
                    if (cor && cor !== 'transparent') {
                        ctx.fillStyle = cor;
                        ctx.fillRect(x + coluna, y + linha, 1, 1);
                    }
                }
            }
        }
    },
    
    // Função para criar animação
    criarAnimacao: function(direcao, tipo, duracao = 1000) {
        return {
            direcao: direcao,
            tipo: tipo,
            duracao: duracao,
            frameAtual: 0,
            tempoFrame: 0,
            frames: this.sprites.direcoes[direcao][tipo] || []
        };
    }
};

// Exportar o personagem
export default PersonagemPrincipal;
