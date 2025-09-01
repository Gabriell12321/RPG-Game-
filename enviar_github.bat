@echo off
echo Iniciando o uploader do GitHub...
powershell -ExecutionPolicy Bypass -File "%~dp0enviar_github.ps1"
exit
