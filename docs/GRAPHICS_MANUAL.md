# Manual do Sistema Gráfico Avançado

Este manual explica como usar os novos sistemas gráficos avançados implementados no jogo.

## Índice
1. [Instalação](#instalação)
2. [Integração com o Jogo](#integração-com-o-jogo)
3. [Sistema de Partículas](#sistema-de-partículas)
4. [Efeitos Visuais](#efeitos-visuais)
5. [Superfícies de Água](#superfícies-de-água)
6. [Otimização de Performance](#otimização-de-performance)
7. [Exemplos de Uso](#exemplos-de-uso)

## Instalação

Para usar os sistemas gráficos avançados, adicione os seguintes scripts ao seu arquivo HTML:

```html
<!-- Arquivo principal do jogo -->
<script src="js/game.js"></script>

<!-- Novos sistemas gráficos -->
<script src="js/particle_system.js"></script>
<script src="js/visual_effects_system.js"></script>
<script src="js/water_shader.js"></script>
<script src="js/graphics_integration_v2.js"></script>
<script src="js/graphics_main.js"></script>
```

Os arquivos TypeScript (.ts) serão automaticamente compilados para JavaScript (.js) se você tiver o TypeScript configurado. Caso contrário, você pode usar diretamente as versões JavaScript fornecidas.

## Integração com o Jogo

O sistema já está configurado para se integrar automaticamente ao loop do jogo. A inicialização ocorre no evento `DOMContentLoaded` através do arquivo `graphics_main.js`.

Se você precisar inicializar manualmente:

```javascript
// Inicializar sistemas gráficos
window.initializeGraphicsSystems();

// Integrar com o loop do jogo
window.integrateWithGameLoop();

// Adicionar controles de configuração (opcional)
window.addGraphicsControls();
```

## Sistema de Partículas

### Efeitos Pré-definidos

O sistema inclui vários efeitos de partículas pré-definidos que podem ser facilmente adicionados ao jogo:

```javascript
// Criar um efeito de fogo
GameEffects.explosion(x, y, tamanho);

// Criar efeito de cura
GameEffects.healing(x, y);

// Iniciar chuva
const chuvaId = GameEffects.startRain(intensidade);

// Iniciar neve
const neveId = GameEffects.startSnow(intensidade);

// Efeito de teletransporte
GameEffects.playerTeleport(x, y);

// Rastro de partículas seguindo o jogador
const rastroId = GameEffects.playerTrail(player, '#4CAF50');
```

### Criando Efeitos Personalizados

Para criar efeitos de partículas personalizados:

```javascript
// Criar um emissor personalizado
const emissorId = window.ParticleSystem.createEmitter('meu_emissor', {
    position: {x: 100, y: 100},
    rate: 20, // partículas por segundo
    angle: Math.PI/2, // direção para baixo
    spread: Math.PI/6, // variação na direção
    force: {min: 1, max: 3}, // força de emissão
    maxParticles: 100,
    particleOptions: {
        color: ['#ff0000', '#ff8800', '#ffff00'], // cores variadas
        size: {min: 5, max: 10},
        life: {min: 500, max: 1500}, // vida em ms
        opacity: {min: 0.5, max: 1.0},
        gravity: 0.1,
        fade: true,
        shrink: true
    }
});

// Remover um emissor
window.ParticleSystem.removeEmitter(emissorId);
```

## Efeitos Visuais

O sistema de efeitos visuais aplica pós-processamento à renderização do jogo:

```javascript
// Adicionar efeito de bloom (brilho)
window.visualEffects.addBloom(0.5, 0.6);

// Adicionar vinheta (escurecimento nas bordas)
window.visualEffects.addVignette(0.7, 'rgba(0,0,0,0.8)', 0.7);

// Adicionar aberração cromática
window.visualEffects.addChromaticAberration(2);

// Adicionar efeito de pixelização
window.visualEffects.addPixelate(4);

// Definir qualidade dos efeitos
window.visualEffects.setQuality('medium'); // 'low', 'medium', 'high'

// Desativar todos os efeitos
window.visualEffects.disableAllEffects();

// Reativar efeitos
window.visualEffects.enableAllEffects();
```

## Superfícies de Água

O sistema inclui um shader avançado para renderizar água realista:

```javascript
// Criar uma superfície de água
const agua = new WaterSurface(
    100, // posição x
    300, // posição y
    500, // largura
    200, // altura
    {
        color: 'rgba(30, 100, 180, 0.8)',
        waveHeight: 0.5,
        waveSpeed: 0.3,
        transparency: 0.7
    }
);

// Atualizar a água no loop do jogo
function gameLoop(deltaTime) {
    // Atualização do jogo...
    
    // Atualizar e renderizar água
    agua.update(deltaTime);
    agua.render(ctx);
}

// Adicionar ondulação na água
agua.createRipple(x, y, 30, 1.5);
```

## Otimização de Performance

O sistema inclui ajuste automático de qualidade para manter um bom desempenho:

```javascript
// Configurar o sistema de integração
window.GraphicsIntegrationV2.initialize({
    visualEffects: true,
    particleSystem: true,
    initialQuality: 'medium',
    autoQuality: true, // ajuste automático com base no FPS
    enableEnvironment: true,
    debugMode: false
});

// Ativar modo de depuração para ver informações de desempenho
window.GraphicsIntegrationV2.setDebugMode(true);

// Ajustar qualidade manualmente
window.GraphicsIntegrationV2.setQuality('low'); // 'low', 'medium', 'high'
```

## Exemplos de Uso

### Adicionar Ciclo Dia/Noite

```javascript
// Função para ciclo dia/noite (chamar no update do jogo)
function atualizarCicloDiaNoise() {
    // timeOfDay varia de 0 a 1 (0 = meia-noite, 0.5 = meio-dia)
    const timeOfDay = (performance.now() % 120000) / 120000;
    GameEffects.setDayNightCycle(timeOfDay);
}
```

### Adicionar Partículas ao Movimento do Jogador

```javascript
// No evento de movimento do jogador
function moverJogador() {
    // Código de movimento...
    
    // Criar efeitos de passos se estiver se movendo
    if (velocidade > 0) {
        // Criar pequenas partículas nos pés do jogador
        window.GraphicsIntegrationV2.createParticleEffect(
            'dust', 
            player.x, 
            player.y + player.height/2, 
            0.5, 
            500
        );
    }
}
```

### Efeitos de Iluminação Dinâmica

```javascript
// Adicionar fonte de luz
const luzId = window.GraphicsIntegrationV2.addLightSource(
    x, y,         // posição
    '#ffcc00',    // cor (amarelada)
    50,           // raio
    0.7,          // intensidade
    true,         // oscilação (efeito de fogo)
    -1            // duração (-1 = permanente)
);

// Atualizar posição da luz
function atualizarPosicaoLuz() {
    const luz = window.ParticleSystem.getEmitter(luzId);
    if (luz) {
        luz.setPosition(player.x, player.y - 20);
    }
}
```

### Efeitos para Habilidades do Jogador

```javascript
// Função para ativar habilidade especial
function ativarHabilidadeEspecial() {
    // Efeito visual no jogador
    GameEffects.playerTeleport(player.x, player.y);
    
    // Aumentar temporariamente o bloom para um efeito dramático
    const bloomEffect = window.VisualEffectsSystem.getEffect('bloom');
    if (bloomEffect) {
        const originalStrength = bloomEffect.strength;
        bloomEffect.strength = 0.8;
        
        // Restaurar após 1 segundo
        setTimeout(() => {
            bloomEffect.strength = originalStrength;
        }, 1000);
    }
}
```
