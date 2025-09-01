@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0A

echo =====================================================
echo  UPLOADER DO JOGO RPG PARA GITHUB
echo =====================================================
echo.

REM Usa o diretório atual do script como pasta do repositório
set "REPO=%~dp0"
set "REPO=%REPO:~0,-1%"

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
  echo Alternativamente, execute o script "configurar_git.bat" para assistencia.
  echo.
  pause
  exit /b 1
)

echo [OK] Git encontrado: 
git --version
echo.

REM Verifica se o diretório já está inicializado como repositório git
if not exist "%REPO%\.git" (
  echo Repositorio Git nao inicializado.
  echo.
  echo Deseja inicializar o repositorio? (S/N)
  set /p choice=Escolha: 
  if /i "!choice!"=="S" (
    git init
    git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
    echo [OK] Repositorio Git inicializado e configurado.
  ) else (
    echo Operacao cancelada pelo usuario.
    pause
    exit /b 0
  )
)

echo.
echo === STATUS ATUAL DO REPOSITORIO ===
git --no-pager status -sb
echo.

echo Digite uma mensagem para identificar esta atualizacao:
set /p MSG=Mensagem de commit (Enter para usar padrao): 
if "!MSG!"=="" set "MSG=Atualizacao do jogo RPG pixel"

echo.
echo Enviando atualizacoes para https://github.com/Gabriell12321/RPG-Game-.git
echo Mensagem: !MSG!
echo.

REM Adiciona todos os arquivos
echo === PREPARANDO ARQUIVOS ===
git -c core.longpaths=true add -A
if errorlevel 1 (
  echo [ERRO] Falha ao adicionar arquivos.
  pause
  exit /b 1
)

REM Cria o commit
echo === SALVANDO ALTERACOES LOCAIS ===
git commit --allow-empty -m "!MSG!"
if errorlevel 1 (
  echo [ERRO] Falha ao criar commit.
  pause
  exit /b 1
)

REM Determina o branch padrão
set "BRANCH=main"
git ls-remote --exit-code origin main >nul 2>&1
if errorlevel 1 (
  set "BRANCH=master"
)
echo Usando branch: %BRANCH%

REM Tenta fazer o pull com rebase
echo === SINCRONIZANDO COM SERVIDOR ===
git pull --rebase --autostash origin %BRANCH% || echo Primeiro push, pulando pull...

REM Faz o push
echo === ENVIANDO PARA GITHUB ===
git push -u origin HEAD:%BRANCH%
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao enviar para GitHub.
  echo Verifique se o repositorio existe e se voce tem permissao.
  echo.
  echo Para resolver problemas de conexao, execute o script "configurar_git.bat"
  echo.
  pause
  exit /b 1
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
