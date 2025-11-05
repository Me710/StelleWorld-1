# 🚀 Guide de Démarrage Rapide - StelleWorld

## Problème Résolu ✅

Le serveur était bloqué avec des connexions en état CLOSE_WAIT. Ce problème a été résolu en arrêtant le processus Python bloqué.

## Comment Démarrer le Serveur

### Option 1 : Script Automatique (Recommandé)

Double-cliquez sur le fichier `start_server.bat` à la racine du projet.

### Option 2 : Ligne de Commande

1. **Ouvrez un nouveau terminal (CMD ou PowerShell)**
   - Appuyez sur `Win + R`
   - Tapez `cmd` et appuyez sur Entrée

2. **Naviguez vers le dossier du projet**
   ```cmd
   cd "C:\Users\Admin\OneDrive - Université Laval\Bureau\StelleWorld-1"
   ```

3. **Activez l'environnement virtuel**
   ```cmd
   env\Scripts\activate
   ```

4. **Allez dans le dossier backend**
   ```cmd
   cd backend
   ```

5. **Lancez le serveur**
   ```cmd
   python run.py
   ```

6. **Accédez à l'application**
   - Frontend : http://localhost:8000
   - API Documentation : http://localhost:8000/api/docs
   - Admin : http://localhost:8000/admin

## Vérification du Démarrage

Une fois le serveur lancé, vous devriez voir dans le terminal :
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## En Cas de Problème

### Port 8000 déjà utilisé

Si vous voyez une erreur indiquant que le port 8000 est déjà utilisé :

1. **Trouvez le processus qui utilise le port**
   ```cmd
   netstat -ano | findstr :8000
   ```

2. **Arrêtez le processus (remplacez XXXXX par le PID)**
   ```cmd
   taskkill /F /PID XXXXX
   ```

3. **Relancez le serveur**
   ```cmd
   python run.py
   ```

### Erreur de module manquant

Si vous voyez une erreur comme `ModuleNotFoundError` :

1. **Assurez-vous que l'environnement virtuel est activé**
   ```cmd
   env\Scripts\activate
   ```

2. **Réinstallez les dépendances**
   ```cmd
   cd backend
   pip install -r requirements.txt
   ```

### Le serveur charge indéfiniment dans le navigateur

Cela peut arriver si :
- Le serveur n'est pas complètement démarré
- Il y a une erreur dans les logs du serveur

**Solution** :
1. Arrêtez le serveur (`CTRL+C` dans le terminal)
2. Vérifiez les erreurs dans les logs
3. Relancez le serveur

## Arrêter le Serveur

Pour arrêter proprement le serveur :
1. Cliquez dans le terminal où le serveur tourne
2. Appuyez sur `CTRL+C`
3. Attendez quelques secondes que le serveur s'arrête complètement

## Démarrage Automatique au Boot (Optionnel)

Si vous voulez que le serveur démarre automatiquement :

1. **Créez une tâche planifiée Windows**
   - Ouvrez le Planificateur de tâches
   - Créez une nouvelle tâche
   - Déclencheur : Au démarrage
   - Action : Démarrer le programme `C:\Users\Admin\OneDrive - Université Laval\Bureau\StelleWorld-1\start_server.bat`

## Conseils de Développement

### Mode Debug

Pour activer plus de logs de débogage, modifiez `backend/run.py` :
```python
uvicorn.run(
    "app.main:app",
    host="0.0.0.0",
    port=8000,
    reload=True,
    log_level="debug"  # Changez "info" en "debug"
)
```

### Changement de Port

Si vous voulez utiliser un port différent, modifiez dans `backend/run.py` :
```python
uvicorn.run(
    "app.main:app",
    host="0.0.0.0",
    port=8080,  # Changez 8000 en 8080 ou autre
    reload=True,
    log_level="info"
)
```

## Support

Si vous rencontrez toujours des problèmes après avoir suivi ce guide :
1. Vérifiez les logs du serveur dans le terminal
2. Consultez le fichier `SETUP_NO_DOCKER.md` pour plus de détails
3. Vérifiez que Python 3.9+ est bien installé : `python --version`

---

**Bon développement avec StelleWorld ! 🌟**

