# Open Helpdesk — Frontend

The web app of [Open Helpdesk](https://github.com/Hyzokaaa/open-helpdesk), the open-source helpdesk for modern teams: the agent workspace, admin settings and customer portal. Built with React, Vite and Tailwind CSS.

> Looking to **install** Open Helpdesk? Start at the [main repository](https://github.com/Hyzokaaa/open-helpdesk): it covers Docker Compose, the native install script and manual deployment. This repository is for working on the UI itself.

[Website](https://openhelpdesk.dev) · [API docs](https://openhelpdesk.dev/docs) · [Backend](https://github.com/Hyzokaaa/open-helpdesk-backend) · [Releases](https://github.com/Hyzokaaa/open-helpdesk-client/releases)

## Requirements

- Node.js 22+
- A running [backend](https://github.com/Hyzokaaa/open-helpdesk-backend) (by default on `http://localhost:3000`)

## Run it locally

```bash
npm install
cp .env.example .env        # VITE_API_URL points at the backend
npm run dev                 # http://localhost:5173
```

Sign in with the admin user the backend creates on startup (`admin@example.com` / `admin1234` with its `.env.example`).

## Deploying

`npm run build` produces a static site in `dist/` that any web server can host.

- **Docker**: a production image (Nginx) is published to `ghcr.io/hyzokaaa/open-helpdesk-client` and used by the main repository's Docker Compose setup.
- **Native**: [`install.sh`](install.sh) builds the app and serves it with Nginx on a Linux server (Node.js 22+ and Nginx required). It is interactive, so download it first and then run `bash install.sh`. [`update.sh`](update.sh) upgrades an existing install.

The [main repository](https://github.com/Hyzokaaa/open-helpdesk#option-3-manual-deployment-without-docker) has the full guide, including HTTPS.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Project layout

```
src/modules/<feature>/
  components/   UI pieces of the feature
  pages/        routed screens
  services/     API calls
  domain/       types and pure logic
  hooks/
```

Shared UI components live in `src/modules/app/modules/ui`, and every user-facing string goes through the translations in `src/modules/app/i18n` (English and Spanish).

## Contributing

1. Fork the repository and branch from `dev`.
2. Add new text to the translations in both languages — no hard-coded strings.
3. Make sure `npm run build` and `npm test` pass.
4. Open a pull request against `dev`.

Bugs and feature requests are welcome as [issues](https://github.com/Hyzokaaa/open-helpdesk-client/issues).

## License

[AGPL-3.0](LICENSE)
