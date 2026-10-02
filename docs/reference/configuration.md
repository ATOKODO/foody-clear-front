# Configuration

## Frontend addresses

| Setting | File | Current value |
| --- | --- | --- |
| Development application API | `src/environments/environment.ts` | `http://localhost:3000` |
| Production application API | `src/environments/environment.production.ts` | `/api` |
| Direct barcode lookup | `src/services/open-food-facts-service.ts` | `https://world.openfoodfacts.net` |

Frontend environment values are compiled into the build; changing a container environment variable does not rewrite the already-built Angular configuration.

In production, Nginx proxies `/api/` to `http://back:3000/`, removing the `/api` prefix. Keep the Compose backend service name `back` or update `nginx.conf` accordingly.

For a phone, `localhost` refers to the phone itself. Serve the production app with its `/api` proxy instead of using the default development API address across devices.

## Backend environment

The backend reads `.env` from its working directory and accepts process/container environment variables.

| Variable | Meaning | Default / example |
| --- | --- | --- |
| `POSTGRES_HOST` | Database hostname | Required; `localhost` from source, `db` in Compose |
| `POSTGRES_PORT` | Database port | Required; `5432` |
| `POSTGRES_DB` | Database name | Required; `foody_clear` |
| `POSTGRES_USER` | Database username | Required; `postgres` in examples |
| `POSTGRES_PASSWORD` | Database password | Required; choose your own |
| `PORT` | HTTP listening port | `3000` |
| `SYNC` | TypeORM schema synchronization | `false` |
| `AUTO_SYNC_ON_EMPTY_DB` | Initialize schema if public schema has no base tables | `true` |
| `RUN_MIGRATIONS` | Run migrations on an existing database at startup | `true` |
| `OPEN_FOOD_FACTS_ENV` | Optional backend proxy's upstream environment | `.org` normally; `staging` selects `.net` |
| `OPEN_FOOD_FACTS_USER_AGENT` | Optional backend proxy's identifying request agent | Set an application/contact string |

`OPEN_FOOD_FACTS_ENV` and `OPEN_FOOD_FACTS_USER_AGENT` configure the backend lookup service only. They do not change the current direct frontend barcode request.

## Database startup behavior

Keep `SYNC=false` for normal operation.

- An empty public schema is initialized through synchronization if `AUTO_SYNC_ON_EMPTY_DB=true`.
- An empty schema with that setting disabled fails startup; prepare the schema deliberately first.
- A populated database runs registered migrations if `RUN_MIGRATIONS=true`.
- The migration history table is `typeorm_migrations`.

The empty-database initialization branch returns before running migrations. Subsequent startups use the existing-database branch. See [Backups and updates](../deployment/backup.md) before upgrades.

## Network and access

The backend currently enables broad CORS and does not implement authentication. Use the app on a trusted local network or place access control in a reverse proxy for a wider deployment. The [Docker example](../deployment/docker.md) keeps database and backend ports internal and exposes the frontend.

## Documentation settings

The docs have their own `docs/package.json` and lockfile. `FOODY_DOCS_BASE` controls a hosting subpath and defaults to `/`; it must start and end with `/`.

```sh
FOODY_DOCS_BASE=/foody-clear/ npm run docs:build
```

This setting affects the documentation build only. See [Maintain these docs](../development/documentation.md).
