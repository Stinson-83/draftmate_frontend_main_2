# ⚖️ DraftMate - AI Legal Document Drafting Platform

DraftMate is an advanced AI-powered platform tailored for legal professionals. It streamlines the legal workflow by providing tools for document drafting, deep case law research, PDF analysis, and case file management.

This single `README.md` serves as the ultimate source of truth for developing locally, managing the AWS EC2 server, updating code/credentials, and eventually migrating to your live `draftmate.in` domain.

---

## 🏗 Architecture Overview

DraftMate uses a decoupled architecture:
*   **Frontend**: React SPA built with Vite, served via an ultra-fast Nginx container.
*   **Backend**: Multiple Python microservices (FastAPI/Uvicorn) handling Auth, Conversion, Querying, AI Enhancement, Drafting, and PDF Editing.
*   **Databases**: PostgreSQL (Relational) and Qdrant (Vector AI Search).
*   **Infrastructure**: Hosted on a single AWS EC2 `t3a.xlarge` instance running a full Kubernetes (`Kind`) cluster.

---

## 💻 1. Local Development (On Your PC)

If you are developing features locally on your machine, you have two options:

### Option A: Full Stack (Docker Compose)
To run the Frontend, Backend, Postgres, and Qdrant all at once on your computer:
1. Create a `.env` file from the example: `cp .env.example .env`
2. Add your API keys to the `.env` file.
3. Run: `docker compose up --build`
4. Access the app at: `http://localhost:8080`

### Option B: Frontend UI Only (Node.js)
If you only want to edit React code with instant hot-reloading:
1. Run `npm install`
2. Run `npm run dev`

---

## ☁️ 2. AWS Server Management (How it Works Right Now)

Your AWS EC2 server is currently 100% automated. 
You **DO NOT** need to run any local scripts (like `start_draftmate.ps1`) anymore.

**What happens when you boot the AWS Server:**
1. Docker starts the Kubernetes (`Kind`) cluster automatically.
2. Kubernetes boots up all your microservices and databases automatically.
3. A background service (`draftmate-tunnel.service`) opens the networking tunnel automatically.

Within 60 seconds of pressing "Start Instance" in AWS, your app is live at:
👉 **`http://<YOUR_EC2_PUBLIC_IP>:8080`**

---

## 🛠️ 3. How to Update Code & Credentials on AWS

When you make changes to your code, or if you need to update an API key, you must apply those changes to the EC2 server. 

First, SSH into your server:
```bash
ssh -i "~/.ssh/jenkins-v2.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### 👉 Scenario A: Changing API Keys (OpenAI, Cashfree, Postgres, etc.)
1. Edit the `.env` file on the server:
   ```bash
   nano ~/draftmate_frontend_main_2/.env
   ```
2. Run the update script to inject the new keys into Kubernetes:
   ```bash
   python3 ~/update_creds.py
   ```
3. Restart the backend pods to apply the new keys:
   ```bash
   kubectl rollout restart deploy/backend
   ```

### 👉 Scenario B: Updating the Frontend Code (React/Vite)
If you change frontend code, you must rebuild the frontend Docker image and reload it into the cluster.

```bash
cd ~/draftmate_frontend_main_2
git pull  # (Or however you transfer your new code)

# 1. Grab your Google Client ID from the .env file
export VITE_CLIENT_ID=$(grep VITE_CLIENT_ID .env | cut -d '=' -f2)

# 2. Build the production image
docker build --build-arg VITE_CLIENT_ID="$VITE_CLIENT_ID" --build-arg VITE_API_BASE_URL='/api' -t draftmate_frontend_main_2-frontend:prod -f Dockerfile.frontend.prod .

# 3. Load it into the cluster
kind load docker-image draftmate_frontend_main_2-frontend:prod --name draftmate-cluster

# 4. Restart the frontend pods
kubectl rollout restart deploy/frontend
```

### 👉 Scenario C: Updating the Backend Code (Python)
If you change Python code in the backend:
```bash
cd ~/draftmate_frontend_main_2

# 1. Build the backend image
docker build -t draftmate_frontend_main_2-backend:latest -f Dockerfile .

# 2. Load it into the cluster
kind load docker-image draftmate_frontend_main_2-backend:latest --name draftmate-cluster

# 3. Restart the backend pods
kubectl rollout restart deploy/backend
```

---

## 🌐 4. Custom Domain Setup (`draftmate.in`)

When you are ready to stop using the raw `ec2-...amazonaws.com:8080` URL and officially launch `https://draftmate.in`, follow these exact steps:

### Step 1: Assign an Elastic IP in AWS
1. Go to AWS EC2 Console > **Elastic IPs**.
2. Click **Allocate Elastic IP address**.
3. Select the IP, click **Actions > Associate**, and attach it to your EC2 instance.
*(Your server IP will now NEVER change).*

### Step 2: Configure your DNS Records
Go to your Domain Registrar (GoDaddy/Hostinger) and create an **A Record**:
*   **Host/Name:** `@`
*   **Points to:** `<YOUR_NEW_ELASTIC_IP>`

### Step 3: Enable Web Traffic (NGINX Ingress)
SSH into your server and run these commands to turn off the port 8080 tunnel and turn on standard web traffic (Ports 80/443):
```bash
# 1. Install Kubernetes NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 2. Disable the old background tunnel
sudo systemctl disable --now draftmate-tunnel.service
```

### Step 4: Tell Kubernetes about your Domain
Edit your Kubernetes configuration:
```bash
nano ~/draftmate_frontend_main_2/draftmate-chart/values.yaml
```
Find `ingress:` and change `draftmate.test` to your real domain:
```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: draftmate.in       # <--- CHANGE THIS
      paths:
        - path: /
          pathType: Prefix
```
Apply the changes:
```bash
helm upgrade draftmate ./draftmate-chart
```
*(Your site is now live at `http://draftmate.in`!)*

### Step 5: Update Google Login (CRITICAL)
If you don't do this, Google Login will throw a `redirect_uri_mismatch` error.
1. Open `.env` on your server and change `FRONTEND_URL_PROD` to `https://draftmate.in`. Run `python3 ~/update_creds.py` and `helm upgrade draftmate ./draftmate-chart`.
2. Go to Google Cloud Console > APIs & Services > Credentials.
3. Edit your OAuth Client ID and add `https://draftmate.in` to the **Authorized JavaScript origins**.

### Step 6: Enable HTTPS (SSL Certificates)
To make your site "Secure", run these commands on the server to install Cert-Manager:
```bash
# Install Cert Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml
```
Create a file called `issuer.yaml`:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@draftmate.in  # <-- Change to your email
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```
Run `kubectl apply -f issuer.yaml`. Then edit your `values.yaml` ingress block to enable TLS:
```yaml
ingress:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  tls:
    - secretName: draftmate-tls
      hosts:
        - draftmate.in
```
Run `helm upgrade draftmate ./draftmate-chart` one last time. Your site is now officially secure!
