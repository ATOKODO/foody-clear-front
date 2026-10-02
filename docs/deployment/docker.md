# Docker deployment

This guide builds the two repositories and serves the production frontend through Nginx. PostgreSQL uses a named volume. The backend and database stay on the Compose network; only the frontend port is published.

## Prepare the workspace

Clone the repositories as [sibling directories](../getting-started/installation.md#_1-clone-the-repositories). From their parent directory, copy the supplied examples:

```sh
cp foody-clear-front/docs/public/examples/compose.yml compose.yml
cp foody-clear-front/docs/public/examples/backend.env.example.txt .env
```

You can also download [compose.yml](/examples/compose.yml) and [the environment example](/examples/backend.env.example.txt). Save them as `compose.yml` and `.env` beside the two repositories.

Set your own `POSTGRES_PASSWORD` in `.env` before starting. The example uses `POSTGRES_HOST=db`, with database/schema startup settings explained in [Configuration](../reference/configuration.md).

Expected layout:

```text
foody-clear/
├── compose.yml
├── .env
├── foody-clear-front/
└── foody-clear-back/
```

## Build and run

```sh
docker compose -f compose.yml up -d --build
docker compose -f compose.yml ps
docker compose -f compose.yml logs --tail=100 back
```

Open **http://localhost:8080** on the server, or `http://SERVER_LAN_IP:8080` from another computer on the same network. This HTTP address is useful for checking the deployment; use [HTTPS](./https.md) for phone installation and camera access.

Check the backend through the frontend proxy:

```sh
curl --fail http://localhost:8080/api/product
```

## How requests are routed

| Request | Destination |
| --- | --- |
| Application files and client routes | Frontend Nginx container |
| `/api/product`, `/api/inventory`, etc. | Nginx → `back:3000`, with `/api` removed |
| Barcode lookup | Browser → `https://world.openfoodfacts.net` |
| Database connection | Backend → `db:5432` |

The application Dockerfiles build with Node 22 and produce a frontend Nginx image and a compiled NestJS image. The frontend image serves the Angular app only. The VitePress documentation has its own [static build](../development/documentation.md#build-and-host).

## Persistent storage

The example stores PostgreSQL data in `postgres_data`. `docker compose stop` preserves containers and data. A normal `docker compose down` also retains the named volume; `down -v` deletes it.

Keep [database backups](./backup.md) outside the Compose volume. A volume is persistence, not a backup.

```sh
docker compose -f compose.yml stop
docker compose -f compose.yml up -d
```

## Existing database

If you already run PostgreSQL, remove the example's `db` service and the backend dependency on it. Set `POSTGRES_HOST`, port and credentials to a hostname reachable **from the backend container**. `localhost` inside that container does not refer to the host machine's PostgreSQL server.

Keep the service name `back` because the frontend's supplied Nginx configuration uses it. If you change that name, update the upstream and rebuild the frontend image.

## ARM64 hosts

The repository Dockerfiles can be built on an ARM64 Docker host. For a cross-build from another machine, use Docker Buildx with `--platform linux/arm64` and load or export the resulting images for your target. An exported image archive contains the app, not your PostgreSQL data.

## Deploy a new version

Back up first, update both source checkouts to compatible revisions, rebuild and review backend migration logs. Follow [Backups and updates](./backup.md); alpha releases can introduce breaking changes.
