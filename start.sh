#!/bin/bash

# Script de démarrage rapide StelleWorld v2.0

echo "🌟 Démarrage StelleWorld..."

# Vérifier si on est dans le bon répertoire
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erreur: Exécutez ce script depuis le dossier racine du projet"
    exit 1
fi

# Backend
echo ""
echo "🔧 Démarrage Backend (FastAPI)..."
cd backend
source venv/bin/activate 2>/dev/null || python -m venv venv && source venv/bin/activate
pip install -q -r requirements.txt
python test_db_connection.py
python load_all_fixtures.py
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "✅ Backend démarré (PID: $BACKEND_PID)"
echo "📡 API: http://localhost:8001"
echo "📚 Docs: http://localhost:8001/api/docs"

cd ..

# Frontend
echo ""
echo "🎨 Démarrage Frontend (Next.js)..."
cd frontend
yarn install --silent
yarn dev &
FRONTEND_PID=$!
echo "✅ Frontend démarré (PID: $FRONTEND_PID)"
echo "🌐 Site: http://localhost:3000"
echo "👤 Admin: http://localhost:3000/admin"

cd ..

echo ""
echo "🎉 StelleWorld est prêt !"
echo ""
echo "📝 Credentials Admin:"
echo "   Email: admin@stelleworld.com"
echo "   Password: admin123"
echo ""
echo "📱 WhatsApp: +15813081802"
echo ""
echo "Pour arrêter les services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
