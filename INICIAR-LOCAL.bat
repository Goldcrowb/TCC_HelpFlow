@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo =========================================
echo HelpFlow TCC - ambiente local
 echo =========================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: instale Node.js 22 primeiro. Consulte docs\05_manual_instalacao_uso_publicacao.md
  pause
  exit /b 1
)
echo Instalando dependencias conforme package-lock...
call npm ci
if errorlevel 1 (
  echo ERRO na instalacao. Confira internet e Node.js 22.
  pause
  exit /b 1
)
echo Iniciando API e interface. Abra http://localhost:5173
call npm run dev
pause
