# Deployment Guide: CI/CD, Digital Ocean Droplet, Nginx, PM2

This guide covers GitHub Actions CI/CD, deploying to a Digital Ocean droplet, and managing env vars, SSH, and Nginx.

---

## 1. Environment Variables Management

### Passing secrets from GitHub to the droplet

**Option A: GitHub Secret `ENV_FILE` (recommended)**  
In the CD workflow we create `backend/.env` on the server from a single GitHub secret:

1. In GitHub: **Settings → Secrets and variables → Actions**, add a secret named `ENV_FILE`.
2. Paste your **entire production `.env`** file contents (same format as `.env.example`).  
   Use real production values for DB, JWT, Stripe, etc.
3. The CD workflow runs:  
   `echo "${{ secrets.ENV_FILE }}" > /var/www/myapp/backend/.env`  
   so every deploy updates the server’s `.env` from that secret.

**Option B: Create `.env` once on the server**  
If you prefer not to use `ENV_FILE`:

1. **Remove** the **“Create .env on server”** step from `.github/workflows/cd.yml` (otherwise a missing/empty `ENV_FILE` would overwrite your server `.env` with an empty file).
2. SSH into the droplet and create `/var/www/myapp/backend/.env` manually (e.g. copy from `.env.example` and fill in production values). Set `PORT=3001` so Nginx can proxy to the backend.
3. Rsync already excludes `.env`, so this file will not be overwritten by future deploys.

### Using env vars in the Node.js app

The backend uses **NestJS `ConfigService`** (and typically `@nestjs/config`), which loads `backend/.env` automatically. No extra code is required; use:
- In production behind Nginx, set **`PORT=3001`** in `backend/.env` so the provided `nginx.conf` can proxy to the backend.

- `config.get<string>('PORT')`
- `config.get<string>('DB_HOST')`
- etc.

If you were using plain Node.js, you would use `require('dotenv').config()` at the top of your entry file (e.g. before creating the app).

---

## 2. SSH Setup (GitHub Actions ↔ Droplet)

### 2.1 Generate an SSH key pair (if you don’t have one)

On your **local machine**:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy -N ""
```

This creates:

- `~/.ssh/github_deploy` (private key)
- `~/.ssh/github_deploy.pub` (public key)

### 2.2 Add the public key to the droplet

1. Copy the public key:  
   `cat ~/.ssh/github_deploy.pub`
2. SSH into the droplet (with your normal user, e.g. `root` or `deploy`):  
   `ssh root@YOUR_DROPLET_IP`
3. Append the public key to `authorized_keys`:  
   `echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys`  
   Or, if `~/.ssh` doesn’t exist:  
   `mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`

### 2.3 Add GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret name        | Value |
|--------------------|--------|
| `SSH_PRIVATE_KEY`  | Entire contents of `~/.ssh/github_deploy` (private key). |
| `DROPLET_USER`     | User you SSH as (e.g. `root` or `deploy`). |
| `DROPLET_IP`       | Droplet IP or hostname. |
| `ENV_FILE`         | (Optional) Full production `.env` file content. |

The CD workflow uses these to connect and run the deploy script.

---

## 3. Digital Ocean Droplet Initial Setup

Run these on a **fresh Ubuntu droplet** (as root or with sudo).

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Create app directory and set ownership (replace 'deploy' with your user if different)
sudo mkdir -p /var/www/myapp
sudo chown -R $USER:$USER /var/www/myapp

# Firewall: allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Optional: use **nvm** instead of NodeSource:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
npm install -g pm2
```

### Nginx

- Copy the project’s `nginx.conf` to the droplet, then:  
  `sudo cp nginx.conf /etc/nginx/sites-available/telemedicine`
- Edit `server_name` (e.g. replace `example.com` with your droplet IP or domain).
- Enable and reload:  
  `sudo ln -sf /etc/nginx/sites-available/telemedicine /etc/nginx/sites-enabled/`  
  `sudo nginx -t && sudo systemctl reload nginx`

Backend should listen on **port 3001** when behind this Nginx (set `PORT=3001` in `backend/.env` on the server). The provided `nginx.conf` proxies `/api/`, `/uploads/`, and `/ws` to `http://127.0.0.1:3001`.

---

## 4. PM2 Ecosystem

The repo includes `ecosystem.config.js` at the root. The deploy script uses it so that:

- The app name is `telemedicine`.
- The script run is `backend/dist/main.js` with `cwd: ./backend` (so `.env` and paths resolve correctly).

No change is required unless you want more instances or different env.

---

## 5. Final Testing Steps

1. **Make a small change**  
   e.g. in the React app or in the backend (e.g. a comment or a log line).

2. **Commit and push to `main`**  
   `git add . && git commit -m "CI/CD test" && git push origin main`

3. **Check GitHub Actions**  
   - **Actions** tab → “CI” workflow should run on the push (and on PRs to `main`).  
   - “CD” workflow should run on push to `main` (checkout → SSH → rsync → deploy script).

4. **SSH into the droplet**  
   `ssh YOUR_USER@DROPLET_IP`  
   - `ls -la /var/www/myapp` – repo files (no `node_modules` in synced dirs).  
   - `ls -la /var/www/myapp/frontend/dist` – built frontend.  
   - `pm2 list` – `telemedicine` should be running.  
   - `pm2 logs telemedicine` – no startup errors.

5. **Visit the app**  
   Open `http://YOUR_DROPLET_IP` in a browser. You should see the React app and be able to use the API (e.g. login) if env vars are set correctly.

If CI fails: fix tests/lint locally and push again. If CD fails: check Actions logs (SSH, rsync, or deploy script), and on the server check `backend/.env`, `pm2 list`, and `pm2 logs telemedicine`.
