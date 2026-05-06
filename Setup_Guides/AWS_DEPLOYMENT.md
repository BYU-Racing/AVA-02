# AWS EC2 Deployment Guide

This guide deploys AVA-03 on one cheap EC2 instance using Docker Compose. The app container serves both the FastAPI backend and built React frontend, and the `db` container runs Postgres with a persistent Docker volume.

## Cheapest Working Route

Use this setup unless you have a reason to make the AWS architecture bigger:

- **Instance**: `t4g.small`, Amazon Linux 2023, ARM64
- **Storage**: 12-16 GB `gp3` root volume
- **Database**: the included Docker Postgres container, not RDS
- **Networking**: one public EC2 instance, no Load Balancer, no NAT Gateway
- **Ports**: SSH `22` from your IP only, app `8000` from your IP/team IP
- **Cost safety**: create an AWS Budget alert before leaving it running

Why this route:

- `t4g.small` has 2 GiB RAM, which is a safer minimum for building the frontend Docker image than `nano` or `micro`.
- AWS currently advertises a `t4g.small` free trial of up to 750 hours/month through December 31, 2026, though surplus CPU credits and non-EC2 resources can still cost money.
- If your account has regular EC2 Free Tier, the eligible instance types depend on when the AWS account was created. Check the EC2 Free Tier box in the AWS console instead of guessing.

Useful AWS references:

- [EC2 Free Tier usage](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)
- [T4g instances and free trial](https://aws.amazon.com/ec2/instance-types/t4/)
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html)
- [EBS gp3 volumes](https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html)

## 1. Launch EC2

In the AWS EC2 console:

- Choose **Amazon Linux 2023 AMI**.
- Choose **64-bit Arm** architecture.
- Choose **`t4g.small`**.
- Use a `gp3` root volume around **12-16 GB**.
- Create or choose a key pair so you can SSH in.
- Create a security group with only the rules you need.

Suggested security group:

| Type | Port | Source | Notes |
| --- | --- | --- | --- |
| SSH | `22` | Your IP only | Needed to connect to EC2 |
| Custom TCP | `8000` | Your IP or team IP | AVA website/API |

Avoid `0.0.0.0/0` for SSH. For demos, opening port `8000` wider is convenient, but close it back down afterward.

## 2. SSH Into EC2

From your local machine:

```bash
ssh -i path/to/key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

## 3. Clone The Repo

If `git` is not available yet, install it first:

```bash
sudo yum install -y git
```

```bash
git clone YOUR_REPO_URL AVA-02
cd AVA-02
```

If the repo is already on the instance:

```bash
cd AVA-02
git pull
```

## 4. First-Time Setup With Scripts

Run the dependency installer first:

```bash
chmod +x installDependencies.sh firstDeploy.sh redeploy.sh
./installDependencies.sh
```

Log out and SSH back in after `installDependencies.sh` finishes. This lets the new Docker group permission apply.

Then run the first deployment from the repo root:

```bash
cd AVA-02
./firstDeploy.sh
```

What the scripts do:

- [installDependencies.sh](../installDependencies.sh) installs Docker, Git, the Docker Compose plugin, starts Docker, and adds `ec2-user` to the Docker group.
- [firstDeploy.sh](../firstDeploy.sh) starts the Postgres container, waits for Postgres to be ready, builds the web container, and waits for `/api/health`.
- [redeploy.sh](../redeploy.sh) is for later updates. It pulls latest code and rebuilds the web container.

Open the app:

```text
http://YOUR_EC2_PUBLIC_IP:8000
```

Check health directly:

```text
http://YOUR_EC2_PUBLIC_IP:8000/api/health
```

## 5. Redeploy Later

After the first deploy, use:

```bash
./redeploy.sh
```

If you intentionally need to restart the database container too:

```bash
./redeploy.sh --restart-db
```

Do not restart or delete the database volume unless you understand the data impact.

## 6. Manual Setup

Use this if a script fails or you want to do the steps by hand.

Install dependencies on Amazon Linux 2023:

```bash
sudo yum update -y
sudo yum install -y docker git curl docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -a -G docker ec2-user
```

Log out and SSH back in.

Start the database:

```bash
docker compose up -d db
```

Wait for Postgres:

```bash
until docker compose exec -T db pg_isready -U evangelion -d appdb; do
  echo "Waiting for database..."
  sleep 2
done
```

Build and start the app:

```bash
docker compose up -d --build web
```

Check containers:

```bash
docker compose ps
```

Check app health:

```bash
curl -fsS http://localhost:8000/api/health
```

## 7. Useful Commands

Watch logs:

```bash
docker compose logs -f web
docker compose logs -f db
```

Restart the app:

```bash
docker compose restart web
```

Rebuild the app:

```bash
git pull
docker compose up -d --build web
```

Stop containers without deleting database data:

```bash
docker compose down
```

Stop containers and delete local database data:

```bash
docker compose down -v
```

Only use `docker compose down -v` if you intentionally want to wipe the Postgres Docker volume.

## 8. Cost Notes

The cheap route is cheap because everything runs on one EC2 instance. That is fine for testing, demos, and small internal use, but it is not the most durable production architecture.

To keep costs low:

- Use one `t4g.small` instead of separate EC2, RDS, Load Balancer, and NAT Gateway resources.
- Use `gp3` storage and keep the root volume small.
- Stop the instance when you are not using it.
- Delete unused volumes, snapshots, and old test instances.
- Set an AWS Budget alert before deploying.
- Watch CPU credits on burstable instances if the app is under heavy sustained load.

Tradeoff: storing Postgres inside the EC2 Docker volume is cheaper than RDS, but if the instance or volume is deleted, the database can be lost. Take backups before using this for important data.

## Troubleshooting

If the website does not load:

- Confirm the EC2 security group allows inbound TCP `8000`.
- Run `docker compose ps` and check that `db` and `web` are running.
- Run `docker compose logs -f web` and look for build or environment variable errors.
- Confirm [docker-compose.yml](../docker-compose.yml) uses `db` as the database hostname, not `localhost`.

If `firstDeploy.sh` says `curl: command not found`:

- Run `sudo yum install -y curl`, then rerun `./firstDeploy.sh`.

If Docker says permission is denied:

- Log out and SSH back in after running `installDependencies.sh`.
- If needed, test with `docker ps`.

If the build gets killed or runs out of memory:

- Retry on `t4g.small` if you used a smaller instance.
- Temporarily resize to `t4g.medium` for the build, then resize back down if needed.
