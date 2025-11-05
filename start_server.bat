@echo off
echo ========================================
echo    Demarrage de StelleWorld
echo ========================================
echo.

REM Activer l'environnement virtuel
call env\Scripts\activate.bat

REM Aller dans le dossier backend
cd backend

REM Lancer le serveur
echo Lancement du serveur sur http://localhost:8000
echo Pour arreter le serveur, appuyez sur CTRL+C
echo.
python run.py

pause

