# AVA-02

Second Generation BYU-Racing Analytics Application

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL database
- **Frontend**: React application
- **Deployment**: AWS Elastic Beanstalk with RDS PostgreSQL

## Getting Started

###

To build the application, 
- ```cd Frontend/ava-02```, then 
- ```npm run build```

Then in the base folder in Linux or WSL,
- ```./autodeploy.sh [version_name]```

### Local Development

To run the application locally on your machine:

See [Setup_Guides/LOCAL_SETUP.md](Setup_Guides/LOCAL_SETUP.md)

### AWS Deployment

To deploy to AWS Elastic Beanstalk:

See [Setup_Guides/AWS_DEPLOYMENT.md](Setup_Guides/AWS_DEPLOYMENT.md)

## Quick Start

```bash
# 1. Set up local environment
See Setup_Guides/LOCAL_SETUP.md for detailed instructions

# 2. Run locally
uvicorn Backend.main:app --reload

# 3. Deploy to AWS
eb init
eb create ava-production --database
eb deploy
```
