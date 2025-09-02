# Sistema de Iluminação e Lanterna - Manual de Uso

Este documento descreve como utilizar o sistema de iluminação e lanterna no jogo RPG.

## Comandos Básicos

- **F** - Liga/desliga a lanterna
- **B** - Mostra/esconde o medidor de bateria da lanterna

## Sistema de Lanterna

A lanterna possui um sistema de bateria que se esgota gradualmente enquanto está em uso. Quando desligada, a bateria se recarrega lentamente. O estado da bateria é indicado visualmente no jogo.

### Características da Lanterna

- **Intensidade da luz**: Varia conforme o nível da bateria
- **Alcance**: O alcance da luz diminui quando a bateria está fraca
- **Bateria Baixa**: Quando a bateria está baixa, a lanterna pode piscar e um som de aviso será emitido
- **Sem Bateria**: Se a bateria acabar completamente, a lanterna desligará automaticamente

## Sistema de Iluminação Adaptativa

O jogo conta com um sistema de iluminação que detecta automaticamente fontes de luz no ambiente, como:

- Fogueiras
- Tochas
- Lamparinas
- Lâmpadas
- Janelas iluminadas

### Funcionamento

1. O sistema detecta automaticamente objetos que podem emitir luz baseado em seus nomes
2. A iluminação ambiente se ajusta conforme a proximidade dessas fontes de luz
3. Cada fonte de luz contribui para a iluminação geral do ambiente
4. Quanto mais fontes de luz próximas, menor será a escuridão

## Efeitos Visuais

- **Tremulação**: Fontes de luz como fogueiras e tochas possuem efeito de tremulação
- **Gradiente de Luz**: A luz diminui gradualmente do centro para as bordas
- **Iluminação Combinada**: Múltiplas fontes de luz se combinam para criar efeitos realistas

## Dicas

- Em ambientes muito escuros, use a lanterna com moderação para economizar bateria
- Procure ficar perto de fontes de luz naturais quando possível
- Lembre-se que a luz pode atrair atenção indesejada
- A lanterna pode ser crucial para explorar áreas sem iluminação
- Objetos que emitem luz geralmente contêm "fogueira", "tocha", "lamparina" ou termos similares em seus nomes

## Solução de Problemas

Se a iluminação parecer muito escura ou muito clara, é possível ajustar as configurações do sistema:

1. Para escuridão menos intensa, use `window.LanternaSystem.setEscuridao(0.4)` no console (valores de 0 a 1)
2. Para aumentar a luz ambiente, use `window.LightingSystem.setLuzAmbientePadrao(0.3)` no console (valores de 0 a 1)

---

Divirta-se explorando os ambientes sombrios do jogo com seu novo sistema de iluminação!
