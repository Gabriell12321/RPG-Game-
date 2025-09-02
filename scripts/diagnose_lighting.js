// diagnose_lighting.js - Script para diagnosticar problemas com o sistema de iluminação

// Executar este script no console do navegador enquanto o jogo estiver rodando

(function() {
    console.log("=== DIAGNÓSTICO DO SISTEMA DE ILUMINAÇÃO ===");
    
    // Verificar se os sistemas de iluminação estão carregados
    console.log("\n1. Verificando sistemas carregados:");
    
    if (window.LanternaSystem) {
        console.log("✅ LanternaSystem está carregado");
        
        // Mostrar estado da lanterna
        const lanternaAtiva = window.LanternaSystem.isLanternaAtiva ? window.LanternaSystem.isLanternaAtiva() : "Função não encontrada";
        const bateria = window.LanternaSystem.getBateria ? window.LanternaSystem.getBateria() : "Função não encontrada";
        
        console.log(`   - Lanterna ativa: ${lanternaAtiva}`);
        console.log(`   - Nível de bateria: ${bateria}`);
    } else {
        console.log("❌ LanternaSystem NÃO está carregado");
    }
    
    if (window.LightSourceManager) {
        console.log("✅ LightSourceManager está carregado");
        
        // Mostrar fontes de luz ativas
        const fontesDeLuz = window.LightSourceManager.getLightSources ? window.LightSourceManager.getLightSources() : [];
        console.log(`   - Fontes de luz ativas: ${fontesDeLuz.length}`);
        
        if (fontesDeLuz.length > 0) {
            console.log("   - Detalhes das fontes:");
            fontesDeLuz.forEach((fonte, index) => {
                console.log(`     [${index}] Tipo: ${fonte.type}, Posição: (${fonte.x}, ${fonte.y})`);
            });
        }
    } else {
        console.log("❌ LightSourceManager NÃO está carregado");
    }
    
    if (window.LightingSystem) {
        console.log("✅ LightingSystem está carregado");
        
        // Mostrar nível de luz ambiente
        const luzAmbiente = window.LightingSystem.getLuzAmbiente ? window.LightingSystem.getLuzAmbiente() : "Função não encontrada";
        console.log(`   - Nível de luz ambiente: ${luzAmbiente}`);
        
        // Fontes de luz ativas
        const fontesAtivas = window.LightingSystem.getFontesAtivas ? window.LightingSystem.getFontesAtivas() : [];
        console.log(`   - Fontes de luz gerenciadas: ${fontesAtivas.length}`);
    } else {
        console.log("❌ LightingSystem NÃO está carregado");
    }
    
    // Verificar estado do jogo
    console.log("\n2. Verificando estado do jogo:");
    
    if (typeof gameState !== 'undefined') {
        console.log(`✅ Estado do jogo: ${gameState}`);
    } else {
        console.log("❌ Variável gameState não encontrada");
    }
    
    if (typeof jogador !== 'undefined') {
        console.log("✅ Jogador encontrado");
        console.log(`   - Posição: (${jogador.posicao.x}, ${jogador.posicao.y})`);
        console.log(`   - Direção: ${jogador.animacao.direcao}`);
    } else {
        console.log("❌ Jogador não encontrado");
    }
    
    if (typeof inimigosAtivos !== 'undefined') {
        console.log(`✅ Inimigos ativos: ${inimigosAtivos.length}`);
        
        if (inimigosAtivos.length > 0) {
            console.log("   - Detalhes dos inimigos:");
            inimigosAtivos.forEach((inimigo, index) => {
                console.log(`     [${index}] Tipo: ${inimigo.tipo}, Posição: (${inimigo.x}, ${inimigo.y})`);
            });
        }
    } else {
        console.log("❌ Lista de inimigos não encontrada");
    }
    
    // Verificar o DOM
    console.log("\n3. Verificando elementos DOM:");
    
    const canvas = document.getElementById('screen');
    if (canvas) {
        console.log(`✅ Canvas encontrado: ${canvas.width}x${canvas.height}`);
    } else {
        console.log("❌ Canvas não encontrado");
    }
    
    // Verificar scripts carregados
    console.log("\n4. Verificando scripts carregados:");
    
    const scripts = document.querySelectorAll('script');
    const scriptPaths = Array.from(scripts).map(s => s.src).filter(src => src.length > 0);
    
    const lightingScripts = scriptPaths.filter(path => 
        path.includes('Lanterna') || 
        path.includes('Light') || 
        path.includes('lantern') || 
        path.includes('light')
    );
    
    if (lightingScripts.length > 0) {
        console.log("✅ Scripts de iluminação encontrados:");
        lightingScripts.forEach(script => {
            console.log(`   - ${script.split('/').pop()}`);
        });
    } else {
        console.log("❌ Nenhum script de iluminação encontrado no DOM");
    }
    
    // Recomendações
    console.log("\n5. Recomendações:");
    
    if (!window.LanternaSystem || !window.LightSourceManager || !window.LightingSystem) {
        console.log("❗ Um ou mais sistemas de iluminação não estão carregados.");
        console.log("   Verifique se todos os scripts estão incluídos no index.html na ordem correta.");
    }
    
    if (typeof inimigosAtivos === 'undefined') {
        console.log("❗ A lista de inimigos não foi encontrada.");
        console.log("   O sistema de iluminação pode não ter objetos para detectar.");
    }
    
    console.log("\n=== FIM DO DIAGNÓSTICO ===");
    
    // Funções de ajuda
    window.fixLighting = function() {
        if (window.LanternaSystem) {
            // Reduzir a escuridão para um nível mais visível
            window.LanternaSystem.setEscuridao(0.5);
            console.log("Escuridão ajustada para 50%");
        }
        
        if (window.LightingSystem) {
            window.LightingSystem.setLuzAmbientePadrao(0.3);
            console.log("Luz ambiente ajustada para 30%");
        }
    };
    
    window.createTestLight = function(x, y, tipo = 'fogueira') {
        if (!window.LightSourceManager) {
            console.error("LightSourceManager não está disponível");
            return;
        }
        
        // Se x e y não foram fornecidos, usar a posição do jogador
        if (typeof x === 'undefined' || typeof y === 'undefined') {
            if (typeof jogador !== 'undefined' && jogador.posicao) {
                x = jogador.posicao.x;
                y = jogador.posicao.y;
            } else {
                console.error("Posição do jogador não disponível");
                return;
            }
        }
        
        // Adicionar uma fonte de luz de teste
        window.LightSourceManager.addLightSource({
            x: x,
            y: y,
            type: tipo,
            objectId: 'test_light_' + Date.now(),
            radius: 100,
            color: '#FFCC66',
            intensity: 0.8,
            flicker: true,
            flickerAmount: 0.2,
            ambient: 0.3
        });
        
        console.log(`Fonte de luz de teste (${tipo}) criada em (${x}, ${y})`);
    };
    
    console.log("\nFunções de ajuda disponíveis:");
    console.log("- fixLighting() - Ajusta os níveis de iluminação para valores mais visíveis");
    console.log("- createTestLight(x, y, tipo) - Cria uma fonte de luz de teste na posição especificada");
})();
