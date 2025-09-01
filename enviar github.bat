@echo off
setlocal EnableExtensions EnableDelayedExpansion

echo ========================================================
echo  ENVIANDO PARA GITHUB - https://github.com/Gabriell12321/RPG-Game-
echo ========================================================
echo.

REM Mudando para o diretório do script
cd /d "%~dp0"

REM Pergunta a mensagem do commit
set "MSG="
set /p MSG=Mensagem de commit (Enter para usar padrao): 
if "%MSG%"=="" set "MSG=Atualizacao do jogo RPG pixel"

echo.
echo Usando mensagem: "%MSG%"
echo.

REM Inicializa o repositório Git se necessário
if not exist ".git" (
  git init
  git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
)

REM Adiciona todos os arquivos
git add -A

REM Cria o commit
git commit -m "%MSG%"

REM Envia para o GitHub
git push -u origin master

echo.
echo === LAST LOCAL ===
git --no-pager log -1 --oneline
echo.
echo === REMOTE HEAD ===
git ls-remote origin -h refs/heads/%BRANCH%
echo.
echo [OK] Enviado com sucesso para https://github.com/Gabriell12321/RPG-Game-.git
echo.
echo =========================================================
echo  Para ver seu projeto online, acesse:
echo  https://github.com/Gabriell12321/RPG-Game-
echo =========================================================
goto :end

:fail
echo.
echo ========================================================
echo  SCRIPT CONCLUIDO! Pressione qualquer tecla para sair
echo ========================================================
pause
exit /b 0
