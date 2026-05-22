# 🚀 DraftMate: Complete Infrastructure & Kubernetes Deployment Guide

This guide explains exactly how to set up the entire DraftMate infrastructure from scratch, including the AWS EC2 server, the Kubernetes `kind` cluster, Jenkins CI/CD, and the external database.

---

## 🏗️ 1. AWS EC2 Instance Setup

To host the Kubernetes cluster and run the AI-powered backend, you need a powerful server.

1. **Launch an EC2 Instance:**
   - **AMI:** Ubuntu 24.04 LTS
   - **Instance Type:** `m7i-flex.large` (2 vCPUs, 8GB RAM - optimized for our backend requirements).
   - **Storage:** At least 30 GB gp3 SSD.
2. **Configure Security Groups (Firewall):**
   Open the following ports to `0.0.0.0/0` (Anywhere):
   - `22` (SSH for server access)
   - `80` (HTTP for the Frontend/Ingress)
   - `8080` (Backend FastAPI traffic)

---

## 🐳 2. Install Required Software

SSH into your new EC2 instance and install the core dependencies: Docker, kubectl, Helm, and Kind.

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install docker.io -y
sudo usermod -aG docker $USER && newgrp docker

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Kind (Kubernetes in Docker)
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

## ☸️ 3. Create the Kubernetes `Kind` Cluster

Because we want the outside world to access our cluster on ports `80` and `8080` without running manual port-forwards forever, we create the `kind` cluster with a custom configuration file that maps the container ports to the EC2 host.

1. Create a file named `kind-config.yaml`:
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 8080
    hostPort: 8080
    protocol: TCP
```

2. Create the cluster:
```bash
kind create cluster --config kind-config.yaml
```

---

## 🗄️ 4. External Database (AWS RDS)

Instead of hosting the relational database inside Kubernetes (which risks data loss if the pod crashes), we use AWS RDS.

1. **Create RDS Instance:** Go to AWS RDS and create a PostgreSQL instance (e.g., `free-lawdb-useast1...`).
2. **Database Credentials:** You will be given a host URL, a username (e.g., `lawuser`), and a password.
3. **Secret Configuration:** *NEVER* commit these to GitHub. Instead, on your EC2 instance, create a file called `values-secrets.yaml` inside your `draftmate-chart` directory:

```yaml
# values-secrets.yaml (Keep this safe on EC2!)
frontend:
  env:
    POSTGRES_PASSWORD: 'YourRealPassword'
    POSTGRES_HOST: 'free-lawdb-useast1.rds.amazonaws.com'
    POSTGRES_DSN: 'postgresql://lawuser:YourRealPassword@free-lawdb-useast1.rds.amazonaws.com:5432/postgres'
    DATABASE_URL: 'postgresql://lawuser:YourRealPassword@free-lawdb-useast1.rds.amazonaws.com:5432/postgres'
    GOOGLE_CLIENT_ID: 'Your-Google-Client-ID'
    GOOGLE_API_KEY: 'Your-Gemini-Key'
    OPENAI_API_KEY: 'Your-OpenAI-Key'

backend:
  env:
    # (Copy the exact same secrets here as above)
```

---

## 🚀 5. Deploying the Application

With the cluster running and your `values-secrets.yaml` securely on the EC2 instance, it's time to deploy!

1. Clone the repository on your EC2 instance.
2. Use **Helm** to install or upgrade the deployment, passing *both* the default config and your secrets override:

```bash
cd draftmate_frontend_main_2
helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml
```

This will automatically spin up:
- **Nginx Ingress**
- **draftmate-frontend** (React/Vite Pod)
- **draftmate-backend** (FastAPI Pod)
- **qdrant** (Vector Search DB Pod)

---

## 🌐 6. Setting Up Your Domain Name

To make your application accessible via a real URL instead of a raw IP address:

1. **Get a Domain:** (e.g., from Namecheap, Route53, or a free host).
2. **DNS Record:** Create a **CNAME Record** (like `app.yourdomain.com`) and point it to your AWS EC2 Public DNS (e.g., `ec2-54-221-83-201.compute-1.amazonaws.com`).
3. **Update Kubernetes:** Change the frontend/ingress URLs in `values.yaml` to match your new domain name, commit to GitHub, pull it on the EC2 instance, and run `helm upgrade` again.

---

## 🔄 7. CI/CD Pipeline (Jenkins)

To automate future updates so you don't have to manually pull code on EC2:
1. Set up a Jenkins server.
2. Link it to your GitHub Webhooks.
3. Your Jenkins pipeline should run:
   - `docker build -t your-dockerhub/draftmate-frontend .`
   - `docker push your-dockerhub/draftmate-frontend`
   - Run the `helm upgrade` command on the EC2 server via SSH.
