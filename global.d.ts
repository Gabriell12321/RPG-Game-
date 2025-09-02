/**
 * global.d.ts
 * Definições globais para o jogo
 */

interface Window {
    // Sistema de partículas
    ParticleSystem: import('./js/particle_system').ParticleSystem;
    ParticleEffects: typeof import('./js/particle_system').ParticleEffects;
    
    // Sistema de efeitos visuais
    VisualEffectsSystem: import('./js/visual_effects_system').VisualEffectsSystem;
    visualEffects: typeof import('./js/visual_effects_system').visualEffects;
    
    // Sistema de integração gráfica
    GraphicsIntegration: import('./js/graphics_integration').GraphicsIntegration;
    GraphicsIntegrationV2: import('./js/graphics_integration_v2').GraphicsIntegrationV2;
    
    // Canvas e contexto
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    
    // Elementos do jogo
    game: any;
    world: any;
    player: any;
    lanterna: any;
    LanternaSystem: any;
}
