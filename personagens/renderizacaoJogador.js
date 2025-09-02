// Sistema de renderização avançada do jogador
// Este módulo fornece funções melhoradas para renderizar o jogador com animações e efeitos visuais

// Constantes de renderização
const CORES = {
    PELE_SAUDAVEL: "#FFD1B7",   // Cor de pele normal do personagem
    PELE_FERIDA: "#E0B0A0",     // Cor quando o personagem está ferido
    ROUPAS_SUPERIOR: "#4169E1", // Camisa azul
    ROUPAS_INFERIOR: "#333333", // Calça preta
    CABELO: "#8B4513",          // Cabelo castanho
    OLHOS_NORMAL: "#0066ff",    // Olhos azuis normais
    OLHOS_ASSUSTADO: "#80B0FF", // Olhos quando o personagem está com medo
    CALÇADO: "#111111"          // Botas pretas
};

// Estado de renderização
const estadoRender = {
    ultimaRenderizacao: Date.now(),
    frameRespiracao: 0,
    frameOlhos: 0,
    piscadaTimer: 0,
    mostrarCintilacao: false
};

// Função para renderizar o jogador com detalhes avançados
function renderizarJogadorAvancado(ctx, jogador) {
    // Obter valores básicos
    const { x, y, largura, altura, direcao } = jogador;
    
    // Atualizar timers de animação
    const agora = Date.now();
    const deltaTime = (agora - estadoRender.ultimaRenderizacao) / 1000;
    estadoRender.ultimaRenderizacao = agora;
    
    // Atualizar frame de respiração (movimento sutil de respiração)
    estadoRender.frameRespiracao += deltaTime * 2;
    if (estadoRender.frameRespiracao > Math.PI * 2) {
        estadoRender.frameRespiracao -= Math.PI * 2;
    }
    
    // Atualizar frame dos olhos (piscadas ocasionais)
    estadoRender.piscadaTimer -= deltaTime;
    if (estadoRender.piscadaTimer <= 0) {
        // Tempo para uma nova piscada
        estadoRender.frameOlhos = 1;
        estadoRender.piscadaTimer = 4 + Math.random() * 3; // Entre 4-7 segundos
    }
    
    if (estadoRender.frameOlhos > 0) {
        estadoRender.frameOlhos -= deltaTime * 10; // Velocidade da piscada
        if (estadoRender.frameOlhos < 0) estadoRender.frameOlhos = 0;
    }
    
    // Efeito de cintilação para itens importantes
    estadoRender.mostrarCintilacao = Math.sin(Date.now() / 200) > 0.7;
    
    // Verificar se estamos usando o sistema de animações avançadas
    if (window.CharacterAnimations && typeof window.CharacterAnimations.apply === 'function') {
        // Usar o sistema de animações para renderizar
        window.CharacterAnimations.apply(ctx, jogador, function(ctx) {
            // Esta função será chamada pelo sistema de animações
            desenharCorpoBase(ctx, jogador);
        });
    } else {
        // Fallback para renderização básica se o sistema de animações não estiver disponível
        desenharCorpoBase(ctx, jogador);
    }
    
    // Renderizar efeitos de status (opcional)
    renderizarEfeitosStatus(ctx, jogador);
}

// Função interna para desenhar o corpo base do personagem
function desenharCorpoBase(ctx, jogador) {
    const { x, y, largura, altura, direcao } = jogador;
    
    // Verificar status do personagem
    const estaFerido = jogador.status && jogador.status.vida < jogador.status.vidaMaxima * 0.5;
    const estaComMedo = jogador.status && jogador.status.efeitos && jogador.status.efeitos.com_medo;
    
    // Calcular movimento de respiração
    const respMovimento = Math.sin(estadoRender.frameRespiracao) * 0.5;
    
    // Salvar contexto antes de desenhar
    ctx.save();
    ctx.translate(x, y);
    
    // Escolher cor da pele baseada no status
    const corPele = estaFerido ? CORES.PELE_FERIDA : CORES.PELE_SAUDAVEL;
    
    // Desenhar corpo do personagem com base na direção
    if (direcao === 'down' || direcao === 'up') {
        // Vista frontal/traseira
        
        // Pernas
        ctx.fillStyle = CORES.ROUPAS_INFERIOR;
        ctx.fillRect(-largura * 0.25, altura * 0.1, largura * 0.2, altura * 0.4);
        ctx.fillRect(largura * 0.05, altura * 0.1, largura * 0.2, altura * 0.4);
        
        // Sapatos
        ctx.fillStyle = CORES.CALÇADO;
        ctx.fillRect(-largura * 0.3, altura * 0.4, largura * 0.25, altura * 0.1);
        ctx.fillRect(largura * 0.05, altura * 0.4, largura * 0.25, altura * 0.1);
        
        // Tronco
        ctx.fillStyle = CORES.ROUPAS_SUPERIOR;
        ctx.fillRect(-largura * 0.3, -altura * 0.2 + respMovimento, largura * 0.6, altura * 0.3);
        
        // Braços
        ctx.fillStyle = CORES.ROUPAS_SUPERIOR;
        ctx.fillRect(-largura * 0.4, -altura * 0.15 + respMovimento, largura * 0.1, altura * 0.3);
        ctx.fillRect(largura * 0.3, -altura * 0.15 + respMovimento, largura * 0.1, altura * 0.3);
        
        // Mãos
        ctx.fillStyle = corPele;
        ctx.fillRect(-largura * 0.4, altura * 0.15 + respMovimento, largura * 0.1, altura * 0.1);
        ctx.fillRect(largura * 0.3, altura * 0.15 + respMovimento, largura * 0.1, altura * 0.1);
        
        if (direcao === 'down') {
            // Cabeça (frente)
            ctx.fillStyle = corPele;
            ctx.fillRect(-largura * 0.2, -altura * 0.5 + respMovimento, largura * 0.4, altura * 0.3);
            
            // Cabelo
            ctx.fillStyle = CORES.CABELO;
            ctx.fillRect(-largura * 0.25, -altura * 0.5 + respMovimento, largura * 0.5, altura * 0.1);
            ctx.fillRect(-largura * 0.25, -altura * 0.5 + respMovimento, largura * 0.1, altura * 0.2);
            ctx.fillRect(largura * 0.15, -altura * 0.5 + respMovimento, largura * 0.1, altura * 0.2);
            
            // Olhos
            const fechamentoOlhos = Math.min(1, estadoRender.frameOlhos);
            const corOlhos = estaComMedo ? CORES.OLHOS_ASSUSTADO : CORES.OLHOS_NORMAL;
            
            ctx.fillStyle = corOlhos;
            ctx.fillRect(-largura * 0.15, -altura * 0.4 + fechamentoOlhos * altura * 0.05 + respMovimento, 
                        largura * 0.08, altura * 0.05 * (1 - fechamentoOlhos));
            ctx.fillRect(largura * 0.07, -altura * 0.4 + fechamentoOlhos * altura * 0.05 + respMovimento, 
                        largura * 0.08, altura * 0.05 * (1 - fechamentoOlhos));
            
            // Boca
            ctx.fillStyle = "#AA5555";
            ctx.fillRect(-largura * 0.07, -altura * 0.3 + respMovimento, largura * 0.14, altura * 0.02);
        } else {
            // Cabeça (costas)
            ctx.fillStyle = corPele;
            ctx.fillRect(-largura * 0.2, -altura * 0.5 + respMovimento, largura * 0.4, altura * 0.3);
            
            // Cabelo (visto de trás)
            ctx.fillStyle = CORES.CABELO;
            ctx.fillRect(-largura * 0.25, -altura * 0.5 + respMovimento, largura * 0.5, altura * 0.2);
        }
    } else {
        // Vista lateral (esquerda/direita)
        const espelhar = direcao === 'left' ? -1 : 1;
        
        ctx.scale(espelhar, 1);
        
        // Perna (visível)
        ctx.fillStyle = CORES.ROUPAS_INFERIOR;
        ctx.fillRect(-largura * 0.1, altura * 0.1, largura * 0.3, altura * 0.4);
        
        // Sapato
        ctx.fillStyle = CORES.CALÇADO;
        ctx.fillRect(-largura * 0.15, altura * 0.4, largura * 0.35, altura * 0.1);
        
        // Tronco
        ctx.fillStyle = CORES.ROUPAS_SUPERIOR;
        ctx.fillRect(-largura * 0.25, -altura * 0.2 + respMovimento, largura * 0.5, altura * 0.3);
        
        // Braço (frente)
        ctx.fillStyle = CORES.ROUPAS_SUPERIOR;
        ctx.fillRect(largura * 0.25, -altura * 0.15 + respMovimento, largura * 0.1, altura * 0.3);
        
        // Mão (frente)
        ctx.fillStyle = corPele;
        ctx.fillRect(largura * 0.25, altura * 0.15 + respMovimento, largura * 0.1, altura * 0.1);
        
        // Cabeça (perfil)
        ctx.fillStyle = corPele;
        ctx.fillRect(-largura * 0.15, -altura * 0.5 + respMovimento, largura * 0.3, altura * 0.3);
        
        // Cabelo (perfil)
        ctx.fillStyle = CORES.CABELO;
        ctx.fillRect(-largura * 0.2, -altura * 0.5 + respMovimento, largura * 0.4, altura * 0.15);
        ctx.fillRect(-largura * 0.15, -altura * 0.35 + respMovimento, largura * 0.1, altura * 0.15);
        
        // Olho (apenas um visível de perfil)
        const fechamentoOlhos = Math.min(1, estadoRender.frameOlhos);
        const corOlhos = estaComMedo ? CORES.OLHOS_ASSUSTADO : CORES.OLHOS_NORMAL;
        
        ctx.fillStyle = corOlhos;
        ctx.fillRect(largura * 0.05, -altura * 0.4 + fechamentoOlhos * altura * 0.05 + respMovimento, 
                    largura * 0.08, altura * 0.05 * (1 - fechamentoOlhos));
        
        // Orelha
        ctx.fillStyle = corPele;
        ctx.fillRect(largura * 0.15, -altura * 0.4 + respMovimento, largura * 0.05, altura * 0.1);
        
        // Boca
        ctx.fillStyle = "#AA5555";
        ctx.fillRect(largura * 0.05, -altura * 0.3 + respMovimento, largura * 0.1, altura * 0.02);
        
        // Braço (atrás - parcialmente visível)
        ctx.fillStyle = CORES.ROUPAS_SUPERIOR;
        ctx.fillRect(-largura * 0.3, -altura * 0.15 + respMovimento, largura * 0.1, altura * 0.2);
    }
    
    // Restaurar contexto
    ctx.restore();
}

// Função interna para renderizar efeitos de status
function renderizarEfeitosStatus(ctx, jogador) {
    const { x, y, largura, altura } = jogador;
    
    // Verificar status do personagem
    if (!jogador.status) return;
    
    // Salvar contexto
    ctx.save();
    
    // Renderizar aura para diferentes estados
    if (jogador.status.efeitos) {
        // Efeito de envenenado
        if (jogador.status.efeitos.envenenado) {
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
            ctx.fillStyle = "#00FF00";
            ctx.beginPath();
            ctx.arc(x, y, largura * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Efeito de alucinando
        if (jogador.status.efeitos.alucinando) {
            ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 150) * 0.1;
            ctx.fillStyle = "#FF00FF";
            ctx.beginPath();
            ctx.arc(x, y, largura * 0.9, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Efeito de com medo
        if (jogador.status.efeitos.com_medo) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "#0000FF";
            ctx.beginPath();
            ctx.arc(x, y, largura * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Restaurar contexto
    ctx.restore();
}

// Exportar as funções para uso externo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderizarJogadorAvancado,
        CORES
    };
} else {
    // Disponibilizar no escopo global para browsers
    window.RenderizacaoJogador = {
        renderizar: renderizarJogadorAvancado,
        CORES: CORES
    };
}
