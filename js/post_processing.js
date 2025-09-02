// Sistema de pós-processamento para efeitos visuais avançados
// Adiciona filtros e efeitos à renderização final do jogo

(function(window) {
    // Constantes
    const BASE_W = window.GameSystem?.constants?.BASE_W || 320;
    const BASE_H = window.GameSystem?.constants?.BASE_H || 180;
    
    // Canvas para efeitos de pós-processamento
    let postCanvas = null;
    let postCtx = null;
    
    // Canvas para shaders e efeitos
    let shaderCanvas = null;
    let shaderCtx = null;
    
    // Efeitos disponíveis
    const effects = {
        scanlines: true,           // Linhas de scanline (estilo CRT)
        chromaShift: false,        // Deslocamento de canais de cor
        vignette: true,            // Escurecimento das bordas
        noise: true,               // Ruído de filme
        bloom: false,              // Efeito de brilho para luzes
        motionBlur: false,         // Desfoque de movimento
        crtDistortion: true,       // Distorção de tela CRT
        filmGrain: true,           // Grão de filme
        aberration: true,          // Aberração cromática
        contrast: 1.1              // Ajuste de contraste
    };
    
    // Variáveis de estado
    let lastFrame = null;
    let noisePattern = null;
    
    // Inicializar sistema
    function init() {
        // Criar canvas para pós-processamento
        postCanvas = document.createElement('canvas');
        postCanvas.width = BASE_W;
        postCanvas.height = BASE_H;
        postCtx = postCanvas.getContext('2d');
        
        // Criar canvas para shaders
        shaderCanvas = document.createElement('canvas');
        shaderCanvas.width = BASE_W;
        shaderCanvas.height = BASE_H;
        shaderCtx = shaderCanvas.getContext('2d');
        
        // Gerar ruído para uso em efeitos
        generateNoisePattern();
    }
    
    // Gerar padrão de ruído
    function generateNoisePattern() {
        const canvas = document.createElement('canvas');
        canvas.width = BASE_W / 4;
        canvas.height = BASE_H / 4;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const value = Math.random() < 0.5 ? 0 : Math.random() * 50;
            data[i] = data[i + 1] = data[i + 2] = value;
            data[i + 3] = Math.random() * 40; // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
        noisePattern = canvas;
    }
    
    // Aplicar pós-processamento à cena final
    function process(ctx, inputCanvas) {
        // Se o sistema não foi inicializado, fazer isso agora
        if (!postCanvas) init();
        
        // Limpar canvas de pós-processamento
        postCtx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Copiar frame original para canvas de pós-processamento
        postCtx.drawImage(inputCanvas, 0, 0, BASE_W, BASE_H);
        
        // Aplicar efeitos de pós-processamento
        
        // 1. Ajuste de contraste e brilho
        if (effects.contrast !== 1) {
            applyContrast();
        }
        
        // 2. Bloom (brilho ao redor de áreas claras)
        if (effects.bloom) {
            applyBloom();
        }
        
        // 3. Aberração cromática
        if (effects.aberration) {
            applyAberration();
        }
        
        // 4. Distorção CRT
        if (effects.crtDistortion) {
            applyCrtDistortion();
        }
        
        // 5. Vinheta (escurecimento das bordas)
        if (effects.vignette) {
            applyVignette();
        }
        
        // 6. Scanlines
        if (effects.scanlines) {
            applyScanlines();
        }
        
        // 7. Ruído de filme
        if (effects.noise || effects.filmGrain) {
            applyNoise();
        }
        
        // 8. Deslocamento cromático
        if (effects.chromaShift) {
            applyChromaShift();
        }
        
        // 9. Motion blur (desfoque de movimento)
        if (effects.motionBlur && lastFrame) {
            applyMotionBlur();
        }
        
        // Armazenar frame atual para efeitos futuros
        if (effects.motionBlur) {
            if (!lastFrame) {
                lastFrame = document.createElement('canvas');
                lastFrame.width = BASE_W;
                lastFrame.height = BASE_H;
            }
            const lastFrameCtx = lastFrame.getContext('2d');
            lastFrameCtx.clearRect(0, 0, BASE_W, BASE_H);
            lastFrameCtx.drawImage(postCanvas, 0, 0);
        }
        
        // Desenhar resultado final no canvas do jogo
        ctx.clearRect(0, 0, BASE_W, BASE_H);
        ctx.drawImage(postCanvas, 0, 0);
    }
    
    // Funções para aplicar efeitos específicos
    
    // Ajuste de contraste
    function applyContrast() {
        shaderCtx.clearRect(0, 0, BASE_W, BASE_H);
        shaderCtx.filter = `contrast(${effects.contrast})`;
        shaderCtx.drawImage(postCanvas, 0, 0);
        
        postCtx.clearRect(0, 0, BASE_W, BASE_H);
        postCtx.drawImage(shaderCanvas, 0, 0);
        postCtx.filter = 'none';
    }
    
    // Efeito de bloom (brilho)
    function applyBloom() {
        // Criar cópia para aplicar blur
        shaderCtx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Extrair áreas brilhantes
        shaderCtx.filter = 'brightness(1.3) saturate(1.5)';
        shaderCtx.drawImage(postCanvas, 0, 0);
        
        // Aplicar blur
        shaderCtx.filter = 'blur(4px)';
        shaderCtx.globalCompositeOperation = 'lighten';
        shaderCtx.drawImage(shaderCanvas, 0, 0);
        
        // Misturar com o original
        postCtx.globalCompositeOperation = 'lighter';
        postCtx.globalAlpha = 0.5;
        postCtx.drawImage(shaderCanvas, 0, 0);
        postCtx.globalAlpha = 1.0;
        postCtx.globalCompositeOperation = 'source-over';
    }
    
    // Efeito de aberração cromática
    function applyAberration() {
        const amount = 1.5; // Quantidade de deslocamento em pixels
        
        shaderCtx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Canal vermelho (deslocado para esquerda)
        shaderCtx.globalCompositeOperation = 'source-over';
        shaderCtx.fillStyle = '#ff0000';
        shaderCtx.globalAlpha = 0.5;
        shaderCtx.drawImage(postCanvas, -amount, 0);
        
        // Canal azul (deslocado para direita)
        shaderCtx.fillStyle = '#0000ff';
        shaderCtx.globalAlpha = 0.5;
        shaderCtx.drawImage(postCanvas, amount, 0);
        
        // Canal verde (central)
        shaderCtx.fillStyle = '#00ff00';
        shaderCtx.globalAlpha = 0.5;
        shaderCtx.drawImage(postCanvas, 0, 0);
        
        // Aplicar ao canvas final
        postCtx.clearRect(0, 0, BASE_W, BASE_H);
        postCtx.drawImage(postCanvas, 0, 0);
        postCtx.globalAlpha = 0.7;
        postCtx.drawImage(shaderCanvas, 0, 0);
        postCtx.globalAlpha = 1.0;
    }
    
    // Efeito de distorção CRT
    function applyCrtDistortion() {
        const distortionAmount = 0.03;
        
        postCtx.save();
        
        // Desenhar com distorção barril
        postCtx.drawImage(postCanvas, 0, 0);
        
        // Aplicar distorção com transformação
        postCtx.globalCompositeOperation = 'source-over';
        postCtx.translate(BASE_W/2, BASE_H/2);
        postCtx.scale(1 - distortionAmount, 1 - distortionAmount);
        postCtx.translate(-BASE_W/2, -BASE_H/2);
        
        // Gradiente de distorção
        const distortionGradient = postCtx.createRadialGradient(
            BASE_W/2, BASE_H/2, 0,
            BASE_W/2, BASE_H/2, BASE_W/1.5
        );
        
        distortionGradient.addColorStop(0, 'rgba(20, 20, 20, 0)');
        distortionGradient.addColorStop(1, 'rgba(20, 20, 20, 0.12)');
        
        postCtx.fillStyle = distortionGradient;
        postCtx.fillRect(0, 0, BASE_W, BASE_H);
        postCtx.restore();
    }
    
    // Efeito de vinheta (escurecimento das bordas)
    function applyVignette() {
        const gradient = postCtx.createRadialGradient(
            BASE_W/2, BASE_H/2, BASE_H/3,
            BASE_W/2, BASE_H/2, BASE_H/1.2
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        
        postCtx.globalCompositeOperation = 'overlay';
        postCtx.fillStyle = gradient;
        postCtx.fillRect(0, 0, BASE_W, BASE_H);
        postCtx.globalCompositeOperation = 'source-over';
    }
    
    // Efeito de scanlines (linhas horizontais de CRT)
    function applyScanlines() {
        const lineHeight = 2;
        const lineOpacity = 0.1;
        
        postCtx.globalCompositeOperation = 'multiply';
        
        for (let y = 0; y < BASE_H; y += lineHeight * 2) {
            postCtx.fillStyle = `rgba(0, 0, 0, ${lineOpacity})`;
            postCtx.fillRect(0, y, BASE_W, lineHeight);
        }
        
        postCtx.globalCompositeOperation = 'source-over';
    }
    
    // Efeito de ruído de filme
    function applyNoise() {
        postCtx.globalAlpha = 0.05;
        postCtx.globalCompositeOperation = 'overlay';
        
        // Padrão de ruído aleatório por frame
        if (effects.filmGrain) {
            // Usar o padrão pré-gerado e reposicioná-lo aleatoriamente
            const offsetX = Math.random() * (BASE_W / 4);
            const offsetY = Math.random() * (BASE_H / 4);
            
            // Desenhar o ruído em diferentes posições para criar variação
            for (let i = 0; i < 2; i++) {
                const x = (Math.random() * BASE_W) - BASE_W/4;
                const y = (Math.random() * BASE_H) - BASE_H/4;
                postCtx.drawImage(noisePattern, x, y, BASE_W/2, BASE_H/2);
            }
        }
        
        postCtx.globalAlpha = 1.0;
        postCtx.globalCompositeOperation = 'source-over';
    }
    
    // Efeito de deslocamento cromático
    function applyChromaShift() {
        const shiftAmount = 1;
        
        shaderCtx.clearRect(0, 0, BASE_W, BASE_H);
        shaderCtx.drawImage(postCanvas, 0, 0);
        
        // Extrair canais
        shaderCtx.globalCompositeOperation = 'source-over';
        
        // Canal vermelho
        postCtx.globalCompositeOperation = 'lighter';
        postCtx.drawImage(shaderCanvas, -shiftAmount, 0);
        
        // Canal azul
        postCtx.drawImage(shaderCanvas, shiftAmount, 0);
        
        postCtx.globalCompositeOperation = 'source-over';
    }
    
    // Efeito de desfoque de movimento
    function applyMotionBlur() {
        postCtx.globalAlpha = 0.7;
        postCtx.globalCompositeOperation = 'source-over';
        postCtx.drawImage(lastFrame, 0, 0);
        postCtx.globalAlpha = 0.3;
        postCtx.drawImage(postCanvas, 0, 0);
        postCtx.globalAlpha = 1.0;
    }
    
    // Configurar efeitos
    function configure(newEffects) {
        Object.assign(effects, newEffects);
    }
    
    // Exportar funções para o escopo global
    window.GameSystem = window.GameSystem || { functions: {} };
    window.GameSystem.functions.postProcessing = {
        init,
        process,
        configure,
        getEffects: () => ({...effects})
    };
    
})(window);
