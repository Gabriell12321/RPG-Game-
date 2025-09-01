# Como Usar o GitHub com Este Projeto

## Configuração Inicial (Primeira Vez)

1. **Certifique-se de ter o Git instalado**
   - Verifique executando o script `scripts/configurar_git.bat`
   - Selecione a opção 1 para verificar a instalação do Git

2. **Configure seu nome e email no Git**
   - Execute o script `scripts/configurar_git.bat`
   - Selecione a opção 2 para configurar nome e email

3. **Configure as permissões de acesso ao GitHub**
   - Execute o script `scripts/configurar_permissoes.bat`
   - Escolha o método de autenticação (HTTPS ou SSH)
   - Siga as instruções na tela para configurar

4. **Inicialize o repositório local (se ainda não inicializado)**
   - Execute o script `scripts/configurar_git.bat`
   - Selecione a opção 4 para inicializar o repositório

## Uso Diário

### Enviando Alterações para o GitHub

1. **Método Simples**
   - Execute o script `enviar_github.bat` na raiz do projeto
   - Digite uma mensagem descritiva sobre suas alterações
   - O script enviará automaticamente para o GitHub

2. **Método Avançado**
   - Execute o script `scripts/enviar_github_novo.bat`
   - Este script fornece mais feedback e opções avançadas

### Solução de Problemas Comuns

- **Erro de autenticação**
  - Execute `scripts/configurar_permissoes.bat` para atualizar suas credenciais

- **URL do repositório incorreta**
  - Execute `scripts/configurar_git.bat` e selecione a opção 5 para corrigir

- **Conflitos de merge**
  - Resolva os conflitos manualmente editando os arquivos afetados
  - Execute novamente o script de envio depois de resolver os conflitos

## Dicas

- Sempre inclua uma mensagem de commit descritiva
- Faça commits frequentes de alterações relacionadas
- Verifique se o repositório remoto existe antes de tentar enviar

## Repositório Online

Acesse o repositório online em: [https://github.com/Gabriell12321/RPG-Game-](https://github.com/Gabriell12321/RPG-Game-)

Para mais informações sobre Git e GitHub, visite [git-scm.com](https://git-scm.com/doc) ou [docs.github.com](https://docs.github.com)
