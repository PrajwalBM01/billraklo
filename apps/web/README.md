# Billraklo web application

The Next.js application provides the public landing page, authentication, dashboard, client management, bill upload and review, purchase reports, and Meta WhatsApp webhook handling.

See the root [README](../../README.md) for the architecture, repository structure, required external services, and complete local setup instructions. Use this package's [.env.example](.env.example) to configure `apps/web/.env.local`.

After completing that setup, run from the repository root:

```sh
pnpm --filter @billraklo/web dev
```

The web app runs at [http://localhost:3000](http://localhost:3000). Run the worker alongside it for queued document processing:

```sh
pnpm --filter @billraklo/worker dev
```

Building and serving the web application:

```sh
pnpm build:web
pnpm --filter @billraklo/web start
```
