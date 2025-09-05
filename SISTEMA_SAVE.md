# Sistema de Save - Pesadelo Pixelado

## Como Funciona o Sistema de Save

### Menu Principal
- **Novo Jogo**: Inicia um novo jogo do zero
- **Continuar**: Carrega o último save (só aparece disponível se houver um save)
  - Se há save: aparece "(save encontrado)" em verde
  - Se não há save: aparece "(sem save)" em cinza e não pode ser selecionado

### Como Salvar o Jogo

1. **Localizar o Baú de Save**
   - Vá para dentro da casa (ambiente inicial)
   - Procure pelo baú dourado com brilho especial
   - Localização: próximo ao centro da casa

2. **Salvar**
   - Aproxime-se do baú (cerca de 40 pixels de distância)
   - Aparecerá a mensagem "Pressione S para salvar" na parte inferior da tela
   - Pressione a tecla **S** para salvar
   - Uma confirmação aparecerá: "Jogo salvo com sucesso no baú!"
   - Efeitos visuais verdes indicam sucesso

### O que é Salvo

O sistema salva automaticamente:
- **Posição do jogador**
- **Vida e sanidade atuais**
- **Ambiente atual** (casa, quintal, mundo aberto)
- **Posição da câmera**
- **Inimigos ativos** e suas posições
- **Tempo de jogo**
- **Configurações da lanterna**
- **Efeitos ativos no jogador**

### Controles do Sistema de Save

- **Tecla S**: Salvar (quando perto do baú)
- **Menu → Continuar**: Carregar último save
- **Menu → Novo Jogo**: Começar do zero

### Indicadores Visuais

#### Baú de Save
- **Cor dourada** com gradiente brilhante
- **Fechadura** decorativa no centro
- **Efeitos de brilho** pulsantes ao redor
- **Animação sutil** de levitação

#### Mensagens de Status
- **Verde**: Save realizado com sucesso
- **Vermelho**: Erro ao salvar/carregar
- **Amarelo**: Aviso (ex: muito longe do baú)

### Dicas de Uso

1. **Salve frequentemente** - especialmente antes de sair da casa para áreas perigosas
2. **O save persiste** entre sessões do navegador
3. **Só há um slot de save** - salvar novamente sobrescreve o save anterior
4. **Salve antes de fechar** o navegador para não perder progresso

### Resolução de Problemas

**"Você precisa estar perto do baú para salvar"**
- Mova-se mais próximo ao baú dourado na casa

**"Continuar" aparece cinza no menu**
- Não há nenhum save disponível, use "Novo Jogo"

**Erro ao carregar save**
- O save pode estar corrompido, comece um novo jogo

---

*Sistema implementado com localStorage para persistência local*
