@echo off
TITLE ERP Social - CIVIS Social Governance System
echo ==========================================
echo   Iniciando Sistema CIVIS Social (Supabase)
echo ==========================================

:: Caminho raiz do projeto
set PROJECT_ROOT=%~dp0

:: 1. Iniciar o Backend
echo [1/2] Iniciando o Backend na porta 3000...
cd /d "%PROJECT_ROOT%backend"
start "Backend - ERP Social" /min cmd /c "npm start"

:: Pequena pausa para o backend subir
timeout /t 3 /nobreak > nul

:: 2. Iniciar o Frontend
echo [2/2] Iniciando o Frontend React...
cd /d "%PROJECT_ROOT%frontend"
start "Frontend - ERP Social" cmd /c "npm start"

echo.
echo ==========================================
echo   Sistema iniciado com sucesso!
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:3000 (ou porta 3001)
echo ==========================================
pause
