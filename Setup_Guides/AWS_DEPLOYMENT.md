# AWS Elastic Beanstalk Deployment Guide

This guide explains how to deploy your FastAPI backend with PostgreSQL and React frontend to AWS Elastic Beanstalk.

## Architecture Overview

- **Backend**: FastAPI application running in Docker container on Elastic Beanstalk
- **Database**: Amazon RDS PostgreSQL (managed database service)
- **Frontend**: React app built and served as static files

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. EB CLI (Elastic Beanstalk CLI) installed
4. Docker installed locally for testing

### Install EB CLI
```bash
pip install awsebcli
```

## Step 1: Build Frontend Static Files

**IMPORTANT: Do this BEFORE deploying to EB!**

```bash
cd Frontend/ava-02
npm install
npm run build
cd ../..
```

This creates a `build/` directory with optimized static files that will be included in the Docker container.

## Step 2: Verify Frontend is Configured

Your `Backend/main.py` should already have this line (already added):

```python
app.mount("/", StaticFiles(directory="../Frontend/ava-02/build", html=True), name="static")
```

This serves your React app as static files from the FastAPI backend.

## Step 3: Initialize Elastic Beanstalk Application

From the project root directory:

```bash
cd /Users/rental/AVA-02-1
eb init
```

Configuration:
- Select your region (e.g., `us-east-1`)
- Create new application: `ava-application`
- Platform: `Docker`
- Platform branch: `Docker running on 64bit Amazon Linux 2`
- Do not set up CodeCommit (unless you want to)
- Do not set up SSH (you can enable later if needed)

## Step 4: Create Elastic Beanstalk Environment WITH Database

**Option 1: Using EB CLI (Recommended for Learning Lab)**

```bash
eb create ava-production --database
```

When prompted, configure:
- Database engine: `postgres`
- Database version: (select latest, e.g., `14.x`)
- Database instance class: `db.t3.micro` (free tier eligible)
- Master username: `evangelion`
- Master password: (create a secure password - write it down!)
- Database name: Leave blank (will use default)

**Option 2: Using AWS Console**

1. Go to Elastic Beanstalk Console
2. Create new environment
3. Select "Web server environment"
4. Platform: Docker
5. Under "Configure more options" → Database:
   - Engine: PostgreSQL
   - Instance class: db.t3.micro
   - Username: `evangelion`
   - Password: (create secure password)
   - Retention: Delete (for learning lab)

This automatically:
- Creates RDS database attached to your EB environment
- Sets up security groups correctly
- Creates environment variable `RDS_HOSTNAME`, `RDS_PORT`, `RDS_USERNAME`, `RDS_PASSWORD`, `RDS_DB_NAME`

## Step 5: Update Database Configuration

Since EB creates RDS environment variables, update your `Backend/configDB.py`:

```python
import os

# EB provides these environment variables when DB is attached
RDS_HOSTNAME = os.getenv('RDS_HOSTNAME')
RDS_PORT = os.getenv('RDS_PORT', '5432')
RDS_DB_NAME = os.getenv('RDS_DB_NAME', 'ebdb')
RDS_USERNAME = os.getenv('RDS_USERNAME')
RDS_PASSWORD = os.getenv('RDS_PASSWORD')

# Build connection string
if RDS_HOSTNAME:
    DATABASE_URL = f"postgresql://{RDS_USERNAME}:{RDS_PASSWORD}@{RDS_HOSTNAME}:{RDS_PORT}/{RDS_DB_NAME}"
else:
    # Fallback for local development
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://evangelion:password@localhost/postgres"
    )
```

## Step 6: What Gets Uploaded to Elastic Beanstalk?

When you run `eb create` or `eb deploy`, EB packages and uploads from your **project root**:

- ✅ `Dockerfile` (at root)
- ✅ `Backend/` folder (Python code)
- ✅ `Backend/requirements.txt`
- ✅ `Frontend/ava-02/build/` (static React build)
- ✅ `.ebextensions/` (EB config)
- ✅ `Dockerrun.aws.json`
- ❌ `Frontend/ava-02/node_modules/` (excluded via .dockerignore)
- ❌ `Backend/*.sql` files (excluded)
- ❌ Git files (excluded)

The `.dockerignore` file ensures only necessary files are uploaded.

## Step 7: Deploy

First deployment (already done in Step 4 if you used `eb create --database`):
```bash
# This was done when you ran: eb create ava-production --database
```

For subsequent updates after code changes:
```bash
eb deploy
```

**Important**: Always rebuild frontend before deploying:
```bash
cd Frontend/ava-02 && npm run build && cd ../..
eb deploy
```

## Step 8: Check Status and Open Application

```bash
eb status
eb open
```

## Step 9: Import Database (Optional)

If you need to import your existing database dump, first get the RDS endpoint:

```bash
eb printenv | grep RDS
```

This will show you the RDS connection details. Then import from your local machine:

```bash
# Replace values with output from above command
psql -h <RDS_HOSTNAME_value> -U <RDS_USERNAME_value> -d <RDS_DB_NAME_value> -f Backend/2025_dump.sql
```

Example:
```bash
psql -h aa1234567890.abc123.us-east-1.rds.amazonaws.com -U evangelion -d ebdb -f Backend/2025_dump.sql
```

Enter the password you created during EB environment setup when prompted.

## Monitoring and Logs

View logs:
```bash
eb logs
```

SSH into instance (if enabled):
```bash
eb ssh
```

## Updating Your Application

After making code changes:

```bash
# Update backend
eb deploy

# If frontend changes, rebuild first
cd Frontend/ava-02
npm run build
cd ../..
eb deploy
```

## Environment Variables Reference

- `DATABASE_URL`: PostgreSQL connection string (set via `eb setenv`)
- Additional vars can be added in `.ebextensions/01_app.config`

## Cost Optimization Tips

1. Use RDS Free Tier (db.t3.micro or db.t4g.micro)
2. Use EB single instance (instead of load balanced)
3. Stop/terminate environments when not in use

## Troubleshooting

### Database Connection Issues
- Check security groups allow traffic between EB and RDS
- Verify DATABASE_URL environment variable is correct
- Check RDS is publicly accessible (for initial setup)

### Docker Build Failures
- Test locally: `cd Backend && docker build -t ava-backend .`
- Check `eb logs` for specific errors

### Import Path Issues
The Dockerfile uses `uvicorn Backend.main:app` which requires the parent directory structure.

## Alternative: Docker Compose (Multi-Container)

If you prefer running Postgres in a container alongside your app, you'll need:
1. Use EB Multi-Container Docker platform
2. Create `docker-compose.yml`
3. Use EBS volumes for Postgres data persistence

However, **RDS is strongly recommended** for production databases (better backups, scaling, maintenance).

## Next Steps

1. Set up custom domain (Route 53)
2. Enable HTTPS (AWS Certificate Manager)
3. Set up CI/CD pipeline (GitHub Actions → EB)
4. Configure auto-scaling policies
5. Set up CloudWatch alarms

Let me know if you need help with any of these!
