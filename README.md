# Foody Clear — Angular Frontend

Foody Clear is an open-source food management application that brings product catalogs, inventory, shopping, meal preparation, planning, and nutrition tracking together in one place.

This repository contains **only the Angular frontend** for Foody Clear. It consumes a separate backend API to read and store data.

> The project is currently in **alpha** (`1.0.0-alpha.1`): it is under active development, and breaking changes may still occur.

## Features

- **Daily dashboard**: planned and logged meals, nutrition progress, daily expenses, and quick entry.
- **Food catalog**: manage products, barcodes, prices, units, portions, and nutrition values.
- **Reference data**: categories, generic products, and tags for organizing and enriching the catalog.
- **Stock and inventory**: track available and normalized quantities across multiple storage locations.
- **Shopping lists**: reusable lists, templates, collected-item tracking, and conversion of purchases into inventory.
- **Meal prep**: compose dishes and meals, check their availability against current stock, and generate missing purchases.
- **Planning**: time slots, day sets, templates, food cycles, assignments, and a calendar.
- **Daily tracking**: log consumed products and external meals, and convert planned items into actual consumption entries.
- **Statistics**: expense history, nutrition-goal tracking, and product price trends.
- **Light and dark themes** with a responsive interface built using Angular Material, Tailwind CSS, and SCSS.

## Roadmap and Deployment Scope

The next features currently planned are:

- **Multiple profiles**, so several people or usage contexts can keep separate food data, goals, and planning.
- **Barcode-based product lookup**, using the Open Food Facts API to retrieve product information and speed up catalog entry.
- **Offline PWA support**, allowing the application to remain usable and manage local data without a network connection.

For now, Foody Clear is intended to remain a **locally hosted application**. Cloud services, remote accounts, and authentication are not part of the current scope. The project still uses a separated frontend/backend architecture to keep responsibilities and data flows clearly isolated, even though both parts are designed to run locally.

## An Entirely Vibe-Coded Project

Foody Clear is also a full-scale experiment designed to test the capabilities of coding models on a real-world project: architecture design, business feature development, user interface creation, test writing, regression fixing, and continuous refactoring.

Development of this frontend mainly began in early February 2026 with the arrival of **GPT-5.3-Codex**, then continued with the models that followed it: **GPT-5.4, GPT-5.5, and GPT-5.6**. The entire project was built using only **OpenAI's Plus plan**.

The project was produced **99.99% with OpenAI models**, under human direction. This vibe-coding approach is intentional and documented transparently: the goal is both to build a functional application and to observe how far these models can go in developing, maintaining, and evolving an Angular codebase over time.

The interface was initially designed with **wireframes created in Figma ahead of development**. This design work continued throughout the project as new tool capabilities became available: transforming the existing application into Figma mockups, editing screens in Figma, and then bringing those changes back into the Angular codebase.

This **code → Figma → code** loop was notably explored with **`mcp/html-to-design`**, making it possible to convert working interfaces into editable mockups, evolve them visually, and use the results to guide frontend implementation and refactoring.

Development and refactoring are guided in particular by:

- the **official Angular skills**, to apply ecosystem conventions and best practices;
- **Figma and its MCP tools**, for wireframes and two-way design-to-code iterations;
- **`ng lint`**, to detect static issues and maintain a consistent codebase;
- **SonarQube Community**, to guide fixes, reduce technical debt, and support refactoring.

These tools serve as guardrails, but they do not replace a critical review of generated code.

## Tech Stack

- Angular 22 with lazy-loaded standalone components
- Angular Material and Angular CDK
- NgRx Signals for reactive stores
- RxJS and Luxon
- Tailwind CSS 4 and SCSS
- Jasmine/Karma for unit testing
- Playwright for end-to-end testing
- ESLint and Angular ESLint

## Project Structure

```text
src/
├── app/           # Application shell, navigation, routes, and global UI
├── components/    # Reusable business components
├── features/      # Main pages and features
├── services/      # Communication with the Foody Clear API
├── interfaces/    # TypeScript contracts and models
├── environments/  # Environment-specific API configuration
└── utils/         # Shared utilities
```

## Prerequisites

- A Node.js version compatible with Angular 22
- npm
- A running instance of the Foody Clear backend API

By default, the frontend uses:

- `http://localhost:3000` in development;
- `/api` in production, on the same domain as the application.

These values are configured in `src/environments/environment.ts` and `src/environments/environment.production.ts`.

## Installation and Development

Install the dependencies:

```bash
npm ci
```

Start the backend API on `http://localhost:3000`, then launch the frontend:

```bash
npm start
```

The application is available at [http://localhost:4200](http://localhost:4200). The development server automatically reloads the page whenever a source file changes.

## Available Commands

```bash
npm start              # Start the development server
npm run build          # Create a production build in dist/
npm run watch          # Continuously build in development mode
npm test               # Run unit tests
npm run test:coverage  # Run unit tests with coverage
npm run lint           # Run ESLint analysis
npm run e2e            # Run Playwright end-to-end tests
npm run e2e:headed     # Run Playwright with a visible browser
npm run e2e:smoke      # Run Playwright scenarios tagged with @smoke
```

Before running the end-to-end tests for the first time, install the Playwright browsers:

```bash
npx playwright install
```

## Forks and Contributions

The source code is public and may be **forked**, studied, and adapted in accordance with the AGPL-3.0 license. You are free to use a fork to experiment, explore other approaches, or continue your own version of the project.

However, **external contributions are not currently open**. Pull requests are therefore not being requested and may not be reviewed. This position may change once the project and its collaboration framework are sufficiently stable.

## License

This project is distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for the full terms.
