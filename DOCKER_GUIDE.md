# 🐳 SmartDoc — Docker & Docker Compose Guide

> Complete guide to containerizing, running, and managing the **SmartDoc** microservices platform with Docker.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    smartdoc-net (bridge)                  │
│                                                           │
│  ┌──────────────┐  port 5173→80                          │
│  │   Frontend   │ (React/Vite → Nginx)                   │
│  └──────┬───────┘                                        │
│         │ HTTP calls to each service                     │
│  ┌──────▼────────────────────────────────────────────┐   │
│  │  auth-service        :3001                        │   │
│  │  patient-service     :3002  ──uploads volume      │   │
│  │  doctor-service      :3003                        │   │
│  │  appointment-service :3004  ──→ notification-svc  │   │
│  │  payment-service     :3005                        │   │
│  │  notification-service:3006                        │   │
│  │  telemedicine-service:3007                        │   │
│  │  ai-service          :3008  ──uploads volume      │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │
         ▼  MongoDB Atlas (external cloud DB)
```

### Port Map

| Service               | Container Port | Host Port |
|-----------------------|---------------|-----------|
| Frontend (Nginx)      | 80            | **5173**  |
| auth-service          | 3001          | **3001**  |
| patient-service       | 3002          | **3002**  |
| doctor-service        | 3003          | **3003**  |
| appointment-service   | 3004          | **3004**  |
| payment-service       | 3005          | **3005**  |
| notification-service  | 3006          | **3006**  |
| telemedicine-service  | 3007          | **3007**  |
| ai-service            | 3008          | **3008**  |

---

## ✅ Prerequisites

| Tool           | Minimum Version | Install                                      |
|----------------|-----------------|----------------------------------------------|
| Docker Desktop | 24+             | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2 (bundled)    | Included with Docker Desktop                 |
| Node.js        | 20+ (local dev) | https://nodejs.org                           |

Verify your installation:
```bash
docker --version
docker compose version
```

---

## 🚀 Quick Start (Full Stack in one command)

### 1 — Clone & enter the project
```bash
git clone https://github.com/your-org/SmartDoc.git
cd SmartDoc
```

### 2 — Create your environment file
```bash
cp .env.example .env
```

Open `.env` and fill in **your real secrets**:
- MongoDB Atlas connection strings (`MONGODB_URI_*`)
- `JWT_SECRET`
- SMTP / Twilio / PayPal / HuggingFace credentials

### 3 — Build & start everything
```bash
docker compose up --build
```

> **Tip:** Add `-d` to run in detached (background) mode:
> ```bash
> docker compose up --build -d
> ```

### 4 — Open in browser
| URL                        | What you see         |
|----------------------------|----------------------|
| http://localhost:5173      | SmartDoc Frontend    |
| http://localhost:3001/health | Auth Service health  |
| http://localhost:3008/health | AI Service health    |

---

## 🛠 Common Commands

### Start / Stop

```bash
# Start all services (foreground — shows logs)
docker compose up

# Start all services (detached / background)
docker compose up -d

# Stop all running containers (keep volumes)
docker compose stop

# Stop AND remove containers + networks (keep volumes)
docker compose down

# Stop AND remove containers + networks + volumes  ⚠️ deletes uploads
docker compose down -v
```

### Rebuild

```bash
# Rebuild all images and restart
docker compose up --build

# Rebuild a single service image (e.g., after code change)
docker compose up --build auth-service

# Force a completely fresh rebuild (no cache)
docker compose build --no-cache
docker compose up
```

### Scaling / Individual Services

```bash
# Start only specific services
docker compose up frontend auth-service patient-service

# Restart a single service without touching others
docker compose restart doctor-service

# Stop a single service
docker compose stop payment-service
```

### Logs

```bash
# Stream logs from all services
docker compose logs -f

# Stream logs from a single service
docker compose logs -f ai-service

# Last 100 lines from notification-service
docker compose logs --tail=100 notification-service
```

### Shell Access (debugging)

```bash
# Open a shell inside a running container
docker compose exec auth-service sh
docker compose exec ai-service sh
docker compose exec frontend sh

# One-shot command (no interactive shell)
docker compose exec auth-service node src/utils/seedAdmin.js
```

### Container Status

```bash
# List running containers and their status
docker compose ps

# Show resource usage (CPU, memory)
docker stats
```

---

## 🌱 Seeding the Admin User

The `auth-service` includes a seed script to create the default admin account defined in `.env`:

```bash
# While containers are running:
docker compose exec auth-service node src/utils/seedAdmin.js
```

---

## 🔄 Volumes (Persistent Data)

Two named Docker volumes keep uploaded files across container restarts:

| Volume            | Mounted at               | Used by          |
|-------------------|--------------------------|------------------|
| `patient-uploads` | `/app/uploads`           | patient-service  |
| `ai-uploads`      | `/app/uploads`           | ai-service       |

```bash
# List all volumes
docker volume ls

# Inspect a volume
docker volume inspect smartdoc_patient-uploads

# Back up uploads to a tar archive
docker run --rm \
  -v smartdoc_ai-uploads:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/ai-uploads-backup.tar.gz -C /data .
```

---

## ⚙️ Environment Variables Reference

All variables are set in the **root `.env`** file (not inside service folders when using Docker).

| Variable                  | Service(s)              | Description                             |
|---------------------------|-------------------------|-----------------------------------------|
| `NODE_ENV`                | all                     | `production` or `development`           |
| `JWT_SECRET`              | auth, patient, doctor, appointment, ai | Shared signing secret      |
| `JWT_EXPIRES_IN`          | auth, appointment       | Token TTL (e.g. `7d`)                   |
| `MONGODB_URI_AUTH`        | auth-service            | Atlas connection string                 |
| `MONGODB_URI_PATIENT`     | patient-service         | Atlas connection string                 |
| `MONGODB_URI_DOCTOR`      | doctor-service          | Atlas connection string                 |
| `MONGODB_URI_APPOINTMENT` | appointment-service     | Atlas connection string                 |
| `MONGODB_URI_AI`          | ai-service              | Atlas connection string                 |
| `ADMIN_EMAIL`             | auth-service            | Seed admin email                        |
| `ADMIN_PASSWORD`          | auth-service            | Seed admin password                     |
| `SMTP_USER`               | notification-service    | Gmail address                           |
| `SMTP_PASS`               | notification-service    | Gmail App Password                      |
| `TWILIO_ACCOUNT_SID`      | notification-service    | Twilio SID                              |
| `TWILIO_AUTH_TOKEN`       | notification-service    | Twilio auth token                       |
| `TWILIO_PHONE_NUMBER`     | notification-service    | Twilio sender number                    |
| `PAYPAL_CLIENT_ID`        | payment-service         | PayPal sandbox/live client ID           |
| `PAYPAL_SECRET`           | payment-service         | PayPal sandbox/live secret              |
| `TELEMEDICINE_ROOM_SECRET`| telemedicine-service    | Room token signing key                  |
| `HF_ACCESS_TOKEN`         | ai-service              | Hugging Face API token                  |
| `ATLAS_VECTOR_INDEX`      | ai-service              | MongoDB Atlas Vector Search index name  |

---

## 🏗 Project File Structure (Docker files only)

```
SmartDoc/
├── .env.example                   ← copy to .env and fill secrets
├── docker-compose.yml             ← orchestrates all services
│
├── frontend/
│   ├── Dockerfile                 ← multi-stage: Vite build → Nginx
│   ├── nginx.conf                 ← SPA routing config
│   └── .dockerignore
│
└── services/
    ├── auth-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── patient-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── doctor-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── appointment-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── payment-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── notification-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    ├── telemedicine-service/
    │   ├── Dockerfile
    │   └── .dockerignore
    └── ai-service/
        ├── Dockerfile
        └── .dockerignore
```

---

## 🧹 Cleanup

```bash
# Remove stopped containers
docker compose rm

# Remove ALL unused images, containers, networks, build cache
docker system prune -a

# Remove unused volumes (⚠️ will delete persistent upload data)
docker volume prune
```

---

## 🐞 Troubleshooting

### Port already in use
```bash
# Find which process is using a port (e.g. 3001)
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Container keeps restarting
```bash
# Check exit logs
docker compose logs auth-service
# Common cause: missing env variable → verify your .env file
```

### MongoDB connection refused
- Make sure your Atlas cluster **IP Whitelist** includes `0.0.0.0/0` (allow all) or your outgoing IP.
- Check that `MONGODB_URI_*` values in `.env` are correct.

### Frontend shows blank page / 404 on refresh
- The `nginx.conf` already handles SPA routing — ensure the frontend container rebuilt after any `nginx.conf` change:
  ```bash
  docker compose up --build frontend
  ```

### Inter-service calls fail
- Inside Docker Compose, use **service names** as hostnames (e.g. `http://notification-service:3006`). These are already configured in `docker-compose.yml`.

---

## 📦 Building Individual Images Manually

If you need to build and push a single service image to a registry:

```bash
# Build
docker build -t smartdoc/auth-service:latest ./services/auth-service

# Run standalone
docker run -p 3001:3001 \
  --env-file ./services/auth-service/.env \
  smartdoc/auth-service:latest

# Push to Docker Hub
docker push smartdoc/auth-service:latest
```

---

> **Security reminder:** Your actual `.env` file (with real credentials) is already excluded by `.gitignore`. Only `.env.example` should be committed to version control.
