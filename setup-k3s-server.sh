#!/bin/bash
# ==========================================
# DraftMate Production Migration Script (Path B)
# For Bootstrapping a BRAND NEW EC2 Instance (t3.xlarge)
# Installs: Docker, Kubectl, Helm, K3s, NGINX Ingress, SonarQube
# Deploys: Complete DraftMate Application using Helm
# ==========================================

set -e # Exit immediately if a command exits with a non-zero status
echo "🚀 Starting Full DraftMate Production Setup on new server..."

echo "📦 1. Updating System Packages..."
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y

echo "🐳 2. Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt install docker.io -y
    sudo usermod -aG docker ubuntu
fi

echo "☸️ 3. Installing Kubectl..."
if ! command -v kubectl &> /dev/null; then
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
fi

echo "⛵ 4. Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo "🧸 5. Installing K3s (Production Kubernetes Engine)..."
# Install K3s and disable Traefik so we can use NGINX Ingress for compatibility
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
fi

echo "⚙️ 6. Waiting for K3s to be ready..."
sleep 15
sudo k3s kubectl wait --for=condition=Ready nodes --all --timeout=60s

echo "🚦 7. Installing NGINX Ingress Controller..."
sudo k3s kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

echo "🔍 8. Setting up Self-Hosted SonarQube Server..."
# SonarQube requires this specific system setting
sudo sysctl -w vm.max_map_count=262144
sudo sh -c 'echo "vm.max_map_count=262144" >> /etc/sysctl.conf'

# Start SonarQube container if not running, with the CPU limit we applied earlier
if ! sudo docker ps -a | grep -q sonarqube; then
    sudo docker run -d --name sonarqube --cpus="1.0" -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:community
fi

echo "⏳ Waiting for Ingress Controller to be ready..."
sleep 20
sudo k3s kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "🔐 9. Cloning Codebase & Setting up Secrets..."
if [ ! -d "draftmate_frontend_main_2" ]; then
    git clone -b preet/k8s-setup https://github.com/Preetkakdiya/draftmate_frontend_main_2.git
fi

cd draftmate_frontend_main_2
git pull origin preet/k8s-setup

if [ ! -f "draftmate-chart/values-secrets.yaml" ]; then
cat <<EOF > draftmate-chart/values-secrets.yaml
frontend:
  env:
    POSTGRES_PASSWORD: 'TempPassword'
backend:
  env:
    POSTGRES_PASSWORD: 'TempPassword'
EOF
fi

echo "🚢 10. Deploying Application via Helm..."
sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml /usr/local/bin/helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml

echo "✅ Deployment Automation Complete!"
echo "------------------------------------------------"
echo "⚠️ IMPORTANT FINAL STEPS FOR THE NEW SERVER:"
echo "1. Run 'sudo k3s kubectl get pods' to check your new production pods."
echo "2. Edit 'draftmate-chart/values-secrets.yaml' and enter your REAL passwords and API keys."
echo "3. Re-run Helm to apply the real secrets: "
echo "   sudo KUBECONFIG=/etc/rancher/k3s/k3s.yaml helm upgrade draftmate ./draftmate-chart -f ./draftmate-chart/values.yaml -f ./draftmate-chart/values-secrets.yaml"
echo "4. Remember to open Port 80, 443, 8080, and 9000 on your NEW AWS Security Group!"
echo "------------------------------------------------"
