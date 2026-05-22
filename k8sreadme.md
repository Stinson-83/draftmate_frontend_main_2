# 🚀 DraftMate: Kubernetes Quickstart Guide

This is the brief cheat sheet for deploying the DraftMate infrastructure.

## 1. AWS EC2 Setup
- **Launch Instance:** `m7i-flex.large` (Ubuntu 24.04).
- **Firewall:** Open ports `22` (SSH), `80` (HTTP), and `8080` (API) to `0.0.0.0/0`.

## 2. Install Dependencies (Run on EC2)
```bash
sudo apt update && sudo apt install docker.io -y
sudo usermod -aG docker $USER && newgrp docker

# Install kubectl & Helm
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64 && chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
```

## 3. Start Cluster
Create `kind-config.yaml`:
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
  - containerPort: 8080
    hostPort: 8080
```
Run: `kind create cluster --config kind-config.yaml`

## 4. Deploy Application
Create `values-secrets.yaml` securely on the EC2 server containing your private AWS RDS database and API credentials.

Run the Helm deployment:
```bash
helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml
```

## 5. Domain & CI/CD
- **DNS:** Point your domain CNAME (e.g., `app.domain.com`) to the EC2 Public DNS.
- **Updates:** Configure Jenkins to build Docker images on code push, and run the `helm upgrade` command above to apply changes.
