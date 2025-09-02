@echo off
echo Iniciando o jogo RPG com sistema de iluminacao adaptativa...

REM Verificar se o diretório de áudio existe
if not exist "audio" (
    mkdir audio
    echo Diretorio 'audio' criado.
)

REM Verificar se os arquivos de áudio existem
if not exist "audio\lanterna_on.mp3" (
    echo Os arquivos de audio para a lanterna nao foram encontrados.
    echo Execute o script PowerShell 'jogar_com_iluminacao.ps1' para baixa-los,
    echo ou baixe manualmente os arquivos necessarios para a pasta 'audio'.
    pause
)

REM Verificar se o Python está instalado
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Iniciando servidor Python...
    start /B python -m http.server 8000
    
    REM Aguardar um pouco para o servidor iniciar
    timeout /T 2 >nul
    
    REM Abrir navegador
    start http://localhost:8000
    
    echo Servidor iniciado na porta 8000.
    echo Pressione CTRL+C e depois S para encerrar quando terminar.
    
    REM Manter o script em execução
    pause
) else (
    echo Python nao encontrado. Tentando abrir o jogo diretamente...
    start index.html
)

exit
