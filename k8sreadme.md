# 🚀 DraftMate: 2-Instance CI/CD & Deployment Guide

This cheat sheet outlines the two-server architecture for deploying DraftMate, incorporating automated CI/CD and code quality checks.

## 🖥️ Server 1: CI/CD Pipeline (Jenkins & SonarQube)
This instance handles testing, building, and pushing code.

**1. Setup & Installations:**
- Install **Java**, **Jenkins**, **Docker**, and **SonarQube** on this instance.
- Install security tools: **OWASP Dependency-Check** and **Trivy**.

**2. The Jenkins CI Pipeline (Continuous Integration):**
When a developer pushes to GitHub, Jenkins automatically:
- Pulls the latest code.
- Runs **OWASP** to check for dependency vulnerabilities.
- Runs **SonarQube** to analyze code quality and bugs.
- Runs **Trivy** to scan the filesystem/Docker images for vulnerabilities.
- Builds the new Frontend & Backend Docker images.
- Pushes the images to Docker Hub.

---

## 🖥️ Server 2: Production Server (Kubernetes)
This is your powerful `m7i-flex.large` instance that actually runs the application.

**1. Setup & Installations:**
- Install **Docker**, **kubectl**, **Helm**, and **Kind**.
- Open Firewall ports `80` (HTTP), `8080` (Backend), and `22` (SSH).

**2. Start Kubernetes Cluster:**
Create `kind-config.yaml` to map ports 80 and 8080 to the host, then run:
`kind create cluster --config kind-config.yaml`

**3. External Database Configuration:**
Create `values-secrets.yaml` safely on this server containing your AWS RDS PostgreSQL and API credentials.

**4. The Jenkins CD Pipeline (Continuous Deployment):**
After Server 1 finishes pushing the Docker images, it triggers the CD pipeline, which securely connects to Server 2 via SSH and runs:
```bash
helm upgrade --install draftmate ./draftmate-chart \
  -f ./draftmate-chart/values.yaml \
  -f ./draftmate-chart/values-secrets.yaml
```

*(Alternatively, ArgoCD can be installed on Server 2 to automatically detect GitHub changes and deploy them).*
