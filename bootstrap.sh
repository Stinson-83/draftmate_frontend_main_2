#!/bin/bash
# DraftMate EC2 Automated Production Bootstrap Script
# Run this script ON the newly created AWS EC2 instance after cloning the repository.

set -e

echo "🚀 Starting DraftMate Automated Production Bootstrap..."

# Check for .env file first
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found! Please create it before running this script."
    exit 1
fi

# Extract Domain from .env (FRONTEND_URL_PROD)
RAW_DOMAIN=$(grep "FRONTEND_URL_PROD" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DOMAIN=$(echo $RAW_DOMAIN | sed -e 's|^[^/]*//||' -e 's|/.*$||')
# Remove 'www.' if present
if [[ "$DOMAIN" == www.* ]]; then
    DOMAIN=${DOMAIN#www.}
fi

if [ -z "$DOMAIN" ]; then
    echo "❌ ERROR: FRONTEND_URL_PROD not found or invalid in .env file!"
    exit 1
fi

echo "🌐 Detected Production Domain: $DOMAIN"
echo "⏳ Continuing setup in 3 seconds..."
sleep 3

# 1. Update and install packages
echo "📦 Installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl apt-transport-https python3 python3-yaml

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker ubuntu
fi

# Install Kubectl
if ! command -v kubectl &> /dev/null; then
    echo "☸️ Installing Kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
fi

# Install Kind
if ! command -v kind &> /dev/null; then
    echo "📦 Installing Kind..."
    [ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind
fi

# Install Helm
if ! command -v helm &> /dev/null; then
    echo "⛵ Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Ensure Docker is running and group permissions are applied
if ! groups | grep -q '\bdocker\b'; then
    sudo chmod 666 /var/run/docker.sock || true
fi

# Create Kind Cluster
echo "🏗️ Setting up Kubernetes Cluster..."
cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
  - containerPort: 443
    hostPort: 443
EOF

if ! kind get clusters | grep -q "^draftmate-cluster$"; then
    kind create cluster --name draftmate-cluster --config kind-config.yaml
else
    echo "Cluster already exists, skipping creation."
fi

# Install NGINX Ingress Controller
echo "🌐 Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Install Cert Manager
echo "🔒 Installing Cert-Manager for HTTPS..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml

# Apply Credentials & Update Ingress Configuration
echo "🔐 Injecting Domain and Credentials into Helm Chart..."
export TARGET_DOMAIN=$DOMAIN
cat << 'EOF' > configure_helm.py
import re
import os

domain = os.environ.get('TARGET_DOMAIN', 'draftmate.in')
creds = {}

# 1. Read .env keys
with open('.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            creds[k.strip()] = v.strip().strip('"').strip("'")

# 2. Inject Keys
with open('draftmate-chart/values.yaml', 'r') as f:
    content = f.read()

for k, v in creds.items():
    content = re.sub(rf'({k}:\s*").*?(")', rf'\g<1>{v}\g<2>', content)

# 3. Configure Ingress Host & TLS
ingress_block = f"""ingress:
  enabled: true
  className: "nginx"
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: {domain}
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: draftmate-tls
      hosts:
        - {domain}
"""
# Replace the existing ingress block with the production one
content = re.sub(r'ingress:.*?(?=^[a-zA-Z])', ingress_block, content, flags=re.MULTILINE | re.DOTALL)

with open('draftmate-chart/values.yaml', 'w') as f:
    f.write(content)
EOF
python3 configure_helm.py

# Build Images
echo "🐳 Building Docker images (this may take a few minutes)..."
export VITE_CLIENT_ID=$(grep "VITE_CLIENT_ID" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
sudo docker build -t draftmate_frontend_main_2-backend:latest -f Dockerfile .
sudo docker build --build-arg VITE_CLIENT_ID="$VITE_CLIENT_ID" --build-arg VITE_API_BASE_URL='/api' -t draftmate_frontend_main_2-frontend:prod -f Dockerfile.frontend.prod .

# Wait for Ingress and Cert Manager to be fully ready before deploying
echo "⏳ Waiting for Kubernetes controllers to initialize..."
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s || true
kubectl wait --namespace cert-manager --for=condition=ready pod -l app=webhook --timeout=120s || true

# Apply ClusterIssuer
cat <<EOF > letsencrypt-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@${DOMAIN}
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
kubectl apply -f letsencrypt-issuer.yaml

# Load Images
echo "📦 Loading images into Kubernetes..."
kind load docker-image draftmate_frontend_main_2-backend:latest --name draftmate-cluster
kind load docker-image draftmate_frontend_main_2-frontend:prod --name draftmate-cluster

# Deploy Helm Chart
echo "⛵ Deploying application with Helm..."
helm upgrade --install draftmate ./draftmate-chart

echo "================================================="
echo "✅ PRODUCTION BOOTSTRAP COMPLETE!"
echo "Your application will be live at: https://${DOMAIN}"
echo ""
echo "CRITICAL FINAL STEPS:"
echo "1. Go to AWS and associate an Elastic IP with this EC2 instance."
echo "2. Go to your DNS provider and point ${DOMAIN} to your new Elastic IP."
echo "3. Go to Google Cloud Console and add https://${DOMAIN} to your OAuth Authorized Origins."
echo "================================================="
