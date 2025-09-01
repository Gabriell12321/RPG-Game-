@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0A

echo =====================================================
echo  ASSISTENTE DE CONFIGURACAO - JOGO RPG
echo =====================================================
echo.
echo Este script ajuda a resolver problemas comuns com o envio para GitHub
echo.
echo Escolha uma opcao:
echo 1. Verificar se o Git esta instalado
echo 2. Configurar nome e email no Git
echo 3. Testar conexao com GitHub
echo 4. Inicializar repositorio Git nesta pasta
echo 5. Corrigir URL do repositorio remoto
echo 6. Sair
echo.

set /p choice=Digite o numero da opcao desejada: 

if "%choice%"=="1" goto check_git
if "%choice%"=="2" goto config_git
if "%choice%"=="3" goto test_github
if "%choice%"=="4" goto init_git
if "%choice%"=="5" goto fix_remote
if "%choice%"=="6" goto end

echo Opcao invalida. Tente novamente.
pause
goto :eof

:check_git
cls
echo Verificando se o Git esta instalado...
where git >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no sistema.
  echo.
  echo Para instalar o Git:
  echo 1. Baixe do site oficial: https://git-scm.com/download/win
  echo 2. Execute o instalador e siga as instrucoes
  echo 3. Certifique-se de selecionar "Git from the command line..." durante a instalacao
) else (
  echo [OK] Git encontrado no sistema.
  echo.
  git --version
)
echo.
pause
cls
goto :eof

:config_git
cls
echo Configurando nome e email do Git...
echo.
echo Seus dados atuais:
git config --global user.name
git config --global user.email
echo.
echo Configurar novos dados:
set /p git_name=Nome: 
set /p git_email=Email: 

if not "!git_name!"=="" (
  git config --global user.name "!git_name!"
)
if not "!git_email!"=="" (
  git config --global user.email "!git_email!"
)

echo.
echo Configuracao atualizada:
git config --global user.name
git config --global user.email
echo.
pause
cls
goto :eof

:test_github
cls
echo Testando conexao com GitHub...
echo.
git ls-remote https://github.com/Gabriell12321/RPG-Game-.git HEAD
if errorlevel 1 (
  echo [ERRO] Nao foi possivel conectar ao repositorio GitHub.
  echo Verifique sua conexao com a internet e as permissoes do repositorio.
) else (
  echo [OK] Conexao com GitHub estabelecida com sucesso.
)
echo.
pause
cls
goto :eof

:init_git
cls
echo Inicializando repositorio Git...
echo.
if exist ".git" (
  echo [INFO] Ja existe um repositorio Git nesta pasta.
  echo.
  echo Para reiniciar, voce precisa excluir a pasta .git (pasta oculta).
) else (
  git init
  git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
  echo [OK] Repositorio Git inicializado e conectado ao GitHub.
)
echo.
pause
cls
goto :eof

:fix_remote
cls
echo Corrigindo URL do repositorio remoto...
echo.
echo URL atual:
git remote -v
echo.
echo Definindo URL para https://github.com/Gabriell12321/RPG-Game-.git
git remote remove origin
git remote add origin https://github.com/Gabriell12321/RPG-Game-.git
echo.
echo Nova URL:
git remote -v
echo.
pause
cls
goto :eof

:end
exit /b 0
