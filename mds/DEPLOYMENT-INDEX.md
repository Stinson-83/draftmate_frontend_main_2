# DraftMate Deployment Package - Complete Index

## Overview

Complete, step-by-step guide to deploy DraftMate on AWS with custom domain (`draftmate.com`). Includes Kubernetes cluster, Helm charts, database setup, SSL certificates, and monitoring.

---

## 📚 Documentation Files

### 1. **README.md** - Main Deployment Guide

**Start here!** Complete 20-step walkthrough covering:

- Prerequisites and tools installation
- AWS infrastructure setup (VPC, subnets, security groups)
- EC2 instance provisioning (3 nodes: control plane + 2 workers)
- Kubernetes cluster initialization
- Ingress controller setup
- Domain configuration with Route53
- SSL certificate installation with Let's Encrypt
- Helm deployment
- Post-deployment verification
- Monitoring and maintenance

**Time to complete:** 2-3 hours

### 2. **AWS-COST-ESTIMATION.md** - Budget Planning

Detailed cost breakdown including:

- Development environment: **$204.85/month**
- Production environment: **$478.24/month**
- Optimized production: **$350/month**
- Cost optimization strategies (save up to 70%)
- ROI calculations
- Budget monitoring setup
- Reserved instances and Spot pricing

**Use this to:** Plan budget and understand costs

### 3. **TROUBLESHOOTING.md** - Issue Resolution

Comprehensive troubleshooting guide for:

- Kubernetes issues (ImagePullBackOff, CrashLoopBackOff, etc.)
- Frontend Configuration (Vite environment variables)
- Database connectivity problems
- Networking and DNS issues
- SSL/certificate problems
- Performance troubleshooting
- Debugging commands cheatsheet

**Use this when:** Something breaks or behaves unexpectedly

### 4. **QUICK-REFERENCE.md** - Commands Cheatsheet

Quick lookup guide with:

- Essential AWS CLI commands
- Kubernetes kubectl commands
- Helm chart management
- Common deployment steps
- Monitoring commands
- Disaster recovery procedures
- Cost management commands

**Use this for:** Quick command lookups

---

## 📁 Infrastructure Files

### 5. **kind-cluster.yaml**

Kubernetes cluster configuration for local development using Kind (Kubernetes in Docker).

- 3-node cluster (1 control plane + 2 workers)
- Port mapping for ports 80 and 8080
- Useful for testing before AWS deployment

**Usage:** `kind create cluster --config kind-cluster.yaml`

### 6. **draftmate-chart/** - Helm Chart Directory

Complete Helm chart for DraftMate deployment:

```
draftmate-chart/
├── Chart.yaml                    # Chart metadata
├── values.yaml                   # Default values (all env vars)
├── values-aws.yaml               # AWS-specific overrides
└── templates/
    ├── frontend-deployment.yaml   # Frontend application
    ├── frontend-service.yaml      # Frontend service
    ├── backend-deployment.yaml    # Backend API server
    ├── backend-service.yaml       # Backend service
    ├── postgres-statefulset.yaml  # PostgreSQL with pgvector
    ├── postgres-service.yaml      # Database service
    └── ingress.yaml               # Ingress controller config
```

**Features:**

- Multi-replica deployments (2 frontend, 2 backend)
- PostgreSQL StatefulSet with pgvector extension
- LoadBalancer ingress with SSL support
- All environment variables configured
- AWS RDS integration
- Kubernetes DNS for internal services

---

## 🚀 Automation Scripts

### 7. **deploy-aws.sh** - One-Command Deployment

Bash script to automate initial AWS setup:

```bash
bash deploy-aws.sh us-east-1 production
```

**Does:**

- Validates prerequisites (AWS CLI, kubectl, Helm)
- Creates infrastructure configuration file
- Sets up VPC networking
- Generates SSH key
- Creates summary of next steps

**Time saved:** ~30 minutes

---

## 🔑 Configuration Files (Generated)

These files are created when you run deployment scripts:

### 8. **.env.aws** (Generated)

AWS infrastructure variables:

```bash
AWS_REGION=us-east-1
PROJECT_NAME=draftmate
VPC_CIDR=10.0.0.0/16
DOMAIN=draftmate.com
# ... more variables
```

### 9. **.infra.ids** (Generated)

AWS resource IDs for reference:

```bash
VPC_ID=vpc-12345678
RDS_ENDPOINT=draftmate-postgres.c123456.us-east-1.rds.amazonaws.com
CONTROL_PLANE_IP=54.123.45.67
# ... more IDs
```

### 10. **draftmate-key.pem** (Generated)

SSH private key for EC2 instances. **Keep this secure!**

---

## 📋 Deployment Workflow

### Phase 1: Planning & Setup (30 min)

1. ✅ Read `README.md` sections 1-2
2. ✅ Set up AWS account and CLI
3. ✅ Review `AWS-COST-ESTIMATION.md`
4. ✅ Run `deploy-aws.sh` for automation

### Phase 2: Infrastructure (1 hour)

1. ✅ Execute VPC and networking setup (README Step 1-2)
2. ✅ Create security groups (README Step 2)
3. ✅ Launch EC2 instances (README Step 4)
4. ✅ Create RDS database (README Step 5)

### Phase 3: Kubernetes (45 min)

1. ✅ Initialize control plane (README Step 6)
2. ✅ Join worker nodes (README Step 7)
3. ✅ Copy kubeconfig locally (README Step 8)
4. ✅ Setup storage class (README Step 9)

### Phase 4: Ingress & Networking (30 min)

1. ✅ Install NGINX Ingress Controller (README Step 10)
2. ✅ Configure Route53 DNS (README Step 11)
3. ✅ Setup SSL certificates (README Step 12)

### Phase 5: Deployment (15 min)

1. ✅ Create Kubernetes secrets (README Step 14)
2. ✅ Install Helm chart (README Step 15)
3. ✅ Verify deployment (README Step 16)

### Phase 6: Verification (15 min)

1. ✅ Test application at draftmate.com
2. ✅ Check logs and monitoring
3. ✅ Run performance tests

**Total time: ~3 hours (first deployment)**

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              AWS Account (us-east-1)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Internet Gateway                 │  │
│  └────────────┬─────────────────────────────┘  │
│               │                                 │
│  ┌────────────┴─────────────────────────────┐  │
│  │        Route53 DNS (draftmate.com)       │  │
│  └────────────┬─────────────────────────────┘  │
│               │                                 │
│  ┌────────────┴─────────────────────────────┐  │
│  │      ALB / LoadBalancer (Port 80/443)    │  │
│  └────────────┬─────────────────────────────┘  │
│               │                                 │
│  ┌────────────┴─────────────────────────────┐  │
│  │      Kubernetes Cluster (3 nodes)        │  │
│  │  ┌──────────────────────────────────┐    │  │
│  │  │ NGINX Ingress Controller         │    │  │
│  │  └────┬────────────┬────────────────┘    │  │
│  │       │            │                      │  │
│  │  ┌────┴─┐     ┌────┴─────────────────┐   │  │
│  │  │Frontend    │ Backend               │   │  │
│  │  │(Pods)      │ (Pods)                │   │  │
│  │  └────┬─┘     └────┬─────────────────┘   │  │
│  │       └────────────┤                      │  │
│  │            ┌───────┴────────┐             │  │
│  │            │ PostgreSQL      │             │  │
│  │            │ StatefulSet     │             │  │
│  │            └────────────────┘             │  │
│  └─────────────────────────────────────────┘  │
│                     │                         │
│  ┌──────────────────┴──────────────────┐     │
│  │      RDS PostgreSQL Instance        │     │
│  │  (db.t4g.micro - 20GB storage)      │     │
│  └─────────────────────────────────────┘     │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 📊 Resource Summary

### Compute Resources

- **Control Plane:** 1x t3.medium (2 vCPU, 4GB RAM)
- **Worker Nodes:** 2x t3.medium (2 vCPU, 4GB RAM each)
- **Total CPU:** 6 vCPU, 12GB RAM

### Storage

- **Kubernetes:** EBS gp3 volumes (20GB each node)
- **Database:** RDS with 20GB (auto-scaling available)
- **Backups:** Automated daily snapshots

### Networking

- **VPC:** 10.0.0.0/16 with public/private subnets
- **Domain:** draftmate.com (Route53)
- **SSL:** Let's Encrypt (auto-renewing)
- **Load Balancer:** AWS ALB (automatic scaling)

---

## 🔒 Security Features

- ✅ VPC with private/public subnets
- ✅ Security groups with minimal permissions
- ✅ SSH key-based authentication
- ✅ HTTPS/TLS certificates (Let's Encrypt)
- ✅ Database encryption at rest
- ✅ Network ACLs and security groups
- ✅ Kubernetes RBAC
- ✅ Secrets management via Kubernetes Secrets

---

## 📈 Monitoring & Logging

**Included:**

- CloudWatch Logs for application logs
- CloudWatch Alarms for cost tracking
- Kubernetes pod logs and events
- Database performance metrics

**To add:**

- Prometheus/Grafana for metrics
- ELK Stack for centralized logging
- AWS X-Ray for tracing
- See `README.md` Step 18-19

---

## 🆘 Getting Help

### If something goes wrong:

1. Check **TROUBLESHOOTING.md** for common issues
2. Review logs: `kubectl logs <pod-name> -n draftmate`
3. Verify AWS resources in AWS Console
4. Check DNS resolution: `nslookup draftmate.com`

### Quick diagnostic script:

```bash
# Create a script to check system health
kubectl get all -n draftmate
kubectl describe nodes
aws ec2 describe-instances --filters "Name=tag:Name,Values=draftmate-*"
aws rds describe-db-instances --db-instance-identifier draftmate-postgres
```

---

## 💰 Cost Optimization

**Quick wins:**

- Use Spot Instances: Save 70% on compute
- Reserve Instances: Save 40% with 1-year commitment
- Consolidate environments: Use same cluster for dev/staging
- Auto-scaling: Scale down during off-hours

See **AWS-COST-ESTIMATION.md** for detailed strategies.

---

## 📱 Quick Access

### Files to Keep Handy

- `draftmate-key.pem` - SSH key (SECURE!)
- `.env.aws` - Configuration variables
- `QUICK-REFERENCE.md` - Command cheatsheet
- `TROUBLESHOOTING.md` - Issue resolution

### Bookmarks

- AWS Console: https://console.aws.amazon.com/
- Your domain: https://draftmate.com
- kubectl cheatsheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/

---

## ✨ What's Included

- ✅ Complete Helm chart for DraftMate
- ✅ 3-node Kubernetes cluster setup
- ✅ PostgreSQL with pgvector extension
- ✅ Frontend and Backend deployments
- ✅ SSL/TLS certificates via Let's Encrypt
- ✅ Auto-scaling ingress controller
- ✅ Custom domain setup (draftmate.com)
- ✅ Security groups and networking
- ✅ RDS database configuration
- ✅ Cost estimation and monitoring
- ✅ Troubleshooting guides
- ✅ Deployment automation script

---

## 🚫 What's NOT Included

- CI/CD pipeline (use GitHub Actions, GitLab CI, or Jenkins)
- Secrets management (use AWS Secrets Manager)
- Log aggregation (use ELK or Loki)
- Application code (your responsibility)
- Domain registration (register on Route53 or external registrar)

---

## 📞 Support

For issues:

1. Check the appropriate `.md` file from this package
2. Review AWS documentation
3. Check Kubernetes documentation
4. Consult your infrastructure team

---

## 📝 Version Info

- **Created:** May 2024
- **Domain:** draftmate.com
- **Kubernetes Version:** 1.35+
- **Helm Version:** 3.x
- **AWS Region:** us-east-1
- **Ubuntu Version:** 22.04 LTS

---

## 🎓 Learning Resources

- **Kubernetes:** https://kubernetes.io/docs/
- **Helm:** https://helm.sh/docs/
- **AWS:** https://docs.aws.amazon.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Docker:** https://docs.docker.com/

---

## 📄 License & Usage

These deployment materials are provided as-is for deploying DraftMate on AWS.

- Keep SSH keys secure
- Don't commit credentials to git
- Use AWS IAM roles, not hardcoded credentials
- Review costs regularly

---

**Ready to deploy? Start with README.md! 🚀**

---

**Package Contents:**

- 📘 4 Documentation files (README, Cost, Troubleshooting, Quick Reference)
- 🎯 1 Kubernetes configuration file
- 📦 1 Complete Helm chart
- 🔧 1 Automation script
- 📋 This index document

**Total deployment time:** 3-4 hours (first time)
**Maintenance time:** 30 minutes/week

---

_Last Updated: May 13, 2024_
_Version: 1.0_
_Status: Production Ready_ ✅
