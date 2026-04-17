# SmartDoc Kubernetes Deployment Guide (Minikube)

This guide runs the full SmartDoc system on Kubernetes using Minikube.

## 1. Prerequisites

- Minikube v1.33+
- kubectl v1.29+
- Docker (or Docker Desktop)
- SmartDoc source code with a valid root .env file

Check tools:

```bash
minikube version
kubectl version --client
docker --version
```

## 2.first time  Start Minikube

```bash
minikube start --cpus=4 --memory=6144 --driver=docker
kubectl get nodes
```
## 2.1. Start Minikube 

```bash
minikube start 
minikube service frontend -n smartdoc
```
## Stop Minikube:

```bash
minikube stop
```

## 3. Build all images inside Minikube Docker

Switch your shell to Minikube's Docker daemon so Kubernetes can use locally built images without pushing to a registry.

```bash
eval $(minikube docker-env)
```

Load project env and compute Minikube IP:

```bash
set -a
source .env
set +a

MINIKUBE_IP=$(minikube ip)
echo "$MINIKUBE_IP"

# Required for PayPal return/cancel URLs in payment-service
export FRONTEND_BASE_URL="http://$MINIKUBE_IP:30517"
```

Set frontend build URLs (NodePort endpoints):

```bash
export VITE_AUTH_API_URL="http://$MINIKUBE_IP:30001/api/auth"
export VITE_PATIENT_API_URL="http://$MINIKUBE_IP:30002/api/patients"
export VITE_DOCTOR_API_URL="http://$MINIKUBE_IP:30003/api/doctors"
export VITE_APPOINTMENT_API_URL="http://$MINIKUBE_IP:30004/api/appointments"
export VITE_PAYMENT_API_URL="http://$MINIKUBE_IP:30005"
export VITE_LKR_TO_USD_RATE="${VITE_LKR_TO_USD_RATE:-0.0033}"
export VITE_PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID"
```

Build images using existing Docker Compose definitions:

```bash
docker compose build
```

## 4. Create Kubernetes Secret from your .env

The manifest expects a secret named smartdoc-secrets in namespace smartdoc.

```bash
kubectl create namespace smartdoc --dry-run=client -o yaml | kubectl apply -f -
kubectl -n smartdoc create secret generic smartdoc-secrets \
  --from-env-file=.env \
  --dry-run=client -o yaml | kubectl apply -f -
```

Before this step, make sure `.env` contains `FRONTEND_BASE_URL=http://<minikube-ip>:30517`.

## 5. Apply Kubernetes resources

```bash
kubectl apply -f k8s/smartdoc-minikube.yaml
```

Check rollout:

```bash
kubectl -n smartdoc get pods
kubectl -n smartdoc get svc
kubectl -n smartdoc rollout status deploy/frontend
kubectl -n smartdoc rollout status deploy/auth-service
kubectl -n smartdoc rollout status deploy/appointment-service
```

## 6. Access URLs

```bash
MINIKUBE_IP=$(minikube ip)
```

- Frontend: http://$MINIKUBE_IP:30517
- Auth health: http://$MINIKUBE_IP:30001/health
- Patient health: http://$MINIKUBE_IP:30002/health
- Doctor health: http://$MINIKUBE_IP:30003/health
- Appointment health: http://$MINIKUBE_IP:30004/health
- Payment health: http://$MINIKUBE_IP:30005/health
- Notification health: http://$MINIKUBE_IP:30006/health
- Telemedicine health: http://$MINIKUBE_IP:30007/health
- AI health: http://$MINIKUBE_IP:30008/health

### macOS + Docker driver note (important)

On macOS with Minikube Docker driver, direct NodePort access via `http://$(minikube ip):<nodePort>` can time out.
If that happens, use this pattern:

1. Open frontend with:

```bash
minikube service frontend -n smartdoc
```

Use the localhost URL shown by Minikube tunnel, for example `http://127.0.0.1:49410`.

2. Build frontend with localhost API URLs (already needed for this mode):

```bash
eval $(minikube docker-env)
PAYPAL_CLIENT_ID=$(grep '^PAYPAL_CLIENT_ID=' .env | cut -d'=' -f2-)
VITE_LKR_TO_USD_RATE=$(grep '^VITE_LKR_TO_USD_RATE=' .env | cut -d'=' -f2-)

export VITE_AUTH_API_URL=http://127.0.0.1:3001/api/auth
export VITE_PATIENT_API_URL=http://127.0.0.1:3002/api/patients
export VITE_DOCTOR_API_URL=http://127.0.0.1:3003/api/doctors
export VITE_APPOINTMENT_API_URL=http://127.0.0.1:3004/api/appointments
export VITE_PAYMENT_API_URL=http://127.0.0.1:3005
export VITE_PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID"
export VITE_LKR_TO_USD_RATE="${VITE_LKR_TO_USD_RATE:-0.0033}"

docker compose build frontend
kubectl -n smartdoc rollout restart deploy/frontend
kubectl -n smartdoc rollout status deploy/frontend
```

3. Port-forward backend services to localhost:

```bash
kubectl -n smartdoc port-forward svc/auth-service 3001:3001
kubectl -n smartdoc port-forward svc/patient-service 3002:3002
kubectl -n smartdoc port-forward svc/doctor-service 3003:3003
kubectl -n smartdoc port-forward svc/appointment-service 3004:3004
kubectl -n smartdoc port-forward svc/payment-service 3005:3005
kubectl -n smartdoc port-forward svc/notification-service 3006:3006
kubectl -n smartdoc port-forward svc/telemedicine-service 3007:3007
kubectl -n smartdoc port-forward svc/ai-service 3008:3008
```

Keep these port-forward terminals open while testing.

## 7. Logs and debugging

View all pods:

```bash
kubectl -n smartdoc get pods -o wide
```

Stream logs:

```bash
kubectl -n smartdoc logs -f deploy/frontend
kubectl -n smartdoc logs -f deploy/appointment-service
kubectl -n smartdoc logs -f deploy/payment-service
kubectl -n smartdoc logs -f deploy/notification-service
```

Describe a failing pod:

```bash
kubectl -n smartdoc describe pod <pod-name>
```

Restart one deployment:

```bash
kubectl -n smartdoc rollout restart deploy/appointment-service
```

## 8. Updating after code changes

After editing code:

1. Rebuild inside Minikube Docker:

```bash
eval $(minikube docker-env)
docker compose build <service-name>
```

2. Restart that deployment:

```bash
kubectl -n smartdoc rollout restart deploy/<deployment-name>
```

Examples:

```bash
docker compose build frontend
kubectl -n smartdoc rollout restart deploy/frontend
```

```bash
docker compose build appointment-service
kubectl -n smartdoc rollout restart deploy/appointment-service
```

## 9. Cleanup

Delete SmartDoc resources:

```bash
kubectl delete namespace smartdoc
```

Stop Minikube:

```bash
minikube stop
```

Delete Minikube cluster:

```bash
minikube delete
```

## Notes

- Inter-service calls use Kubernetes service DNS names (for example, http://notification-service:3006).
- Frontend Vite variables are baked at image build time; always rebuild frontend when API URL or PayPal client ID changes.
- This setup uses NodePort for direct host access in Minikube.
