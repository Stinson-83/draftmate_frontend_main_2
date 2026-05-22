# 🚀 DraftMate: Comprehensive 2-Instance Deployment Guide

This is the ultimate, step-by-step technical guide for setting up the 2-instance CI/CD and Production architecture for DraftMate.

---

## 🖥️ INSTANCE 1: CI/CD Pipeline (Jenkins & SonarQube)

This server handles all building, testing, code quality checks, and pushing to Docker Hub.

### Step 1: Launch EC2 Instance
- **OS:** Ubuntu 24.04 LTS
- **Instance Type:** `t3.xlarge` (Jenkins and SonarQube require at least 4-8GB RAM)
- **Storage:** 40 GB `gp3` SSD
- **Security Group (Firewall) Ports:** 
  - `22` (SSH)
  - `8080` (Jenkins UI)
  - `9000` (SonarQube UI)

### Step 2: SSH & Update System
```bash
ssh -i your-key.pem ubuntu@<INSTANCE_1_IP>
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Java (Required for Jenkins)
```bash
sudo apt install fontconfig openjdk-17-jre -y
java -version
```

### Step 4: Install Jenkins
```bash
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install jenkins -y
sudo systemctl enable jenkins
sudo systemctl start jenkins
```
*Access Jenkins at `http://<INSTANCE_1_IP>:8080`. Get initial admin password:*
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Step 5: Install Docker
```bash
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
newgrp docker
```

### Step 6: Install SonarQube (Via Docker)
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```
*Access SonarQube at `http://<INSTANCE_1_IP>:9000` (Default login: `admin` / `admin`).*

### Step 7: Install Trivy (Security Scanner)
```bash
wget https://github.com/aquasecurity/trivy/releases/download/v0.49.0/trivy_0.49.0_Linux-64bit.deb
sudo dpkg -i trivy_0.49.0_Linux-64bit.deb
```

---

## 🖥️ INSTANCE 2: Production Kubernetes Environment

This server is your live application hosting the Kubernetes cluster and pods.

### Step 1: Launch EC2 Instance
- **OS:** Ubuntu 24.04 LTS
- **Instance Type:** `m7i-flex.large`
- **Storage:** 30 GB `gp3` SSD
- **Security Group (Firewall) Ports:** 
  - `22` (SSH)
  - `80` (Frontend Web Traffic)
  - `8080` (Backend API Traffic)

### Step 2: SSH & Update System
```bash
ssh -i your-key.pem ubuntu@<INSTANCE_2_IP>
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker
```bash
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 4: Install Kubectl & Helm
```bash
# Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Step 5: Install Kind & Create Cluster
```bash
# Install Kind
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create Configuration File
cat <<EOF > kind-config.yaml
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
EOF

# Create Cluster
kind create cluster --config kind-config.yaml
```

### Step 6: Clone Code & Add Secrets
```bash
git clone https://github.com/Preetkakdiya/draftmate_frontend_main_2.git
cd draftmate_frontend_main_2

# Create secrets file (NEVER COMMIT THIS TO GITHUB)
cat <<EOF > draftmate-chart/values-secrets.yaml
frontend:
  env:
    POSTGRES_PASSWORD: 'YourRealPassword'
    POSTGRES_HOST: 'free-lawdb-useast1.rds.amazonaws.com'
    POSTGRES_DSN: 'postgresql://lawuser:YourRealPassword@free-lawdb...:5432/postgres'
    DATABASE_URL: 'postgresql://lawuser:YourRealPassword@free-lawdb...:5432/postgres'
    GOOGLE_API_KEY: 'Your-Gemini-Key'
    OPENAI_API_KEY: 'Your-OpenAI-Key'
backend:
  env:
    POSTGRES_PASSWORD: 'YourRealPassword'
    POSTGRES_HOST: 'free-lawdb-useast1.rds.amazonaws.com'
    POSTGRES_DSN: 'postgresql://lawuser:YourRealPassword@free-lawdb...:5432/postgres'
    DATABASE_URL: 'postgresql://lawuser:YourRealPassword@free-lawdb...:5432/postgres'
    GOOGLE_API_KEY: 'Your-Gemini-Key'
    OPENAI_API_KEY: 'Your-OpenAI-Key'
EOF
```

### Step 7: Initial Helm Deployment
```bash
helm upgrade --install draftmate ./draftmate-chart -f ./draftmate-chart/values.yaml -f ./draftmate-chart/values-secrets.yaml
```

### Step 8: Expose Services
*Note: Because Kind runs inside Docker, you must port-forward the services to your EC2 public ports.*
```bash
sudo nohup bash -c 'while true; do kubectl port-forward --address 0.0.0.0 svc/frontend-service 80:80; sleep 1; done' > pf-frontend.log 2>&1 &
sudo nohup bash -c 'while true; do kubectl port-forward --address 0.0.0.0 svc/backend-service 8080:8080; sleep 1; done' > pf-backend.log 2>&1 &
```

Your DraftMate application is now fully deployed and accessible via Instance 2's IP or Domain!
