// Sistema de carregamento do jogo
(function(window) {
  // Garantir que GameSystem exista e não seja sobrescrito
  if (!window.GameSystem) {
    window.GameSystem = { constants: {}, functions: {}, state: {} };
  }
  window.GameSystem.constants = window.GameSystem.constants || {};
  window.GameSystem.functions = window.GameSystem.functions || {};
  window.GameSystem.state = Object.assign({
    isLoaded: false,
    currentState: 'loading',
    worldInitialized: false
  }, window.GameSystem.state || {});
  const requiredScripts = [
    // Mundo
    'js/world_system.js',
    'js/world_render_funcs.js',
    'js/world_render_effects.js',
    'js/world_render.js',
    // Sistemas de iluminação
    'js/LanternaSystem.js',
    'js/LightSourceManager.js',
    'js/LightingIntegration.js',
    'js/lighting_advanced.js',
    'js/lanterna_diagnostico.js', // Diagnóstico para compatibilidade
    // Personagens (ordem: dados -> personagem -> gerenciador)
    'personagens/mobs.js',
    'personagens/personagemPrincipal.js',
    'personagens/gerenciadorPersonagens.js'
  ];

  // Carregar scripts em sequência
  async function loadGameScripts() {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          console.log(`Script carregado: ${src}`);
          resolve();
        };
        script.onerror = () => reject(new Error(`Erro ao carregar ${src}`));
        document.body.appendChild(script);
      });
    };

    try {
      for (const script of requiredScripts) {
        await loadScript(script);
      }
      return true;
    } catch (error) {
      console.error('Erro ao carregar scripts:', error);
      return false;
    }
  }

  // Inicializar sistemas do jogo
  async function initializeGameSystems() {
    // Inicializar sistema de mundo
    if (typeof initWorld === 'function') {
      await initWorld();
    }

    // Inicializar sistema de personagens
    if (typeof initCharacterSystem === 'function') {
      await initCharacterSystem();
    }

    // Inicializar sistema de renderização
    if (typeof initRenderSystem === 'function') {
      await initRenderSystem();
    }

    GameSystem.state.isLoaded = true;
    GameSystem.state.worldInitialized = true;
  }

  // Função principal de carregamento
  async function loadGame() {
    const updateStatus = (message) => {
      console.log(message);
      const statusElement = document.getElementById('debug-status');
      if (statusElement) {
        statusElement.innerHTML += `<br>${message}`;
      }
    };

    try {
      updateStatus('Iniciando carregamento dos scripts...');
      const scriptsLoaded = await loadGameScripts();
      
      if (!scriptsLoaded) {
        throw new Error('Falha ao carregar scripts necessários');
      }
      
      updateStatus('Scripts carregados com sucesso');
      updateStatus('Inicializando sistemas do jogo...');
      
      await initializeGameSystems();
      
      updateStatus('Sistemas inicializados com sucesso');
      updateStatus('Preparando para iniciar o jogo...');

      // Transição para o estado inicial do jogo (cutscene ou mundo)
      GameSystem.state.currentState = 'cutscene';
      
      if (typeof startCutscene === 'function') {
        startCutscene();
      }

      return true;
    } catch (error) {
      console.error('Erro durante o carregamento:', error);
      updateStatus(`ERRO: ${error.message}`);
      return false;
    }
  }

  // Exportar função de carregamento
  window.GameSystem.loadGame = loadGame;
})(window);
