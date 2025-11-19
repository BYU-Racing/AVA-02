# AWS Elastic Beanstalk Deployment - Console Guide (Learner Lab)

This guide is for deploying via AWS Console when CLI access is restricted (like in AWS Learner Lab).

## Prerequisites

Before starting, ensure you have:
1. ✅ Built your frontend
2. ✅ All necessary files in place

## Step 1: Build Frontend

**CRITICAL: Do this first!**

```bash
cd Frontend/ava-02
npm install
npm run build
cd ../..
```

Verify the build folder exists:
```bash
ls Frontend/ava-02/build
```

You should see: `index.html`, `static/`, and other files.

## Step 2: Create Deployment Package (ZIP)

From your project root (`/Users/rental/AVA-02-1/`):

```bash
# Create a zip file with all necessary files
zip -r ava-deployment.zip \
  Dockerfile \
  Dockerrun.aws.json \
  .ebextensions \
  Backend \
  Frontend/ava-02/build \
  -x "*.pyc" "**/__pycache__/*" "**/*.sql" "Backend/2025_dump.sql"
```

This creates `ava-deployment.zip` with:
- ✅ Dockerfile
- ✅ Dockerrun.aws.json
- ✅ .ebextensions/
- ✅ Backend/ (all Python code)
- ✅ Frontend/ava-02/build/ (static files)
- ❌ Excludes: Python cache, SQL dumps

**Verify the zip** (optional):
```bash
unzip -l ava-deployment.zip | head -20
```

## Step 3: AWS Console - Create Elastic Beanstalk Application

### 3.1 Navigate to Elastic Beanstalk

1. Log into AWS Console
2. Search for "Elastic Beanstalk" in the search bar
3. Click **"Elastic Beanstalk"**
4. Click **"Create Application"** (orange button)

### 3.2 Configure Application

**Application Information:**
- Application name: `ava-application`
- Application tags: (optional, can skip)

**Environment Information:**
- Environment name: `ava-production` (or your choice)
- Domain: (auto-generated, or customize)

**Platform:**
- Platform: **Docker**
- Platform branch: **Docker running on 64bit Amazon Linux 2**
- Platform version: (recommended - latest)

**Application Code:**
- Select: **Upload your code**
- Version label: `v1` (or today's date like `2025-11-19`)
- Click **"Choose file"**
- Select your `ava-deployment.zip`

Click **"Configure more options"** (important!)

### 3.3 Configure Database (IMPORTANT!)

In the configuration cards, find **"Database"** and click **"Edit"**:

**Database Settings:**
- Engine: **postgres**
- Engine version: **14.13** (or latest available)
- Instance class: **db.t3.micro** (free tier eligible)
- Storage: **5 GB** (minimum, or 20 GB)
- Username: `evangelion`
- Password: (create strong password - **WRITE IT DOWN!**)
- Retention: **Delete** (for Learner Lab - deletes DB when environment is terminated)
- Availability: **Low** (single AZ)

Click **"Save"**

### 3.4 Configure Instance (Optional but Recommended)

Find **"Instances"** and click **"Edit"**:

- Instance type: **t3.micro** or **t2.micro** (free tier)
- Root volume: **General Purpose (SSD)**, 10 GB

Click **"Save"**

### 3.5 Configure Capacity (Cost Savings)

Find **"Capacity"** and click **"Edit"**:

- Environment type: **Single instance** (cheaper for testing)
  - OR **Load balanced** (if you need high availability)

For Learner Lab, choose **Single instance** to save costs.

Click **"Save"**

### 3.6 Configure Network (Optional)

If you need specific VPC settings, configure here. Otherwise, leave as default.

### 3.7 Create Environment

Review all settings, then click **"Create environment"** at the bottom.

**This will take 10-15 minutes.** AWS is:
- Creating EC2 instance
- Creating RDS PostgreSQL database
- Building Docker container
- Deploying your application

## Step 4: Monitor Deployment

You'll see a screen with:
- Recent events (shows progress)
- Health status (will show "Grey" → "Yellow" → "Green")

Watch for:
- ✅ "Environment health has transitioned from Grey to Green"
- ✅ "Successfully launched environment"

If you see errors, check the logs (see troubleshooting below).

## Step 5: Get Your Application URL

Once deployment is complete (status = Green):

1. At the top of the environment page, you'll see a URL like:
   ```
   http://ava-production.us-east-1.elasticbeanstalk.com
   ```
2. Click the URL to open your application
3. You should see your React app!

## Step 6: Verify Database Connection

### 6.1 Check Environment Variables

1. In your EB environment, click **"Configuration"**
2. Click **"Updates, monitoring, and logging"** → **"Edit"**
3. Scroll to **"Environment properties"**

You should see:
- `RDS_HOSTNAME` = (database endpoint)
- `RDS_PORT` = 5432
- `RDS_DB_NAME` = ebdb
- `RDS_USERNAME` = evangelion
- `RDS_PASSWORD` = (your password)

These are automatically set when you created the database!

Your `Backend/configDB.py` automatically uses these variables.

## Step 7: Import Existing Database (Optional)

If you need to import your `2025_dump.sql`:

### 7.1 Get Database Endpoint

From Configuration → Environment properties, copy the `RDS_HOSTNAME` value.

Example: `aa1abc2def3g.abc123.us-east-1.rds.amazonaws.com`

### 7.2 Import from Your Local Machine

Make sure you have PostgreSQL client installed (`psql`):

```bash
# Import the database
psql -h <RDS_HOSTNAME> -U evangelion -d ebdb -f Backend/2025_dump.sql

# Example:
psql -h aa1abc2def3g.abc123.us-east-1.rds.amazonaws.com -U evangelion -d ebdb -f Backend/2025_dump.sql
```

When prompted, enter the password you created.

**Note:** The RDS database must allow connections from your IP:
1. Go to RDS Console
2. Find your database (name starts with `aa...`)
3. Click on it → Security group
4. Edit inbound rules → Add your IP for PostgreSQL (port 5432)

## Step 8: Update Your Application (Future Deployments)

When you make code changes:

### 8.1 Rebuild Frontend (if changed)
```bash
cd Frontend/ava-02
npm run build
cd ../..
```

### 8.2 Create New ZIP
```bash
zip -r ava-deployment-v2.zip \
  Dockerfile \
  Dockerrun.aws.json \
  .ebextensions \
  Backend \
  Frontend/ava-02/build \
  -x "*.pyc" "**/__pycache__/*" "**/*.sql" "Backend/2025_dump.sql"
```

### 8.3 Upload New Version

1. Go to your EB environment
2. Click **"Upload and deploy"** (top right)
3. Choose file: `ava-deployment-v2.zip`
4. Version label: `v2` (or date)
5. Click **"Deploy"**

Wait 2-5 minutes for deployment to complete.

## Monitoring and Logs

### View Logs

1. In your environment, click **"Logs"**
2. Click **"Request Logs"** → **"Last 100 Lines"** or **"Full Logs"**
3. Click **"Download"** to see application logs

Look for:
- Docker build output
- Uvicorn startup messages
- Any Python errors

### Check Health

1. Click **"Monitoring"** to see:
   - Request count
   - CPU usage
   - Response times
   - Health status

## Troubleshooting

### Application Won't Start (Grey/Yellow Health)

1. **Check Logs:**
   - Environment → Logs → Request Logs → Full Logs
   - Look for Python errors or Docker build failures

2. **Common Issues:**
   - Missing `Frontend/ava-02/build/` folder → rebuild frontend
   - Wrong Python dependencies → check `Backend/requirements.txt`
   - Port mismatch → ensure Dockerfile exposes port 8000

### Database Connection Failed

1. **Verify environment variables:**
   - Configuration → Environment properties
   - Ensure all `RDS_*` variables exist

2. **Check Security Groups:**
   - RDS Console → Your database → Security
   - Ensure EB security group can access RDS on port 5432

3. **Test connection:**
   - SSH into EB instance (if enabled)
   - Try: `psql -h $RDS_HOSTNAME -U $RDS_USERNAME -d $RDS_DB_NAME`

### Frontend Not Loading

1. **Verify build exists in ZIP:**
   ```bash
   unzip -l ava-deployment.zip | grep "Frontend/ava-02/build"
   ```

2. **Check main.py has StaticFiles mount:**
   ```python
   app.mount("/", StaticFiles(directory="../Frontend/ava-02/build", html=True), name="static")
   ```

3. **Verify path in Dockerfile:**
   ```dockerfile
   COPY Frontend/ava-02/build/ ./Frontend/ava-02/build/
   ```

### ZIP Too Large Error

If upload fails due to size:

1. **Check what's included:**
   ```bash
   du -sh ava-deployment.zip
   unzip -l ava-deployment.zip | grep -E "node_modules|.git"
   ```

2. **Ensure exclusions:**
   ```bash
   # Recreate zip with strict exclusions
   zip -r ava-deployment.zip \
     Dockerfile Dockerrun.aws.json .ebextensions Backend Frontend/ava-02/build \
     -x "*/node_modules/*" "*/.git/*" "*.pyc" "**/__pycache__/*" "*.sql"
   ```

## Cost Management (Important for Learner Lab!)

Learner Lab has budget limits:

1. **Use Single Instance** (not load balanced)
2. **Use db.t3.micro** for database
3. **Terminate when done:**
   - Environment → Actions → Terminate environment
   - This deletes everything (including database if set to "Delete")

4. **Stop environment temporarily:**
   - Not available in EB, must terminate

## Next Steps

- ✅ Set up custom domain (Route 53)
- ✅ Enable HTTPS (Certificate Manager + Load Balancer)
- ✅ Set up monitoring alerts (CloudWatch)
- ✅ Configure auto-scaling (if using load balanced)

## Summary Checklist

- [ ] Built frontend (`npm run build`)
- [ ] Created deployment ZIP
- [ ] Created EB application via Console
- [ ] Configured PostgreSQL database
- [ ] Deployed and verified (Green health)
- [ ] Tested application URL
- [ ] (Optional) Imported database dump
- [ ] Saved RDS password somewhere safe!

## Quick Reference Commands

```bash
# Build frontend
cd Frontend/ava-02 && npm run build && cd ../..

# Create deployment package
zip -r ava-deployment.zip Dockerfile Dockerrun.aws.json .ebextensions Backend Frontend/ava-02/build -x "*.pyc" "**/__pycache__/*" "**/*.sql"

# Import database (from local)
psql -h <RDS_HOSTNAME> -U evangelion -d ebdb -f Backend/2025_dump.sql
```

Good luck with your deployment! 🚀
