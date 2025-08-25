#!/bin/bash

echo "========================================"
echo "   StelleWorld Setup Script (Unix)"
echo "========================================"
echo

echo "Checking prerequisites..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.9+ using your package manager:"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-venv python3-pip"
    echo "  CentOS/RHEL: sudo dnf install python3 python3-venv python3-pip"
    echo "  macOS: brew install python@3.11"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "Python version: $PYTHON_VERSION"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "ERROR: pip3 is not available"
    echo "Please install pip3 using your package manager"
    exit 1
fi

echo "pip3 version:"
pip3 --version
echo

# Check if virtual environment exists
if [ -d "backend/venv" ]; then
    echo "Virtual environment already exists. Removing old one..."
    rm -rf backend/venv
fi

echo "Creating Python virtual environment..."
cd backend
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create virtual environment"
    exit 1
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
python -m pip install --upgrade pip

echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "========================================"
echo "    Setup Complete!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Install PostgreSQL:"
echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
echo "   CentOS/RHEL: sudo dnf install postgresql postgresql-server"
echo "   macOS: brew install postgresql@13"
echo
echo "2. Install Redis:"
echo "   Ubuntu/Debian: sudo apt install redis-server"
echo "   CentOS/RHEL: sudo dnf install redis"
echo "   macOS: brew install redis"
echo
echo "3. Create a .env file in the backend directory"
echo "4. Set up your database"
echo "5. Run: source venv/bin/activate"
echo "6. Run: uvicorn app.main:app --reload"
echo
echo "For detailed instructions, see SETUP_NO_DOCKER.md"
echo

# Make the script executable
chmod +x setup_unix.sh
