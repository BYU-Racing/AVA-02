# Quick Deploy Guide - Elastic Beanstalk

## What Gets Uploaded?

When you run `eb create` or `eb deploy` from `/Users/rental/AVA-02-1/`:

### ✅ Included Files
- `Dockerfile` (root level - builds the container)
- `Backend/` (FastAPI Python code)
- `Backend/requirements.txt` (Python dependencies)
- `Frontend/ava-02/build/` (React static files - **must build first!**)
- `.ebextensions/` (EB configuration)
- `Dockerrun.aws.json` (Docker configuration)

### ❌ Excluded Files (via .dockerignore)
- `Frontend/ava-02/node_modules/` (not needed)
- `Frontend/ava-02/src/` (only need build output)
- `Backend/*.sql` (database dumps)
- `.git/`, `__pycache__/`, etc.

## Quick Deploy Commands

### First Time Setup

```bash
# 1. Build frontend
cd Frontend/ava-02
npm install
npm run build
cd ../..

# 2. Initialize EB (only once)
eb init

# 3. Create environment with database (only once)
eb create ava-production --database

# When prompted:
# - Engine: postgres
# - Username: evangelion
# - Password: (create and remember!)
```

### Deploying Updates

```bash
# Always rebuild frontend first if frontend changed
cd Frontend/ava-02 && npm run build && cd ../..

# Deploy
eb deploy
```

### Check Your App

```bash
# View status
eb status

# Open in browser
eb open

# View logs
eb logs

# Check environment variables
eb printenv
```

## File Structure

```
/Users/rental/AVA-02-1/
├── Dockerfile                    ← EB uses this to build container
├── Dockerrun.aws.json           ← Docker config for EB
├── .dockerignore                ← Excludes unnecessary files
├── .ebextensions/               ← EB environment config
│   └── 01_app.config
├── Backend/
│   ├── requirements.txt         ← Python dependencies
│   ├── configDB.py             ← Auto-detects RDS env vars
│   ├── main.py                 ← FastAPI app (serves frontend too)
│   └── ... (other Python files)
└── Frontend/ava-02/
    └── build/                   ← Must exist before deploy!
        └── ... (static files)
```

## How It Works

1. **You run**: `eb deploy`
2. **EB zips**: Root directory files (excluding .dockerignore items)
3. **EB uploads**: Zip to S3, then to EC2 instance
4. **Docker builds**: Using root `Dockerfile`
5. **Container runs**: `uvicorn Backend.main:app` on port 8000
6. **FastAPI serves**:
   - API routes at `/api/*`
   - React app at `/` (from `build/` folder)
7. **Connects to**: RDS database using auto-injected env vars

## Environment Variables (Auto-set by EB)

When you create EB with `--database`, these are automatically set:

- `RDS_HOSTNAME` - Database endpoint
- `RDS_PORT` - Usually 5432
- `RDS_DB_NAME` - Usually "ebdb"
- `RDS_USERNAME` - What you chose (e.g., "evangelion")
- `RDS_PASSWORD` - What you chose

Your `configDB.py` automatically reads these and builds the connection string!

## Common Issues

### "No module named 'Backend'"
- Make sure Dockerfile CMD is: `uvicorn Backend.main:app`
- Check that Backend folder is copied in Dockerfile

### Frontend not loading
- Did you run `npm run build` before deploying?
- Check `Frontend/ava-02/build/` exists
- Verify `main.py` has the StaticFiles mount

### Database connection failed
- Run `eb printenv | grep RDS` to verify env vars exist
- Check security groups allow EB → RDS traffic (auto-configured with --database flag)

### Upload too large
- Check `.dockerignore` excludes `node_modules/`
- Don't commit large SQL dumps to git

## For More Details

See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for complete step-by-step guide.
