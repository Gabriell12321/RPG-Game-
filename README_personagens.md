# Sistema de Personagens - Jogo RPG de Terror

## Estrutura Criada

### 📁 Pasta `/personagens`
- **personagemPrincipal.js** - Definição completa do personagem principal
- **mobs.js** - Sistema de inimigos e monstros
- **gerenciadorPersonagens.js** - Sistema de gestão de personagens

## 🎮 Funcionalidades Implementadas

### Personagem Principal
- ✅ Sistema de estatísticas (Vida, Sanidade, Stamina)
- ✅ Atributos (Força, Agilidade, Inteligência, etc.)
- ✅ Inventário e equipamentos
- ✅ Estados de condição (envenenado, ferido, etc.)
- ✅ Sistema de movimento e combate
- ✅ Interação com objetos

### Sistema de Inimigos
- ✅ Diferentes tipos de mobs:
  - **Sombra Espreitadora** - Inimigo básico
  - **Cadáver Reanimado** - Inimigo médio
  - **O Carniceiro** - Inimigo forte
  - **O Pesadelo** - Chefe final

### Gameplay Integrado
- ✅ Movimento com WASD
- ✅ Sistema de combate básico (Barra de Espaço para atacar)
- ✅ IA básica dos inimigos (perseguição e ataque)
- ✅ Sistema de vida e sanidade
- ✅ UI com barras de status
- ✅ Condições de Game Over

## 🎯 Controles do Jogo

### Menu
- **↑/↓** - Navegar no menu
- **Enter** - Selecionar opção
- **ESC** - Voltar ao menu

### Gameplay
- **W** - Mover para cima
- **A** - Mover para esquerda  
- **S** - Mover para baixo
- **D** - Mover para direita
- **Espaço** - Atacar inimigos próximos
- **ESC** - Voltar ao menu

## 🎨 Características Visuais

### Tema de Terror
- Fundo escuro com chuva
- Inimigos com cores espectrais
- Efeitos visuais de sanidade baixa
- Ambiente sombrio e opressivo

### Interface
- Barras de vida e sanidade
- Contador de inimigos
- Instruções na tela
- Feedback visual de combate

## 🚀 Próximos Passos Sugeridos

1. **Expandir Sistema de Combate**
   - Diferentes tipos de ataques
   - Sistema de defesa/esquiva
   - Armas e equipamentos funcionais

2. **Melhorar IA dos Inimigos**
   - Padrões de movimento mais complexos
   - Diferentes comportamentos por tipo
   - Sistema de spawn dinâmico

3. **Sistema de Progressão**
   - Experiência e níveis
   - Habilidades desbloqueáveis
   - Sistema de loot

4. **Expandir Mundo**
   - Diferentes mapas/áreas
   - Sistema de save/load
   - História e missões

## 📝 Arquivos Principais

- `game_simple_new.js` - Jogo principal com personagens integrados
- `personagens/personagemPrincipal.js` - Definição do protagonista
- `personagens/mobs.js` - Sistema de inimigos
- `personagens/gerenciadorPersonagens.js` - Gestão de personagens

O sistema está funcionando e integrado ao jogo principal. Agora você pode começar a jogar selecionando "Começar Pesadelo" no menu!
