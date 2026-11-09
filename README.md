# Tahfizh Dashboard

Node.js + Express + MySQL MVC application for Halaqoh clustering.

Environment: copy `.env.example` to `.env` and set DB credentials. The original database is `tahfizh`.

For the new V3 database, import `halaqohv3.sql`, then set `DB_NAME=halaqohv3` in `.env` before starting the application. The existing `tahfizh` database and previous SQL files are not modified.

Run:

```bash
npm install
npm run dev
```
