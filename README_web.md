Tela inicial web (HTML + JS)

Abra `index.html` no navegador (Chrome/Edge/Firefox). O menu é navegável por teclado (↑ ↓ Enter) e por clique.

## Novos recursos
- **Música de fundo** e **efeitos sonoros** ao navegar no menu (com botões de controle)
- Menu expandido: Iniciar, Opções, Créditos, Sair
- Interface aprimorada com informações sobre cada opção
- Animações e visual mais refinado com partículas, efeitos de highlight e scanlines
- Fonte pixel estilo retro
- **Modo de tela cheia** (botão dedicado ou tecla F11)

Arquivos:
- `index.html` - HTML e canvas com configuração para pixel art.
- `game.js` - lógica do menu, desenho pixel e interação.
- `css/style.css` - estilos e layout responsivo
- `index_backup.html` e `game_backup.js` - versão anterior (sem áudio), caso precise reverter

Observações:
- A tela é renderizada em um canvas de 320x180 escalado 3x para ficar pixelado.
- `Iniciar` atualmente mostra um "Carregando..." e volta; posso implementar o loop do jogo se desejar.
- Os efeitos sonoros e a música são obtidos de OpenGameArt.org (recursos gratuitos)
- As configurações de áudio e vídeo são salvas no localStorage do navegador
- Para alternar entre modo janela e tela cheia, use o botão "Tela Cheia" ou pressione F11

## Próximos passos sugeridos
- Implementar o mapa inicial e controle do personagem
- Adicionar sistema de inventário e itens
- Criar um editor de mapas simples
- Implementar sistema de diálogo e NPCs
