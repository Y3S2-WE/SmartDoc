# SmartDoc Healthcare Platform

AI-Enabled Smart Healthcare Appointment & Telemedicine Platform using Microservices Architecture

## Project Structure

```
SmartDoc/
├── frontend/                 (Vite + React + Tailwind)
├── services/
│   ├── auth-service/          (Port: 3001)
│   ├── patient-service/       (Port: 3002)
│   ├── doctor-service/        (Port: 3003)
│   ├── appointment-service/   (Port: 3004)
│   ├── payment-service/       (Port: 3005)
│   ├── notification-service/  (Port: 3006)
│   └── telemedicine-service/  (Port: 3007)
└── package.json
```

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 3001 | Authentication and Authorization |
| Patient Service | 3002 | Patient Management & Medical Records |
| Doctor Service | 3003 | Doctor Profiles & Availability |
| Appointment Service | 3004 | Appointment Booking & Management |
| Payment Service | 3005 | Payment Processing |
| Notification Service | 3006 | SMS & Email Notifications |
| Telemedicine Service | 3007 | Video Consultation Integration |

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

Install all dependencies for all services:

```bash
npm run install:all
```

This also installs dependencies for the root frontend app.

Or install dependencies manually for each service:

```bash
cd services/auth-service && npm install
cd ../patient-service && npm install
cd ../doctor-service && npm install
cd ../appointment-service && npm install
cd ../payment-service && npm install
cd ../notification-service && npm install
cd ../telemedicine-service && npm install
```

### Running Services

#### Run All Services Simultaneously (Development Mode with Nodemon)

```bash
npm run dev:all
```

This will start the frontend and all services with auto-reload on file changes.

#### Run Frontend Only

```bash
npm run dev:frontend
```

Frontend runs on: `http://localhost:5173`

#### Run All Services (Production Mode)

```bash
npm run start:all
```

#### Run Individual Services in Development Mode (with Nodemon)

```bash
# Auth Service
npm run dev:auth

# Patient Service
npm run dev:patient

# Doctor Service
npm run dev:doctor

# Appointment Service
npm run dev:appointment

# Payment Service
npm run dev:payment

# Notification Service
npm run dev:notification

# Telemedicine Service
npm run dev:telemedicine
```

#### Run Individual Services in Production Mode

```bash
# Auth Service
npm run start:auth

# Patient Service
npm run start:patient

# Doctor Service
npm run start:doctor

# Appointment Service
npm run start:appointment

# Payment Service
npm run start:payment

# Notification Service
npm run start:notification

# Telemedicine Service
npm run start:telemedicine
```

#### Run Services Directly in Each Folder

```bash
# Development mode with auto-reload
cd services/auth-service && npm run dev

# Production mode
cd services/auth-service && npm start
```

### Testing Services

Once services are running, you can test them using:

```bash
# Auth Service
curl http://localhost:3001/health

# Patient Service
curl http://localhost:3002/health

# Doctor Service
curl http://localhost:3003/health

# Appointment Service
curl http://localhost:3004/health

# Payment Service
curl http://localhost:3005/health

# Notification Service
curl http://localhost:3006/health

# Telemedicine Service
curl http://localhost:3007/health
```

## Auth Service (Implemented)

### Core Features

- Separate registration routes/forms for **Patient** and **Doctor**
- Single login portal for **Patient / Doctor / Admin**
- JWT-based authentication
- Role-based authorization middleware
- Seeded admin account

### Auth API Endpoints

```bash
# Register Patient
POST http://localhost:3001/api/auth/register/patient

# Register Doctor
POST http://localhost:3001/api/auth/register/doctor

# Login (all roles)
POST http://localhost:3001/api/auth/login

# Current logged user (Bearer token)
GET  http://localhost:3001/api/auth/me

# Admin only - list users
GET  http://localhost:3001/api/auth/admin/users

# Admin only - verify doctor
PATCH http://localhost:3001/api/auth/admin/doctors/:userId/verify
```

### Auth Service Environment Setup

Create `.env` in `services/auth-service` using `services/auth-service/.env.example`.

Default seeded admin credentials:

- Email: `admin@smartdoc.com`
- Password: `Admin@123`

### MongoDB Note

This auth service uses a separate database name (`smartdoc_auth`) via `MONGODB_DB_NAME` to support service-level database separation.

## Features (To Be Implemented)

### Patient Management Service
- Patient registration and profile management
- Medical report/document upload
- Medical history and prescription viewing
- Appointment booking
- Video consultation access

### Doctor Management Service
- Doctor profile management
- Availability schedule management
- Appointment request handling
- Video consultation hosting
- Digital prescription issuing
- Patient record access

### Admin Capabilities
- User account management
- Doctor registration verification
- Platform operations oversight
- Financial transaction monitoring

### Appointment Service
- Doctor search by specialty
- Appointment booking/modification/cancellation
- Real-time appointment status tracking

### Telemedicine Service
- Secure video consultation
- Integration with third-party video APIs (Agora/Twilio/Jitsi)

### Payment Service
- Secure payment gateway integration
- Support for PayHere/Dialog Genie/FriMi/Stripe/PayPal

### Notification Service
- SMS notifications
- Email notifications
- Appointment confirmations
- Consultation completion alerts

### AI Symptom Checker (Optional)
- Symptom input and analysis
- Preliminary health suggestions
- Doctor specialty recommendations

## Technology Stack

- **Backend**: Node.js with Express
- **Architecture**: Microservices
- **Communication**: RESTful APIs
- **Additional Libraries**: CORS, dotenv

## User Roles

1. **Patient**: Browse doctors, book appointments, attend video consultations, upload medical reports, receive prescriptions
2. **Doctor**: Manage availability, conduct consultations, issue digital prescriptions, view patient records
3. **Admin**: Manage user accounts, verify doctor registrations, handle platform operations

## Development Status

✅ Project structure created
✅ All services initialized
✅ Basic server setup completed
🔄 Business logic implementation - Pending
🔄 Database integration - Pending
🔄 Authentication & Authorization - Pending
🔄 API endpoints - Pending

## License

ISC
