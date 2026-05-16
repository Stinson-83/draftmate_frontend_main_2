# DraftMate AWS Deployment - Quick Reference

## Pre-Deployment Checklist

```bash
# 1. Install tools
aws --version
kubectl version --client
helm version
eksctl version

# 2. Configure AWS credentials
aws configure
aws sts get-caller-identity

# 3. Set variables
export AWS_REGION="us-east-1"
export PROJECT_NAME="draftmate"
export DOMAIN="draftmate.com"
```

---

## One-Command Deployment (Quick Start)

```bash
# Run from draftmate directory
bash deploy-aws.sh us-east-1 production
```

---

## Infrastructure Variables

```bash
# VPC Configuration
VPC_CIDR=10.0.0.0/16
PUBLIC_SUBNET_1=10.0.1.0/24
PUBLIC_SUBNET_2=10.0.2.0/24
PRIVATE_SUBNET_1=10.0.10.0/24
PRIVATE_SUBNET_2=10.0.11.0/24

# Kubernetes
K8S_POD_CIDR=10.244.0.0/16

# Instance Types
CONTROL_PLANE=t3.medium
WORKER_NODE=t3.medium
DB_INSTANCE=db.t4g.micro

# SSH & Keys
KEY_NAME=draftmate-key
REGION=us-east-1
```

---

## Essential AWS Commands

### EC2 Instances

```bash
# List instances
aws ec2 describe-instances --filters "Name=tag:Name,Values=draftmate-*"

# Get instance IP
aws ec2 describe-instances --instance-ids i-1234567890abcdef0 \
  --query 'Reservations[0].Instances[0].PublicIpAddress'

# SSH into instance
ssh -i draftmate-key.pem ubuntu@<PUBLIC-IP>

# Stop instance (save costs)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Terminate instance
aws ec2 terminate-instances --instance-ids i-1234567890abcdef0
```

### Security Groups

```bash
# List security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=draftmate-*"

# Add ingress rule (HTTP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-1234567890abcdef0 \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# Add ingress rule (SSH)
aws ec2 authorize-security-group-ingress \
  --group-id sg-1234567890abcdef0 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0
```

### RDS

```bash
# Describe RDS instance
aws rds describe-db-instances --db-instance-identifier draftmate-postgres

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier draftmate-postgres \
  --query 'DBInstances[0].Endpoint.Address'

# Modify RDS (increase storage)
aws rds modify-db-instance \
  --db-instance-identifier draftmate-postgres \
  --allocated-storage 50 --apply-immediately

# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier draftmate-postgres \
  --db-snapshot-identifier draftmate-backup-$(date +%Y%m%d)
```

### Route53 (DNS)

```bash
# List hosted zones
aws route53 list-hosted-zones-by-name --dns-name draftmate.com

# List DNS records
aws route53 list-resource-record-sets --hosted-zone-id Z1234567890ABC

# Update DNS (update CHANGE_BATCH.json first)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://change-batch.json
```

---

## Kubernetes Control

### Cluster Information

```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/draftmate-config

# Cluster info
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide

# Check resources
kubectl top nodes
kubectl top pods -n draftmate
```

### Namespace Management

```bash
# Create namespace
kubectl create namespace draftmate

# Switch namespace
kubectl config set-context --current --namespace=draftmate

# List namespaces
kubectl get namespaces
```

### Pod Management

```bash
# List pods
kubectl get pods -n draftmate
kubectl get pods -n draftmate -o wide

# Describe pod
kubectl describe pod <pod-name> -n draftmate

# View logs
kubectl logs <pod-name> -n draftmate
kubectl logs -f <pod-name> -n draftmate  # Follow logs

# Previous logs (for crashed pods)
kubectl logs <pod-name> -n draftmate --previous

# Execute command in pod
kubectl exec -it <pod-name> -n draftmate -- /bin/bash
```

### Deployment Management

```bash
# List deployments
kubectl get deployments -n draftmate

# Describe deployment
kubectl describe deployment <name> -n draftmate

# Scale deployment
kubectl scale deployment backend --replicas=3 -n draftmate

# Restart deployment
kubectl rollout restart deployment/backend -n draftmate

# Check rollout status
kubectl rollout status deployment/backend -n draftmate

# View rollout history
kubectl rollout history deployment/backend -n draftmate

# Rollback to previous version
kubectl rollout undo deployment/backend -n draftmate
```

### Service Management

```bash
# List services
kubectl get svc -n draftmate

# Get service details
kubectl describe svc backend-service -n draftmate

# Port forward (local access)
kubectl port-forward svc/backend-service 8080:8080 -n draftmate

# Get service endpoints
kubectl get endpoints -n draftmate
```

### Ingress Management

```bash
# List ingress
kubectl get ingress -n draftmate

# Describe ingress
kubectl describe ingress draftmate-ingress -n draftmate

# Watch ingress
kubectl get ingress -n draftmate -w
```

---

## Helm Commands

### Chart Management

```bash
# Install chart
helm install draftmate ./draftmate-chart \
  --namespace draftmate \
  --create-namespace

# Upgrade chart
helm upgrade draftmate ./draftmate-chart \
  --namespace draftmate

# Rollback release
helm rollback draftmate 1 -n draftmate

# List releases
helm list -n draftmate

# Get release status
helm status draftmate -n draftmate

# Get release values
helm get values draftmate -n draftmate

# Uninstall release
helm uninstall draftmate -n draftmate
```

### Chart Development

```bash
# Validate chart
helm lint ./draftmate-chart

# Dry run (preview)
helm install draftmate ./draftmate-chart --dry-run --debug

# Template rendering
helm template draftmate ./draftmate-chart

# Package chart
helm package ./draftmate-chart
```

---

## Common Deployment Steps

### Step 1: Create Infrastructure

```bash
# SSH into control plane
ssh -i draftmate-key.pem ubuntu@<CONTROL_PLANE_IP>

# Initialize Kubernetes
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<CONTROL_PLANE_IP>

# Setup kubeconfig
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI (Flannel)
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

### Step 2: Join Workers

```bash
# On each worker node
sudo kubeadm join <CONTROL_PLANE_IP>:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash <HASH>
```

### Step 3: Setup Ingress

```bash
# Add Helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer
```

### Step 4: Setup SSL

```bash
# Add Jetstack repo
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# Create Let's Encrypt issuer
kubectl apply -f letsencrypt-issuer.yaml
```

### Step 5: Deploy Application

```bash
# Create secrets
kubectl create secret generic draftmate-secrets \
  --from-literal=database-url='...' \
  -n draftmate

# Install Helm chart
helm install draftmate ./draftmate-chart \
  --namespace draftmate --create-namespace
```

---

## Monitoring Commands

### Real-time Monitoring

```bash
# Watch pods
kubectl get pods -n draftmate -w

# Watch events
kubectl get events -n draftmate -w

# Monitor resources
watch 'kubectl top nodes && kubectl top pods -n draftmate'
```

### Debugging

```bash
# Debug pod connectivity
kubectl run -it --rm debug --image=ubuntu --restart=Never -- bash

# Inside debug pod:
apt-get update && apt-get install -y curl postgresql-client dnsutils

# Test services
curl http://backend-service:8080
psql -h db-service -U lawuser

# Test DNS
dig backend-service
nslookup db-service

# Check connectivity
nc -zv db-service 5432
```

### Logs Analysis

```bash
# Get logs from specific pod
kubectl logs pod/<pod-name> -n draftmate

# Get logs from deployment
kubectl logs deployment/backend -n draftmate --all-containers=true

# Tail logs
kubectl logs -f pod/<pod-name> -n draftmate

# Get logs from specific container
kubectl logs pod/<pod-name> -c backend -n draftmate

# Get logs from all pods in deployment
kubectl logs -f deployment/backend -n draftmate --all-pods=true

# Export logs
kubectl logs deployment/backend -n draftmate > deployment.log
```

---

## Disaster Recovery

### Backup

```bash
# Backup kubeconfig
cp ~/.kube/draftmate-config ~/.kube/draftmate-config.backup

# Backup database
kubectl exec postgres-0 -n draftmate -- \
  pg_dump -U lawuser postgres > backup.sql

# Backup Helm values
helm get values draftmate -n draftmate > helm-values-backup.yaml

# Backup entire namespace
kubectl get all -n draftmate -o yaml > namespace-backup.yaml
```

### Restore

```bash
# Restore Helm release
helm rollback draftmate <REVISION> -n draftmate

# Restore database
kubectl exec -i postgres-0 -n draftmate -- \
  psql -U lawuser postgres < backup.sql

# Restore from manifest
kubectl apply -f namespace-backup.yaml
```

---

## Cost Management

### Stop Services (Save Money)

```bash
# Stop EC2 instances
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Scale down deployments
kubectl scale deployment backend --replicas=0 -n draftmate
kubectl scale deployment frontend --replicas=0 -n draftmate

# Scale down RDS
aws rds modify-db-instance \
  --db-instance-identifier draftmate-postgres \
  --db-instance-class db.t4g.micro --apply-immediately
```

### Monitor Costs

```bash
# Check estimated charges
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# List expensive resources
kubectl describe nodes | grep -A 5 "Allocated resources"
```

---

## Quick Troubleshooting

| Problem                  | Command                                                     |
| ------------------------ | ----------------------------------------------------------- |
| Pod won't start          | `kubectl describe pod <name> -n draftmate`                  |
| Can't connect to service | `kubectl get endpoints -n draftmate`                        |
| Certificate issue        | `kubectl get certificate -n draftmate`                      |
| Database connection      | `psql -h <RDS-ENDPOINT> -U lawuser`                         |
| DNS not resolving        | `kubectl exec <pod> -n draftmate -- nslookup draftmate.com` |
| High memory usage        | `kubectl top pods -n draftmate`                             |
| Check logs               | `kubectl logs <pod-name> -n draftmate -f`                   |

---

## Files & Directories

```
draftmate/
├── README.md                      # Main deployment guide
├── TROUBLESHOOTING.md             # Troubleshooting guide
├── AWS-COST-ESTIMATION.md         # Cost breakdown
├── QUICK-REFERENCE.md             # This file
├── deploy-aws.sh                  # Automation script
├── kind-cluster.yaml              # Local K8s cluster config
├── draftmate-chart/               # Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-aws.yaml
│   └── templates/
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── postgres-statefulset.yaml
│       ├── postgres-service.yaml
│       └── ingress.yaml
├── draftmate-key.pem              # SSH private key (generated)
├── .env.aws                       # Environment variables (generated)
└── .infra.ids                     # AWS resource IDs (generated)
```

---

## Useful URLs

- AWS Console: https://console.aws.amazon.com/
- Route53 (DNS): https://console.aws.amazon.com/route53/
- EC2 Dashboard: https://console.aws.amazon.com/ec2/
- RDS Dashboard: https://console.aws.amazon.com/rds/
- Cost Explorer: https://console.aws.amazon.com/cost-management/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/
- CloudFormation: https://console.aws.amazon.com/cloudformation/

---

## Support & Resources

- **Kubernetes Docs:** https://kubernetes.io/docs/
- **Helm Docs:** https://helm.sh/docs/
- **AWS Docs:** https://docs.aws.amazon.com/
- **kubectl Cheatsheet:** https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- **Troubleshooting:** See `TROUBLESHOOTING.md`

---

**Last Updated:** May 2024
**Version:** 1.0
**Domain:** draftmate.com
