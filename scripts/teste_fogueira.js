// teste_fogueira.js - Script para testar o sistema de iluminação com fogueiras

// Executar este script no console do navegador enquanto o jogo estiver rodando
// para criar uma fogueira de teste no mapa

(function() {
    // Verificar se o jogo está rodando
    if (typeof objetos === 'undefined' || !Array.isArray(objetos)) {
        console.error("O jogo não parece estar inicializado. Execute este script enquanto o jogo estiver rodando.");
        return;
    }
    
    // Verificar se o sistema de iluminação está disponível
    if (!window.LightingSystem) {
        console.error("Sistema de iluminação não encontrado!");
        return;
    }
    
    // Função para criar uma fogueira
    function criarFogueira(x, y) {
        // Se as coordenadas não foram especificadas, usar a posição do jogador
        if (typeof x === 'undefined' || typeof y === 'undefined') {
            // Tentar obter a posição do jogador
            if (typeof jogador !== 'undefined' && jogador.posicao) {
                x = jogador.posicao.x + 50; // Um pouco à frente do jogador
                y = jogador.posicao.y + 20;
            } else {
                console.error("Não foi possível determinar a posição do jogador.");
                return null;
            }
        }
        
        // Criar objeto de fogueira
        const fogueira = {
            id: 'fogueira_' + Date.now(),
            nome: 'fogueira',
            tipo: 'decoracao',
            x: x,
            y: y,
            largura: 24,
            altura: 24,
            colisao: true,
            ativo: true,
            // Adicionar animação básica
            animacao: {
                frame: 0,
                frames: 4,
                velocidade: 10,
                contador: 0
            }
        };
        
        // Adicionar à lista de objetos
        objetos.push(fogueira);
        
        console.log(`Fogueira criada em (${x}, ${y})`);
        return fogueira;
    }
    
    // Função para criar várias fogueiras ao redor
    function criarFogueirasAoRedor(quantidade = 5, raio = 200) {
        if (typeof jogador === 'undefined' || !jogador.posicao) {
            console.error("Jogador não encontrado!");
            return;
        }
        
        const fogueiras = [];
        const centroX = jogador.posicao.x;
        const centroY = jogador.posicao.y;
        
        for (let i = 0; i < quantidade; i++) {
            // Calcular posição em círculo ao redor do jogador
            const angulo = (i / quantidade) * Math.PI * 2;
            const x = centroX + Math.cos(angulo) * raio;
            const y = centroY + Math.sin(angulo) * raio;
            
            // Criar fogueira
            const fogueira = criarFogueira(x, y);
            if (fogueira) {
                fogueiras.push(fogueira);
            }
        }
        
        console.log(`${fogueiras.length} fogueiras criadas ao redor do jogador.`);
        return fogueiras;
    }
    
    // Função para remover todas as fogueiras
    function removerFogueiras() {
        // Filtrar objetos para remover fogueiras
        const fogueirasRemovidas = objetos.filter(obj => obj.nome === 'fogueira');
        objetos = objetos.filter(obj => obj.nome !== 'fogueira');
        
        console.log(`${fogueirasRemovidas.length} fogueiras removidas.`);
    }
    
    // Criar algumas fogueiras ao redor do jogador
    criarFogueirasAoRedor(5, 150);
    
    // Expor funções no escopo global para uso no console
    window.criarFogueira = criarFogueira;
    window.criarFogueirasAoRedor = criarFogueirasAoRedor;
    window.removerFogueiras = removerFogueiras;
    
    console.log("Script de teste de fogueiras carregado!");
    console.log("Use criarFogueira(x, y) para criar uma fogueira em uma posição específica.");
    console.log("Use criarFogueirasAoRedor(quantidade, raio) para criar várias fogueiras ao redor do jogador.");
    console.log("Use removerFogueiras() para remover todas as fogueiras.");
})();
