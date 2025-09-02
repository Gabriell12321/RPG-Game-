/**
 * water_shader.ts
 * Implementação de shader de água para ambientes aquáticos
 */

window.WaterShader = (function() {
    // Interface para configuração do shader de água
    interface WaterConfig {
        enabled: boolean;
        amplitude: number; // Amplitude das ondas
        frequency: number; // Frequência das ondas
        speed: number;     // Velocidade de animação
        direction: number; // Direção das ondas em radianos
        color: string;     // Cor base da água
        reflectivity: number; // Quanto a superfície reflete (0-1)
        refraction: number;   // Quanto distorce o que está abaixo (0-1)
        rippleScale: number;  // Escala das ondulações
        rippleStrength: number; // Intensidade das ondulações
        deepColor: string;    // Cor das partes profundas
        shallowColor: string; // Cor das partes rasas
        specularAmount: number; // Reflexo especular (brilho)
        lighting: {
            enabled: boolean,
            intensity: number,
            direction: {x: number, y: number}
        }
    }
    
    // Configuração padrão
    const config: WaterConfig = {
        enabled: true,
        amplitude: 0.05,
        frequency: 2.0,
        speed: 0.5,
        direction: Math.PI / 4, // 45 graus
        color: '#3D85C6',
        reflectivity: 0.5,
        refraction: 0.3,
        rippleScale: 0.1,
        rippleStrength: 0.15,
        deepColor: '#0B5394',
        shallowColor: '#6FA8DC',
        specularAmount: 0.6,
        lighting: {
            enabled: true,
            intensity: 0.7,
            direction: {x: 0.5, y: 0.7}
        }
    };
    
    // Estado interno
    const state = {
        initialized: false,
        time: 0,
        buffers: {
            canvas: null as HTMLCanvasElement | null,
            ctx: null as CanvasRenderingContext2D | null,
            noiseTexture: null as HTMLCanvasElement | null,
            heightMap: null as HTMLCanvasElement | null
        },
        lastUpdate: 0,
        canvasSize: {width: 0, height: 0}
    };
    
    // Inicialização
    function init(width: number, height: number) {
        if (state.initialized) return;
        
        console.log("Inicializando Water Shader...");
        
        // Configurar canvas de buffer
        state.buffers.canvas = document.createElement('canvas');
        state.buffers.canvas.width = width;
        state.buffers.canvas.height = height;
        state.buffers.ctx = state.buffers.canvas.getContext('2d');
        
        // Gerar textura de ruído para perturbar a superfície da água
        generateNoiseTexture(width, height);
        
        // Gerar mapa de altura inicial
        generateHeightMap(width, height);
        
        state.canvasSize = {width, height};
        state.initialized = true;
        
        console.log("Water Shader inicializado com sucesso");
    }
    
    // Gerar textura de ruído
    function generateNoiseTexture(width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Gerar ruído Perlin (simplificado)
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                
                // Ruído Perlin simplificado
                const noise = simplex2(x * 0.01, y * 0.01);
                const value = Math.floor((noise * 0.5 + 0.5) * 255);
                
                data[index] = value;     // R
                data[index + 1] = value; // G
                data[index + 2] = value; // B
                data[index + 3] = 255;   // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        state.buffers.noiseTexture = canvas;
    }
    
    // Gerar mapa de altura para simulação de ondas
    function generateHeightMap(width: number, height: number) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Criar padrão inicial de ondas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Adicionar algumas ondas iniciais
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 20 + Math.random() * 50;
            
            const gradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, radius
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        state.buffers.heightMap = canvas;
    }
    
    // Atualizar mapa de altura
    function updateHeightMap(deltaTime: number) {
        if (!state.buffers.heightMap || !state.buffers.noiseTexture) return;
        
        const ctx = state.buffers.heightMap.getContext('2d');
        if (!ctx) return;
        
        // Aplicar desvanecimento às ondas existentes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, state.canvasSize.width, state.canvasSize.height);
        
        // Adicionar novas ondas ocasionalmente
        if (Math.random() < 0.1 * (deltaTime / 16)) {
            const x = Math.random() * state.canvasSize.width;
            const y = Math.random() * state.canvasSize.height;
            const radius = 10 + Math.random() * 30;
            
            const gradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, radius
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Propagar ondas
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.filter = 'blur(1px)';
        ctx.drawImage(state.buffers.heightMap, 0, 0);
        ctx.restore();
    }
    
    // Atualizar shader
    function update(deltaTime: number) {
        if (!config.enabled || !state.initialized) return;
        
        state.time += deltaTime * config.speed * 0.001;
        
        // Atualizar mapa de altura para simulação de ondas
        updateHeightMap(deltaTime);
        
        // Rastrear último timestamp de atualização
        state.lastUpdate = performance.now();
    }
    
    // Renderizar shader de água
    function render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
        if (!config.enabled || !state.initialized || !state.buffers.canvas || !state.buffers.ctx) return;
        
        const bufferCtx = state.buffers.ctx;
        
        // Limpar buffer
        bufferCtx.clearRect(0, 0, state.canvasSize.width, state.canvasSize.height);
        
        // Desenhar base da água com gradiente
        const gradient = bufferCtx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, config.shallowColor);
        gradient.addColorStop(1, config.deepColor);
        
        bufferCtx.fillStyle = gradient;
        bufferCtx.fillRect(x, y, width, height);
        
        // Aplicar efeito de ondas usando o mapa de altura
        if (state.buffers.heightMap) {
            bufferCtx.save();
            
            // Deslocar com base no tempo para animação
            const offsetX = Math.cos(config.direction) * state.time * 20;
            const offsetY = Math.sin(config.direction) * state.time * 20;
            
            // Aplicar efeito de ondulação
            bufferCtx.globalAlpha = config.rippleStrength;
            bufferCtx.globalCompositeOperation = 'overlay';
            
            // Desenhar mapa de altura com deslocamento
            bufferCtx.drawImage(
                state.buffers.heightMap,
                x + offsetX, y + offsetY,
                width, height
            );
            
            // Adicionar outra camada com diferente deslocamento para complexidade
            bufferCtx.globalAlpha = config.rippleStrength * 0.7;
            bufferCtx.drawImage(
                state.buffers.heightMap,
                x - offsetY, y + offsetX,
                width, height
            );
            
            bufferCtx.restore();
        }
        
        // Aplicar efeito de reflexo especular (brilho da luz)
        if (config.lighting.enabled && config.specularAmount > 0) {
            bufferCtx.save();
            
            // Posição da luz
            const lightX = (0.5 + config.lighting.direction.x * 0.5) * width;
            const lightY = (0.5 + config.lighting.direction.y * 0.5) * height;
            
            // Criar brilho especular
            const specular = bufferCtx.createRadialGradient(
                x + lightX, y + lightY, 0,
                x + lightX, y + lightY, width * 0.7
            );
            
            specular.addColorStop(0, `rgba(255, 255, 255, ${config.specularAmount * config.lighting.intensity})`);
            specular.addColorStop(0.5, `rgba(255, 255, 255, ${config.specularAmount * config.lighting.intensity * 0.3})`);
            specular.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            bufferCtx.fillStyle = specular;
            bufferCtx.globalCompositeOperation = 'lighter';
            bufferCtx.fillRect(x, y, width, height);
            
            bufferCtx.restore();
        }
        
        // Aplicar efeito de distorção da refração
        bufferCtx.save();
        bufferCtx.filter = `blur(${config.refraction * 3}px)`;
        bufferCtx.globalAlpha = 0.8;
        bufferCtx.drawImage(state.buffers.canvas, 0, 0);
        bufferCtx.restore();
        
        // Desenhar o resultado final no canvas de destino
        ctx.drawImage(state.buffers.canvas, 0, 0);
    }
    
    // Função simplificada de ruído Perlin 2D
    function simplex2(x: number, y: number): number {
        // Esta é uma versão muito simplificada para demonstração
        // Normalmente usaríamos uma biblioteca como simplex-noise
        
        const dotProduct = (ix: number, iy: number, x: number, y: number) => {
            // Obter gradiente pseudoaleatório
            let gradient = (ix * 1836311903 ^ iy * 2971215073) & 0x7fffffff;
            gradient = (gradient << 13) ^ gradient;
            gradient = (gradient * (gradient * gradient * 15731 + 789221) + 1376312589) & 0x7fffffff;
            
            // Normalizar para [-1, 1]
            const gradX = (gradient & 0x0ff) / 127.5 - 1;
            const gradY = ((gradient >> 8) & 0x0ff) / 127.5 - 1;
            
            // Produto escalar
            return gradX * x + gradY * y;
        };
        
        // Inteiros e frações
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        
        // Fatores de interpolação
        const u = fx * fx * (3 - 2 * fx);
        const v = fy * fy * (3 - 2 * fy);
        
        // Produtos escalares com os quatro cantos
        const a = dotProduct(ix, iy, fx, fy);
        const b = dotProduct(ix + 1, iy, fx - 1, fy);
        const c = dotProduct(ix, iy + 1, fx, fy - 1);
        const d = dotProduct(ix + 1, iy + 1, fx - 1, fy - 1);
        
        // Interpolação bilinear
        const result = a + u * (b - a) + v * (c - a) + u * v * (a - b - c + d);
        
        // Normalize approximately to [-1, 1]
        return result * 0.5;
    }
    
    // Redimensionar buffers
    function resize(width: number, height: number) {
        if (!state.initialized) {
            init(width, height);
            return;
        }
        
        if (state.buffers.canvas) {
            state.buffers.canvas.width = width;
            state.buffers.canvas.height = height;
        }
        
        // Regenerar texturas
        generateNoiseTexture(width, height);
        generateHeightMap(width, height);
        
        state.canvasSize = {width, height};
    }
    
    // API pública
    return {
        init,
        update,
        render,
        resize,
        
        // Obter configuração
        getConfig: () => ({...config}),
        
        // Definir configuração
        setConfig: (newConfig: Partial<WaterConfig>) => {
            Object.assign(config, newConfig);
        },
        
        // Ajustar propriedade específica
        setProperty: (property: keyof WaterConfig, value: any) => {
            if (property in config) {
                (config as any)[property] = value;
            }
        },
        
        // Ativar/desativar shader
        setEnabled: (enabled: boolean) => {
            config.enabled = enabled;
        },
        
        // Estado do shader
        isEnabled: () => config.enabled,
        isInitialized: () => state.initialized
    };
})();

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("Water Shader module loaded - waiting for game initialization");
});
