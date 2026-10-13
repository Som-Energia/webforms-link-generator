# Change Log

## 0.2.0 2026-10-13

- NEW: Add authenticated signature-email link generation, sharing feature-flag request handling with the social-tariff generator.
- NEW: Add an ERP username modal, normalized owner identifiers, browser persistence, and a keyboard-accessible profile menu for editing the username and signing out.
- NEW: Add personal links without tokens, an optional owner toggle, and owner updates on already-generated links.
- NEW: Add optional `lead_tag` campaign attribution to personal and generated links, persist campaign settings, and update existing links when settings change.
- NEW: Add an in-app help dialog with usage instructions, link-type explanations, and campaign guidance.
- NEW: Add selectable expiration periods: 30 or 60 minutes for social-tariff links; 30 minutes, 1 hour, 7 days, or 30 days for signature-email links.
- NEW: Send `expiresAt` to the token API, validate future timezone-aware timestamps, normalize them to UTC, and align countdowns with the requested expiration time.
- FIX: Require HTTPS for custom destination URLs in both the frontend and backend; add inline validation, HTTPS completion, URL clearing, and disabled generation for invalid destinations.
- FIX: Use the `sendSignaturit` feature flag instead of `sendSignature` and correct the corresponding UI description and test expectation.
- IMP: Improve network, upstream HTTP, malformed JSON, and invalid-link diagnostics, with redaction and bounded technical details.
- FIX: Add reusable copy controls with success and failure feedback, safe HTTP/HTTPS link opening, and disabled opening and copying of expired links.
- FIX: Keep the latest owner and campaign settings when an in-flight generation request completes, and account for request time in expiration countdowns.
- IMP: Redesign login, administration, profile, and generator views with Som Energia styling, responsive layouts, Outfit typography, theme colors, loading states, and improved accessible feedback.
- REF: Replace `JWT_API_URL` with the `API_URL` base URL and append `/feature-flags/token`; update deployment configuration and documentation.
- REF: Make `owner` optional in backend requests, then remove `owner` from the frontend/backend request contract and apply attribution to links in the browser.
- IMP: Separate backend application and root deployment environment templates; add sanitized upstream endpoint logging and extend operational logging to both link types.
- FIX: Run Gunicorn with `exec` for container signal handling and exclude nested environment files from Docker build contexts while retaining example templates.
- DOC: Clarify local Python and environment setup, directory-safe installation commands, API configuration, and environment precedence.
- DOC: Document local Docker builds, runtime environment injection, port mapping, health checks, logs, shutdown, cleanup, and root-level verification commands; add a README table of contents and align the configuration table.
- TEST: Extend backend and frontend coverage for signature links, owner normalization and editing, clipboard failures, URL validation, campaign settings, help dialogs, expiration, and sanitized logs; update assertions for revised labels and request contracts.

## 0.1.5 2026-10-01

- IMP: Configure the Portainer stack for an external Traefik network, Swarm routing labels, configurable hostname and TLS entrypoint, and deployment environment variables.
- IMP: Add Portainer-compatible application and Gunicorn logs for startup, authentication, link generation, upstream responses, request timing, and unexpected errors, excluding sensitive request data.
- FIX: Return a generic JSON response for unexpected server errors while preserving HTTP exceptions; reuse the application instance in the WSGI entrypoint.
- DOC: Document Portainer log access and the operational metadata recorded by each log stream.
- TEST: Add checks for logging behavior and sensitive-data exclusion.
- IMP: Synchronize backend and frontend package versions to 0.1.5.

## 0.1.4 2026-10-01

- IMP: Add Make `help` as the default target, expose image publishing, and delegate development and version commands to dedicated shell scripts.
- IMP: Publish images from the current checkout and automate Portainer redeployment with the exact image tag, forced image pulling, and preservation of stored stack configuration.
- IMP: Parameterize the Portainer image repository and tag, and create release tags without the `v` prefix.
- FIX: Update the version script's generated commit message to match the release naming convention.
- DOC: Expand shared-version, Harbor publishing, Portainer configuration, redeployment, and rollback instructions; remove an obsolete legacy-source reference.
- IMP: Synchronize backend and frontend package versions to 0.1.4.

## 0.1.3 2026-09-30

- NEW: Display the frontend package version on the administration page.
- IMP: Add interactive shared-version updates with release commits and tags, plus Harbor image publishing with confirmation, registry login, image building, pushing, and digest reporting.
- TEST: Update administration-page tests for the displayed application version.
- IMP: Synchronize backend and frontend package versions to 0.1.3.

## 0.1.2 2026-09-30

- IMP: Add a dedicated Portainer Compose definition for prebuilt registry images and retain Compose builds for local use.
- IMP: Switch the frontend Docker build stage from Node Alpine to Node slim.
- DEP: Raise the frontend Node.js minimum to 24.15.0 within the Node 24 series and update the lockfile engine requirement.
- DOC: Document production image publishing, Harbor registry configuration, and Portainer deployment using prebuilt images.
- IMP: Synchronize backend and frontend package versions to 0.1.2.

## 0.1.1 2026-09-24

- I18N: Use Catalan for backend link-generation and external-token API error messages.
- REF: Rename the social-tariff-specific URL constant to `DEFAULT_FORM_URL`.
- IMP: Set the backend and frontend package versions to 0.1.1.

## 0.1.0 2026-09-24

- NEW: Introduce the Flask backend and React/Vite administration UI for authenticated `socialTariffByPass` link generation through an external token API.
- NEW: Add password login, signed eight-hour sessions, protected administration and generation routes, logout, and configurable secure session cookies.
- NEW: Support the default domestic contracting form and validated custom HTTP/HTTPS destinations, preserving query parameters and fragments while replacing duplicate token parameters.
- NEW: Add generated-link display and clipboard copying, loading and error states, expiration notices and countdowns, and a placeholder for a future signature generator.
- NEW: Serve the frontend production build from Flask, add a health endpoint and SPA fallback, and report missing builds and upstream failures.
- NEW: Add a branded logo, customizable styling, and persistent light/dark themes with system-preference fallback and a theme-aware logo component.
- IMP: Add the single-container multi-stage Docker build, Gunicorn runtime, local Compose configuration, environment configuration, and Make development commands with combined logs and process cleanup.
- CI: Add backend tests, frontend builds, and frontend tests in GitHub Actions; pin Ubuntu 24.04 runners and update checkout and language setup actions to address warnings.
- DEP: Establish Python 3.12, Flask, Gunicorn, Requests, python-dotenv, React, Vite, and test dependencies with Poetry and npm lockfiles; upgrade the frontend toolchain to Node 24 and use `npm ci` in Docker.
- DOC: Add project structure, setup, local development, proxy behavior, troubleshooting, production and Portainer instructions, Node version guidance, and a CI status badge.
- TEST: Add backend authentication, URL and upstream-response tests, plus frontend API, administration, generator countdown, clipboard, and theme tests.
