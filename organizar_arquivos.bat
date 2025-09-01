@echo off
setlocal

echo =====================================================
echo  ORGANIZADOR DE ARQUIVOS DO JOGO RPG
echo =====================================================
echo.
echo Este script vai organizar os arquivos do projeto
echo em uma estrutura de pastas adequada.
echo.
echo Organizando...

REM Criar diretórios se não existirem
if not exist "js" mkdir js
if not exist "python" mkdir python
if not exist "scripts" mkdir scripts
if not exist "backups" mkdir backups
if not exist "docs" mkdir docs

REM Mover arquivos JavaScript para pasta js
if exist "game.js" move /Y "game.js" "js\"
if exist "game_backup.js" move /Y "game_backup.js" "backups\"

REM Mover arquivos Python para pasta python
if exist "main.py" move /Y "main.py" "python\"
if exist "requirements.txt" move /Y "requirements.txt" "python\"

REM Mover arquivos de backup para pasta backups
if exist "index_backup.html" move /Y "index_backup.html" "backups\"

REM Mover scripts .bat para pasta scripts
if exist "run.bat" move /Y "run.bat" "scripts\"
if exist "jogar_web.bat" move /Y "jogar_web.bat" "scripts\"
if exist "configurar_git.bat" move /Y "configurar_git.bat" "scripts\"
if exist "configurar_permissoes.bat" move /Y "configurar_permissoes.bat" "scripts\"
if exist "enviar github.bat" move /Y "enviar github.bat" "scripts\"
if exist "enviar_github_novo.bat" move /Y "enviar_github_novo.bat" "scripts\"

REM Mover documentação para pasta docs
if exist "README_web.md" move /Y "README_web.md" "docs\"
if exist "README_github.md" move /Y "README_github.md" "docs\"
if exist "preview.txt" move /Y "preview.txt" "docs\"

REM Criar arquivos de redirecionamento para manter compatibilidade
echo @echo off > run.bat
echo echo Executando o jogo RPG (versao Python)... >> run.bat
echo cd python >> run.bat
echo python main.py >> run.bat
echo pause >> run.bat

echo @echo off > jogar_web.bat
echo echo Abrindo o jogo RPG no navegador... >> jogar_web.bat
echo start "" "index.html" >> jogar_web.bat
echo pause >> jogar_web.bat

echo @echo off > enviar_github.bat
echo echo Enviando para GitHub... >> enviar_github.bat
echo cd scripts >> enviar_github.bat
echo call "enviar github.bat" >> enviar_github.bat

echo.
echo Atualização do arquivo index.html para apontar para o novo local do JavaScript...

REM Atualizar referências no index.html
if exist "index.html" (
    powershell -Command "(Get-Content index.html) -replace 'src=\"game.js\"', 'src=\"js/game.js\"' | Set-Content index.html"
)

echo.
echo =====================================================
echo  Organizacao concluida com sucesso!
echo =====================================================
echo.
echo A nova estrutura do projeto e:
echo.
echo /
echo ├── index.html            - Página principal (versão web)
echo ├── js/                   - Scripts JavaScript
echo │   └── game.js           - Lógica principal do jogo
echo ├── css/                  - Estilos CSS
echo ├── audio/                - Arquivos de áudio
echo ├── python/               - Versão Python do jogo
echo │   ├── main.py           - Script principal Python
echo │   └── requirements.txt  - Dependências Python
echo ├── scripts/              - Scripts utilitários
echo │   ├── jogar_web.bat     - Inicia versão web
echo │   ├── run.bat           - Inicia versão Python
echo │   └── configurar_git.bat - Configura o Git
echo │   └── enviar github.bat - Envia para GitHub
echo ├── backups/              - Backups de versões anteriores
echo ├── docs/                 - Documentação
echo └── README.md             - Documentação principal
echo.
echo Os scripts de atalho continuam funcionando na raiz do projeto.
echo.
pause
