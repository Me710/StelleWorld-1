# StelleWorld Setup Guide (Without Docker)

This guide will help you set up and run StelleWorld locally without using Docker containers. This approach is useful for development, debugging, or when you prefer to manage services directly on your system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Redis Setup](#redis-setup)
7. [Running the Application](#running-the-application)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting](#troubleshooting)
10. [Alternative Setup Options](#alternative-setup-options)

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Python 3.9+** (recommended: Python 3.11)
- **PostgreSQL 13+**
- **Redis 6+**
- **Node.js 16+** (for frontend assets if needed)
- **Git**

### Installing Prerequisites

#### Windows
```bash
# Python
# Download from https://www.python.org/downloads/
# Make sure to check "Add Python to PATH"

# PostgreSQL
# Download from https://www.postgresql.org/download/windows/

# Redis
# Download from https://github.com/microsoftarchive/redis/releases
# Or use WSL2 with Ubuntu

# Git
# Download from https://git-scm.com/download/win
```

#### macOS
```bash
# Using Homebrew
brew install python@3.11 postgresql@13 redis git

# Or using MacPorts
sudo port install python311 postgresql13 redis git
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip
sudo apt install postgresql postgresql-contrib redis-server git
sudo apt install build-essential libpq-dev
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# CentOS/RHEL 8+
sudo dnf install python3.11 python3.11-devel python3.11-pip
sudo dnf install postgresql postgresql-server redis git
sudo dnf groupinstall "Development Tools"

# Fedora
sudo dnf install python3.11 python3.11-devel python3.11-pip
sudo dnf install postgresql postgresql-server redis git
sudo dnf groupinstall "Development Tools"
```

## System Requirements

- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 2GB free space
- **CPU**: Any modern multi-core processor
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd StelleWorld-1
```

### 2. Create Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Verify activation
which python  # Should point to venv directory
```

### 3. Install Python Dependencies

```bash
# Make sure you're in the backend directory with venv activated
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Install Additional Development Tools

```bash
# Install pre-commit hooks (optional but recommended)
pip install pre-commit
pre-commit install

# Install additional development dependencies
pip install ipython ipdb
```

## Configuration

### 1. Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp .env_example .env

# Or create manually
touch .env
```

Edit the `.env` file with your configuration:

```env
# Application
APP_NAME=StelleWorld
DEBUG=true
ALLOWED_HOSTS=["*"]

# Database
DATABASE_URL=postgresql://stelleworld:password@localhost:5432/stelleworld

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe (optional for development)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis
REDIS_URL=redis://localhost:6379/0

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=true

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Frontend
FRONTEND_URL=http://localhost:8080
```

### 2. Database Configuration

The default configuration expects a PostgreSQL database with:
- **Host**: localhost
- **Port**: 5432
- **Database**: stelleworld
- **Username**: stelleworld
- **Password**: password

You can modify these values in the `.env` file.

## Database Setup

### 1. PostgreSQL Installation

#### Windows
1. Download and install PostgreSQL from the official website
2. During installation, note down the password for the `postgres` user
3. Add PostgreSQL to your PATH environment variable

#### macOS
```bash
# Using Homebrew
brew services start postgresql@13

# Or manually
pg_ctl -D /usr/local/var/postgresql@13 start
```

#### Linux
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# CentOS/RHEL/Fedora
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create user and database
CREATE USER stelleworld WITH PASSWORD 'password';
CREATE DATABASE stelleworld OWNER stelleworld;
GRANT ALL PRIVILEGES ON DATABASE stelleworld TO stelleworld;
GRANT ALL ON SCHEMA public TO stelleworld;

# Exit PostgreSQL
\q
```

### 3. Initialize Database Schema

```bash
# Make sure you're in the backend directory with venv activated
cd backend

# Initialize Alembic
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Redis Setup

### 1. Install and Start Redis

#### Windows
```bash
# Download Redis for Windows
# Start Redis server
redis-server

# Or install via WSL2
wsl
sudo apt install redis-server
sudo systemctl start redis-server
```

#### macOS
```bash
# Using Homebrew
brew services start redis

# Or manually
redis-server /usr/local/etc/redis.conf
```

#### Linux
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# CentOS/RHEL/Fedora
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Verify Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Test Redis with Python
python -c "import redis; r = redis.Redis(); print(r.ping())"
# Should return: True
```

## Running the Application

### 1. Start the Backend API

```bash
# Make sure you're in the backend directory with venv activated
cd backend

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 2. Start the Celery Worker

Open a new terminal window:

```bash
# Navigate to the project directory
cd StelleWorld-1

# Activate virtual environment
cd backend
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start Celery worker
celery -A worker.celery_app worker --loglevel=info
```

### 3. Start the Celery Beat Scheduler (Optional)

For scheduled tasks, open another terminal:

```bash
# Activate virtual environment
cd backend
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start Celery beat
celery -A worker.celery_app beat --loglevel=info
```

### 4. Start the Frontend

The frontend is served by FastAPI using Jinja2 templates. You can access it directly at:
- **Frontend**: http://localhost:8000

## Development Workflow

### 1. Code Quality Tools

```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html
```

### 2. Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

### 3. Development Commands

Create a `Makefile` for local development (optional):

```makefile
# Makefile for local development
.PHONY: dev test lint format migrate clean

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

worker:
	celery -A worker.celery_app worker --loglevel=info

beat:
	celery -A worker.celery_app beat --loglevel=info

test:
	pytest

lint:
	flake8 app/
	black --check app/
	isort --check-only app/

format:
	black app/
	isort app/

migrate:
	alembic upgrade head

migrate-create:
	@read -p "Migration name: " name; \
	alembic revision --autogenerate -m "$$name"

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .pytest_cache/
	rm -rf htmlcov/
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Error**: `psycopg2.OperationalError: connection to server at "localhost" failed`

**Solutions**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Start PostgreSQL if stopped
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS

# Verify connection
psql -U stelleworld -d stelleworld -h localhost
```

#### 2. Redis Connection Issues

**Error**: `redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379`

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if stopped
sudo systemctl start redis-server  # Linux
brew services start redis  # macOS
redis-server  # Windows
```

#### 3. Port Already in Use

**Error**: `OSError: [Errno 98] Address already in use`

**Solutions**:
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

#### 4. Virtual Environment Issues

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solutions**:
```bash
# Ensure you're in the correct directory
pwd  # Should show .../StelleWorld-1/backend

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Verify Python path
which python  # Should point to venv directory

# Reinstall dependencies
pip install -r requirements.txt
```

#### 5. Permission Issues

**Error**: `Permission denied` when creating directories or files

**Solutions**:
```bash
# Check file permissions
ls -la

# Fix permissions
chmod 755 uploads/
chmod 644 .env

# Or run with appropriate user permissions
sudo chown -R $USER:$USER .
```

### Performance Optimization

#### 1. Database Optimization

```bash
# Enable connection pooling in config.py
DATABASE_URL = "postgresql://user:pass@localhost:5432/db?pool_size=20&max_overflow=30"

# Use database indexes for frequently queried fields
# Add to your models:
__table_args__ = (
    Index('idx_user_email', 'email'),
    Index('idx_product_category', 'category'),
)
```

#### 2. Redis Optimization

```bash
# Configure Redis for better performance
# Edit redis.conf:
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### 3. Python Optimization

```bash
# Use uvicorn with multiple workers for production
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000

# Enable Python optimizations
export PYTHONOPTIMIZE=1
```

## Alternative Setup Options

### 1. Using Conda/Miniconda

```bash
# Install Miniconda
# Download from https://docs.conda.io/en/latest/miniconda.html

# Create conda environment
conda create -n stelleworld python=3.11
conda activate stelleworld

# Install dependencies
conda install -c conda-forge postgresql redis
pip install -r requirements.txt
```

### 2. Using pyenv

```bash
# Install pyenv
# macOS: brew install pyenv
# Linux: curl https://pyenv.run | bash

# Install Python 3.11
pyenv install 3.11.0
pyenv local 3.11.0

# Create virtual environment
python -m venv venv
source venv/bin/activate
```

### 3. Using Docker for Dependencies Only

If you want to run only the database and Redis in Docker but the application locally:

```bash
# Start only PostgreSQL and Redis
docker-compose up -d db redis

# Update .env to use Docker ports
DATABASE_URL=postgresql://stelleworld:password@localhost:5432/stelleworld
REDIS_URL=redis://localhost:6379/0

# Run application locally
uvicorn app.main:app --reload
```

## Next Steps

After successful setup:

1. **Explore the API**: Visit http://localhost:8000/docs
2. **Create your first user**: Use the registration endpoint
3. **Add products**: Use the products API endpoints
4. **Test the chat system**: WebSocket endpoints are available
5. **Configure Stripe**: Add your Stripe keys for payment testing
6. **Set up Telegram**: Configure bot for notifications

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all services are running
3. Check the application logs
4. Ensure all environment variables are set correctly
5. Verify database and Redis connections

## Production Considerations

When moving to production:

1. **Security**: Change all default passwords and keys
2. **Database**: Use a managed PostgreSQL service
3. **Redis**: Use a managed Redis service
4. **Environment**: Set `DEBUG=false`
5. **SSL/TLS**: Configure HTTPS
6. **Monitoring**: Add logging and monitoring
7. **Backup**: Set up automated database backups

---

**Happy coding with StelleWorld! 🚀**
