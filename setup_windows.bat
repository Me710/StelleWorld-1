@echo off
echo ========================================
echo    StelleWorld Setup Script (Windows)
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not available
    echo Please ensure pip is installed with Python
    pause
    exit /b 1
)

echo Python version:
python --version
echo.

REM Check if virtual environment exists
if exist "backend\venv" (
    echo Virtual environment already exists. Removing old one...
    rmdir /s /q "backend\venv"
)

echo Creating Python virtual environment...
cd backend
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Install PostgreSQL from https://www.postgresql.org/download/windows/
echo 2. Install Redis from https://github.com/microsoftarchive/redis/releases
echo 3. Create a .env file in the backend directory
echo 4. Set up your database
echo 5. Run: venv\Scripts\activate
echo 6. Run: uvicorn app.main:app --reload
echo.
echo For detailed instructions, see SETUP_NO_DOCKER.md
echo.
pause
