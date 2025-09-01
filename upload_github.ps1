# upload_github.ps1 - Script PowerShell para enviar o projeto para o GitHub

# Definições de cores para melhor legibilidade
$colorSuccess = "Green"
$colorError = "Red"
$colorInfo = "Cyan"
$colorWarn = "Yellow"

function Write-ColoredOutput {
    param (
        [string]$message,
        [string]$color = "White"
    )
    Write-Host $message -ForegroundColor $color
}

function Show-Header {
    Write-ColoredOutput "=======================================================" $colorInfo
    Write-ColoredOutput "  UPLOAD DO JOGO RPG PARA GITHUB - POWERSHELL EDITION  " $colorInfo
    Write-ColoredOutput "=======================================================" $colorInfo
    Write-Host ""
}

function Test-GitInstalled {
    try {
        $gitVersion = git --version
        Write-ColoredOutput "[OK] Git encontrado: $gitVersion" $colorSuccess
        return $true
    }
    catch {
        Write-ColoredOutput "[ERRO] Git não encontrado no sistema." $colorError
        Write-Host ""
        Write-ColoredOutput "Para instalar o Git:" $colorWarn
        Write-ColoredOutput "1. Baixe do site oficial: https://git-scm.com/download/win" $colorWarn
        Write-ColoredOutput "2. Execute o instalador e siga as instruções" $colorWarn
        Write-Host ""
        return $false
    }
}

function Initialize-GitRepo {
    if (-not (Test-Path ".git")) {
        Write-ColoredOutput "Repositório Git não inicializado." $colorWarn
        Write-Host ""
        $initRepo = Read-Host "Deseja inicializar o repositório? (S/N)"
        
        if ($initRepo -eq "S" -or $initRepo -eq "s") {
            git init
            git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
            Write-ColoredOutput "[OK] Repositório Git inicializado e configurado." $colorSuccess
            return $true
        }
        else {
            Write-ColoredOutput "Operação cancelada pelo usuário." $colorInfo
            return $false
        }
    }
    
    Write-ColoredOutput "[OK] Repositório Git já inicializado." $colorSuccess
    return $true
}

function Update-ReadmeFile {
    if (Test-Path "README_atualizado.md") {
        Copy-Item -Path "README_atualizado.md" -Destination "README.md" -Force
        Write-ColoredOutput "[OK] README.md atualizado com o conteúdo mais recente." $colorSuccess
    }
}

function Push-ToGitHub {
    # Adicionar todos os arquivos
    Write-ColoredOutput "=== PREPARANDO ARQUIVOS ===" $colorInfo
    git add -A
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColoredOutput "[ERRO] Falha ao adicionar arquivos." $colorError
        return $false
    }
    
    # Solicitar mensagem de commit
    Write-Host ""
    $commitMessage = Read-Host "Mensagem de commit (Enter para usar padrão)"
    if ([string]::IsNullOrEmpty($commitMessage)) {
        $commitMessage = "Atualização do jogo RPG pixel com cutscenes e melhorias visuais"
    }
    
    # Criar commit
    Write-ColoredOutput "=== SALVANDO ALTERAÇÕES LOCAIS ===" $colorInfo
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColoredOutput "[ERRO] Falha ao criar commit." $colorError
        return $false
    }
    
    # Determinar o branch correto
    $defaultBranch = "master"
    try {
        $branches = git ls-remote --heads origin
        if ($branches -match "refs/heads/main") {
            $defaultBranch = "main"
        }
    }
    catch {
        # Manter master como padrão em caso de erro
    }
    
    Write-ColoredOutput "Usando branch: $defaultBranch" $colorInfo
    
    # Tentar push
    Write-ColoredOutput "=== ENVIANDO PARA GITHUB ===" $colorInfo
    git push -u origin $defaultBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColoredOutput "[AVISO] Falha no push inicial. Tentando estratégia alternativa..." $colorWarn
        
        # Configurar armazenamento de credenciais
        git config --global credential.helper store
        
        # Tentar novamente
        git push -u origin $defaultBranch
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColoredOutput "[ERRO] Falha ao enviar para GitHub." $colorError
            Write-ColoredOutput "Para instruções de upload manual, consulte o arquivo MANUAL_GITHUB.md" $colorWarn
            return $false
        }
    }
    
    return $true
}

function Show-Summary {
    param (
        [bool]$success
    )
    
    Write-Host ""
    
    if ($success) {
        Write-ColoredOutput "[SUCESSO] Arquivos enviados para GitHub com sucesso!" $colorSuccess
        Write-Host ""
        Write-ColoredOutput "Últimas alterações enviadas:" $colorInfo
        git log -1 --pretty=format:"Commit: %h%nAutor: %an%nData: %ad%nMensagem: %s" --date=format:"%d/%m/%Y %H:%M:%S"
    }
    else {
        Write-ColoredOutput "[ATENÇÃO] O upload não foi concluído com sucesso." $colorWarn
        Write-ColoredOutput "Consulte o arquivo MANUAL_GITHUB.md para instruções de upload manual." $colorWarn
    }
    
    Write-Host ""
    Write-Host ""
    Write-ColoredOutput "==========================================================" $colorInfo
    Write-ColoredOutput " Para ver seu projeto online, acesse:" $colorInfo
    Write-ColoredOutput " https://github.com/Gabriell12321/RPG-Game-" $colorInfo
    Write-ColoredOutput "==========================================================" $colorInfo
}

# Execução principal
Show-Header

# Verificar se o Git está instalado
if (-not (Test-GitInstalled)) {
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Inicializar repositório Git se necessário
if (-not (Initialize-GitRepo)) {
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Status atual
Write-Host ""
Write-ColoredOutput "=== STATUS ATUAL DO REPOSITÓRIO ===" $colorInfo
git status -sb
Write-Host ""

# Atualizar README
Update-ReadmeFile

# Fazer push para o GitHub
$pushSuccess = Push-ToGitHub

# Mostrar resumo
Show-Summary -success $pushSuccess

# Finalizar
Write-Host ""
Read-Host "Pressione ENTER para sair"
