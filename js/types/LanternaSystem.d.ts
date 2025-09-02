// LanternaSystem.d.ts
// Definições de tipos para o sistema de lanterna

/**
 * Configurações do sistema de iluminação da lanterna
 */
interface LanternaConfig {
    lanterna: {
        ativa: boolean;
        alcance: number;
        anguloLuz: number;
        intensidade: number;
        corLuz: string;
        bateria: number;
        consumoBateria: number;
        consumoExtra: number;
        tremor: number;
        brilhoCentral: number;
        bordaSuave: boolean;
        sons: {
            ligar: string;
            desligar: string;
            semBateria: string;
        }
    };
    escuridao: {
        intensidade: number;
        corAmbiente: string;
        gradiente: boolean;
        variacao: number;
        velocidadeVariacao: number;
        adaptacaoVisual: boolean;
        tempoAdaptacao: number;
        luaCeu: {
            presente: boolean;
            intensidade: number;
            cor: string;
        }
    };
    atmosfera: {
        particulas: boolean;
        densidade: number;
        visibilidade: number;
    };
}

/**
 * Estado interno do sistema de lanterna
 */
interface LanternaState {
    tick: number;
    keyPressed: boolean;
    ultimoPisca: number;
    variationOffset: number;
    isShaking: boolean;
    shakeIntensity: number;
    shakeDecay: number;
    flickerTimer: number;
    flickering: boolean;
    direcaoAtual: 'up' | 'down' | 'left' | 'right';
    adaptacaoEscuridao: number;
    inicioAdaptacao: number;
    bateriaBaixa: boolean;
    intensidadeAtual: number;
    desgasteBateria: number;
    ultimoRuido: number;
    ambienteUmido: boolean;
    particulasAr: ParticleData[];
    ultimoTremor: {x: number, y: number};
    modoComposicaoPreferido: string;
    modoFallback: string;
    renderizacaoFalhou: boolean;
}

/**
 * Dados de uma partícula no sistema
 */
interface ParticleData {
    x: number;
    y: number;
    tamanho: number;
    velocidade: number;
    opacidade: number;
}

/**
 * Interface pública do sistema de lanterna
 */
interface LanternaSystem {
    init(): void;
    update(deltaTime: number, playerX: number, playerY: number, playerAngle: number): void;
    render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
    toggleLanterna(): void;
    causarTremor(intensidade: number, duracao: number): void;
    recarregarBateria(quantidade: number): void;
    
    // Getters/Setters
    isLanternaAtiva(): boolean;
    getBateria(): number;
    setEscuridao(intensidade: number): void;
    getConfig(): LanternaConfig;
    setDirecao(novaDirecao: 'up' | 'down' | 'left' | 'right'): void;
    
    // Funções avançadas
    setAmbienteUmido(umido: boolean): void;
    configurarLuz(config: Partial<LanternaConfig['lanterna']>): void;
    ativarLuar(intensidade?: number): void;
    desativarLuar(): void;
    
    // Diagnóstico
    getModoComposicao(): string;
    getRenderizacaoFalhou(): boolean;
    getEstadoDebug(): any;
}

/**
 * Interface para diagnóstico do sistema de lanterna
 */
interface LanternaDiagnostico {
    init(): void;
    renderUI(ctx: CanvasRenderingContext2D): void;
    ativar(): void;
    desativar(): void;
    isAtivo(): boolean;
    mostrarUI(mostrar: boolean): void;
    getInfo(): any;
    getEstadoLanterna(): any;
}

declare global {
    interface Window {
        LanternaSystem: LanternaSystem;
        LanternaDiagnostico: LanternaDiagnostico;
    }
}
