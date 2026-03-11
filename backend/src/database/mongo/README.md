# MongoDB fake database – migration & seed

Fake data lives in MongoDB collections prefixed with `seed_`. Use them for development, demos, or analytics without touching MySQL.

## Prerequisites

- MongoDB running locally or a `MONGO_URI` in `.env` (default: `mongodb://localhost:27017/telemedicine`).

## Commands (run from `backend/`)

```bash
# Create collections and indexes (run once or after schema changes)
npm run mongo:migrate

# Insert fake data (replaces existing seed_* data)
npm run mongo:seed
```

## Collections (tables)

| Collection           | Description                    |
|----------------------|--------------------------------|
| `seed_users`         | Fake users (email, name, role) |
| `seed_doctors`       | Fake doctors + specializations |
| `seed_appointments`  | Fake appointments              |
| `seed_notifications` | Fake notifications             |
| `seed_packages`      | Fake subscription packages     |

## Schemas

- Seed schemas: `src/database/mongo/schemas/seed-*.schema.ts`
- Entry used by migrate/seed: `schemas/seed-schemas.ts` (no app log schemas).
