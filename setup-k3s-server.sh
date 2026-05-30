#!/bin/bash
# ==========================================
# DraftMate Production K3s Deployment Script
# Installs: K3s, NGINX Ingress Controller
# Deploys: Complete Application using Helm
# ==========================================

set -e # Exit immediately if a command exits with a non-zero status
echo "🚀 Starting Full DraftMate Production Setup (K3s)..."

echo "🗑️ 1. Cleaning up old Kind cluster (if exists)..."
if command -v kind &> /dev/null; then
    sudo kind delete cluster || true
fi

echo "🧸 2. Installing K3s (Production Kubernetes Engine)..."
# Install K3s and disable Traefik so we can use NGINX Ingress
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -

echo "⚙️ 3. Waiting for K3s to be ready..."
sleep 15
sudo k3s kubectl wait --for=condition=Ready nodes --all --timeout=60s

echo "🚦 4. Installing NGINX Ingress Controller..."
sudo k3s kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

echo "⏳ Waiting for Ingress Controller to be ready..."
sleep 20
sudo k3s kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "🚢 5. Deploying Application via Helm..."
# Ensure Helm is installed
if ! command -v helm &> /dev/null; then
    echo "⛵ Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Ensure codebase exists
if [ ! -d "draftmate_frontend_main_2" ]; then
    echo "This script must be run from inside or directly above the repository. Assuming we are in it."
fi

# Export KUBECONFIG for helm to use K3s config
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Create secrets file if not exists
if [ ! -f "./draftmate-chart/values-secrets.yaml" ]; then
cat <<EOF > ./draftmate-chart/values-secrets.yaml
frontend:
  env:
    POSTGRES_PASSWORD: 'TempPassword'
backend:
  env:
    POSTGRES_PASSWORD: 'TempPassword'
EOF
fi

sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml /usr/local/bin/helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml

echo "✅ Production K3s Deployment Complete!"
echo "------------------------------------------------"
echo "⚠️ IMPORTANT FINAL STEPS:"
echo "1. Run 'sudo k3s kubectl get pods' to check your new production pods."
echo "------------------------------------------------"
