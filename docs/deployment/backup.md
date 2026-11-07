# Backups and updates

Application data lives in PostgreSQL. Back up the database and keep a private copy of your deployment configuration. Frontend images, browser caches and a database volume alone are not portable data backups.

These commands assume the [example deployment](./docker.md), database `foody_clear` and user `postgres`. Substitute your configured names when they differ.

## Create a backup

From the workspace containing `compose.yml`:

```sh
mkdir -p backups
docker compose -f compose.yml exec -T db \
  pg_dump -U postgres -d foody_clear -Fc > backups/foody-clear.dump
```

Choose a new filename for each backup instead of overwriting the only copy. Check the command's exit status, file size and archive contents:

```sh
docker compose -f compose.yml exec -T db \
  pg_restore --list < backups/foody-clear.dump
```

Copy successful backups to storage outside the server. Treat them as private: they contain your catalog, stock, meals and accounting data. See PostgreSQL's [SQL dump and restore documentation](https://www.postgresql.org/docs/17/backup-dump.html) for custom-format archives.

## Verify a restore in a separate database

Do not test by overwriting your active database. Create a separate empty verification database:

```sh
docker compose -f compose.yml exec -T db \
  createdb -U postgres -T template0 foody_clear_restore_check
docker compose -f compose.yml exec -T db \
  pg_restore -U postgres -d foody_clear_restore_check \
  --no-owner --no-acl --exit-on-error < backups/foody-clear.dump
docker compose -f compose.yml exec -T db \
  psql -U postgres -d foody_clear_restore_check \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

Inspect representative product and inventory data before considering the backup verified. The restore-check database is separate from the backend's configured target.

## Recover an installation

1. Stop the backend to prevent writes during recovery.
2. Create a new empty recovery database and restore the selected archive into it using the verified procedure above.
3. Change `POSTGRES_DB` in your private configuration to the recovered database.
4. Recreate the backend with that configuration and verify the app before retiring the old database.

Do not apply a restore blindly to a database that already contains application tables. Keep the original database available until recovery is checked.

## Update the app

1. Record the currently running frontend and backend revisions.
2. Make and verify a fresh database backup.
3. Update both repositories to the intended compatible revisions.
4. Rebuild and recreate services:

```sh
docker compose -f compose.yml up -d --build
docker compose -f compose.yml logs --tail=100 back
```

5. Check Catalog, inventory quantities, a planning day and statistics.
6. Activate the frontend update if the mobile app shows **Update app**.

The backend runs migrations on existing databases when `RUN_MIGRATIONS=true`. Keep `SYNC=false`; startup behavior is described in [Configuration](../reference/configuration.md#database-startup-behavior).

## Rollback considerations

An older application image may not understand a migrated schema. Use a compatible database backup in a separate recovery database when a schema rollback is required. Do not assume every migration can be reversed without loss.

For deliberate migration operations in a source checkout, the backend provides `npm run migration:run` and `npm run migration:revert`. Review the migration and back up before using a revert on data you want to retain.
