# DraftMate Server Migration & Setup Guide

This guide contains the exact steps required to migrate DraftMate to a brand new AWS EC2 instance exactly as it is currently configured.

## 1. AWS EC2 Instance Requirements

Create a new EC2 Instance with the following specifications:
- **OS:** Ubuntu 24.04 LTS (or 22.04 LTS)
- **Size:** `t3.large` or `t3a.large` (Minimum 8GB RAM required for the machine learning models).
- **Disk:** 40GB General Purpose SSD (gp3)
- **Security Group (Inbound Rules):**
  - **SSH (22):** Anywhere (`0.0.0.0/0`)
  - **HTTP (80):** Anywhere (`0.0.0.0/0`)
  - **HTTPS (443):** Anywhere (`0.0.0.0/0`)
  - **Custom TCP (8080):** Anywhere (`0.0.0.0/0`) (Required for Backend API)
  - **Custom TCP (9000):** Anywhere (`0.0.0.0/0`) (Optional for SonarQube)

## 2. Server Bootstrapping

Once the instance is running, SSH into it and run the automatic setup script:

```bash
# Clone the repository
git clone -b preet/k8s-setup https://github.com/Preetkakdiya/draftmate_frontend_main_2.git
cd draftmate_frontend_main_2

# Make the setup script executable and run it
chmod +x setup-k3s-server.sh
./setup-k3s-server.sh
```

**What this script automatically does:**
1. Upgrades system packages and creates an **8GB Swapfile** to prevent Out-Of-Memory (OOM) crashes.
2. Installs **Docker** and **Kubectl**.
3. Installs **K3s** (a lightweight production Kubernetes engine) without Traefik.
4. Correctly configures `~/.kube/config` permissions.
5. Installs **socat** and sets up a permanent port-forward rule mapping `8080` (public API) directly to Kubernetes NodePort `30080`.
6. Installs **NGINX Ingress Controller**.
7. Deploys the entire DraftMate Helm Chart into the cluster.

## 3. Apply Production Secrets (Crucial Step)

Because API keys and passwords (`values-secrets.yaml`) are ignored by Git for security, the setup script generated a dummy file. **You must copy your real secrets to the new server.**

From your **local Windows machine** (where you have your real `values-secrets.yaml`), run this `scp` command to securely copy it to the new EC2 instance:

```bash
scp -i "C:\path\to\your\aws-key.pem" "D:\draftmate\draftmate_frontend_main_2\draftmate-chart\values-secrets.yaml" ubuntu@<NEW-EC2-IP-ADDRESS>:/home/ubuntu/draftmate_frontend_main_2/draftmate-chart/values-secrets.yaml
```

Once copied, SSH back into the new EC2 instance and apply the secrets to the live cluster:

```bash
cd /home/ubuntu/draftmate_frontend_main_2
helm upgrade draftmate ./draftmate-chart -f ./draftmate-chart/values.yaml -f ./draftmate-chart/values-secrets.yaml
```

## 4. Update GitHub Actions (CI/CD)

For your automatic deployment pipeline to deploy to the *new* server, you must update your GitHub Secrets.

1. Go to your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**.
2. Update the following secrets:
   - `K8S_SERVER_IP` -> Set to your new EC2 Public IP address.
   - `K8S_SSH_PRIVATE_KEY` -> Set to the private `.pem` key used to SSH into the new server.

## 5. Maintenance Commands

**View Backend Logs:**
```bash
kubectl logs -l app.kubernetes.io/name=backend -f
```

**Check Pod Status:**
```bash
kubectl get pods
```

**Garbage Collect Unused Docker Images (To save disk space manually):**
```bash
sudo k3s crictl rmi --prune
```
