# DraftMate AWS Cost Estimation

## Monthly Cost Breakdown

### 1. Ultra-Low Budget / Startup Environment (Absolute Minimum Cost)
*Highly recommended for early-stage startups and initial launches. This uses a single EC2 instance running the entire stack (Postgres, Qdrant, Backend, Frontend) via Docker Compose or a single-node Kind cluster, completely avoiding expensive AWS managed services like RDS, NAT Gateways, and Load Balancers.*

| Service                 | Configuration                                      | Monthly Cost (On-Demand) | Monthly Cost (Spot Instance) |
| ----------------------- | -------------------------------------------------- | ------------------------ | ---------------------------- |
| **Compute (EC2)**       | 1x `t3a.xlarge` (4 vCPUs, 16GB RAM)                | ~$110.00                 | **~$35.00** (70% savings)    |
| **Storage (EBS)**       | 50 GB gp3 SSD                                      | ~$4.00                   | ~$4.00                       |
| **Networking**          | 1x Elastic IP (Direct attached, no Load Balancer)  | $0.00                    | $0.00                        |
| **Database**            | Postgres & Qdrant running in Docker                | $0.00                    | $0.00                        |
| **Misc**                | Route53 Domain (1 hosted zone)                     | $0.50                    | $0.50                        |
| **TOTAL MONTHLY**       |                                                    | **~$114.50**             | **~$39.50**                  |

> [!TIP]
> **How to achieve the $39.50/month cost:**
> 1. Request a **Spot Instance** for your `t3a.xlarge` EC2 server. AWS gives massive discounts for unused capacity.
> 2. Point your domain DNS directly to the EC2's Public IP address, bypassing the need for an AWS Application Load Balancer ($16/mo).
> 3. Use the `docker-compose up -d` setup (or the single-node Kind cluster we built) so your databases run on the same server, saving you from paying for AWS RDS ($21/mo+).

---

### 1.5 Startup + CI/CD Environment (Chosen Architecture)
*This setup separates your production application from your Jenkins CI/CD pipeline. Keeping Jenkins on a separate instance ensures that heavy build jobs (like Docker builds) do not cause Out-Of-Memory (OOM) errors on your live production server.*

| Service                 | Configuration                                      | Monthly Cost (On-Demand) | Monthly Cost (Spot Instance) |
| ----------------------- | -------------------------------------------------- | ------------------------ | ---------------------------- |
| **Compute (App Server)**| 1x `t3a.xlarge` (4 vCPUs, 16GB RAM)                | ~$110.00                 | ~$35.00                      |
| **Compute (Jenkins)**   | 1x `t3a.medium` (2 vCPUs, 4GB RAM)                 | ~$30.00                  | ~$10.00                      |
| **Storage (App)**       | 50 GB gp3 SSD                                      | ~$4.00                   | ~$4.00                       |
| **Storage (Jenkins)**   | 30 GB gp3 SSD                                      | ~$2.40                   | ~$2.40                       |
| **Networking**          | 2x Elastic IPs (Direct attached)                   | $0.00                    | $0.00                        |
| **Misc**                | Route53 Domain (1 hosted zone)                     | $0.50                    | $0.50                        |
| **TOTAL MONTHLY**       |                                                    | **~$146.90**             | **~$51.90**                  |

> [!TIP]
> **Cost Optimization for Jenkins:** You can configure an AWS Lambda function or a cron job to automatically shut down your Jenkins (`t3a.medium`) instance outside of working hours (e.g., evenings and weekends). This can cut the Jenkins compute cost by an additional 50-70%.

---

### 2. Standard Development/Staging Environment

| Service                 | Configuration            | Monthly Cost |
| ----------------------- | ------------------------ | ------------ |
| **EC2 Instances**       |
| - Control Plane         | 1x t3.medium (730 hours) | $30.38       |
| - Workers               | 2x t3.medium (730 hours) | $60.76       |
| **RDS PostgreSQL**      |
| - Instance              | db.t4g.micro (730 hours) | $21.68       |
| - Storage               | 20 GB gp3                | $2.00        |
| - Backup Storage        | 1 GB                     | $0.10        |
| **Networking**          |
| - LoadBalancer          | 1x ALB                   | $16.20       |
| - Data Transfer (Out)   | ~100 GB                  | $10.00       |
| - NAT Gateway           | 1x                       | $32.00       |
| **Storage**             |
| - EBS Volumes           | 60 GB gp3                | $4.80        |
| - S3 (if used)          | 10 GB                    | $0.23        |
| **Monitoring**          |
| - CloudWatch Logs       | ~50 GB/month             | $25.00       |
| - CloudWatch Alarms     | 10 alarms                | $1.00        |
| **Misc**                |
| - Route53               | 1 hosted zone            | $0.50        |
| - Secrets Manager       | 1 secret                 | $0.40        |
| **TOTAL MONTHLY (Dev)** |                          | **$204.85**  |

### Production Environment (Recommended)

| Service                  | Configuration            | Monthly Cost |
| ------------------------ | ------------------------ | ------------ |
| **EC2 Instances**        |
| - Control Plane          | 1x t3.large (730 hours)  | $61.00       |
| - Workers                | 3x t3.large (730 hours)  | $183.00      |
| **RDS PostgreSQL**       |
| - Instance               | db.t4g.small (730 hours) | $58.83       |
| - Storage                | 100 GB gp3               | $10.00       |
| - Multi-AZ               | Replication              | $58.83       |
| - Backup Storage         | 50 GB                    | $5.00        |
| **Networking**           |
| - LoadBalancer           | 1x NLB                   | $16.20       |
| - Data Transfer (Out)    | ~500 GB                  | $45.00       |
| - NAT Gateways           | 2x                       | $64.00       |
| **Storage**              |
| - EBS Volumes            | 300 GB gp3               | $24.00       |
| - S3 Storage             | 50 GB                    | $1.15        |
| - S3 Transfer Out        | 100 GB                   | $9.23        |
| **Monitoring & Logging** |
| - CloudWatch Logs        | ~200 GB/month            | $100.00      |
| - CloudWatch Alarms      | 20 alarms                | $2.00        |
| - X-Ray                  | ~100 traces/day          | $5.00        |
| **Security**             |
| - WAF                    | ~1M requests             | $5.00        |
| - Route53                | 1 hosted zone + queries  | $5.00        |
| - Secrets Manager        | 5 secrets                | $2.00        |
| - ACM Certificates       | Free (Let's Encrypt)     | $0.00        |
| **Misc**                 |
| - Data Pipeline          | ~1000 GB/month           | $23.00       |
| - Lambda (if used)       | -                        | $0.00        |
| **TOTAL MONTHLY (Prod)** |                          | **$478.24**  |

---

## Cost Optimization Strategies

### 1. Reserved Instances (Save up to 40%)

```bash
# Purchase 1-year reserved instances
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id <offering-id> \
  --instance-count 3

# Estimated savings for 3x t3.large: ~$360/year
```

**Estimated Annual Cost with RI:** $4,537 (save ~$1,215)

### 2. Spot Instances for Worker Nodes (Save up to 70%)

```yaml
# Use Spot for non-critical worker nodes
# Replace some t3.large with t3a.large Spot instances
# Cost: ~$18/month per Spot instance (vs $61 On-Demand)

# Savings: ~$129/month per instance, $1,548/year for 1 instance
```

### 3. Auto-Scaling Groups

```bash
# Scale workers based on demand
# Reduces cost during off-peak hours

# Development: Min 1, Max 3, Min during night: 0
# Estimated savings: 30-40%
```

### 4. Consolidate Services

- Run staging and dev on same cluster
- Use namespaces for isolation
- **Potential saving:** $150-200/month

### 5. Database Optimization

- Use db.t4g.micro for development ($21.68/month)
- Share RDS across environments (if acceptable)
- Enable automated backups instead of snapshots
- **Potential saving:** $30-50/month

### 6. Data Transfer Optimization

- Use VPC endpoints for AWS services (free)
- Minimize cross-region traffic
- Enable compression
- **Potential saving:** $20-30/month

### 7. Storage Optimization

- Use gp3 instead of gp2 (save 20% on storage)
- Enable S3 Intelligent-Tiering
- Archive old logs to Glacier
- **Potential saving:** $10-20/month

---

## Annual Cost Projections

### Development Environment (12 months)

```
Monthly: $204.85
Annual: $2,458.20

With Reserved Instances (1yr): $2,100/year (save $358)
```

### Production Environment (12 months)

```
Monthly: $478.24
Annual: $5,738.88

With Reserved Instances (1yr): $4,500/year (save $1,239)
With Spot Workers: $3,800/year (save $1,939)
```

### Optimized Production (with all strategies)

```
Monthly: ~$350
Annual: ~$4,200 (save $1,539 vs standard prod)
```

---

## Cost Monitoring

### Setup CloudWatch Alarms

```bash
# Alert when monthly bill exceeds $500
aws cloudwatch put-metric-alarm \
  --alarm-name draftmate-billing-alert \
  --alarm-description "Alert when bill exceeds $500" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold

# Enable AWS Budgets
aws budgets create-budget \
  --account-id <account-id> \
  --budget file://budget.json
```

### Monitor Daily

```bash
# Check current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE

# Check EC2 costs specifically
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon EC2"]}}' \
  --metrics "UnblendedCost"
```

---

## Cost Reduction Checklist

- [ ] Use Reserved Instances for stable workloads
- [ ] Enable Spot Instances for non-critical workers
- [ ] Configure Auto-Scaling Groups
- [ ] Setup resource tagging for cost allocation
- [ ] Enable CloudWatch cost anomaly detection
- [ ] Review and delete unused resources monthly
- [ ] Consolidate non-prod environments
- [ ] Use smaller instance types during development
- [ ] Enable automated backups (vs manual snapshots)
- [ ] Use gp3 EBS volumes instead of gp2
- [ ] Archive S3 data to Glacier after 90 days
- [ ] Enable AWS Compute Optimizer recommendations
- [ ] Review and optimize RDS settings
- [ ] Use VPC endpoints instead of NAT
- [ ] Set up AWS Budget alerts

---

## Free Tier Usage

For first 12 months (if eligible):

- 750 hours EC2 (t2.micro)
- 20 GB RDS
- 1 million Lambda requests
- 5 GB S3 storage
- Free data transfer within region

**Potential first-year savings:** $300-500

---

## Comparing Deployment Options

| Option                         | Monthly Cost | Pros                      | Cons               |
| ------------------------------ | ------------ | ------------------------- | ------------------ |
| **Local Development**          | $0           | Free                      | Limited resources  |
| **AWS Dev/Test**               | $205         | Pay as you go             | Lower availability |
| **AWS Production**             | $478         | High availability         | Higher cost        |
| **AWS Optimized**              | $350         | Balanced cost/performance | Complex setup      |
| **Managed Services (ECS/EKS)** | $250-300     | Simpler ops               | Less control       |

---

## Tips for Cost Optimization

1. **Start small:** Begin with development environment, scale up gradually
2. **Use spot:** 70% savings on compute for non-critical workloads
3. **Monitor:** Check AWS Cost Explorer weekly
4. **Tag resources:** Better cost allocation and tracking
5. **Automate:** Use Infrastructure as Code to prevent waste
6. **Right-size:** Use CloudWatch metrics to right-size instances
7. **Clean up:** Delete unused resources immediately
8. **Schedule:** Stop non-production resources during off-hours
9. **Consolidate:** Combine multiple small instances into fewer large ones
10. **Negotiate:** Contact AWS for volume discounts

---

## ROI Calculation Example

**Scenario:** SaaS Application with 10,000 Monthly Users

```
Development Environment
- Initial setup: $500
- Monthly operations: $205
- Development team: 3 people × $4,000/month = $12,000
- Total monthly: $12,205

Production Environment (Year 1)
- Initial setup: $2,000
- Monthly operations: $478
- Operations team: 1 person × $4,000/month = $4,000
- Total monthly: $4,478

Year 1 Total Cost: $2,000 + ($4,478 × 12) = $55,736

Revenue (10K users × $10/month average)
- Year 1: 10,000 × $10 × 12 = $1,200,000

ROI: ($1,200,000 - $55,736) / $55,736 = 2052% 🎉
```

---

## Budget Template

```yaml
# budget.json
{
  "BudgetName": "DraftMate-Monthly",
  "BudgetLimit": { "Amount": "500", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "NotificationsWithSubscribers":
    [
      {
        "Notification":
          {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100,
            "ThresholdType": "PERCENTAGE",
          },
        "Subscribers":
          [{ "SubscriptionType": "EMAIL", "Address": "admin@draftmate.com" }],
      },
    ],
}
```

---

**Last Updated:** May 2024
**Pricing Source:** AWS Pricing (us-east-1 region)
**Disclaimer:** Prices are estimates and subject to change. Refer to AWS Pricing Calculator for accurate quotes.
