@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0E

echo =====================================================
echo  INICIADOR DO JOGO RPG (VERSAO WEB)
echo =====================================================
echo.
echo Este script abrira o jogo RPG no navegador padrao.
echo.

REM Define o caminho do arquivo HTML
set "HTML_FILE=%~dp0index.html"

REM Verifica se o arquivo existe
if not exist "%HTML_FILE%" (
  echo [ERRO] Arquivo index.html nao encontrado em:
  echo %HTML_FILE%
  echo.
  echo Verifique se o arquivo existe e tente novamente.
  goto end
)

echo Abrindo o jogo no navegador padrao...
echo.

REM Abre o arquivo HTML no navegador padrão
start "" "%HTML_FILE%"

echo [OK] Jogo iniciado! Se o navegador nao abriu automaticamente,
echo      acesse manualmente o arquivo:
echo      %HTML_FILE%
echo.
echo Dica: Para jogar em tela cheia, pressione F11 no navegador
echo       ou use o botao de tela cheia no jogo.
echo.

:end
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
exit /b 0
