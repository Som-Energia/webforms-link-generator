[![CI](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/Som-Energia/webforms-link-generator/actions/workflows/ci.yml)

# Webforms Links Generator

Single-container monorepo for an admin-only link generator.

## Table of Contents

- [Structure](#structure)
- [Local Development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Start](#start)
  - [Local URLs and Proxy](#local-urls-and-proxy)
  - [Troubleshooting and Limits](#troubleshooting-and-limits)
- [Link Generation and External API](#link-generation-and-external-api)
- [Run Locally with Docker](#run-locally-with-docker)
  - [Configure and Start](#configure-and-start)
  - [Health and Logs](#health-and-logs)
  - [Stop and Remove](#stop-and-remove)
- [Release and Harbor Publishing](#release-and-harbor-publishing)
  - [Quick Path](#quick-path)
  - [Shared Version](#shared-version)
  - [Harbor Publishing Details](#harbor-publishing-details)
- [Portainer](#portainer)
  - [Logs](#logs)
- [Verification](#verification)

## Structure

- `apps/backend`: Flask API, authentication, and production static serving.
- `apps/frontend`: React + Vite admin UI.

## Local Development

### Prerequisites

- Python 3.12 and Poetry.
- Node.js `>=24.15.0 <25` and npm.
- GNU Make, `setsid` (provided by util-linux on Linux), and standard POSIX utilities (`sh`, `mkfifo`, and `sed`) for the root Make workflow.
- Access to the external JWT API configured below.

### Setup

From the repository root, create the local environment files and install dependencies. If you use pyenv, first select an installed Python 3.12 patch release (`3.12.12` below is an example; the project does not pin a patch version):

```bash
pyenv local 3.12.12 # If using pyenv; replace with your installed 3.12 patch version.
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
(cd apps/backend && poetry install)
(cd apps/frontend && npm install)
```

Set these values in `apps/backend/.env` before starting the local backend:

| Variable               | Required value                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| `ADMIN_PASSWORD`       | Password for the admin login.                                             |
| `SESSION_SECRET`       | Secret of at least 32 characters.                                         |
| `ADMIN_GATEWAY_SECRET` | Token sent to the JWT API as `X-Admin-Gateway-Token`.                     |
| `API_URL`              | Reachable external API base URL, without a token endpoint suffix; see [API endpoints](#link-generation-and-external-api). |
| `ACTIVIST_SPONSOR_VAT` | NIF used by the activist sponsor card.                                   |
| `ACTIVIST_SPONSOR_CODE` | Member number used by the activist sponsor card.                        |
| `COOKIE_SECURE`        | Set to `false` for local HTTP; leave `true` for HTTPS deployments.        |

`PORT` defaults to `3000`; the Make backend target explicitly uses port `3000`. The local Flask CLI loads `apps/backend/.env`; the application also loads the root `.env` without overriding variables already set. Already-exported environment variables take precedence. Keep both `.env` files out of version control.

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

- A startup error such as `Missing ADMIN_PASSWORD` means a required variable is absent or empty. Confirm that you configured the values in `apps/backend/.env`; `SESSION_SECRET` must also meet the 32-character minimum.
- Login will not persist over `http://localhost:5173` if `COOKIE_SECURE=true`, because secure cookies require HTTPS. Set it to `false` only for local HTTP.
- Opening the Flask root URL without a frontend build returns `503 Frontend build not found.` This is expected during `make dev`; use Vite at port `5173`. Build the frontend with `npm --prefix apps/frontend run build` when you need Flask to serve the UI.
- Token-based link generation depends on the external API. The backend requests either `<API_URL>/feature-flags/token` or `<API_URL>/sponsored-contract/token`, depending on the link type; connection failures, upstream HTTP errors, or a missing/invalid `data.token` value produce a `502`. Confirm `API_URL` and `ADMIN_GATEWAY_SECRET`.
- The backend request to the JWT API has a 10-second timeout.

## Link Generation and External API

Set `API_URL` to the external API base URL, for example `https://example.com/admin/api`. Do not include `/feature-flags/token` or `/sponsored-contract/token`: the backend appends the appropriate path.

| Backend route (POST) | External API path (POST) | Token payload |
| --- | --- | --- |
| `/api/links/social-tariff` | `/feature-flags/token` | `{"ff":["socialTariffByPass"]}` |
| `/api/links/send-signature` | `/feature-flags/token` | `{"ff":["sendSignaturit"]}` |
| `/api/links/activist-sponsor` | `/sponsored-contract/token` | `vat` and `code` from `ACTIVIST_SPONSOR_VAT` and `ACTIVIST_SPONSOR_CODE`. |
| `/api/links/sponsor` | `/sponsored-contract/token` | Non-empty `vat` and `code` strings supplied in the request. |

All backend routes above require an authenticated session. Upstream requests send JSON with the `X-Admin-Gateway-Token` header set to `ADMIN_GATEWAY_SECRET`. The expected response is `{"data":{"token":"<token>"}}`; the backend checks that the token is a non-empty string, not its JWT signature or claims.

Requests may include `expiresAt` (a future, timezone-aware ISO-8601 timestamp, forwarded in UTC) and `formUrl` (an HTTPS destination URL, not sent to the token API). The backend returns `{"link":"<destination URL with token>"}`. Without `formUrl`, it uses the default domestic contracting form. Personal links are assembled in the browser without requesting a token from the backend or external API.

## Run Locally with Docker

Run these commands from the repository root with Docker available. Ensure port `13000` and container name `webforms-local` are unused.

### Configure and Start

If you have not created the backend environment file during local setup, copy its template:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Configure `apps/backend/.env` using the [Setup variable table](#setup): set an admin password, a `SESSION_SECRET` of at least 32 characters, a real `API_URL` reachable from the container, the matching `ADMIN_GATEWAY_SECRET`, and the activist sponsor's `ACTIVIST_SPONSOR_VAT` and `ACTIVIST_SPONSOR_CODE`. Link generation requires access to that API; placeholder credentials do not provide a working integration.

The environment file stays outside the image: `.dockerignore` excludes it from the build context, and `--env-file` injects its values only at runtime. No credentials are needed for the image build.

```bash
docker build -t webforms:local .
docker run -d --name webforms-local \
  --env-file apps/backend/.env \
  -e COOKIE_SECURE=false \
  -e PORT=3000 \
  -p 127.0.0.1:13000:3000 \
  webforms:local
docker logs webforms-local
```

The explicit `PORT=3000` keeps the container port consistent with the mapping even if the environment file sets another port. `COOKIE_SECURE=false` allows login cookies over local HTTP; use `true` for HTTPS deployments.

Once startup completes, open **http://localhost:13000/** to log in and generate links. The container serves both the UI and backend.

### Health and Logs

```bash
curl -i http://localhost:13000/health
docker logs --follow webforms-local
```

The health endpoint should return `200` with JSON containing `"status": "ok"`. It confirms the app is running; successful link generation also requires the configured external API. Press `Ctrl+C` to stop following logs; the container keeps running.

### Stop and Remove

```bash
docker stop --time 30 webforms-local
docker logs webforms-local
docker inspect --format 'exit={{.State.ExitCode}} oom={{.State.OOMKilled}}' webforms-local
docker rm webforms-local
```

After a normal shutdown, inspection reports `exit=0 oom=false`. Exit `137` can indicate a forced kill after the stop timeout; check the logs and OOM flag.

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
3. Checks that Git tag `v<version>` does not already exist (see the caveat below).
4. Runs `poetry version <version>` in `apps/backend`.
5. Runs `npm --prefix apps/frontend version <version> --no-git-tag-version`.
6. Commits `apps/backend/pyproject.toml`, `apps/frontend/package.json`, and `apps/frontend/package-lock.json` with `🔖 bump to <version>`.
7. Creates the local Git tag `<version>`.

The target does not push the commit or tag. Push them separately after reviewing the generated commit:

```bash
git push
git push --tags
```

> **Important:** the current target checks for `v<version>` but creates `<version>` without the `v` prefix. Before running it, also check that the unprefixed tag is unused (`git tag --list '<version>'`); otherwise tag creation can fail after the version commit. Use the exact tag that `make version` creates, or pass the image tag explicitly to the publishing script.

### Harbor Publishing Details

The publishing script reads `.env` from the repository root. Set `IMAGE_URL` to the complete Harbor repository path before running it, as shown by the placeholder in `.env.example`:

```dotenv
IMAGE_URL="[HARBOR_SERVER_URL]/webapps/webforms-link-generator"
```

Pass an image tag as the first argument to avoid an interactive tag prompt:

```bash
./scripts/publish-images.sh 0.1.4
```

Without an argument, the script suggests `git describe --tags --always` as the image tag; pressing Enter accepts that suggestion. Before it logs in, builds the current checkout, or pushes, it displays `IMAGE_URL:TAG` and asks for confirmation. Any answer other than `y`, `Y`, `s`, or `S` cancels publication.

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
  webforms-link-generator:
    image: ${IMAGE_URL:?set IMAGE_URL}:${IMAGE_TAG:?set IMAGE_TAG}
```

Before the first deployment, set these stack environment variables in Portainer:

```dotenv
IMAGE_URL=harbor.somenergia.coop/webapps/webforms-link-generator
IMAGE_TAG=0.1.4
```

Set `PORTAINER_URL`, `PORTAINER_API_TOKEN`, and `PORTAINER_STACK_NAME` in the local `.env` used by `scripts/publish-images.sh`. The redeploy script requires `curl` and `jq`. Each publication then changes only `IMAGE_TAG` and forces Portainer to pull and redeploy the exact version just pushed. To roll back, redeploy the stack after setting `IMAGE_TAG` to a previously published tag.

Also set all required application variables from the [Setup table](#setup) in the Portainer stack environment. The stack fixes the application `PORT` to `3000`; keep `COOKIE_SECURE=true` when served over HTTPS.

The supplied stack targets Docker Swarm with Traefik. It requires an existing external network named `traefik` and these routing variables:

| Variable | Value |
| --- | --- |
| `APP_HOSTNAME` | Public hostname, without a scheme or path. |
| `TRAEFIK_SERVICE` | Traefik service name; use `webforms-link-generator` to match the supplied service label. |
| `TRAEFIK_ENTRYPOINT` | HTTPS entrypoint configured in Traefik (for example `websecure`). |
| `TRAEFIK_PORT` | `3000`, matching the application's internal port. |

Keep `docker-compose.yml` for local builds from this repository. Compose reads the root `.env` by default, not `apps/backend/.env`; to use the application environment file over local HTTP, run:

```bash
COOKIE_SECURE=false docker compose --env-file apps/backend/.env up --build -d
```

This local Compose configuration publishes port `3000` on all host interfaces; it does not use the loopback-only port `13000` mapping from the Docker example above.

Portainer may also need registry credentials configured so it can pull from Harbor.

### Logs

Open the deployed stack in Portainer, select the `webforms-link-generator` service or its running task, then select **Logs**. Gunicorn access logs are written to stdout and Gunicorn, startup, authentication, link-generation, upstream, and unexpected-error application logs are written as human-readable text to stderr. Portainer shows both streams together.

Application logs intentionally include only operational metadata such as operation, type, outcome, status, duration, and the sanitized upstream endpoint. Gunicorn access logs also omit request paths and query strings. Neither log stream includes passwords, secrets, JWTs, cookies, authorization values, request bodies, upstream credentials, query strings, fragments, or generated links. This makes the logs suitable for operational visibility, but they cannot be used to reconstruct a user request or a generated link.

## Verification

Run these commands from the repository root:

```bash
(cd apps/backend && poetry run pytest)
npm --prefix apps/frontend test
npm --prefix apps/frontend run build
docker compose --env-file apps/backend/.env build
```
