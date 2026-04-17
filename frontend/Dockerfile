# ─── Stage 1: Build React/Vite App ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_AUTH_API_URL
ARG VITE_PATIENT_API_URL
ARG VITE_DOCTOR_API_URL
ARG VITE_PAYMENT_API_URL
ARG VITE_APPOINTMENT_API_URL
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_LKR_TO_USD_RATE

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_PATIENT_API_URL=$VITE_PATIENT_API_URL
ENV VITE_DOCTOR_API_URL=$VITE_DOCTOR_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL
ENV VITE_APPOINTMENT_API_URL=$VITE_APPOINTMENT_API_URL
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID
ENV VITE_LKR_TO_USD_RATE=$VITE_LKR_TO_USD_RATE

COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
