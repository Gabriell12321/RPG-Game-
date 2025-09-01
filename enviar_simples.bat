@echo off
setlocal

echo =====================================================
echo  UPLOADER DO JOGO RPG PARA GITHUB - VERSAO SIMPLES
echo =====================================================
echo.

cd /d "%~dp0"

git add -A
git commit -m "Atualizacao do jogo RPG pixel"
git push -u origin master

if %ERRORLEVEL% equ 0 (
  echo.
  echo [SUCESSO] Arquivos enviados para GitHub com sucesso!
) else (
  echo.
  echo [ERRO] Falha ao enviar para GitHub.
)

echo.
echo =========================================================
echo  Para ver seu projeto online, acesse:
echo  https://github.com/Gabriell12321/RPG-Game-
echo =========================================================
echo.
pause
