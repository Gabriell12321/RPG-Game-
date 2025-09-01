# Versão Python do Jogo RPG

Esta é a documentação da versão Python do Jogo RPG, desenvolvida com Python e Pygame.

## Requisitos

- Python 3.8 ou superior
- Pygame 2.0.0 ou superior
- Demais dependências listadas em `python/requirements.txt`

## Estrutura de Arquivos

- **python/main.py**: Script principal do jogo
- **python/requirements.txt**: Lista de dependências

## Como Executar

1. **Instalação de Dependências**
   ```bash
   cd python
   pip install -r requirements.txt
   ```

2. **Executando o Jogo**
   - Execute diretamente: `python main.py` (na pasta python)
   - Ou use o script `run.bat` na raiz do projeto

## Características Atuais

- Tela de título com menu interativo
- Gráficos em estilo pixel art
- Controles por teclado (setas e enter)

## Controles

- **Setas para cima/baixo**: Navegar pelo menu
- **Enter**: Selecionar opção
- **ESC**: Voltar/Sair

## Desenvolvimento Futuro

- Implementação do loop principal do jogo
- Sistema de sprites e animação
- Física e colisões
- Sistema de combate
- Gerenciamento de estados de jogo
- Integração de áudio
- Salvamento/carregamento de progresso

## Notas de Desenvolvimento

- A versão Python serve como protótipo para testes de mecânicas
- Algumas funcionalidades podem diferir da versão web
- Esta versão é mais adequada para desenvolvimento rápido e testes
