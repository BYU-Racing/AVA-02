# AVA-03

Third Generation BYU-Racing Analytics Application

![AVA Image](./maxverstappen.jpg)

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL database
- **Frontend**: React application, run with Vite
- **Deployment**: Deployed via a Docker container on an AWS EC2 instance

### Backend

Backend folder has `main.py`, from which everything runs. \
--It technically runs `__init__.py` first, but that does nothing. There for linters.

`models.py` contains database models. \
`schemas.py` contains schemas for CRUD (Create, Read, Update, Delete) operations. \
`crud.py` has functions for CRUD. \
`database.py` connects to the Database. \
`configDB.py` configures the DB URL from env vars.

`endpoints` folder contains DB endpoints and LiveTelemetry WebSocket endpoint. \
`services` folder contains helper functions. \
`protobuf` folder contains python protobuf file for Backend->Frontend data.

### Frontend

`.env.development` has VITE_WS_URL, for setting where the Frontend connects to the Backend. \
`index.html` is the starter HTML page.

Rest of the stuff is self-explanatory.


## Getting Started

This whole project can work on any operating system, but we advise running on Linux, as the deployment scripts are made in Bash. It was made to work on AWS EC2, but can also work locally as well.

### Instructions for Linux Deployment

First, copy the .env file and put in new values:
- `cp .env.example .env`

Then run the dep install script:
- `./installDependencies.sh`

Restart the terminal, then run:
- `./firstDeploy.sh`

And it should be up!


### Local Development on non-linux machines

First, copy the .env file and put in new values:
- `cp .env.example .env`

Then start Docker Desktop and then run this 
command from the repo root:
- `docker compose up -d --build`

To restart the application without destroying the db:

- `docker compose up -d --build web`

If database config changed:

- `docker compose up -d --build`

### AWS Deployment

To deploy to AWS EC2:

See [Setup_Guides/AWS_DEPLOYMENT.md](Setup_Guides/AWS_DEPLOYMENT.md)

Start an AWS EC2 instance with Ubuntu on an ARM processor. It needs at least 2GB RAM and 16GB storage.

Make sure in security rules that you have SSH access for inbound rules and general access for outbound rules.

### Redeploy Changes

To redeploy AVA after making changes and pushing them to main, run this from the base folder:
- ```./redeploy.sh```

Optionally, you can also restart the database as well:
- ```./redeploy.sh --restart-db```

If you change the `redeploy.sh` script, do a `git pull` before running it again.
