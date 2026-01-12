@echo off
echo Iniciando Sem panela FC - Frontend e Backend
echo.

echo Iniciando Backend na porta 3001...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Iniciando Frontend na porta 5173...
start "Frontend" cmd /k "npm run dev"

echo.
echo Ambos os serviços foram iniciados!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause