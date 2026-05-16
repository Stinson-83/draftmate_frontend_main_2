# DraftMate AWS Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Kubernetes Issues](#kubernetes-issues)
3. [Database Issues](#database-issues)
4. [Networking Issues](#networking-issues)
5. [SSL/Certificate Issues](#ssl-certificate-issues)
6. [Performance Issues](#performance-issues)

---

## Common Issues

### Issue: "Configuration Error" or Missing VITE_CLIENT_ID in Browser

**Symptoms:** The browser displays a full-screen red "Configuration Error" saying the Google Client ID is missing, even though you added `VITE_CLIENT_ID` to your `values.yaml` or `.env` files.

**Scenario:** Vite is a static site generator. It permanently "bakes" environment variables starting with `VITE_` into the JavaScript files *during the Docker build process*. Injecting them later via Kubernetes at runtime will NOT work for the frontend!

**Solution:** You must rebuild the Docker image and pass the Client ID as a `--build-arg`, then load it into your cluster and restart the pod.

```bash
# 1. Rebuild the image with the build argument
docker build -f Dockerfile \
  --build-arg VITE_CLIENT_ID="YOUR_ACTUAL_CLIENT_ID" \
  -t draftmate-frontend:latest .

# 2. Push/Load the new image
# If using Kind locally:
kind load docker-image draftmate-frontend:latest --name draftmate-cluster
# If using AWS EC2, push to GHCR or ECR.

# 3. Force the pods to restart and pick up the new Javascript files
kubectl rollout restart deployment frontend -n draftmate
```

---

### Issue: kubectl commands not working

**Symptoms:** `The connection to the server was refused`

**Solution:**

```bash
# Verify kubeconfig is set
echo $KUBECONFIG

# Set kubeconfig correctly
export KUBECONFIG=~/.kube/draftmate-config

# Or merge with existing config
cp ~/.kube/config ~/.kube/config.backup
kubectl config view --flatten > ~/.kube/config

# Test connection
kubectl cluster-info
```

### Issue: Cannot SSH into EC2 instances

**Symptoms:** `Permission denied (publickey)`

**Solution:**

```bash
# Verify key permissions
ls -la draftmate-key.pem
chmod 600 draftmate-key.pem

# Verify security group allows port 22
aws ec2 describe-security-groups \
  --group-names draftmate-k8s-sg \
  --query 'SecurityGroups[0].IpPermissions'

# Try with verbose output
ssh -vvv -i draftmate-key.pem ubuntu@<IP>

# Check instance status
aws ec2 describe-instance-status --instance-ids <instance-id>
```

### Issue: AWS credentials not configured

**Symptoms:** `Unable to locate credentials`

**Solution:**

```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1

# Verify credentials
aws sts get-caller-identity
```

---

## Kubernetes Issues

### Issue: Pods stuck in ImagePullBackOff

**Symptoms:**

```
NAME                READY   STATUS              RESTARTS   AGE
backend-555bb...    0/1     ImagePullBackOff    0          5m
```

**Solution:**

```bash
# Check image pull error
kubectl describe pod <pod-name> -n draftmate

# Push image to ECR
aws ecr create-repository --repository-name draftmate-backend

# Tag and push image
docker tag draftmate-frontend-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/draftmate-backend:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/draftmate-backend:latest

# Update image in values.yaml and redeploy
helm upgrade draftmate ./draftmate-chart --namespace draftmate
```

### Issue: Pods stuck in Pending

**Symptoms:** Pods not starting, resources unavailable

**Solution:**

```bash
# Check resource availability
kubectl top nodes

# Describe pending pod
kubectl describe pod <pod-name> -n draftmate

# Check resource limits
kubectl get resourcequota -n draftmate

# Check node capacity
kubectl describe nodes

# Add more nodes or increase resources
aws ec2 run-instances --image-id <ami-id> --instance-type t3.medium ...

# Or adjust resource requests
helm upgrade draftmate ./draftmate-chart \
  --set resources.requests.memory=256Mi \
  --namespace draftmate
```

### Issue: Pod CrashLoopBackOff

**Symptoms:** Pod keeps restarting

**Solution:**

```bash
# Check pod logs
kubectl logs <pod-name> -n draftmate
kubectl logs <pod-name> -n draftmate --previous

# Get detailed pod info
kubectl describe pod <pod-name> -n draftmate

# Check for missing environment variables
kubectl exec -it <pod-name> -n draftmate -- env | grep DATABASE

# Check entrypoint and command
kubectl get pod <pod-name> -n draftmate -o yaml | grep -A 10 "command:"
```

### Issue: Service not accessible

**Symptoms:** `Connection refused` when accessing service

**Solution:**

```bash
# Verify service exists
kubectl get svc -n draftmate

# Check endpoints
kubectl get endpoints -n draftmate

# Test within cluster
kubectl run -it --rm debug --image=ubuntu --restart=Never -- bash
curl http://backend-service:8080

# Check firewall rules
kubectl describe svc backend-service -n draftmate
```

---

## Database Issues

### Issue: Cannot connect to RDS

**Symptoms:** Connection timeout or refused

**Solution:**

```bash
# Test RDS connectivity from EC2
ssh -i draftmate-key.pem ubuntu@<control-plane-ip>

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Test connection
psql -h <RDS-ENDPOINT> -U lawuser -d postgres

# Check security group
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Verify RDS status
aws rds describe-db-instances \
  --db-instance-identifier draftmate-postgres \
  --query 'DBInstances[0].DBInstanceStatus'
```

### Issue: Database connection string not working

**Symptoms:** `psql: error: FATAL:  password authentication failed`

**Solution:**

```bash
# Verify DATABASE_URL format
# Should be: postgresql://user:password@host:port/database

# Check secret
kubectl get secret draftmate-secrets -n draftmate -o yaml

# Update secret
kubectl delete secret draftmate-secrets -n draftmate
kubectl create secret generic draftmate-secrets \
  --from-literal=database-url='postgresql://lawuser:password@draftmate-postgres.c12345.us-east-1.rds.amazonaws.com:5432/postgres'

# Restart pods
kubectl rollout restart deployment/backend -n draftmate
```

### Issue: RDS running out of space

**Symptoms:** Database full errors

**Solution:**

```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=draftmate-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Increase allocated storage
aws rds modify-db-instance \
  --db-instance-identifier draftmate-postgres \
  --allocated-storage 50 \
  --apply-immediately

# Clean up old data
psql -h <RDS-ENDPOINT> -U lawuser -d postgres <<EOF
DELETE FROM chat_history WHERE created_at < NOW() - INTERVAL '30 days';
VACUUM ANALYZE;
EOF
```

---

## Networking Issues

### Issue: Cannot access domain (draftmate.com)

**Symptoms:** Domain not resolving or connection refused

**Solution:**

```bash
# Check DNS resolution
nslookup draftmate.com
dig draftmate.com

# Verify Route53 records
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name draftmate.com \
  --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

aws route53 list-resource-record-sets \
  --hosted-zone-id $ZONE_ID

# Check LoadBalancer IP
kubectl get svc -n ingress-nginx \
  nginx-ingress-ingress-nginx-controller -o wide

# Update DNS if needed
# Re-run Step 11 from README.md
```

### Issue: DNS not resolving (NXDOMAIN)

**Symptoms:** `NXDOMAIN` errors

**Solution:**

```bash
# Wait for DNS propagation
# Usually takes 5-30 minutes

# Check nameservers
whois draftmate.com | grep -i "name server"

# Force clear DNS cache (on your local machine)
# macOS: sudo dscacheutil -flushcache
# Ubuntu: sudo systemctl restart systemd-resolved

# Test with specific nameserver
dig @ns-123.awsdns-45.com draftmate.com
```

### Issue: Load Balancer not accessible

**Symptoms:** 504 Gateway Timeout

**Solution:**

```bash
# Check NGINX controller
kubectl get pods -n ingress-nginx
kubectl describe pod <nginx-pod> -n ingress-nginx
kubectl logs <nginx-pod> -n ingress-nginx

# Check backend services
kubectl get svc -n draftmate
kubectl get endpoints -n draftmate

# Check ingress configuration
kubectl describe ingress -n draftmate

# Test backend directly
kubectl port-forward svc/backend-service 8080:8080 -n draftmate
curl http://localhost:8080
```

---

## SSL/Certificate Issues

### Issue: Certificate not issuing

**Symptoms:** Certificate in "Pending" state

**Solution:**

```bash
# Check cert-manager status
kubectl get pods -n cert-manager
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate status
kubectl get certificate -n draftmate
kubectl describe certificate draftmate-tls -n draftmate

# Check ClusterIssuer
kubectl describe clusterissuer letsencrypt-prod

# Check certificate events
kubectl get events -n draftmate --sort-by='.lastTimestamp'

# Delete and recreate certificate
kubectl delete certificate draftmate-tls -n draftmate
kubectl delete secret draftmate-tls -n draftmate

# Wait for automatic re-issuance
kubectl get certificate -n draftmate -w
```

### Issue: SSL certificate expired

**Symptoms:** Browser security warning, `certificate has expired`

**Solution:**

```bash
# Check certificate expiration
kubectl get certificate -n draftmate -o wide

# Force renewal
kubectl delete certificate draftmate-tls -n draftmate
kubectl delete secret draftmate-tls -n draftmate

# Wait for cert-manager to issue new certificate
sleep 60
kubectl describe certificate draftmate-tls -n draftmate

# Restart ingress controller
kubectl rollout restart deployment/nginx-ingress -n ingress-nginx
```

### Issue: Mixed content warnings (HTTPS with HTTP content)

**Symptoms:** Browser shows "Not Secure" despite HTTPS

**Solution:**

```bash
# Check ingress configuration
kubectl get ingress -n draftmate -o yaml

# Ensure all resources use HTTPS
# Update frontend to use protocol-relative URLs (//example.com)

# Add security headers to ingress
cat > security-headers-ingress.yaml <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: draftmate-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains";
EOF

kubectl apply -f security-headers-ingress.yaml
```

---

## Performance Issues

### Issue: Pods using too much memory

**Symptoms:** OOMKilled errors, slowness

**Solution:**

```bash
# Check memory usage
kubectl top pods -n draftmate
kubectl top nodes

# Increase memory limits
helm upgrade draftmate ./draftmate-chart \
  --set resources.limits.memory=1Gi \
  --set resources.requests.memory=512Mi \
  --namespace draftmate

# Scale up nodes
aws ec2 run-instances --image-id <ami-id> --instance-type t3.large

# Check for memory leaks
kubectl exec -it <pod-name> -n draftmate -- top
```

### Issue: High CPU usage

**Symptoms:** Slow response times, high costs

**Solution:**

```bash
# Check CPU metrics
kubectl top pods -n draftmate
kubectl top nodes

# Profile application
kubectl exec -it <pod-name> -n draftmate -- /bin/bash
# Use profiling tools: perf, py-spy, etc.

# Increase CPU limits
helm upgrade draftmate ./draftmate-chart \
  --set resources.limits.cpu=1000m \
  --namespace draftmate

# Scale horizontally
kubectl scale deployment backend --replicas=3 -n draftmate
```

### Issue: Slow database queries

**Symptoms:** Backend responding slowly

**Solution:**

```bash
# Enable PostgreSQL logging
aws rds modify-db-instance \
  --db-instance-identifier draftmate-postgres \
  --enable-cloudwatch-logs-exports postgresql

# Check slow query logs
aws logs tail /aws/rds/instance/draftmate-postgres/postgresql --follow

# Connect and analyze
psql -h <RDS-ENDPOINT> -U lawuser -d postgres

# Check slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

# Add indexes
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
```

---

## Debugging Commands Cheat Sheet

```bash
# Kubernetes
kubectl get pods,svc,ingress -n draftmate
kubectl logs -f deployment/backend -n draftmate
kubectl exec -it <pod-name> -n draftmate -- /bin/bash
kubectl port-forward svc/backend-service 8080:8080 -n draftmate
kubectl describe pod <pod-name> -n draftmate
kubectl events -n draftmate

# AWS
aws ec2 describe-instances --filters "Name=tag:Name,Values=draftmate-*"
aws rds describe-db-instances --db-instance-identifier draftmate-postgres
aws logs tail /aws/rds --follow
aws s3 ls

# Network
kubectl exec -it <pod-name> -n draftmate -- curl http://backend-service:8080
kubectl exec -it <pod-name> -n draftmate -- nc -zv db-service 5432
kubectl exec -it <pod-name> -n draftmate -- dig +short draftmate.com

# SSL
kubectl get certificate -n draftmate
kubectl describe certificate draftmate-tls -n draftmate
echo | openssl s_client -servername draftmate.com -connect draftmate.com:443 | openssl x509 -text
```

---

## When All Else Fails

### Reset and Redeploy

```bash
# Backup data
kubectl exec -it postgres-0 -n draftmate -- pg_dump postgres > backup.sql

# Delete all resources
kubectl delete namespace draftmate

# Redeploy
helm install draftmate ./draftmate-chart --namespace draftmate

# Restore data
kubectl exec -i postgres-0 -n draftmate -- psql postgres < backup.sql
```

### Contact Support

- AWS Support: https://console.aws.amazon.com/support/
- Kubernetes Community: https://kubernetes.io/community/
- Helm Help: https://helm.sh/docs/
- PostgreSQL: https://www.postgresql.org/support/

---

Last Updated: 2024
