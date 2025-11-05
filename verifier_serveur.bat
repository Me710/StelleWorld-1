@echo off
echo ========================================
echo    Verification du Serveur StelleWorld
echo ========================================
echo.

echo [1/4] Verification Python...
python --version
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)
echo [OK] Python trouve
echo.

echo [2/4] Verification environnement virtuel...
if exist "env\Scripts\python.exe" (
    echo [OK] Environnement virtuel trouve
) else (
    echo [ERREUR] Environnement virtuel introuvable dans env\
    echo Executez d'abord: python -m venv env
    pause
    exit /b 1
)
echo.

echo [3/4] Verification des dependances...
env\Scripts\python.exe -c "import fastapi; import uvicorn" 2>nul
if errorlevel 1 (
    echo [ERREUR] Dependances manquantes
    echo Executez: env\Scripts\activate && cd backend && pip install -r requirements.txt
    pause
    exit /b 1
)
echo [OK] Dependances installees
echo.

echo [4/4] Verification du port 8000...
netstat -ano | findstr :8000 >nul
if errorlevel 1 (
    echo [OK] Port 8000 libre
    echo.
    echo ========================================
    echo    Tout est OK ! Vous pouvez demarrer le serveur
    echo ========================================
    echo.
    echo Executez start_server.bat pour lancer le serveur
) else (
    echo [ATTENTION] Port 8000 deja utilise
    echo.
    echo Processus utilisant le port 8000:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" | findstr "python"
    )
    echo.
    echo Si c'est un serveur bloque, arretez-le avec:
    echo taskkill /F /PID [numero_du_PID]
)
echo.

pause

