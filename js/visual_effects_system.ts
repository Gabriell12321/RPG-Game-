/**
 * visual_effects_system.ts
 * Sistema avançado de efeitos visuais para o jogo
 */

interface ShaderUniforms {
    [key: string]: number | [number, number, number, number] | boolean | HTMLImageElement;
}

interface ShaderOptions {
    fragmentShader: string;
    uniforms?: ShaderUniforms;
    blendMode?: GlobalCompositeOperation;
    enabled?: boolean;
}

interface PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    render: (inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

class ShaderEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    fragmentShader: string;
    uniforms: ShaderUniforms;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    
    constructor(name: string, options: ShaderOptions) {
        this.name = name;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.strength = 1.0;
        this.blendMode = options.blendMode || 'source-over';
        this.fragmentShader = options.fragmentShader;
        this.uniforms = options.uniforms || {};
        
        // Canvas para renderização do shader
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        // Configurar tamanho
        this.canvas.width = inputCanvas.width;
        this.canvas.height = inputCanvas.height;
        
        // Simular o efeito de shader em Canvas 2D
        this.simulateShader(inputCanvas, this.canvas, this.ctx);
        
        // Renderizar no canvas de saída
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.drawImage(this.canvas, 0, 0);
        ctx.restore();
    }
    
    simulateShader(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        // Obter dados de pixel da imagem de entrada
        ctx.drawImage(inputCanvas, 0, 0);
        
        // Implementação específica para cada tipo de shader
        // Esta é uma simulação simplificada, pois Canvas 2D não suporta shaders reais
        // Cada shader específico deve sobrescrever este método
    }
    
    setUniform(name: string, value: number | [number, number, number, number] | boolean | HTMLImageElement): void {
        this.uniforms[name] = value;
    }
}

class BloomEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    threshold: number;
    radius: number;
    passes: number;
    blurCanvas: HTMLCanvasElement;
    blurCtx: CanvasRenderingContext2D;
    
    constructor(strength: number = 0.5, threshold: number = 0.6, radius: number = 8, passes: number = 2) {
        this.name = 'bloom';
        this.enabled = true;
        this.strength = strength;
        this.blendMode = 'lighter';
        this.threshold = threshold;
        this.radius = radius;
        this.passes = passes;
        
        this.blurCanvas = document.createElement('canvas');
        this.blurCtx = this.blurCanvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        // Configurar tamanho
        this.blurCanvas.width = inputCanvas.width;
        this.blurCanvas.height = inputCanvas.height;
        
        // Extrair áreas brilhantes
        this.extractBrightAreas(inputCanvas, this.blurCanvas, this.blurCtx);
        
        // Aplicar blur várias vezes
        for (let i = 0; i < this.passes; i++) {
            this.gaussianBlur(this.blurCanvas, this.blurCtx, this.radius);
        }
        
        // Renderizar no canvas de saída
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.drawImage(this.blurCanvas, 0, 0);
        ctx.restore();
    }
    
    extractBrightAreas(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(inputCanvas, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Calcular luminância
            const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            
            // Aplicar threshold
            const multiplier = brightness > this.threshold ? 1.0 : 0.0;
            
            data[i] *= multiplier;
            data[i + 1] *= multiplier;
            data[i + 2] *= multiplier;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    gaussianBlur(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, radius: number): void {
        const width = canvas.width;
        const height = canvas.height;
        
        // Blur horizontal
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        tempCtx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, width, height);
        
        ctx.save();
        ctx.filter = `blur(${radius}px)`;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
    }
}

class GlowEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    color: string;
    radius: number;
    glowCanvas: HTMLCanvasElement;
    glowCtx: CanvasRenderingContext2D;
    
    constructor(color: string = '#ffcc00', radius: number = 20, strength: number = 0.5) {
        this.name = 'glow';
        this.enabled = true;
        this.strength = strength;
        this.blendMode = 'lighter';
        this.color = color;
        this.radius = radius;
        
        this.glowCanvas = document.createElement('canvas');
        this.glowCtx = this.glowCanvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        // Configurar tamanho
        this.glowCanvas.width = inputCanvas.width;
        this.glowCanvas.height = inputCanvas.height;
        
        // Extrair silhueta
        this.extractSilhouette(inputCanvas, this.glowCanvas, this.glowCtx);
        
        // Aplicar glow
        this.applyGlow(this.glowCanvas, this.glowCtx);
        
        // Renderizar no canvas de saída
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.drawImage(this.glowCanvas, 0, 0);
        ctx.restore();
    }
    
    extractSilhouette(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Desenhar com a cor do glow
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.drawImage(inputCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        ctx.restore();
    }
    
    applyGlow(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.filter = `blur(${this.radius}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
    }
}

class PixelateEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    pixelSize: number;
    pixelCanvas: HTMLCanvasElement;
    pixelCtx: CanvasRenderingContext2D;
    
    constructor(pixelSize: number = 4) {
        this.name = 'pixelate';
        this.enabled = true;
        this.strength = 1.0;
        this.blendMode = 'source-over';
        this.pixelSize = pixelSize;
        
        this.pixelCanvas = document.createElement('canvas');
        this.pixelCtx = this.pixelCanvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        // Configurar tamanho
        this.pixelCanvas.width = inputCanvas.width;
        this.pixelCanvas.height = inputCanvas.height;
        
        // Aplicar pixelate
        this.applyPixelate(inputCanvas, this.pixelCanvas, this.pixelCtx);
        
        // Renderizar no canvas de saída
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.drawImage(this.pixelCanvas, 0, 0);
        ctx.restore();
    }
    
    applyPixelate(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const w = inputCanvas.width;
        const h = inputCanvas.height;
        
        // Desenhar em baixa resolução
        const scaledCanvas = document.createElement('canvas');
        const scaledCtx = scaledCanvas.getContext('2d')!;
        
        scaledCanvas.width = w / this.pixelSize;
        scaledCanvas.height = h / this.pixelSize;
        
        scaledCtx.drawImage(inputCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        
        // Desenhar ampliado no canvas de saída
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            scaledCanvas,
            0, 0, scaledCanvas.width, scaledCanvas.height,
            0, 0, w, h
        );
    }
}

class ChromaticAberrationEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    offsetR: number;
    offsetG: number;
    offsetB: number;
    redCanvas: HTMLCanvasElement;
    greenCanvas: HTMLCanvasElement;
    blueCanvas: HTMLCanvasElement;
    tempCtx: CanvasRenderingContext2D;
    
    constructor(offset: number = 2) {
        this.name = 'chromaticAberration';
        this.enabled = true;
        this.strength = 1.0;
        this.blendMode = 'lighter';
        this.offsetR = offset;
        this.offsetG = 0;
        this.offsetB = -offset;
        
        this.redCanvas = document.createElement('canvas');
        this.greenCanvas = document.createElement('canvas');
        this.blueCanvas = document.createElement('canvas');
        
        this.tempCtx = this.redCanvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        const width = inputCanvas.width;
        const height = inputCanvas.height;
        
        // Configurar tamanhos
        this.redCanvas.width = width;
        this.redCanvas.height = height;
        this.greenCanvas.width = width;
        this.greenCanvas.height = height;
        this.blueCanvas.width = width;
        this.blueCanvas.height = height;
        
        // Extrair canais RGB
        this.extractColorChannel(inputCanvas, this.redCanvas, this.tempCtx, 'red');
        this.extractColorChannel(inputCanvas, this.greenCanvas, this.greenCanvas.getContext('2d')!, 'green');
        this.extractColorChannel(inputCanvas, this.blueCanvas, this.blueCanvas.getContext('2d')!, 'blue');
        
        // Renderizar canais deslocados
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        
        ctx.drawImage(this.redCanvas, this.offsetR, 0);
        ctx.drawImage(this.greenCanvas, this.offsetG, 0);
        ctx.drawImage(this.blueCanvas, this.offsetB, 0);
        
        ctx.restore();
    }
    
    extractColorChannel(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, channel: 'red' | 'green' | 'blue'): void {
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        ctx.drawImage(inputCanvas, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (channel === 'red') {
                data[i + 1] = 0;
                data[i + 2] = 0;
            } else if (channel === 'green') {
                data[i] = 0;
                data[i + 2] = 0;
            } else if (channel === 'blue') {
                data[i] = 0;
                data[i + 1] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
}

class VignetteEffect implements PostProcessEffect {
    name: string;
    enabled: boolean;
    strength: number;
    blendMode: GlobalCompositeOperation;
    size: number;
    color: string;
    vignetteCanvas: HTMLCanvasElement;
    vignetteCtx: CanvasRenderingContext2D;
    
    constructor(size: number = 0.7, color: string = '#000000') {
        this.name = 'vignette';
        this.enabled = true;
        this.strength = 0.7;
        this.blendMode = 'multiply';
        this.size = size;
        this.color = color;
        
        this.vignetteCanvas = document.createElement('canvas');
        this.vignetteCtx = this.vignetteCanvas.getContext('2d')!;
    }
    
    render(inputCanvas: HTMLCanvasElement, outputCanvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        if (!this.enabled) return;
        
        // Configurar tamanho
        this.vignetteCanvas.width = inputCanvas.width;
        this.vignetteCanvas.height = inputCanvas.height;
        
        // Aplicar vinheta
        this.applyVignette(this.vignetteCanvas, this.vignetteCtx);
        
        // Renderizar no canvas de saída
        ctx.save();
        ctx.globalAlpha = this.strength;
        ctx.globalCompositeOperation = this.blendMode;
        ctx.drawImage(this.vignetteCanvas, 0, 0);
        ctx.restore();
    }
    
    applyVignette(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(this.size, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, this.color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

class VisualEffectsSystem {
    private static instance: VisualEffectsSystem;
    
    effects: Map<string, PostProcessEffect>;
    processingCanvas: HTMLCanvasElement;
    processingCtx: CanvasRenderingContext2D;
    outputCanvas: HTMLCanvasElement;
    outputCtx: CanvasRenderingContext2D;
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    scaleFactor: number;
    
    private constructor() {
        this.effects = new Map();
        
        // Canvas para processamento de efeitos
        this.processingCanvas = document.createElement('canvas');
        this.processingCtx = this.processingCanvas.getContext('2d')!;
        
        // Canvas para saída final
        this.outputCanvas = document.createElement('canvas');
        this.outputCtx = this.outputCanvas.getContext('2d')!;
        
        this.enabled = true;
        this.quality = 'medium';
        this.scaleFactor = 1.0;
        
        // Adicionar efeitos padrão
        this.addEffect(new BloomEffect(0.4, 0.6, 8, 2));
        this.addEffect(new VignetteEffect(0.7, 'rgba(0, 0, 0, 0.8)'));
        this.addEffect(new ChromaticAberrationEffect(1));
    }
    
    static getInstance(): VisualEffectsSystem {
        if (!VisualEffectsSystem.instance) {
            VisualEffectsSystem.instance = new VisualEffectsSystem();
        }
        return VisualEffectsSystem.instance;
    }
    
    addEffect(effect: PostProcessEffect): void {
        this.effects.set(effect.name, effect);
    }
    
    removeEffect(name: string): boolean {
        return this.effects.delete(name);
    }
    
    getEffect(name: string): PostProcessEffect | undefined {
        return this.effects.get(name);
    }
    
    setQuality(quality: 'low' | 'medium' | 'high'): void {
        this.quality = quality;
        
        switch (quality) {
            case 'low':
                this.scaleFactor = 0.5;
                break;
            case 'medium':
                this.scaleFactor = 0.75;
                break;
            case 'high':
                this.scaleFactor = 1.0;
                break;
        }
    }
    
    process(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
        if (!this.enabled || this.effects.size === 0) {
            return sourceCanvas;
        }
        
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        
        // Ajustar tamanho com base na qualidade
        const processWidth = Math.floor(width * this.scaleFactor);
        const processHeight = Math.floor(height * this.scaleFactor);
        
        // Configurar tamanhos
        this.processingCanvas.width = processWidth;
        this.processingCanvas.height = processHeight;
        this.outputCanvas.width = width;
        this.outputCanvas.height = height;
        
        // Copiar canvas original para o de processamento (com escala)
        this.processingCtx.clearRect(0, 0, processWidth, processHeight);
        this.processingCtx.drawImage(sourceCanvas, 0, 0, processWidth, processHeight);
        
        // Copiar canvas de processamento para o de saída (original)
        this.outputCtx.clearRect(0, 0, width, height);
        this.outputCtx.drawImage(this.processingCanvas, 0, 0, width, height);
        
        // Aplicar cada efeito
        for (const effect of this.effects.values()) {
            if (effect.enabled) {
                effect.render(this.processingCanvas, this.outputCanvas, this.outputCtx);
            }
        }
        
        return this.outputCanvas;
    }
    
    enable(): void {
        this.enabled = true;
    }
    
    disable(): void {
        this.enabled = false;
    }
}

// Expor como variável global
window.VisualEffectsSystem = VisualEffectsSystem.getInstance();

// Exemplos de efeitos comuns
const visualEffects = {
    addBloom(strength: number = 0.5, threshold: number = 0.6): void {
        window.VisualEffectsSystem.addEffect(new BloomEffect(strength, threshold, 8, 2));
    },
    
    addGlow(color: string = '#ffcc00', radius: number = 20, strength: number = 0.5): void {
        window.VisualEffectsSystem.addEffect(new GlowEffect(color, radius, strength));
    },
    
    addPixelate(pixelSize: number = 4): void {
        window.VisualEffectsSystem.addEffect(new PixelateEffect(pixelSize));
    },
    
    addChromaticAberration(offset: number = 2): void {
        window.VisualEffectsSystem.addEffect(new ChromaticAberrationEffect(offset));
    },
    
    addVignette(size: number = 0.7, color: string = '#000000', strength: number = 0.7): void {
        window.VisualEffectsSystem.addEffect(new VignetteEffect(size, color));
    },
    
    disableAllEffects(): void {
        window.VisualEffectsSystem.disable();
    },
    
    enableAllEffects(): void {
        window.VisualEffectsSystem.enable();
    },
    
    setQuality(quality: 'low' | 'medium' | 'high'): void {
        window.VisualEffectsSystem.setQuality(quality);
    }
};

// Expor para uso global
window.visualEffects = visualEffects;

// Exportar para TypeScript
export {
    ShaderUniforms,
    ShaderOptions,
    PostProcessEffect,
    ShaderEffect,
    BloomEffect,
    GlowEffect,
    PixelateEffect,
    ChromaticAberrationEffect,
    VignetteEffect,
    VisualEffectsSystem,
    visualEffects
};
