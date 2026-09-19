# AWS EC2 Deployment Guide

AVA-03 runs on one Ubuntu EC2 instance using Docker Compose. Tailscale provides
private access to the site.

## 1. Create the EC2 instance

Recommended configuration:

- Ubuntu Server 24.04 LTS, 64-bit Arm
- `t4g.small`
- 16 GiB `gp3` storage
- SSH key pair
- Inbound SSH (`22`) from your IP only

The installer uses `apt-get`, so Amazon Linux is not supported. Port `8000`
does not need to be publicly exposed when using Tailscale.

AWS costs can change. Check current pricing and create an
[AWS Budget](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-create.html).

## 2. Connect and clone

```bash
ssh -i path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP

sudo apt-get update
sudo apt-get install -y git
git clone YOUR_REPO_URL AVA-02
cd AVA-02
```

Ubuntu uses the SSH username `ubuntu`.

## 3. Configure secrets

```bash
cp .env.example .env
nano .env
```

Replace every example value:

```dotenv
POSTGRES_USER=db_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=appdb
DELETE_PASSWORD=different_strong_password
```

Do not commit `.env`. You can generate password-friendly hex strings with:

```bash
openssl rand -hex 24
```

## 4. Install dependencies

```bash
chmod +x installDependencies.sh firstDeploy.sh redeploy.sh
./installDependencies.sh ec2
```

This installs Docker and Tailscale, creates a 2 GiB swap file, and runs
`tailscale up`. Follow the printed Tailscale login link.

Log out and reconnect so Docker group permissions take effect:

```bash
exit
ssh -i path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP
cd AVA-02
```

## 5. Deploy

```bash
./firstDeploy.sh ec2
```

Verify the deployment:

```bash
docker compose ps
curl -fsS http://localhost:8000/api/health
tailscale ip -4
```

From another device on the same tailnet, open:

```text
http://TAILSCALE_IP:8000
```

## Redeploy

After pushing changes:

```bash
./redeploy.sh ec2
```

To restart the database container too:

```bash
./redeploy.sh ec2 --restart-db
```

`redeploy.sh` runs `git pull`. If that script itself changed, run `git pull`
before invoking it.

## Useful commands

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f db
docker compose up -d --no-deps --build web
docker compose down                 # Keeps database data
tailscale status
```

Do not run `docker compose down -v` unless you intend to delete all PostgreSQL
data in the Compose volume.

## Troubleshooting

If Docker reports permission denied, log out and reconnect, then run:

```bash
docker info
```

If Tailscale is disconnected:

```bash
sudo tailscale up
tailscale status
```

If the site is unavailable:

```bash
curl -v http://localhost:8000/api/health
docker compose ps
docker compose logs --tail=100 web
docker compose logs --tail=100 db
```

If a build runs out of memory, verify the swap file:

```bash
free -h
sudo swapon --show
```
