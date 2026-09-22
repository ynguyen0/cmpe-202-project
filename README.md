# CMPE 202

Term Project Tech Stack: **React + Vite → Node.js + Express → PostgreSQL**.

## Run locally

Prerequisites: Node.js 22.12+ and Docker Desktop running.

```sh
npm install
cp server/.env.example server/.env
npm run db:up
npm run db:migrate
npm run dev
```

Open http://localhost:5173. Add a note, refresh, and confirm it persists.
The API runs on http://localhost:3001. `GET /api/health` checks database connectivity.
If port 3001 is changed in `server/.env`, update the proxy in `client/vite.config.ts` too.

## Structure

- `client/`: React UI and Vite development proxy.
- `server/`: Express API, PostgreSQL connection pool, schema setup and API tests.
- `compose.yaml`: local PostgreSQL 17, bound to localhost with a persistent volume.
- `docs/aws-database.md`: connecting the backend to PostgreSQL on AWS.
- `docs/project-journal.md`: weekly Scrum Reports and project progress notes.

## Commands

```sh
npm run typecheck    # Strict type checking for frontend, backend, and tests
npm test             # API validation and failure handling tests (mock database)
npm run build       # Build React into client/dist and compile the API into server/dist
npm start           # Express serves the API and built React app on port 3001
npm run db:down      # Stop local PostgreSQL; retain saved notes
```

`npm run db:migrate` creates the example table if missing and can be rerun (this is an
initial schema bootstrap, not a versioned migration system). We can add versioned migrations
when the application schema is developed.

## AWS

We'll follow these [AWS connection instructions](docs/aws-database.md) when our database is available.
Currently, we don't have AWS resources created yet, so we can use Docker during development and then move to AWS when we need a shared deployment. 

`.env` and CA certificate files are ignored by Git.
Don't put database credentials in React or any `VITE_*` variable.

The notes example has no authentication and is just for local development. We'll add authentication
and authorization before making a deployed app with private data available to users.

References: [Vite setup](https://vite.dev/guide/),
[node-postgres TLS configuration](https://node-postgres.com/features/ssl).

## TypeScript development

React components use `.tsx`; backend code, tests, and Vite configuration use `.ts`.
Both workspaces enable strict type checking. `npm run dev` uses Vite for the frontend
and `tsx watch` for the API; run `npm run typecheck` to check types across the project.
`npm run build` compiles the backend to JavaScript and builds the frontend, then
`npm start` runs the compiled backend. Rebuild after changing code for production.
Backend relative imports keep `.js` extensions so the compiled Node.js modules resolve
correctly; TypeScript and tsx resolve those imports to `.ts` during development.
TypeScript does not validate incoming network data at runtime; the API still validates
note input before writing to PostgreSQL.
