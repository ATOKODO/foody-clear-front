# Install locally

This guide runs both repositories from source, with PostgreSQL in Docker. Run application commands from the repository indicated above each block.

## Requirements

- Git and npm.
- Node.js **24.15 or later in the 24.x line**, or **22.22.3 or later in the 22.x line**. These satisfy the Angular 22 frontend requirements. See the [Angular compatibility table](https://angular.dev/reference/versions) when upgrading.
- Docker with the Compose plugin for the database, or an existing PostgreSQL 17 server.
- A modern browser. Camera access on a phone requires [HTTPS](../deployment/https.md).

Check your tools:

```sh
node --version
npm --version
git --version
docker compose version
```

## 1. Clone the repositories

Use a shared parent directory:

```sh
mkdir foody-clear
cd foody-clear
git clone https://github.com/ATOKODO/foody-clear-front.git
git clone https://github.com/ATOKODO/foody-clear-back.git
```

The following examples assume these sibling folders. No global Angular or Nest CLI installation is necessary: npm scripts use the local dependencies.

## 2. Configure the backend

From `foody-clear-back`, create `.env`:

```dotenv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=foody_clear
POSTGRES_USER=postgres
POSTGRES_PASSWORD=replace-with-your-local-password
PORT=3000
SYNC=false
AUTO_SYNC_ON_EMPTY_DB=true
RUN_MIGRATIONS=true
```

Replace the example password before starting the database. Keep this file private and out of Git. The database container and backend must use matching credentials.

Install the backend dependencies and start PostgreSQL:

```sh
npm ci
docker compose -f docker-compose.yaml up -d db
docker compose -f docker-compose.yaml exec db pg_isready -U postgres -d foody_clear
```

The backend repository's Compose file starts **only PostgreSQL**, on port `5432`. It does not declare a named data volume. Use the [full deployment example](../deployment/docker.md) for a persistent installation and [back up](../deployment/backup.md) any data you want to keep before replacing containers.

For an existing PostgreSQL installation, create the `foody_clear` database, grant the configured user access, and skip the Docker commands.

## 3. Start the backend

Still in `foody-clear-back`:

```sh
npm run start:dev
```

Leave this terminal open. On an empty database, startup creates the schema when `AUTO_SYNC_ON_EMPTY_DB=true`. On a populated database, startup runs migrations when `RUN_MIGRATIONS=true`. Routine schema synchronization remains disabled with `SYNC=false`.

In another terminal, confirm that the catalog endpoint responds:

```sh
curl --fail http://localhost:3000/product
```

An empty catalog normally returns an empty list. A fresh installation does not come with a ready-made food catalog or meal plan.

## 4. Start the frontend

From `foody-clear-front`:

```sh
npm ci
npm start
```

Open **http://localhost:4200**. The development configuration calls the backend at `http://localhost:3000`. These applications run in separate terminals.

If your backend uses another address, update `src/environments/environment.ts` before starting the frontend. Barcode lookup still calls `https://world.openfoodfacts.net` directly; changing the application API URL does not change that host.

## 5. Create your first data

Continue with [Your first day](./first-steps.md). If a screen cannot load, check both server terminals and [Troubleshooting](../troubleshooting.md).

## Stop or restart

Use `Ctrl+C` in each application terminal. To stop the database container without removing it:

```sh
docker compose -f docker-compose.yaml stop db
```

Restart it with `up -d db`, then restart the two npm processes. For a durable server, use [Docker deployment](../deployment/docker.md).
