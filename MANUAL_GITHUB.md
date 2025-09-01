# Instruções para Upload Manual no GitHub

Se o script automático não estiver funcionando corretamente, siga estas instruções para fazer o upload manual:

## Pré-requisitos
1. Ter o Git instalado no seu computador
2. Ter uma conta no GitHub
3. Ter as credenciais configuradas

## Passos para Upload Manual

### 1. Abra o Git Bash ou o PowerShell
- Clique com o botão direito na pasta do projeto e selecione "Git Bash Here" ou abra o PowerShell

### 2. Configure seu usuário Git (apenas na primeira vez)
```
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 3. Inicialize o repositório (apenas na primeira vez)
```
git init
git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
```

### 4. Adicione os arquivos
```
git add .
```

### 5. Faça o commit
```
git commit -m "Atualização do jogo RPG pixel com cutscenes e melhorias visuais"
```

### 6. Envie para o GitHub
```
git push -u origin master
```

Se o branch principal for 'main' em vez de 'master', use:
```
git push -u origin main
```

### 7. Resolução de problemas comuns

#### Erro de autenticação
Se encontrar erros de autenticação, você pode gerar um token de acesso pessoal no GitHub:
1. Vá para Settings > Developer settings > Personal access tokens > Generate new token
2. Dê um nome ao token, selecione os escopos necessários (pelo menos 'repo')
3. Gere o token e use-o como senha quando solicitado

#### Conflitos de branch
Se o GitHub usar 'main' como branch padrão mas seu repositório local usa 'master':
```
git branch -m master main
git push -u origin main
```

#### Forçar upload (usar com cuidado)
Em último caso, se o push normal não funcionar:
```
git push -f origin master
```
Cuidado: isso sobrescreverá o histórico remoto!

## Verificação
Após o upload, acesse https://github.com/Gabriell12321/RPG-Game- para verificar se os arquivos foram enviados corretamente.
