# Project status and license

Foody Clear is currently **1.0.0-alpha.1**. It is an actively developed, locally hosted food management application. Alpha updates may change behavior, API fields or database structure.

## Repositories

- [Angular frontend](https://github.com/ATOKODO/foody-clear-front): application UI, PWA and this documentation.
- [NestJS backend](https://github.com/ATOKODO/foody-clear-back): business rules, API and PostgreSQL persistence.

Use compatible revisions of both repositories and review migrations when updating. See [Backups and updates](./deployment/backup.md).

## Current scope

The current app provides the catalog, shopping, inventories, recipes, planning, daily tracking, statistics, themes, barcode lookup and mobile shell described in [All features and routes](./reference/features.md).

It does not provide authentication, remote accounts, multiple isolated profiles, cloud synchronization or an offline write queue. The EN / FR control beside the theme changes the interface language. Local hosting is the intended current use.

## Planned capabilities

The repository roadmap includes multiple profiles with separate food data/goals/history and offline data synchronization beyond the cached app shell.

These are future directions, not features you can enable with an environment flag in this release. There is no promised release date in this documentation.

## Contributions and forks

The project README currently states that external contributions are not open. Public forks remain possible under the project license. Read the current repository guidance before proposing changes; a documentation edit link points to source and does not change that contribution policy.

## License and source attribution

Both repositories use **AGPL-3.0-only**. Read each repository's license file for the governing terms. Documentation and examples included in the frontend follow its declared project license.

Open Food Facts content has its own database and image licensing. Preserve the source attribution and review upstream terms when reusing data or images; the application license does not replace the source's terms.

## Development history

The READMEs describe the project's use of OpenAI coding models under human direction and the role of testing, static analysis and architectural review. This site focuses on operating and understanding the application; the repository READMEs retain that history.
