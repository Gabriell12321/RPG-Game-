@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0A

echo =====================================================
echo  UPLOADER DO JOGO RPG PARA GITHUB
echo =====================================================
echo.

REM Usa o diretório atual do script como pasta do repositório
cd /d "%~dp0"

echo Verificando requisitos...
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no sistema.
  echo.
  echo Para instalar o Git:
  echo 1. Baixe do site oficial: https://git-scm.com/download/win
  echo 2. Execute o instalador e siga as instrucoes
  echo 3. Certifique-se de selecionar "Git from the command line..." durante a instalacao
  echo.
  pause
  exit /b 1
)

echo [OK] Git encontrado: 
git --version
echo.

REM Verificar se temos um repositório Git inicializado
if not exist ".git" (
  echo [INFO] Inicializando repositorio Git...
  git init
  git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
  echo [OK] Repositorio Git inicializado e configurado.
) else (
  echo [OK] Repositorio Git ja inicializado.
)

echo.
echo === STATUS ATUAL DO REPOSITORIO ===
git --no-pager status -sb
echo.

REM Solicita mensagem de commit
set "MSG="
set /p MSG=Mensagem de commit (Enter para usar padrao): 
if "%MSG%"=="" set "MSG=Atualizacao do jogo RPG pixel"

echo.
echo Enviando atualizacoes para https://github.com/Gabriell12321/RPG-Game-.git
echo Mensagem: %MSG%
echo.

REM Adiciona todos os arquivos
echo === PREPARANDO ARQUIVOS ===
git add -A
if errorlevel 1 (
  echo [ERRO] Falha ao adicionar arquivos.
  pause
  exit /b 1
)

REM Cria o commit
echo === SALVANDO ALTERACOES LOCAIS ===
git commit --allow-empty -m "%MSG%"
if errorlevel 1 (
  echo [ERRO] Falha ao criar commit.
  pause
  exit /b 1
)

REM Determina o branch padrão (main ou master)
for /f %%i in ('git symbolic-ref --short HEAD 2^>nul') do set "CURRENT_BRANCH=%%i"
echo [INFO] Branch atual: %CURRENT_BRANCH%

REM Tenta fazer o push
echo === ENVIANDO PARA GITHUB ===
git push -u origin %CURRENT_BRANCH%
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao enviar para GitHub.
  echo Tentando resolver usando credenciais...
  
  REM Configurar credenciais se necessário
  git config --global credential.helper store
  
  REM Tentar novamente o push
  git push -u origin %CURRENT_BRANCH%
  if errorlevel 1 (
    echo [ERRO] Falha novamente ao enviar para GitHub.
    echo Verifique se o repositorio existe e se voce tem permissao.
    pause
    exit /b 1
  )
)

echo.
echo [SUCESSO] Arquivos enviados para GitHub com sucesso!
echo.
echo Ultimas alteracoes enviadas:
git --no-pager log -1 --pretty=format:"Commit: %%h%%nAutor: %%an%%nData: %%ad%%nMensagem: %%s" --date=format:"%%d/%%m/%%Y %%H:%%M:%%S"
echo.
echo.
echo =========================================================
echo  Para ver seu projeto online, acesse:
echo  https://github.com/Gabriell12321/RPG-Game-
echo =========================================================
echo.
pause
exit /b 0
