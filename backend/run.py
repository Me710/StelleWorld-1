#!/usr/bin/env python3
"""
Script de lancement direct de l'application StelleWorld
Usage: python run.py
"""

import uvicorn
import sys
import os

# Ajouter le répertoire courant au PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
