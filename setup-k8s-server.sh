#!/bin/bash
# ==========================================
# DraftMate Production Deployment Automation Script
# Installs: Docker, Kubectl, Helm, Kind, Ingress Controller
# Deploys: Complete Application using Helm
# ==========================================

set -e # Exit immediately if a command exits with a non-zero status
echo "🚀 Starting Full DraftMate Production Setup..."

echo "📦 1. Updating System Packages..."
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y

echo "💾 1.5. Checking & Configuring Swap Space (8GB)..."
if [ $(free -m | awk '/^Swap:/{print $2}') -lt 4000 ]; then
    echo "Creating 8GB Swap File to prevent Out-of-Memory crashes..."
    sudo fallocate -l 8G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap Space configured!"
else
    echo "✅ Swap Space is already configured."
fi

echo "🐳 2. Installing Docker..."
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu

echo "☸️ 3. Installing Kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

echo "⛵ 4. Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "🧸 5. Installing Kind..."
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

echo "⚙️ 6. Creating Native Kind Configuration (Ingress Ready)..."
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
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 30080
    hostPort: 8080
    protocol: TCP
- role: worker
- role: worker
EOF

echo "🏗️ 7. Spinning up the Kubernetes Cluster (This takes ~1 minute)..."
sudo kind create cluster --config kind-config.yaml

echo "🚦 8. Installing NGINX Ingress Controller..."
# We must use sudo kubectl because the docker group hasn't taken effect for the current bash session
sudo kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "⏳ Waiting for Ingress Controller to be ready..."
sleep 15
sudo kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "🔐 9. Cloning Codebase & Setting up Secrets..."
if [ ! -d "draftmate_frontend_main_2" ]; then
    git clone -b preet/k8s-setup https://github.com/Preetkakdiya/draftmate_frontend_main_2.git
fi
cd draftmate_frontend_main_2

cat <<EOF > draftmate-chart/values-secrets.yaml
frontend:
  env:
    # Database Credentials
    POSTGRES_PASSWORD: "YOUR_POSTGRES_PASSWORD"
    PSQL_PASSWD: "YOUR_POSTGRES_PASSWORD"
    POSTGRES_HOST: "company-lawdb-useast1.rds.amazonaws.com"
    POSTGRES_DSN: "postgresql://lawuser:YOUR_POSTGRES_PASSWORD@company-lawdb-useast1.rds.amazonaws.com:5432/postgres"
    DATABASE_URL: "postgresql://lawuser:YOUR_POSTGRES_PASSWORD@company-lawdb-useast1.rds.amazonaws.com:5432/postgres"
    
    # AI & Search API Keys
    GOOGLE_API_KEY: "YOUR_GOOGLE_API_KEY"
    GEMINI_API_KEY: "YOUR_GEMINI_API_KEY"
    OPENAI_API_KEY: "YOUR_OPENAI_API_KEY"
    TAVILY_API_KEY: "YOUR_TAVILY_API_KEY"
    FIRECRAWL_API_KEY: "YOUR_FIRECRAWL_API_KEY"
    FIRECRAWLER_API_KEY: "YOUR_FIRECRAWL_API_KEY"
    SERPER_API_KEY: "YOUR_SERPER_API_KEY"
    GOOGLE_SERP_API_KEY: "YOUR_SERPER_API_KEY"
    LANGSMITH_API_KEY: "YOUR_LANGSMITH_API_KEY"
    
    # AWS S3 Integration
    AWS_ACCESS_KEY_ID: "YOUR_AWS_ACCESS_KEY_ID"
    AWS_SECRET_ACCESS_KEY: "YOUR_AWS_SECRET_ACCESS_KEY"
    
    # Payments Integration (Cashfree)
    CASHFREE_APP_ID: "YOUR_CASHFREE_APP_ID"
    CASHFREE_SECRET_KEY: "YOUR_CASHFREE_SECRET_KEY"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET: "YOUR_GOOGLE_CLIENT_SECRET"
    
    # Email / SMTP Authentication
    SMTP_PASSWORD: "YOUR_SMTP_PASSWORD"

backend:
  env:
    # Database Credentials
    POSTGRES_PASSWORD: "YOUR_POSTGRES_PASSWORD"
    PSQL_PASSWD: "YOUR_POSTGRES_PASSWORD"
    POSTGRES_HOST: "company-lawdb-useast1.rds.amazonaws.com"
    POSTGRES_DSN: "postgresql://lawuser:YOUR_POSTGRES_PASSWORD@company-lawdb-useast1.rds.amazonaws.com:5432/postgres"
    DATABASE_URL: "postgresql://lawuser:YOUR_POSTGRES_PASSWORD@company-lawdb-useast1.rds.amazonaws.com:5432/postgres"
    
    # AI & Search API Keys
    GOOGLE_API_KEY: "YOUR_GOOGLE_API_KEY"
    GEMINI_API_KEY: "YOUR_GEMINI_API_KEY"
    OPENAI_API_KEY: "YOUR_OPENAI_API_KEY"
    TAVILY_API_KEY: "YOUR_TAVILY_API_KEY"
    FIRECRAWL_API_KEY: "YOUR_FIRECRAWL_API_KEY"
    FIRECRAWLER_API_KEY: "YOUR_FIRECRAWL_API_KEY"
    SERPER_API_KEY: "YOUR_SERPER_API_KEY"
    GOOGLE_SERP_API_KEY: "YOUR_SERPER_API_KEY"
    LANGSMITH_API_KEY: "YOUR_LANGSMITH_API_KEY"
    
    # AWS S3 Integration
    AWS_ACCESS_KEY_ID: "YOUR_AWS_ACCESS_KEY_ID"
    AWS_SECRET_ACCESS_KEY: "YOUR_AWS_SECRET_ACCESS_KEY"
    
    # Payments Integration (Cashfree)
    CASHFREE_APP_ID: "YOUR_CASHFREE_APP_ID"
    CASHFREE_SECRET_KEY: "YOUR_CASHFREE_SECRET_KEY"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET: "YOUR_GOOGLE_CLIENT_SECRET"
    
    # Email / SMTP Authentication
    SMTP_PASSWORD: "YOUR_SMTP_PASSWORD"
EOF

echo "🚢 10. Deploying Application via Helm..."
# We use sudo helm to bypass the session permission issue
sudo KUBECONFIG=/root/.kube/config /usr/local/bin/helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml

echo "✅ Deployment Automation Complete!"
echo "------------------------------------------------"
echo "⚠️ IMPORTANT FINAL STEPS:"
echo "1. Edit draftmate-chart/values-secrets.yaml and enter the REAL company passwords and API keys."
echo "2. Re-run this exact command to apply them: "
echo "   sudo KUBECONFIG=/root/.kube/config helm upgrade draftmate ./draftmate-chart -f ./draftmate-chart/values.yaml -f ./draftmate-chart/values-secrets.yaml"
echo "------------------------------------------------"
echo "Note: You no longer need to run any port-forward scripts!"
