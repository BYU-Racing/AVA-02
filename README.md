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
`index.html` is the starter HTML page. \

Rest of the stuff is self-explanatory.


## Getting Started

This whole project can work on any operating system, but we advise running on Linux, as the deployment scripts are made in Bash. It was made to work on AWS EC2, but can also work locally as well.

We should have a website already going for it, ask the LV Electronics team for the link.

### Instructions for First Deployment

Start by running:
- `./installDependencies.sh`

Restart the terminal:
- `./firstDeploy.sh`

And it should be up!


### Local Development

To run the application locally on your machine:

See [Setup_Guides/LOCAL_SETUP.md](Setup_Guides/LOCAL_SETUP.md)

### AWS Deployment

To deploy to AWS EC2:

See [Setup_Guides/AWS_DEPLOYMENT.md](Setup_Guides/AWS_DEPLOYMENT.md)


### Redeploy Changes

To redeploy AVA after making changes and pushing them to main, run this from the base folder:
- ```./redeploy.sh```

Optionally, you can also restart the database as well:
- ```./redeploy.sh --restart-db```

If you change the `redeploy.sh` script, do a `git pull` before running it again.