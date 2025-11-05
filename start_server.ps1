# Script PowerShell pour démarrer StelleWorld
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Démarrage de StelleWorld" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Changer le répertoire vers le projet
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Activer l'environnement virtuel
Write-Host "Activation de l'environnement virtuel..." -ForegroundColor Yellow
& ".\env\Scripts\Activate.ps1"

# Aller dans le dossier backend
Set-Location backend

# Lancer le serveur
Write-Host ""
Write-Host "Lancement du serveur sur http://localhost:8000" -ForegroundColor Green
Write-Host "Pour arrêter le serveur, appuyez sur CTRL+C" -ForegroundColor Yellow
Write-Host ""

# Démarrer uvicorn
python run.py

