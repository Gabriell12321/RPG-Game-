# Script PowerShell para enviar projeto para GitHub
# Nome do arquivo: enviar_github.ps1

Write-Host "====================================================="
Write-Host " UPLOADER DO JOGO RPG PARA GITHUB"
Write-Host "====================================================="
Write-Host ""

# Verifica se o Git está instalado
try {
    $gitVersion = git --version
    Write-Host "[OK] Git encontrado: $gitVersion"
} catch {
    Write-Host "[ERRO] Git não encontrado no sistema." -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar o Git:"
    Write-Host "1. Baixe do site oficial: https://git-scm.com/download/win"
    Write-Host "2. Execute o instalador e siga as instruções"
    Write-Host "3. Certifique-se de selecionar 'Git from the command line...' durante a instalação"
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Verifica se estamos em um repositório Git
if (-not (Test-Path ".git")) {
    Write-Host "[INFO] Inicializando repositório Git..."
    git init
    git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
    Write-Host "[OK] Repositório Git inicializado e configurado."
} else {
    Write-Host "[OK] Repositório Git já inicializado."
}

Write-Host ""
Write-Host "=== STATUS ATUAL DO REPOSITÓRIO ==="
git status -sb
Write-Host ""

# Solicita mensagem de commit
$MSG = Read-Host "Mensagem de commit (Enter para usar padrão)"
if ([string]::IsNullOrWhiteSpace($MSG)) {
    $MSG = "Atualização do jogo RPG pixel"
}

Write-Host ""
Write-Host "Enviando atualizações para https://github.com/Gabriell12321/RPG-Game-.git"
Write-Host "Mensagem: $MSG"
Write-Host ""

# Adiciona todos os arquivos
Write-Host "=== PREPARANDO ARQUIVOS ==="
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao adicionar arquivos." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Cria o commit
Write-Host "=== SALVANDO ALTERAÇÕES LOCAIS ==="
git commit --allow-empty -m "$MSG"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao criar commit." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Determina o branch atual
$CURRENT_BRANCH = git symbolic-ref --short HEAD
Write-Host "[INFO] Branch atual: $CURRENT_BRANCH"

# Tenta fazer o push
Write-Host "=== ENVIANDO PARA GITHUB ==="
git push -u origin $CURRENT_BRANCH
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao enviar para GitHub." -ForegroundColor Red
    Write-Host "Tentando resolver usando credenciais..."
    
    # Configurar credenciais se necessário
    git config --global credential.helper store
    
    # Tentar novamente o push
    git push -u origin $CURRENT_BRANCH
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha novamente ao enviar para GitHub." -ForegroundColor Red
        Write-Host "Verifique se o repositório existe e se você tem permissão."
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
}

Write-Host ""
Write-Host "[SUCESSO] Arquivos enviados para GitHub com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Últimas alterações enviadas:"
git log -1 --pretty=format:"Commit: %h%nAutor: %an%nData: %ad%nMensagem: %s" --date=format:"%d/%m/%Y %H:%M:%S"
Write-Host ""
Write-Host ""
Write-Host "==========================================================="
Write-Host " Para ver seu projeto online, acesse:"
Write-Host " https://github.com/Gabriell12321/RPG-Game-"
Write-Host "==========================================================="
Write-Host ""
Read-Host "Pressione ENTER para sair"
