# Overview

Foody Clear is a self-hosted food management app. It connects a product catalog, shopping lists, inventory, reusable meals and daily nutrition tracking. The frontend runs in your browser; a NestJS backend stores application data in PostgreSQL.

## The everyday workflow

1. **Catalog:** describe a food once, including package size, optional portions, nutrition and price.
2. **Shopping lists:** prepare quantities to buy, check collected products and transfer them into an inventory.
3. **Inventories:** record stock in locations such as your pantry or refrigerator.
4. **Meal prep:** combine products into dishes and assemble dishes or products into meals.
5. **Templates and cycles:** define repeatable plans, daily goals and meal slots.
6. **Assignments:** place a cycle on real calendar dates.
7. **Day input:** record actual consumption, or convert planned items using selected inventories.
8. **Statistics:** compare nutrition totals with targets and review purchases and price history.

Planning a meal does not reserve or consume ingredients. Inventory changes happen when you record stock movements or actual consumption. [External meals](../user-guide/external-meals.md) record nutrition and spending without touching inventory.

## Choose a starting point

| Your situation | Recommended guide |
| --- | --- |
| I want to run the app from source | [Install locally](./installation.md) |
| I want an application server with containers | [Docker deployment](../deployment/docker.md) |
| The app is already running | [Your first day](./first-steps.md) |
| I want to understand all screens | [Features and routes](../reference/features.md) |

## Current boundaries

The release is an alpha. There are no accounts, user profiles, cloud synchronization or queued offline writes. PostgreSQL is the durable store; browser preferences include theme selection. The installable mobile app caches its application shell, while data operations require the backend.

The barcode lookup uses Open Food Facts over the internet and needs a separate connection even when your application server is local. Read [barcode lookup](../user-guide/barcode.md) for the current upstream host and manual fallback.

See [project status](../project.md) for licensing and the roadmap.
