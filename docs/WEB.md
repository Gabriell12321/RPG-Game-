# Versão Web do Jogo RPG

Esta é a documentação da versão web do Jogo RPG, desenvolvida com HTML5, JavaScript e CSS.

## Estrutura de Arquivos

- **index.html**: Página principal que carrega o jogo
- **js/game.js**: Código principal do jogo
- **css/style.css**: Estilos visuais
- **audio/**: Pasta com arquivos de áudio

## Características Atuais

- Tela de título com animações de partículas
- Menu interativo com opções navegáveis
- Efeitos sonoros e música de fundo
- Modo de tela cheia
- Controles por teclado (setas) e mouse

## Como Executar

1. **Forma Simples**
   - Clique duas vezes no arquivo `index.html` para abrir no navegador padrão
   - Ou execute o script `jogar_web.bat` na raiz do projeto

2. **Servidor Local** (recomendado para desenvolvimento)
   - Use um servidor local como Live Server (extensão do VS Code)
   - Ou use Python: `python -m http.server`
   - Acesse `http://localhost:8000` no navegador

## Controles

- **Setas para cima/baixo**: Navegar pelo menu
- **Enter/Clique**: Selecionar opção
- **Botão de tela cheia**: Alternar modo de tela cheia
- **ESC**: Voltar/Sair do modo tela cheia

## Funcionalidades Técnicas

- **Sistema de partículas**: Efeitos visuais na tela de título
- **Persistência de configurações**: Salvamento de configurações no localStorage
- **Renderização em Canvas**: Gráficos otimizados com HTML5 Canvas
- **Efeitos de scanline**: Visual retro com linhas de varredura
- **Design responsivo**: Adaptação a diferentes tamanhos de tela

## Próximos Desenvolvimentos

- Implementação da jogabilidade
- Mapa de mundo
- Sistema de combate
- NPCs e diálogos
- Sistema de inventário
