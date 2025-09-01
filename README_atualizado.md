# Jogo RPG Pixel - Estilo Zelda 2D

Um jogo de RPG em pixel art inspirado nos clássicos como Zelda, com foco em exploração e aventura.

![Preview](https://raw.githubusercontent.com/Gabriell12321/RPG-Game-/main/preview.png)

## Sobre o Jogo

Este é um projeto em desenvolvimento de um RPG 2D com estilo visual pixel art. O jogo está sendo construído com foco na jogabilidade clássica dos RPGs de 8 e 16 bits, combinando exploração, combate, quebra-cabeças e uma narrativa envolvente.

## Estrutura do Projeto

```
/
├── index.html            - Página principal (versão web)
├── js/                   - Scripts JavaScript
│   ├── game.js           - Lógica principal do jogo
│   ├── game_loader.js    - Carregador de recursos do jogo
│   ├── world_render.js   - Renderização do mundo
│   └── world_system.js   - Sistema de mecânicas do mundo
├── cutscene.js           - Sistema de cutscenes com efeitos de áudio
├── game_simple_new.js    - Versão simplificada e otimizada do jogo
├── css/                  - Estilos CSS
│   └── style.css         - Estilos do jogo
├── audio/                - Arquivos de áudio
├── personagens/          - Sistema de personagens
│   ├── personagemPrincipal.js - Lógica do personagem jogável
│   ├── gerenciadorPersonagens.js - Gerenciador de personagens
│   ├── mobs.js           - Definição de inimigos
│   └── pixelArtCreator.js - Ferramenta de criação de pixel art
├── python/               - Versão Python do jogo
│   ├── main.py           - Script principal Python
│   └── requirements.txt  - Dependências Python
├── scripts/              - Scripts utilitários
│   ├── jogar_web.bat     - Inicia versão web
│   ├── run.bat           - Inicia versão Python
│   └── configurar_git.bat - Configura o Git
├── backups/              - Backups de versões anteriores
├── docs/                 - Documentação detalhada
│   ├── GITHUB.md         - Instruções para GitHub
│   ├── WEB.md            - Documentação da versão web
│   └── PYTHON.md         - Documentação da versão Python
└── README.md             - Esta documentação
```

Para organizar o projeto nesta estrutura, execute o arquivo `organizar_arquivos.bat`.

## Recursos Atuais

### Versão Web (JavaScript/HTML5)
- Tela inicial com design pixelado e animações suaves
- Música de fundo e efeitos sonoros
- Sistema de cutscenes com vozes sussurrantes
- Ambientes interativos (casa e quintal) com transições
- Personagem jogável com animações detalhadas e expressões faciais
- Botões funcionais: Iniciar, Opções, Créditos, Sair
- Modo tela cheia (F11 ou botão dedicado)
- Interface com partículas e visuais dinâmicos
- Sistema de configurações persistentes (localStorage)

### Versão Desktop (Python/Pygame)
- Tela inicial com menu interativo
- Gráficos pixelados em estilo retro
- Controles por teclado

## Como Executar

### Versão Web
1. Abra o arquivo `index.html` em qualquer navegador moderno
2. Use as setas do teclado (↑/↓) e Enter para navegar
3. Ou use o mouse para clicar nas opções

### Versão Python
Requisitos:
- Python 3.8 ou superior
- Pygame 2.0.0 ou superior

```bash
# Instalar dependências
pip install -r requirements.txt

# Executar o jogo
python main.py
```

## Em Desenvolvimento

Recursos planejados para futuras atualizações:
- Mapa de mundo explorável
- Sistema de combate aprimorado
- Inventário e itens colecionáveis
- NPCs e sistema de diálogo
- Masmorras e quebra-cabeças
- Sistema de salvamento
- Mais músicas e efeitos sonoros

## Tecnologias

- JavaScript e HTML5 Canvas para versão web
- Web Audio API para efeitos sonoros e vozes sussurrantes
- Python e Pygame para versão desktop

## Licença

Este projeto é pessoal e de código aberto para fins educacionais.

## Créditos

- Música e efeitos sonoros: [OpenGameArt.org](https://opengameart.org)
- Fonte: VCR OSD Mono
