# Plants!

A Vue/Bootstrap plant care tracker with an Express API and MongoDB storage.

## Run locally

Use Node **24.11 or newer** (Node 24 LTS recommended; `.nvmrc` selects 24).

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
