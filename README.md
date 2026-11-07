# Plants!

A Vue/Bootstrap plant care tracker with an Express API and MongoDB storage.

## Run locally

Use **Node 26 LTS, version 26.13.0 or newer within the 26.x line**. `.nvmrc` and the Dockerfiles select Node 26; CI checks for the latest Node 26 release. With nvm, run `nvm install` and `nvm use` from the repository root.

```sh
npm ci
npm ci --prefix app
cp .env.example .env
# Edit .env to point at your MongoDB database.
npm start
```

In another terminal, run `npm run serve --prefix app` and open the URL Vite prints. The development server proxies `/api` to port 4000. The database name remains `startup`, with the existing `user` and `plant` collections. Fuzzy search requires the existing Atlas Search index named `name`; ordinary list filtering does not.

For a single-process deployment, run `npm run build --prefix app`, then `npm start`; Express serves the built UI. Alternatively, `docker compose up --build` serves the UI on port 8080 and proxies `/api` to the backend. Compose reads database configuration from `.env`; use a database hostname reachable from inside the container. Terminate HTTPS at your deployment proxy.

The default API URL is same-origin. Separate frontend hosting can set `VITE_API_ORIGIN` at build time (`VUE_APP_API_ORIGIN` remains supported) and `CLIENT_ORIGIN` on the API. Adapt the nginx `connect-src` policy if using a separate API origin. Do not put database credentials in frontend environment files.

## Validation

```sh
npm test
npm run build --prefix app
npx --prefix app playwright install chromium
npm run test:e2e --prefix app
npm audit
npm audit --prefix app
```

API tests use a fake database to verify authentication, ownership, input validation, error handling, and care actions. Browser tests mock API responses so they exercise failure and retry states without touching real plants. A live MongoDB deployment and container build need separate deployment verification.

## Upgrade notes

- Replaced Vue CLI/Webpack with Vite; retained Vue, Bootstrap, icons, and installable PWA support. `build:dev` now builds the current checkout without changing Git branches. See the [Vite guide](https://vite.dev/guide/) and [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5/).
- Dependencies are pinned with lockfiles. `npm ci` provides repeatable installs.
- Existing passwords and plant records remain compatible. Sessions stay valid until manual logout, and signing in again reuses the existing token. Existing stored expiration dates are ignored. Logging out revokes the shared token on all devices; the next login creates a new one. Clearing browser storage still requires signing in again.
- Startup creates a unique username index and an owner index. Back up the database before deployment. If duplicate usernames already exist, index creation fails rather than silently modifying or deleting accounts; resolve duplicates before restarting.
- The API assigns ownership, restricts editable fields, validates credentials and IDs, limits authentication attempts and request sizes, hides internal errors, and returns security headers. Browser tokens remain in localStorage; use HTTPS and keep the content security policy in place.
- New passwords require at least eight characters and no more than 72 UTF-8 bytes (bcrypt's limit). Existing shorter passwords still work.
- Authentication rate limiting is in memory and applies per API instance. Behind a reverse proxy, clients conservatively share its limit; configure Express `trust proxy` only for your actual trusted proxy topology if individual client limits are needed.

## Dependency maintenance

[Dependabot configuration](.github/dependabot.yml) checks both npm projects, both Dockerfiles, and GitHub Actions quarterly (January 1, April 1, July 1, October 1). Minor/patch version updates are grouped per ecosystem and directory; major versions remain individual PRs. Security updates are independent of the routine schedule. See the [GitHub configuration reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

[CI](.github/workflows/ci.yml) installs committed lockfiles on Node 26, runs API/session tests, builds the frontend, runs Chromium smoke tests with mocked APIs, and builds both Docker images. It runs for pull requests, pushes to `main`, and manual runs. It requires no production secrets or live database and does not push images, auto-merge, or deploy.

After merging these files into the default branch, configure the repository in GitHub:

- Enable **Dependency Graph**, **Dependabot Alerts**, and **Dependabot Security Updates** under the repository's security settings. YAML alone does not enable these settings. See [GitHub's security-update setup](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).
- Require human review and the **Tests and builds** check before merging through branch protection or a ruleset. Leave auto-merge disabled.
- Review critical alerts as soon as practical (target 24–48 hours), applicable high-severity alerts within seven days, and medium/low alerts at the next quarterly review unless exposure warrants sooner. These are review targets, not delays imposed on security PRs.

Compose currently uses only `build:` services, so there is no `docker-compose` Dependabot entry. Add one if service `image:` references are introduced. Dependabot's Docker checks track base-image references, not every OS package vulnerability inside the images. The current floating tags (especially `nginx:stable-alpine`) can receive new image contents without a manifest PR; review image advisories and rebuild with `--pull` after approval. Review runtime support separately each quarter, keeping `.nvmrc`, package engine requirements, and Docker Node versions aligned.

After reviewing and merging an update, use the existing Compose deployment process: rebuild with a base-image pull and recreate services, then inspect service status/logs and manually check login and plant operations. Confirm backups and a rollback path before database migrations; routine updates do not require `docker compose down` or deleting volumes.

## Container health

Both Docker images include health checks that run every 30 seconds and mark the container unhealthy after three consecutive failures:

- **Backend:** requests `GET /api/health` on its local `PORT` (default 4000). This public, non-cached readiness endpoint returns HTTP 200 only when MongoDB answers a ping, or HTTP 503 with a generic status if the database is unavailable. The database operation has a two-second timeout, the HTTP probe has a four-second timeout, and Docker allows five seconds per check. Startup has a 30-second grace period.
- **Frontend:** checks that nginx can serve the app's root page on port 80. It uses the image's built-in `wget`, with a three-second request timeout, a five-second Docker timeout, and a ten-second startup grace period. Backend availability is tracked separately.

Compose waits for a healthy backend before starting the frontend. These checks report health; they do not automatically restart or deploy containers. See [Docker's startup-order documentation](https://docs.docker.com/compose/how-tos/startup-order).

After an approved rebuild and recreation, use `docker compose ps` to see health status. To inspect recent failures, run `docker inspect --format '{{json .State.Health}}' CONTAINER_NAME` using the container name from that output. No database data is changed by the health probe.
