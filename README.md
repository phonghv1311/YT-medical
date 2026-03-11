# YT-Medical — Telemedicine App

Full-stack telemedicine platform with video consultations, appointment scheduling, medical records, and multi-role management.

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Backend  | NestJS, TypeScript, Sequelize (MySQL), Mongoose (MongoDB), Redis, BullMQ |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit |
| Realtime | Socket.io, Twilio Video                           |
| Payments | Stripe (configurable: PayPal, VNPay)              |
| Storage  | DigitalOcean Spaces (S3-compatible)                |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example backend/.env

# 3. Start backend
npm run dev:backend

# 4. Start frontend
npm run dev:frontend
```

## Project Structure

```
backend/   — NestJS API server
frontend/  — React SPA
scripts/   — deploy.sh (run on server after rsync)
docs/      — DEPLOYMENT.md (CI/CD, Digital Ocean, Nginx, PM2, SSH)
```

## Deployment

CI runs on push/PR to `main` (build, test, lint). CD deploys to a Digital Ocean droplet on push to `main` via rsync and `scripts/deploy.sh`. See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for:

- GitHub Actions CI/CD
- SSH key setup and GitHub secrets
- Droplet setup (Node, PM2, Nginx, UFW)
- Nginx and `nginx.conf`
- Environment variables (ENV_FILE secret)
- PM2 ecosystem and testing steps
