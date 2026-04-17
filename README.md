# SmartDoc Healthcare Platform

AI-enabled healthcare appointment, telemedicine, payments, notifications, and clinical document intelligence platform built with a microservices architecture.

## 1. Overview

SmartDoc is designed to support the end-to-end healthcare consultation lifecycle:

- User onboarding and role-based authentication (patient, doctor, admin)
- Patient and doctor profile/domain management
- Appointment booking and lifecycle management
- Online payment processing (PayPal)
- Notification delivery (email + SMS)
- Telemedicine session link generation
- AI-assisted symptom/document intelligence workflows

The repository includes:

- A React + Vite frontend
- 8 backend services
- Docker Compose orchestration
- Kubernetes (Minikube) deployment manifests

## 2. System Architecture

### 2.1 High-Level Architecture

```text
Client Browser
   |
   v
Frontend (React/Vite served by Nginx in container mode)
   |
   +--> Auth Service (JWT, role-aware access)
   +--> Patient Service (profiles, uploads)
   +--> Doctor Service (profiles, availability/domain logic)
   +--> Appointment Service (booking orchestration)
   |        |\
   |        | +--> Notification Service (email/SMS)
   |        +----> Telemedicine Service (session/room generation)
   +--> Payment Service (PayPal order + capture)
   +--> AI Service (symptom + document intelligence)

Data Stores / External Integrations:
- MongoDB Atlas (service-level databases)
- PayPal APIs
- SMTP provider
- Twilio APIs
- Jitsi Meet (session links)
- Hugging Face token-based integrations
```

### 2.2 Service Boundaries

Each backend service is independently runnable and deployable with its own port, environment, and runtime process.

- Fine-grained separation improves maintainability and independent deployment
- Service-to-service communication is HTTP/REST
- Health checks available at `/health` on each service

## 3. Project Structure

```text
SmartDoc/
|-- frontend/                         # Vite + React + Tailwind app
|-- services/
|   |-- auth-service/                 # :3001
|   |-- patient-service/              # :3002
|   |-- doctor-service/               # :3003
|   |-- appointment-service/          # :3004
|   |-- payment-service/              # :3005
|   |-- notification-service/         # :3006
|   |-- telemedicine-service/         # :3007
|   `-- ai-service/                   # :3008
|-- k8s/
|   `-- smartdoc-minikube.yaml        # Minikube-ready Kubernetes manifest
|-- docker-compose.yml                # Full multi-service local container orchestration
|-- DOCKER_GUIDE.md                   # Deep-dive Docker operations
|-- KUBERNETES_MINIKUBE_GUIDE.md      # Deep-dive Kubernetes workflow
`-- package.json                      # Root scripts for monorepo management
```

## 4. Services and Ports

| Service | Port | Base Path | Notes |
|---|---:|---|---|
| Frontend | 5173 | N/A | Vite dev server (or Nginx in Docker) |
| Auth Service | 3001 | `/api/auth` | JWT, login/register, admin flows |
| Patient Service | 3002 | `/api/patients` | Patient data, uploads |
| Doctor Service | 3003 | `/api/doctors` | Doctor data/domain logic |
| Appointment Service | 3004 | `/api/appointments` | Booking lifecycle + orchestration |
| Payment Service | 3005 | `/api/payments` | PayPal create/capture order |
| Notification Service | 3006 | `/api/notifications` | Email + SMS |
| Telemedicine Service | 3007 | `/api/telemedicine` | Session/room link generation |
| AI Service | 3008 | `/api/ai` | Symptom + document intelligence |

## 5. Technology Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Architecture: Microservices (REST)
- Auth: JWT-based authentication and authorization
- Data: MongoDB Atlas
- Payments: PayPal APIs
- Notifications: Nodemailer + Twilio
- Telemedicine: Jitsi room-link generation
- AI Integration: Hugging Face token-based integration + vector index usage
- Deployment: Docker Compose, Kubernetes (Minikube)

## 6. Prerequisites

For local development:

- Node.js 18+ (20+ recommended)
- npm 8+

For containerized deployment:

- Docker Desktop / Docker Engine
- Docker Compose v2+

For Kubernetes deployment:

- Minikube
- kubectl

Verify tools:

```bash
node --version
npm --version
docker --version
docker compose version
minikube version
kubectl version --client
```

## 7. Environment Configuration

This repository currently includes `.env` files, but no committed `.env.example` template at root.

Recommended setup approach:

1. Maintain a root `.env` for Docker/Kubernetes workflows.
2. Maintain per-service `.env` files under each service for local `npm run dev` service execution.
3. Never commit real secrets.

### 7.1 Common Variables Used Across Services

- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### 7.2 Database Variables

- `MONGODB_URI_AUTH`
- `MONGODB_URI_PATIENT`
- `MONGODB_URI_DOCTOR`
- `MONGODB_URI_APPOINTMENT`
- `MONGODB_URI_AI`

### 7.3 Integration Variables

- Auth/admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `ADMIN_PHONE`
- Notification: `SMTP_SERVICE`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Payment: `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `LKR_TO_USD_RATE`, `FRONTEND_BASE_URL`
- Telemedicine: `JITSI_BASE_URL`, `TELEMEDICINE_ROOM_SECRET`
- AI: `HF_ACCESS_TOKEN`, `ATLAS_VECTOR_INDEX`

### 7.4 Frontend Build Variables (Vite)

- `VITE_AUTH_API_URL`
- `VITE_PATIENT_API_URL`
- `VITE_DOCTOR_API_URL`
- `VITE_APPOINTMENT_API_URL`
- `VITE_PAYMENT_API_URL`
- `VITE_AI_API_URL`
- `VITE_PAYPAL_CLIENT_ID`
- `VITE_LKR_TO_USD_RATE`

## 8. Local Development (Without Docker)

### 8.1 Install Dependencies

From repository root:

```bash
npm run install:all
```

### 8.2 Run Entire Stack in Development Mode

```bash
npm run dev:all
```

This starts:

- Frontend
- Auth, Patient, Doctor, Appointment, Payment, Notification, Telemedicine, and AI services

### 8.3 Useful Individual Commands

```bash
# Frontend
npm run dev:frontend
npm run start:frontend

# Backend services (development)
npm run dev:auth
npm run dev:patient
npm run dev:doctor
npm run dev:appointment
npm run dev:payment
npm run dev:notification
npm run dev:telemedicine
npm run dev:ai

# Backend services (production-style start)
npm run start:auth
npm run start:patient
npm run start:doctor
npm run start:appointment
npm run start:payment
npm run start:notification
npm run start:telemedicine
npm run start:ai
```

Note: `npm run start:all` currently starts backend services except AI and does not start the frontend.

### 8.4 Health Check Endpoints

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
curl http://localhost:3007/health
curl http://localhost:3008/health
```

Frontend (dev mode):

- `http://localhost:5173`

## 9. Deployment with Docker Compose

### 9.1 Build and Start

From repository root:

```bash
docker compose up --build
```

Detached mode:

```bash
docker compose up --build -d
```

### 9.2 Access

- Frontend: `http://localhost:5173`
- Services: `http://localhost:3001` to `http://localhost:3008`

### 9.3 Operations

```bash
# Show running containers
docker compose ps

# Follow logs
docker compose logs -f

# Follow one service
docker compose logs -f appointment-service

# Stop all
docker compose stop

# Remove containers + network
docker compose down

# Remove containers + network + volumes
docker compose down -v
```

### 9.4 Persistent Volumes

Docker Compose defines named volumes for uploads:

- `patient-uploads`
- `ai-uploads`

These preserve uploaded files across container restarts unless removed.

## 10. Deployment with Kubernetes (Minikube)

Kubernetes manifests are in `k8s/smartdoc-minikube.yaml` and assume images are built into Minikube's Docker environment.

### 10.1 Start Minikube

```bash
minikube start --cpus=4 --memory=6144 --driver=docker
kubectl get nodes
```

### 10.2 Point Docker to Minikube

```bash
eval $(minikube docker-env)
```

### 10.3 Load Environment Variables

```bash
set -a
source .env
set +a
```

### 10.4 Build Images

```bash
docker compose build
```

### 10.5 Create Namespace and Secret

```bash
kubectl create namespace smartdoc --dry-run=client -o yaml | kubectl apply -f -
kubectl -n smartdoc create secret generic smartdoc-secrets \
  --from-env-file=.env \
  --dry-run=client -o yaml | kubectl apply -f -
```

### 10.6 Apply Manifests

```bash
kubectl apply -f k8s/smartdoc-minikube.yaml
kubectl -n smartdoc get pods
kubectl -n smartdoc get svc
```

### 10.7 Access Services

```bash
MINIKUBE_IP=$(minikube ip)
```

- Frontend: `http://$MINIKUBE_IP:30517`
- Auth: `http://$MINIKUBE_IP:30001/health`
- Patient: `http://$MINIKUBE_IP:30002/health`
- Doctor: `http://$MINIKUBE_IP:30003/health`
- Appointment: `http://$MINIKUBE_IP:30004/health`
- Payment: `http://$MINIKUBE_IP:30005/health`
- Notification: `http://$MINIKUBE_IP:30006/health`
- Telemedicine: `http://$MINIKUBE_IP:30007/health`
- AI: `http://$MINIKUBE_IP:30008/health`

### 10.8 macOS Note (Docker Driver)

On some macOS setups, direct NodePort access may time out. Use:

```bash
minikube service frontend -n smartdoc
```

For detailed port-forward and frontend-rebuild instructions, see `KUBERNETES_MINIKUBE_GUIDE.md`.

## 11. Core API Snapshot

### Auth Service

- `POST /api/auth/register/patient`
- `POST /api/auth/register/doctor`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/admin/users`
- `PATCH /api/auth/admin/doctors/:userId/verify`

### Payment Service

- `POST /api/payments/paypal/create-order`
- `POST /api/payments/paypal/capture-order`

### Notification Service

- `POST /api/notifications/appointment/booked`
- `POST /api/notifications/appointment/cancelled`

### Telemedicine Service

- `POST /api/telemedicine/sessions`

### AI Service

- Base path: `GET/POST /api/ai/*` (see service routes for detailed endpoints)

## 12. Troubleshooting

### Port already in use

```bash
lsof -i :3001
kill -9 <PID>
```

### Service not starting

- Check service logs (`docker compose logs -f <service-name>`)
- Verify required environment variables are present
- Verify MongoDB/network credentials

### Frontend cannot call backend

- Confirm Vite API variables are correct for your execution mode (local, Docker, or Minikube)
- Rebuild frontend image after changing Vite variables

### Kubernetes pod restart loop

```bash
kubectl -n smartdoc describe pod <pod-name>
kubectl -n smartdoc logs <pod-name>
```

## 13. Security and Operational Notes

- Keep all secrets in environment variables (never hardcode credentials)
- Do not commit real `.env` files
- Use strong JWT and integration secrets
- Restrict database/network ingress in production
- Add centralized logging, metrics, and tracing for production-grade operations

## 14. Related Docs

- Docker deep-dive: `DOCKER_GUIDE.md`
- Kubernetes deep-dive: `KUBERNETES_MINIKUBE_GUIDE.md`

## 15. License

ISC
# AI Symptom Checker — Implementation 

## What Was Built

A full **RAG (Retrieval-Augmented Generation) AI Symptom Checker** integrated into the SmartDoc platform using:
- **MongoDB Atlas Vector Search** — stores document embeddings for semantic retrieval
- **HuggingFace Inference API** — `all-MiniLM-L6-v2` embeddings + `Mistral-7B-Instruct` generation
- **New `ai-service` microservice** on port `3006`
- **Language/Runtime** 	Node.js (LangChain JS)	Consistent with all existing services 
---

Embedding model	sentence-transformers/all-MiniLM-L6-v2	384-dim, fast, free HF Inference API
Generation model	mistralai/Mistral-7B-Instruct-v0.2	Strong medical reasoning, free tier
Vector store	MongoDB Atlas Vector Search	Uses your existing Atlas cluster, no new infra
## Architecture

```
Admin uploads PDF/DOCX
        │
   ai-service POST /api/ai/documents
        ├── pdf-parse / mammoth → raw text
        ├── RecursiveTextSplitter (800 char chunks, 100 overlap)
        ├── HF Inference API → 384-dim embeddings
        └── MongoDB Atlas → documentchunks collection

Patient selects symptoms
        │
   ai-service POST /api/ai/symptom-check
        ├── Embed symptom query via HF
        ├── $vectorSearch → top-5 relevant chunks
        ├── Mistral-7B-Instruct → structured JSON response
        └── { suggestions, urgency_level, doctor_recommendations, self_care_tips }
```

---

## Files Created / Modified

### New — `services/ai-service/`
| File | Purpose |
|---|---|
| `package.json` | Dependencies: express, mongoose, multer, pdf-parse, mammoth, node-fetch |
| `.env` | HF token, MongoDB URI, JWT secret |
| `server.js` | Entry point |
| `src/app.js` | Express app |
| `src/config/db.js` | MongoDB connection |
| `src/models/HealthDocument.js` | Document metadata model |
| `src/models/DocumentChunk.js` | Vector chunk storage model |
| `src/middleware/authMiddleware.js` | JWT + role guards |
| `src/services/ragService.js` | **Core RAG pipeline** |
| `src/controllers/documentController.js` | Upload / List / Delete |
| `src/controllers/symptomController.js` | Symptom analysis endpoint |
| `src/routes/aiRoutes.js` | Route definitions |

### Modified — Frontend
| File | Change |
|---|---|
| `frontend/src/lib/api.js` | Added `AI_API_URL` |
| `frontend/src/App.jsx` | Added `/ai-assist` protected route |
| `frontend/src/pages/Admin-Dashboard.jsx` | Added **"AI Health Documents"** tab |
| `frontend/src/pages/Patient-Dashboard.jsx` | Added **AI Assist quick-link card** in sidebar |

### New — Frontend
| File | Purpose |
|---|---|
| `frontend/src/pages/AIAssistPage.jsx` | Full AI Symptom Checker UI |

### Modified — Root
| File | Change |
|---|---|
| `package.json` | Added `start:ai`, `dev:ai` scripts |

---

## ⚠️ Required Manual Step — Atlas Vector Search Index

> Without this index, symptom analysis will still work but without RAG context (falls back to LLM-only).

1. Go to **MongoDB Atlas** → your cluster → **Atlas Search** tab
2. Click **Create Search Index** → select **Atlas Vector Search**
3. Database: `smartdoc_ai` → Collection: `documentchunks`
4. Use the JSON editor, paste:

```json
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 384,
    "similarity": "cosine"
  }]
}
```

5. Name the index: **`vector_index`**
6. Click Create — index will be ready within ~1 minute

> This setup guide is also shown in the Admin Dashboard under the "AI Health Documents" tab.

---

## How to Start the AI Service

```bash
cd services/ai-service
/opt/homebrew/bin/node server.js
# or: npm run dev (if npm is on your PATH)
```

Expected output:
```
[AI Service] MongoDB Atlas connected
[AI Service] Running on port 3006
```

To run all services together:
```bash
npm run dev:all   # from project root
```

---

## Testing the Flow

### 1. Admin uploads a document
1. Login as admin (`admin@smartdoc.com` / `Admin@123`)
2. Go to Admin Dashboard → **"AI Health Documents"** tab
3. Drop a PDF or DOCX health guidance document
4. Watch status go: `processing` → `ready` (auto-refreshes at 5s, 15s, 30s)

### 2. Patient uses AI Assist
1. Login as patient → Patient Dashboard
2. Click **"AI Symptom Checker"** card in the sidebar
3. Select symptoms from 8 categories or type custom ones
4. Click **"Analyze Symptoms"**
5. View results: urgency level (color-coded), suggestions, doctor recommendations, self-care tips

---

## Validation Results

| Check | Result |
|---|---|
| `npm install` (ai-service) | ✅ 170 packages, 0 vulnerabilities |
| `/health` endpoint | ✅ `{ status: 'UP' }` |
| MongoDB Atlas connection | ✅ Connected |
| Frontend build (Vite) | ✅ 1745 modules, 0 errors |
