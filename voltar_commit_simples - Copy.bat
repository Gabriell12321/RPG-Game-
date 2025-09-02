@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title Voltar Commit Universal - Versao Simplificada

cls
echo ==========================================
echo    VOLTAR COMMIT UNIVERSAL - v2.0
echo ==========================================
echo.
echo Pasta atual: %CD%
echo.
echo Verificando Git...

:: Teste básico do Git
git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Git nao esta instalado ou nao esta no PATH!
    echo.
    echo Instale o Git e tente novamente.
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo Git encontrado!
echo.

:: Verificar se é repositório Git
echo Verificando repositorio Git...
if not exist ".git" (
    echo.
    echo [ERRO] Esta pasta nao e um repositorio Git!
    echo.
    echo Solucoes:
    echo 1. Navegue ate a pasta do seu projeto Git
    echo 2. Ou execute 'git init' para criar um novo repositorio
    echo.
    pause
    exit /b 1
)

echo Repositorio Git encontrado!
echo.

:: Verificar se há commits
echo Verificando commits...
git log --oneline -1 >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Este repositorio nao possui commits!
    echo.
    echo Faca um commit primeiro:
    echo   git add .
    echo   git commit -m "Primeiro commit"
    echo.
    pause
    exit /b 1
)

echo Commits encontrados!
echo.

:: Listar commits
echo ==========================================
echo         ULTIMOS 20 COMMITS
echo ==========================================
echo.

git log --oneline -20 > temp_commits.txt 2>&1
if errorlevel 1 (
    echo [ERRO] Falha ao listar commits!
    if exist temp_commits.txt type temp_commits.txt
    pause
    exit /b 1
)

:: Mostrar commits numerados
set /a count=0
if exist hashes.txt del hashes.txt
for /f "tokens=*" %%a in (temp_commits.txt) do (
    set /a count+=1
    echo !count!. %%a
    for /f "tokens=1" %%b in ("%%a") do echo %%b >> hashes.txt
)

if !count! equ 0 (
    echo Nenhum commit para mostrar.
    pause
    exit /b 1
)

echo.
echo ==========================================

:: Escolher commit
:escolher
set /p escolha="Digite o numero do commit para voltar (1-!count!) ou 'q' para sair: "

if /i "!escolha!"=="q" (
    echo Saindo...
    goto :fim
)

:: Validar numero
if "!escolha!"=="" goto :escolher

set /a num=0
set /a num=!escolha! 2>nul
if !num! equ 0 (
    echo Numero invalido! Tente novamente.
    goto :escolher
)

if !num! lss 1 (
    echo Numero muito baixo! Minimo: 1
    goto :escolher
)

if !num! gtr !count! (
    echo Numero muito alto! Maximo: !count!
    goto :escolher
)

:: Obter hash do commit
set /a linha=0
for /f "tokens=*" %%a in (hashes.txt) do (
    set /a linha+=1
    if !linha! equ !num! (
        set hash=%%a
        goto :hash_encontrado
    )
)

:hash_encontrado
if "!hash!"=="" (
    echo Erro ao encontrar o hash do commit!
    pause
    exit /b 1
)

echo.
echo Commit selecionado: !hash!
echo.

:: Mostrar detalhes
git show --stat !hash!
echo.

:: Confirmar
echo ==========================================
echo             ATENCAO!
echo ==========================================
echo.
echo Esta operacao ira:
echo 1. Resetar o repositorio para o commit !hash!
echo 2. PERDER todos os commits posteriores!
echo 3. Fazer push forcado (se confirmado)
echo.

:confirmar
set /p conf="Tem certeza? Digite 'SIM' para confirmar: "
if /i "!conf!"=="SIM" goto :resetar
if /i "!conf!"=="sim" goto :resetar
if "!conf!"=="" goto :confirmar
echo Operacao cancelada.
goto :fim

:resetar
echo.
echo Fazendo backup...
git branch backup-%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2% 2>nul

echo Resetando...
git reset --hard !hash!
if errorlevel 1 (
    echo [ERRO] Falha no reset!
    pause
    exit /b 1
)

echo Reset concluido!
echo.

:: Perguntar sobre push
echo Deseja fazer push forcado para o repositorio remoto?
set /p push="Digite 'SIM' para fazer push forcado: "
if /i not "!push!"=="SIM" (
    if /i not "!push!"=="sim" (
        echo Push nao realizado. Reset local mantido.
        goto :fim
    )
)

echo.
echo Fazendo push forcado...
git push origin HEAD --force
if errorlevel 1 (
    echo [AVISO] Falha no push. Reset local foi mantido.
    echo Verifique:
    echo - Conexao com internet
    echo - Permissoes do repositorio
    echo - URL do remote origin
    echo.
    git remote -v
) else (
    echo.
    echo ==========================================
    echo            SUCESSO!
    echo ==========================================
    echo.
    echo Repositorio resetado e enviado com sucesso!
    echo Commit atual:
    git log --oneline -1
)

:fim
echo.
:: Limpar arquivos temporários
if exist temp_commits.txt del temp_commits.txt 2>nul
if exist hashes.txt del hashes.txt 2>nul

echo.
echo Pressione qualquer tecla para sair...
pause >nul
exit /b 0
