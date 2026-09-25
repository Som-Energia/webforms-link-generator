[![CI](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml)

# Webforms Links Generator

Single-container monorepo for an admin-only link generator.

## Structure

- `apps/backend`: Flask API, authentication, and production static serving.
- `apps/frontend`: React + Vite admin UI.
- `app.ts`: legacy Bun/Hono source kept as migration reference.

## Local Development

### Prerequisites

- Python 3.12 and Poetry.
- Node.js 24 LTS and npm.
- GNU Make, `setsid` (provided by util-linux on Linux), and standard POSIX utilities (`sh`, `mkfifo`, and `sed`) for the root Make workflow.
- Access to the external JWT API configured below.

### Setup

From the repository root, create the local environment file and install dependencies:

```bash
cp .env.example .env
cd apps/backend && poetry install
cd apps/frontend && npm install
```

Set these values in `.env` before starting the backend:

| Variable               | Required value                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| `ADMIN_PASSWORD`       | Password for the admin login.                                      |
| `SESSION_SECRET`       | Secret of at least 32 characters.                                  |
| `ADMIN_GATEWAY_SECRET` | Token sent to the JWT API as `X-Admin-Gateway-Token`.              |
| `JWT_API_URL`          | Reachable external JWT API endpoint.                               |
| `COOKIE_SECURE`        | Set to `false` for local HTTP; leave `true` for HTTPS deployments. |

`PORT` defaults to `3000`; the Make backend target explicitly uses port `3000`. Before running the Make targets, export the values from `.env` in your shell; Flask does not load the root `.env` file automatically. Already-exported environment variables take precedence. Keep `.env` out of version control.

### Start

Run one service from the repository root:

```bash
make backend
```

```bash
make frontend
```

Or start both services in one foreground terminal:

```bash
make dev
```

`make dev` prefixes combined output with `[backend]` or `[frontend]`. Stop it with `Ctrl+C`; it terminates and reaps both services and removes its temporary log FIFOs.

### Local URLs and Proxy

| URL                            | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `http://localhost:5173`        | Local React/Vite application. Use this URL during frontend development. |
| `http://localhost:3000/health` | Flask health endpoint.                                                  |
| `http://localhost:3000`        | Flask server; it serves the UI only when `apps/frontend/dist` exists.   |

Vite proxies browser requests beginning with `/api` and `/auth` to `http://localhost:3000`, so both services must be running for login and link generation. `/health` is not proxied; request it directly from port `3000`.

### Troubleshooting and Limits

- A startup error such as `Missing ADMIN_PASSWORD` means a required variable is absent or empty. Confirm that you exported the values from `.env`; `SESSION_SECRET` must also meet the 32-character minimum.
- Login will not persist over `http://localhost:5173` if `COOKIE_SECURE=true`, because secure cookies require HTTPS. Set it to `false` only for local HTTP.
- Opening the Flask root URL without a frontend build returns `503 Frontend build not found.` This is expected during `make dev`; use Vite at port `5173`. Build the frontend with `npm --prefix apps/frontend run build` when you need Flask to serve the UI.
- Link generation depends on the external JWT API. An unreachable API, a non-success response, or an invalid token response produces a `502`; confirm `JWT_API_URL` and `ADMIN_GATEWAY_SECRET`.
- The backend request to the JWT API has a 10-second timeout.

## Production Image

Build the image before deploying it with Portainer, then push it to the registry used by your infrastructure, such as Harbor.

```bash
docker build -t harbor.example.com/project/webforms-links-generator:1.0.0 .
docker push harbor.example.com/project/webforms-links-generator:1.0.0
```

Replace `harbor.example.com/project/webforms-links-generator:1.0.0` with the Harbor project, repository, and tag agreed with the system administrator.

The Flask app serves the React build from `apps/frontend/dist` and exposes the app on `PORT`.

## Portainer

Portainer should deploy a prebuilt image from Harbor. Do not rely on Portainer to build this repository directly in a remote environment.

Use `docker-compose.portainer.yml` as the stack definition. Before deploying, replace the placeholder image with the real Harbor registry, project, repository, and tag:

```yaml
services:
  webforms-links-generator:
    image: harbor.example.com/project/webforms-links-generator:1.0.0
```

Keep `docker-compose.yml` for local builds from this repository.

Set all required environment variables in Portainer before deploy. Keep `COOKIE_SECURE=true` when the app is served over HTTPS.

Portainer may also need registry credentials configured so it can pull from Harbor.

## Verification

```bash
cd apps/backend && poetry run pytest
cd apps/frontend && npm run build
docker compose build
```
