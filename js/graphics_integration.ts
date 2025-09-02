// Integração de módulos de gráficos avançados
// Este arquivo serve como ponte entre os sistemas antigos e novos

/**
 * Inicializa todos os sistemas gráficos avançados
 * @param mainCanvas Canvas principal do jogo
 */
function initializeAdvancedGraphics(mainCanvas: HTMLCanvasElement): void {
    console.log("Inicializando sistemas gráficos avançados...");
    
    // Inicializar o sistema de gráficos avançados
    if (window.AdvancedGraphics) {
        window.AdvancedGraphics.init(mainCanvas);
        console.log("Sistema de gráficos avançados inicializado");
    }
    
    // Inicializar o shader de água
    if (window.WaterShader) {
        window.WaterShader.init(mainCanvas.width, mainCanvas.height);
        console.log("Shader de água inicializado");
    }
}

/**
 * Aplica efeitos gráficos avançados ao canvas principal
 * @param ctx Contexto de renderização 2D
 * @param canvas Canvas principal
 * @param cameraX Posição X da câmera
 * @param cameraY Posição Y da câmera
 */
function applyAdvancedGraphics(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    cameraX: number,
    cameraY: number
): void {
    // Aplicar sistema de gráficos avançados
    if (window.AdvancedGraphics) {
        // Renderizar partículas ambientais
        window.AdvancedGraphics.renderParticles(ctx);
        
        // Aplicar efeitos de pós-processamento
        window.AdvancedGraphics.render(ctx, canvas);
    }
}

/**
 * Atualiza todos os sistemas gráficos avançados
 * @param deltaTime Tempo desde o último frame em ms
 * @param cameraX Posição X da câmera
 * @param cameraY Posição Y da câmera
 * @param width Largura do canvas
 * @param height Altura do canvas
 */
function updateAdvancedGraphics(
    deltaTime: number,
    cameraX: number,
    cameraY: number,
    width: number,
    height: number
): void {
    // Atualizar sistema de gráficos avançados
    if (window.AdvancedGraphics) {
        window.AdvancedGraphics.update(deltaTime, cameraX, cameraY, width, height);
    }
    
    // Atualizar shader de água
    if (window.WaterShader) {
        window.WaterShader.update(deltaTime);
    }
}

/**
 * Renderiza água usando o shader avançado
 * @param ctx Contexto de renderização 2D
 * @param x Posição X da água
 * @param y Posição Y da água
 * @param width Largura da área de água
 * @param height Altura da área de água
 */
function renderWater(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
): void {
    if (window.WaterShader && window.WaterShader.isEnabled()) {
        window.WaterShader.render(ctx, x, y, width, height);
    } else {
        // Fallback para renderização simples de água
        ctx.fillStyle = '#3D85C6';
        ctx.fillRect(x, y, width, height);
    }
}

/**
 * Ajusta as configurações gráficas com base na performance
 * @param fps FPS atual
 */
function adjustGraphicsQuality(fps: number): void {
    if (!window.AdvancedGraphics) return;
    
    // Ajustar qualidade com base no FPS
    if (fps < 30) {
        window.AdvancedGraphics.setQuality('low');
        console.log("FPS baixo detectado. Ajustando qualidade gráfica para: baixa");
    } else if (fps < 45) {
        window.AdvancedGraphics.setQuality('medium');
        console.log("Ajustando qualidade gráfica para: média");
    } else {
        window.AdvancedGraphics.setQuality('high');
        console.log("FPS ótimo. Ajustando qualidade gráfica para: alta");
    }
}

// Exportar funções
export {
    initializeAdvancedGraphics,
    applyAdvancedGraphics,
    updateAdvancedGraphics,
    renderWater,
    adjustGraphicsQuality
};
