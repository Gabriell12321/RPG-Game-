@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Detecta a raiz do repositório com base na pasta deste script (.. de scripts)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO=%%~fI"

pushd "%REPO%" >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Nao foi possivel acessar a pasta do repositorio:
  echo        %REPO%
  echo Verifique o caminho e tente novamente.
  pause
  exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no PATH. Instale o Git e tente novamente.
  pause
  popd >nul 2>&1
  exit /b 1
)

REM Mensagem do commit: aceita parametro ou pergunta ao usuario
set "MSG="
if "%~1"=="" (
  set /p MSG=qualmensagem deseja nomear? 
  if "!MSG!"=="" set "MSG=atualizacao julia"
)
if not "%~1"=="" (
  set "MSG=%*"
)

echo === STATUS ATUAL ===
git --no-pager status -sb
echo.

echo === ADD ===
git -c core.longpaths=true add -A
if errorlevel 1 goto :fail

echo === COMMIT ===
git commit --allow-empty -m "%MSG%"
if errorlevel 1 goto :fail

echo === PULL (rebase/autostash) ===
git pull --rebase --autostash origin master
if errorlevel 1 goto :fail

echo === PUSH ===
git push -u origin HEAD:master
if errorlevel 1 goto :fail

echo.
echo === LAST LOCAL ===
git --no-pager log -1 --oneline
echo.
echo === REMOTE HEAD ===
git ls-remote origin -h refs/heads/master
echo.
echo [OK] Concluido.
goto :end

:fail
echo.
echo [ERRO] O processo de commit/push encontrou um erro. Revise as mensagens acima.
echo Dica: se houver conflitos, resolva-os e rode novamente este script.
exit /b 1

:end
popd >nul 2>&1
exit /b 0
