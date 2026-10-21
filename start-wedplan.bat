@echo off
setlocal
cd /d "%~dp0"
title WedPlan AI Launcher

echo =======================================================
echo              LAUNCHING WEDPLAN AI...
echo =======================================================

:: 1. Create Python virtual environment if missing
if not exist ".venv\Scripts\python.exe" (
    echo [WedPlan AI] Creating Python virtual environment...
    python -m venv .venv
)

:: 2. Install backend dependencies if missing
if not exist ".venv\Scripts\uvicorn.exe" (
    echo [WedPlan AI] Installing backend requirements...
    ".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
)

:: 3. Install root Node dependencies if missing
if not exist "node_modules" (
    echo [WedPlan AI] Installing root npm packages...
    call npm.cmd install
)

:: 4. Install frontend Node dependencies if missing
if not exist "frontend\node_modules" (
    echo [WedPlan AI] Installing frontend npm packages...
    call npm.cmd --prefix frontend install
)

:: 5. Create .env from template if missing
if not exist ".env" (
    if exist ".env.example" (
        echo [WedPlan AI] Creating .env from .env.example...
        copy .env.example .env >nul
    )
)

:: 6. Launch browser once servers are starting
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: 7. Start backend and frontend concurrently
echo [WedPlan AI] Starting local development servers...
echo [WedPlan AI] Backend:  http://127.0.0.1:8000
echo [WedPlan AI] Frontend: http://localhost:5173
echo Press Ctrl+C in this window to stop both servers.
echo =======================================================
node scripts\dev.js
