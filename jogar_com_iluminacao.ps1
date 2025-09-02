// Verificar e criar diretório para áudio se não existir
if (!(Test-Path -Path "./audio")) {
    New-Item -ItemType Directory -Path "./audio"
    Write-Output "Diretório 'audio' criado."
}

# Lista de URLs para baixar
$audioFiles = @(
    @{
        nome = "lanterna_on.mp3"
        url = "https://freesound.org/data/previews/274/274553_5312765-lq.mp3"
    },
    @{
        nome = "lanterna_off.mp3"
        url = "https://freesound.org/data/previews/274/274554_5312765-lq.mp3"
    },
    @{
        nome = "lanterna_bateria_baixa.mp3"
        url = "https://freesound.org/data/previews/257/257652_4205536-lq.mp3"
    }
)

# Baixar arquivos de áudio
foreach ($audio in $audioFiles) {
    $path = "./audio/$($audio.nome)"
    if (!(Test-Path -Path $path)) {
        Write-Output "Baixando $($audio.nome)..."
        try {
            Invoke-WebRequest -Uri $audio.url -OutFile $path
            Write-Output "Arquivo $($audio.nome) baixado com sucesso!"
        } catch {
            Write-Error "Erro ao baixar $($audio.nome): $_"
        }
    } else {
        Write-Output "Arquivo $($audio.nome) já existe."
    }
}

# Iniciar servidor HTTP básico e abrir o navegador
Write-Output "Iniciando o jogo com sistema de iluminação adaptativa..."

# Verificar se o Python está instalado
$pythonInstalled = $null
try {
    $pythonInstalled = python --version
} catch {
    try {
        $pythonInstalled = py --version
    } catch {
        $pythonInstalled = $null
    }
}

if ($pythonInstalled) {
    # Usar Python para servidor HTTP simples
    # Determinar qual comando Python usar
    $pythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "py" }
    
    # Iniciar servidor HTTP em segundo plano
    $process = Start-Process -FilePath $pythonCmd -ArgumentList "-m", "http.server", "8000" -NoNewWindow -PassThru
    
    # Aguardar um pouco para o servidor iniciar
    Start-Sleep -Seconds 2
    
    # Abrir navegador
    Start-Process "http://localhost:8000"
    
    Write-Output "Servidor iniciado na porta 8000. Pressione CTRL+C para encerrar."
    
    try {
        # Manter o script em execução até o usuário pressionar CTRL+C
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        # Encerrar o servidor quando o script for interrompido
        if (!$process.HasExited) {
            $process.Kill()
        }
    }
} else {
    # Alternativa: Abrir diretamente o arquivo no navegador
    Write-Output "Python não encontrado. Abrindo o jogo diretamente no navegador..."
    Start-Process ".\index.html"
}
