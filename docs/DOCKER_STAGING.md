# Docker staging

This project runs the built app, persistent MySQL 8.4, and Caddy for HTTPS. The app port stays private. The checked-in Caddy configuration targets the EC2 staging host.

## First run

1. Install Docker with Compose on the deployment host. Allow inbound TCP 80 and 443; keep MySQL and the app port private.
2. Copy `.env.docker.example` to `.env.docker` and replace every `replace-with-...` value with a unique secret. Keep `.env.docker` private.
3. Build the image:

```powershell
docker compose build
```

4. Start MySQL and wait until it is healthy:

```powershell
docker compose up -d db
docker compose ps
```

5. Run the one-time database setup:

```powershell
docker compose --profile setup run --rm migrate
docker compose --profile setup run --rm seed
docker compose --profile setup run --rm staff
```

6. Start the app:

```powershell
docker compose up -d app proxy
```

Open `https://snacks-staging.47-129-136-41.sslip.io/`. Staff access is at `/staff`. HTTP requests, including the old EC2 hostname, redirect to this address with their paths and query strings preserved.

For local Docker use, replace `deploy/Caddyfile` with a single `http://localhost` site reverse-proxying to `app:3001`, and set `APP_ORIGIN=http://localhost`. The staging hostname must resolve to the deployment server for public HTTPS certificate issuance.

## Later starts

```powershell
docker compose up -d
```

Do not run `seed` again after the database contains data. The MySQL data is stored in the `mysql-data` Docker volume.

## Staging host

For a remote Docker host, set `APP_ORIGIN` in `.env.docker` to the public staging URL, keep only ports 80/443 exposed publicly through a reverse proxy, and do not publish MySQL port 3306. The app container must keep `HOST=0.0.0.0`.

With `STAGING_MODE=true` and an HTTP `APP_ORIGIN`, cookies support HTTP and browser HTTPS upgrading is disabled. Use demo data only on HTTP staging. HTTPS origins and ordinary production keep secure cookies.

On small EC2 instances, build locally with `npm run build` and transfer `dist`, `package.json`, `package-lock.json`, and `deploy/Dockerfile.prebuilt` into a separate build directory. Run `docker build -f deploy/Dockerfile.prebuilt -t snacks-republic-staging-app:latest .` there, then `docker compose up -d --no-build app proxy` from the deployment directory. This avoids compiling on the low-memory server. Keep swap enabled across reboots and allow inbound TCP 80 in the EC2 security group for HTTP staging.

## HTTPS operations

Caddy automatically obtains and renews the public certificate. Preserve the `caddy-data` and `caddy-config` volumes; do not use `docker compose down -v`. Check `docker compose logs --tail 50 proxy` for issuance/renewal errors and verify `/api/v1/health` over HTTPS without disabling certificate verification. Certificate storage was verified to survive a proxy restart.

The hostname embeds public IP `47.129.136.41`. If that address changes, update both site/redirect targets in `deploy/Caddyfile` and `APP_ORIGIN` before recreating app and proxy. Keep `DEMO_MODE=true` and `STAGING_MODE=true` for demo staging. HTTPS origins enable Secure session cookies and HTTPS security headers automatically.

The EC2 deployment directory is `/home/ubuntu/snacks-republic-staging`. Its private `.runtime/pre-https/` directory contains the previous Compose configuration and environment. To roll back this HTTPS rollout, restore `docker-compose.yml` and restore `env.docker` as `.env.docker`, then run `docker compose up -d --no-build app proxy`. The old Nginx configuration remains in `deploy/nginx.conf`. Do not rerun migrations or seed for a proxy change.
