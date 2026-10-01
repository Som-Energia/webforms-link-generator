[![CI](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml)

# Webforms Links Generator

Single-container monorepo for an admin-only link generator.

## Structure

- `apps/backend`: Flask API, authentication, and production static serving.
- `apps/frontend`: React + Vite admin UI.

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

## Release and Harbor Publishing

Use `make version` to set one version for the backend and frontend, then use `scripts/publish-images.sh` to build and publish the image to the Harbor repository configured in `.env`.

### Quick Path

Run these commands from the repository root:

```bash
make version
# Enter the new shared version when prompted, for example: 0.1.4

./scripts/publish-images.sh 0.1.4
```

Confirm the displayed image reference with `y`, `Y`, `s`, or `S`, then enter the Harbor username and token when prompted. On success, the script prints the pushed image digest and updates the configured Portainer stack to use that exact image tag.

### Shared Version

`make version` performs the complete local version update:

1. Reads and displays the current backend and frontend versions.
2. Prompts for `New shared version` and rejects an empty value.
3. Checks that Git tag `<version>` does not already exist.
4. Runs `poetry version <version>` in `apps/backend`.
5. Runs `npm --prefix apps/frontend version <version> --no-git-tag-version`.
6. Commits `apps/backend/pyproject.toml`, `apps/frontend/package.json`, and `apps/frontend/package-lock.json` with `chore: bump version to <version>`.
7. Creates the local Git tag `<version>`.

The target does not push the commit or tag. Push them separately after reviewing the generated commit:

```bash
git push
git push --tags
```

> **Important:** the current target checks for `<version>` but creates `<version>` without the `v` prefix. Use the exact tag that `make version` creates, or pass the image tag explicitly to the publishing script.

### Harbor Publishing Details

The publishing script reads `.env` from the repository root. Set `IMAGE_URL` to the complete Harbor repository path before running it, as shown by the placeholder in `.env.example`:

```dotenv
IMAGE_URL="[HARBOR_SERVER_URL]/webapps/webforms-link-generator"
```

Pass an image tag as the first argument to avoid an interactive tag prompt:

```bash
./scripts/publish-images.sh 0.1.4
```

Without an argument, the script suggests `git describe --tags --always` as the image tag; pressing Enter accepts that suggestion. Before it clones or reuses its working copy, logs in, builds, or pushes, it displays `IMAGE_URL:TAG` and asks for confirmation. Any answer other than `y`, `Y`, `s`, or `S` cancels publication.

After confirmation, the script:

1. Logs in to `harbor.somenergia.coop` with the prompted username and token.
2. Builds the current repository checkout with `docker build --pull -t "$IMAGE_URL:$TAG" .`.
3. Pushes with `docker push "$IMAGE_URL:$TAG"`.
4. Prints the first repository digest reported by `docker inspect`.
5. Updates `IMAGE_TAG` in the configured Portainer stack and redeploys it after forcing an image pull.

The Flask app serves the React build from `apps/frontend/dist` and exposes the app on `PORT`.

## Portainer

Portainer should deploy a prebuilt image from Harbor. Do not rely on Portainer to build this repository directly in a remote environment.

Use `docker-compose.portainer.yml` as the stack definition. The file stays unchanged between deployments; Portainer substitutes `IMAGE_URL` and `IMAGE_TAG` from the stack environment variables:

```yaml
services:
  webforms-links-generator:
    image: ${IMAGE_URL:?set IMAGE_URL}:${IMAGE_TAG:?set IMAGE_TAG}
```

Before the first deployment, set these stack environment variables in Portainer:

```dotenv
IMAGE_URL=harbor.somenergia.coop/webapps/webforms-link-generator
IMAGE_TAG=0.1.4
```

Set `PORTAINER_URL`, `PORTAINER_API_TOKEN`, and `PORTAINER_STACK_NAME` in the local `.env` used by `scripts/publish-images.sh`. The redeploy script requires `curl` and `jq`. Each publication then changes only `IMAGE_TAG` and forces Portainer to pull and redeploy the exact version just pushed. To roll back, redeploy the stack after setting `IMAGE_TAG` to a previously published tag.

Keep `docker-compose.yml` for local builds from this repository.

Set all required environment variables in Portainer before deploy. Keep `COOKIE_SECURE=true` when the app is served over HTTPS.

Portainer may also need registry credentials configured so it can pull from Harbor.

## Verification

```bash
cd apps/backend && poetry run pytest
cd apps/frontend && npm run build
docker compose build
```
