@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm ci
if errorlevel 1 goto :falha
call npm run check
if errorlevel 1 goto :falha
call npm test
if errorlevel 1 goto :falha
call npm run build
if errorlevel 1 goto :falha
call npm run test:build
if errorlevel 1 goto :falha
echo.
echo TODOS OS COMANDOS CONCLUIDOS COM SUCESSO.
pause
exit /b 0
:falha
echo.
echo FALHA. Leia o erro mostrado acima.
pause
exit /b 1
