@echo off
setlocal EnableExtensions EnableDelayedExpansion
color 0A

echo =====================================================
echo  CONFIGURACAO DE PERMISSOES DO REPOSITORIO
echo =====================================================
echo.

REM Verifica se o Git está instalado
where git >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Git nao encontrado no sistema.
  echo Instale o Git primeiro e execute o script "configurar_git.bat"
  echo.
  pause
  exit /b 1
)

echo Escolha o tipo de autenticacao para o GitHub:
echo 1. HTTPS (usando nome de usuario e senha/token)
echo 2. SSH (usando chaves publicas/privadas)
echo.
set /p auth_type=Escolha (1/2): 

if "%auth_type%"=="1" goto setup_https
if "%auth_type%"=="2" goto setup_ssh
echo Opcao invalida. Tente novamente.
pause
exit /b 1

:setup_https
echo.
echo === CONFIGURACAO HTTPS ===
echo.
echo Para usar HTTPS, voce precisa de um token de acesso pessoal (PAT).
echo O GitHub nao aceita mais senha regular para operacoes Git via HTTPS.
echo.
echo 1. Acesse https://github.com/settings/tokens
echo 2. Clique em "Generate new token"
echo 3. De um nome descritivo como "RPG Game Access"
echo 4. Selecione os escopos "repo" e "workflow"
echo 5. Clique em "Generate token" e copie o token gerado
echo.
echo Deseja configurar o token agora? (S/N)
set /p setup_token=Resposta: 

if /i "%setup_token%"=="S" (
  echo.
  echo Digite seu nome de usuario do GitHub:
  set /p github_user=Usuario: 
  
  echo.
  echo Cole seu token de acesso pessoal:
  set /p github_token=Token: 
  
  echo.
  echo Configurando credenciais...
  git config --global credential.helper store
  echo https://%github_user%:%github_token%@github.com > "%USERPROFILE%\.git-credentials"
  echo [OK] Credenciais configuradas com sucesso!
  echo.
  echo Testando conexao com GitHub...
  git ls-remote https://github.com/Gabriell12321/RPG-Game-.git HEAD >nul 2>&1
  if errorlevel 1 (
    echo [ERRO] Falha na autenticacao. Verifique o token e tente novamente.
  ) else (
    echo [OK] Autenticacao bem-sucedida!
  )
)
goto end

:setup_ssh
echo.
echo === CONFIGURACAO SSH ===
echo.
echo Para usar SSH com GitHub:
echo.
echo 1. Vamos verificar se voce ja tem chaves SSH:

if exist "%USERPROFILE%\.ssh\id_rsa.pub" (
  echo [INFO] Chave SSH encontrada em %USERPROFILE%\.ssh\id_rsa.pub
  type "%USERPROFILE%\.ssh\id_rsa.pub"
  echo.
  echo 2. Adicione esta chave ao seu GitHub:
  echo   - Acesse https://github.com/settings/keys
  echo   - Clique em "New SSH key"
  echo   - De um titulo como "Meu Computador"
  echo   - Cole a chave acima
  echo   - Clique em "Add SSH key"
) else (
  echo [INFO] Nenhuma chave SSH encontrada.
  echo.
  echo Para criar uma nova chave SSH:
  echo.
  echo Deseja criar uma chave SSH agora? (S/N)
  set /p create_key=Resposta: 
  
  if /i "%create_key%"=="S" (
    echo.
    echo Digite seu email do GitHub:
    set /p ssh_email=Email: 
    
    echo.
    echo Gerando chave SSH...
    ssh-keygen -t rsa -b 4096 -C "%ssh_email%" -f "%USERPROFILE%\.ssh\id_rsa" -N ""
    
    if errorlevel 1 (
      echo [ERRO] Falha ao gerar chave SSH.
    ) else (
      echo [OK] Chave SSH gerada com sucesso!
      echo.
      echo Sua chave publica:
      type "%USERPROFILE%\.ssh\id_rsa.pub"
      echo.
      echo Adicione esta chave ao seu GitHub:
      echo 1. Acesse https://github.com/settings/keys
      echo 2. Clique em "New SSH key"
      echo 3. De um titulo como "Meu Computador"
      echo 4. Cole a chave acima
      echo 5. Clique em "Add SSH key"
    )
  )
)

echo.
echo Para testar a conexao SSH apos adicionar a chave, execute:
echo   ssh -T git@github.com
echo.
echo Para configurar seu repositorio para usar SSH:
echo   git remote set-url origin git@github.com:Gabriell12321/RPG-Game-.git
echo.
echo Deseja configurar o repositorio para usar SSH agora? (S/N)
set /p config_ssh=Resposta: 

if /i "%config_ssh%"=="S" (
  git remote set-url origin git@github.com:Gabriell12321/RPG-Game-.git
  echo [OK] Repositorio configurado para usar SSH!
)

:end
echo.
echo =====================================================
echo  CONFIGURACAO CONCLUIDA
echo =====================================================
echo.
echo Para verificar as permissoes do repositorio no GitHub:
echo 1. Acesse https://github.com/Gabriell12321/RPG-Game-/settings
echo 2. Clique em "Manage access" para ver colaboradores
echo 3. Para mudar a visibilidade (publico/privado), va para "Danger Zone"
echo.
echo Alem disso, para pessoas contribuirem com seu repositorio:
echo - Se o repositorio for privado, adicione-as como colaboradoras
echo - Se o repositorio for publico, qualquer um pode fazer fork
echo   e enviar pull requests, mas apenas colaboradores podem
echo   fazer commit direto.
echo.
echo Pressione qualquer tecla para sair...
pause > nul
exit /b 0
