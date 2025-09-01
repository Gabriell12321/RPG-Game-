(function(window) {
  // Configuração inicial do jogo
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');

  // Ajustar tamanho do canvas
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Estado inicial do jogo
  const gameState = {
    current: 'cutscene', // Estado inicial definido como cutscene
    resourcesLoaded: false
  };

  // Função para iniciar a cutscene
  function startCutscene() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Iniciando Cutscene...', canvas.width / 2, canvas.height / 2);

    console.log('Cutscene iniciada.');
  }

  // Inicializar o jogo
  function initGame() {
    console.log('Inicializando o jogo...');

    // Simular carregamento de recursos
    setTimeout(() => {
      gameState.resourcesLoaded = true;
      console.log('Recursos carregados.');

      // Transição para a cutscene
      if (gameState.current === 'cutscene') {
        startCutscene();
      }
    }, 1000); // Simulação de 1 segundo para carregamento
  }

  // Iniciar o jogo ao carregar o script
  window.addEventListener('load', initGame);
})(window);