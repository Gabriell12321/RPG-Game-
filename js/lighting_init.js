// Verificar se há erros no sistema de iluminação
try {
    // Verificar se os objetos necessários estão disponíveis
    console.log("Verificando sistemas de iluminação...");

    // Checar sistemas
    const systems = [
        { name: "LanternaSystem", obj: window.LanternaSystem },
        { name: "LightSourceManager", obj: window.LightSourceManager },
        { name: "LightingSystem", obj: window.LightingSystem }
    ];

    let allSystemsLoaded = true;
    systems.forEach(system => {
        if (!system.obj) {
            console.error(`Erro: ${system.name} não está carregado!`);
            allSystemsLoaded = false;
        } else {
            console.log(`${system.name} carregado corretamente.`);
        }
    });

    if (allSystemsLoaded) {
        console.log("Todos os sistemas de iluminação estão carregados corretamente.");
        
        // Configurar escuridão para um nível visível
        if (window.LanternaSystem && window.LanternaSystem.setEscuridao) {
            window.LanternaSystem.setEscuridao(0.5);
            console.log("Escuridão configurada para nível médio (50%)");
        }
        
        // Adicionar um evento para tecla 'L' para alternar diagnóstico
        document.addEventListener('keydown', function(e) {
            if (e.key.toLowerCase() === 'l') {
                // Carregar script de diagnóstico
                const script = document.createElement('script');
                script.src = 'scripts/diagnose_lighting.js';
                document.body.appendChild(script);
                console.log("Script de diagnóstico carregado!");
            }
        });
        
        console.log("Pressione 'L' durante o jogo para executar o diagnóstico de iluminação.");
    }
} catch (error) {
    console.error("Erro ao verificar sistemas de iluminação:", error);
}
