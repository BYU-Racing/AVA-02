# Local Development Setup Guide

This guide walks you through setting up and running AVA-02 on your local machine for development and testing before deploying to AWS.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - Check with `python3 --version`
- **uv** - Python dependency manager; check with `uv --version`
- **Node.js 16+** and npm - Check with `node --version` and `npm --version`
- **PostgreSQL 14+** - Database server
- **Git** - For version control

## Quick Start

```bash
# 1. Set up PostgreSQL database
# 2. Install backend dependencies
cd Backend && uv sync --locked && cd ..

# 3. Build frontend
cd Frontend/ava-03 && npm install && npm run build && cd ../..

# 4. Run backend from project root
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
uv run --project Backend uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000

## Detailed Setup Instructions

### Step 1: Install PostgreSQL

#### macOS (using Homebrew)

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows

Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Step 2: Create Database and User

```bash
# Connect to PostgreSQL
psql postgres

# If you get permission error on macOS/Linux:
sudo -u postgres psql
```

In the PostgreSQL prompt, run:

```sql
-- Create user
CREATE USER evangelion WITH PASSWORD 'password';

-- Create database (or use existing 'postgres' database)
CREATE DATABASE postgres;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE postgres TO evangelion;

-- Exit
\q
```

**Important**: [Backend/configDB.py](Backend/configDB.py) requires these environment variables before the backend starts:

```bash
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
```

### Step 3: Import Database (Optional)

If you have an existing database dump:

```bash
psql -U evangelion -d postgres -f Backend/2025_dump.sql
```

Enter password when prompted: `password`

### Step 4: Install Backend Dependencies

From the project root directory:

```bash
cd AVA-02-1

# Install Python dependencies
cd Backend
uv sync --locked
cd ..
```

**Common packages installed:**

- FastAPI - Web framework
- Uvicorn - ASGI server
- SQLAlchemy - Database ORM
- psycopg2-binary - PostgreSQL adapter
- And more (see [Backend/pyproject.toml](Backend/pyproject.toml))

### Step 5: Build Frontend

```bash
cd Frontend/ava-03

# Install Node dependencies
npm install

# Build production-ready static files
npm run build

# Return to project root
cd ../..
```

This creates `Frontend/ava-03/dist/` with optimized Vite files.

**Verify the build:**

```bash
ls Frontend/ava-03/dist
```

You should see: `index.html`, `assets/`, and other files.

### Step 6: Run the Backend Server

**IMPORTANT**: Run from the **project root**, not from within the Backend folder.

```bash
cd /Users/rental/AVA-02-1

# Run with auto-reload (development mode)
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
uv run --project Backend uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Why from project root?**
The backend uses relative imports (`.endpoints`, `.crud`, etc.) which require the parent package structure to be visible.

You should see output like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 7: Access Your Application

Open your browser and navigate to:

- **Frontend**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health
- **API Docs** (auto-generated): http://localhost:8000/docs

## Development Workflow

### Running Frontend in Development Mode

For faster frontend development with hot-reload:

```bash
cd Frontend/ava-03
npm run dev
```

This runs the Vite dev server.

**Note**: You'll need to configure proxy settings in `package.json` to connect to the backend:

```json
{
  "proxy": "http://localhost:8000"
}
```

### Making Changes

**Backend Changes:**

- The `--reload` flag automatically restarts the server when you save Python files
- No rebuild needed

**Frontend Changes:**

If running production build (served by FastAPI):

```bash
cd Frontend/ava-03
npm run build
cd ../..
# Backend will serve updated build automatically
```

If running dev server (`npm run dev`):

- Changes reload automatically

## Project Structure

```
/Users/rental/AVA-02-1/
├── Backend/
│   ├── __init__.py              # Makes Backend a package
│   ├── main.py                  # FastAPI app entry point
│   ├── configDB.py              # Database configuration
│   ├── database.py              # Database connection
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas
│   ├── crud.py                  # Database operations
│   ├── pyproject.toml            # Python dependency declarations
│   ├── uv.lock                   # Locked Python dependencies
│   └── endpoints/               # API route handlers
│       ├── __init__.py
│       ├── drive.py
│       ├── driver.py
│       └── data.py
└── Frontend/ava-03/
    ├── src/                     # React source code
    ├── public/                  # Static assets
    ├── dist/                    # Production build (created by npm run build)
    └── package.json             # Node dependencies
```

## Environment Variables

### Local Development

The app requires these variables locally:

```bash
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
```

### Configuration

From [Backend/configDB.py](Backend/configDB.py):

1. **`DATABASE_URL`** must be set.
2. **`DELETE_PASSWORD`** must be set.

## Common Issues and Solutions

### Issue 1: ImportError - "attempted relative import with no known parent package"

**Error:**

```
ImportError: attempted relative import with no known parent package
```

**Solution:**
You're trying to run from the wrong directory. Always run from project root:

```bash
# Wrong ❌
cd Backend
uvicorn main:app --reload

# Correct ✅
cd /Users/rental/AVA-02-1
uv run --project Backend uvicorn Backend.main:app --reload
```

### Issue 2: Database Connection Failed

**Error:**

```
psycopg2.OperationalError: could not connect to server
```

**Solutions:**

1. **PostgreSQL not running:**

   ```bash
   # macOS
   brew services start postgresql@14

   # Linux
   sudo systemctl start postgresql
   ```

2. **Wrong credentials:**
   Check [Backend/configDB.py](Backend/configDB.py) and ensure your database user/password match.

3. **Database doesn't exist:**
   ```bash
   psql -U evangelion postgres
   # Or create new database
   createdb -U evangelion your_database_name
   ```

### Issue 3: Frontend Not Loading (404 Error)

**Error:**
Browser shows 404 when accessing http://localhost:8000

**Solution:**
The frontend build folder doesn't exist. Build it:

```bash
cd Frontend/ava-03
npm install
npm run build
cd ../..
```

Verify:

```bash
ls Frontend/ava-03/dist
```

### Issue 4: Static Files Not Found

**Error:**

```
RuntimeError: Directory 'Frontend/ava-03/dist' does not exist
```

**Solution:**
The backend can't find the build folder. In Docker, the app serves built frontend files from `/app/FrontendDist`:

```python
build_dir = Path("/app/FrontendDist")
```

Make sure the frontend image stage built successfully and copied the `dist` output into the backend image.

### Issue 5: Port Already in Use

**Error:**

```
OSError: [Errno 48] Address already in use
```

**Solution:**

1. **Find process using port 8000:**

   ```bash
   lsof -i :8000
   ```

2. **Kill the process:**

   ```bash
   kill -9 <PID>
   ```

3. **Or use a different port:**
   ```bash
   uv run --project Backend uvicorn Backend.main:app --reload --port 8001
   ```

### Issue 6: Module Not Found Errors

**Error:**

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
Install dependencies:

```bash
cd Backend
uv sync --locked
cd ..
```

uv creates and manages the backend virtual environment from the lockfile:

```bash
cd Backend
uv run python -c "import fastapi"
cd ..
```

## Testing Your Setup

### 1. Test Database Connection

```bash
psql -U evangelion -d postgres -c "SELECT version();"
```

Should show PostgreSQL version.

### 2. Test Backend API

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "message": "Special thanks from: Coleman Hardy, Landon Wheeler, Connor Mabey, Bryce Whitworth, Braden Toone, Bradford Bawden, and the rest of the BYU Racing Electronics Team"
}
```

### 3. Test Frontend

Visit http://localhost:8000 in your browser. You should see the React application.

### 4. Test API Documentation

Visit http://localhost:8000/docs to see interactive API documentation (automatically generated by FastAPI).

## Using uv Environment (Recommended)

uv creates and manages the backend virtual environment from the lockfile:

```bash
# Install dependencies
cd Backend
uv sync --locked

# Run the app
cd ..
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
uv run --project Backend uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Next Steps

Once your local environment is working:

1. Make your code changes
2. Test locally
3. Build frontend: `cd Frontend/ava-03 && npm run build && cd ../..`
4. Deploy to AWS using one of the deployment guides:
   - [AWS_CONSOLE_DEPLOY.md](AWS_CONSOLE_DEPLOY.md) - For AWS Console (Learner Lab)
   - [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) - For EB CLI
   - [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) - Quick reference

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

## Quick Command Reference

```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Build frontend
cd Frontend/ava-03 && npm run build && cd ../..

# Run backend (from project root)
export DATABASE_URL="postgresql://evangelion:password@localhost/postgres"
export DELETE_PASSWORD="ava2"
uv run --project Backend uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000

# Run frontend dev server
cd Frontend/ava-03 && npm run dev

# Connect to database
psql -U evangelion -d postgres

# Check what's running on port 8000
lsof -i :8000
```

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] PostgreSQL is running: `pg_isready`
- [ ] Database exists and is accessible: `psql -U evangelion -d postgres -c "\l"`
- [ ] Backend dependencies installed: `cd Backend && uv run python -c "import fastapi"`
- [ ] Frontend is built: `ls Frontend/ava-03/dist`
- [ ] Running from project root: `pwd` should show `/Users/rental/AVA-02-1`
- [ ] Port 8000 is free: `lsof -i :8000`

Good luck with your local development!
