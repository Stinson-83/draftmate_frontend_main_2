# AWS Resource Details & Setup Guide (`how_to_create.md`)

> [!IMPORTANT]
> **$9 AWS CREDIT COST PRESERVATION STRATEGY**
> 
> You currently have **$9 AWS credit remaining**. Running standard AWS Application Load Balancers ($18/month minimum) and continuous Fargate 2 vCPU tasks ($57/month) will exhaust your $9 credit in **less than 4 days**.
> 
> This document details the **Ultra-Low Cost / AWS Free Tier architecture** designed to run DraftMate on AWS for **$0.00 - $2.50/month**, allowing your $9 credit to last for **3 to 6+ months**.

---

## 1. Cost & Architecture Strategy Matrix

| Resource | High-Cost Setup (Do NOT Use with $9 Credit) | Low-Cost / Free-Tier Recommended Setup ($9 Budget Friendly) | Monthly Estimated Cost |
|---|---|---|---|
| **Compute** | ECS Fargate (2 vCPU / 4 GB RAM) 24/7 | **1x AWS EC2 `t4g.small` (ARM64)** or **`t2.micro/t3.micro`** running Docker Compose | **$0.00** (Free Tier) or **~$3.00** |
| **Load Balancer** | AWS ALB (Application Load Balancer) | **Self-Hosted Nginx inside EC2** with Let's Encrypt / CloudFront SSL | **$0.00** (Saves $18/mo) |
| **Frontend CDN** | Hosted on ALB/Fargate | **S3 Static Website + AWS CloudFront CDN** | **$0.00** (Free Tier 1TB/mo) |
| **Database** | Heavy RDS PostgreSQL instance | **AWS RDS PostgreSQL `db.t4g.micro`** (20GB GP3) | **$0.00** (Free Tier 750 hrs/mo) |
| **Vector DB** | Managed Vector Cloud | **Qdrant Container** hosted inside EC2 | **$0.00** |
| **Storage** | Elastic File System (EFS) | **Amazon S3 Bucket** (`draftmate-drafts-...`) | **$0.00** (5 GB Free Tier) |
| **Container Registry** | AWS ECR | **AWS ECR Private Repository** | **$0.00** (500 MB Free) |
| **NAT Gateway** | 1-2 NAT Gateways ($32/month!) | **NO NAT Gateway** (Use Auto-Assign Public IP or Temp NAT) | **$0.00** (Saves $32/mo) |
| **Total Monthly Cost** | **~$107.00 / month** | **$0.00 - $3.50 / month** | **Credit lasts 3-6+ Months!** |

---

## 2. AWS Infrastructure Topology & Structure

```mermaid
graph TD
    User([User Browser / Client]) --> Domain[Route 53 DNS / draftmate.in]
    Domain --> CF[CloudFront CDN - Static Frontend]
    Domain --> EC2_IP[EC2 Elastic IP / api.draftmate.in]
    
    CF --> S3_Front[S3 Bucket: draftmate-frontend-prod]
    
    subgraph AWS VPC: draftmate-vpc (10.0.0.0/16)
        subgraph Public Subnet (ap-south-1a / ap-south-1b)
            EC2[EC2 t4g.small Instance - Docker Unified Container]
            EC2 -->|Port 8080| Nginx[Nginx Reverse Proxy]
            Nginx -->|Port 8009| Auth[Auth Service]
            Nginx -->|Port 8003| Drafter[Legal Drafter]
            Nginx -->|Port 8004| LexBot[Lex Bot / RAG]
            Nginx -->|Port 8000-8016| Other[Converter/Query/PDF Services]
            EC2 -->|Local Container| Qdrant[Qdrant Vector DB - Port 6333]
        end

        subgraph Private / DB Subnet Group
            RDS[(AWS RDS PostgreSQL - db.t4g.micro)]
        end
    end
    
    EC2 -->|Store Docs| S3_Docs[S3 Bucket: draftmate-drafts-022104541864]
    EC2 -->|DB Connection| RDS
```

---

## 3. Required AWS Resources & Specification Structure

### A. AWS Region
* **Primary Region**: `ap-south-1` (Asia Pacific - Mumbai)
* **CloudFront ACM Certificate Region**: `us-east-1` (N. Virginia - Mandatory by AWS for CloudFront)

### B. VPC & Networking (`draftmate-vpc`)
* **VPC Name**: `draftmate-vpc`
* **CIDR Block**: `10.0.0.0/16`
* **Public Subnets**:
  * `draftmate-public-subnet-1` (`10.0.1.0/24`, ap-south-1a, Auto-assign public IP: **Enabled**)
  * `draftmate-public-subnet-2` (`10.0.2.0/24`, ap-south-1b, Auto-assign public IP: **Enabled**)
* **Private Subnets**:
  * `draftmate-private-subnet-1` (`10.0.11.0/24`, ap-south-1a)
  * `draftmate-private-subnet-2` (`10.0.12.0/24`, ap-south-1b)
* **NAT Gateways**: `0` (Disabled to save $32/mo)

### C. Security Groups
1. **`draftmate-ec2-sg`** (Attached to EC2 Instance):
   * Inbound Rule 1: HTTP (Port `80`) | Source: `0.0.0.0/0`
   * Inbound Rule 2: HTTPS (Port `443`) | Source: `0.0.0.0/0`
   * Inbound Rule 3: Custom TCP (Port `8080`) | Source: `0.0.0.0/0`
   * Inbound Rule 4: SSH (Port `22`) | Source: `My IP`
2. **`draftmate-db-sg`** (Attached to RDS PostgreSQL):
   * Inbound Rule 1: PostgreSQL (Port `5432`) | Source: `draftmate-ec2-sg` (or VPC CIDR `10.0.0.0/16`)

### D. Compute Instance (EC2 Low-Cost Setup)
* **Instance Name**: `draftmate-app-server`
* **AMI**: Amazon Linux 2023 or Ubuntu 22.04 LTS (ARM64 / x86_64)
* **Instance Type**: `t4g.small` (2 vCPU, 2 GB RAM, ARM64) or `t3.micro` / `t4g.micro` (Free Tier)
* **Elastic IP**: `1` (Attached to EC2 instance)
* **Storage**: 20 GB GP3 EBS Root Volume

### E. Database Instances
1. **RDS PostgreSQL Database (`draftmate-postgres`)**:
   * **Engine**: PostgreSQL 15+
   * **Instance Class**: `db.t4g.micro` (Free Tier Eligible)
   * **Storage**: 20 GB GP3
   * **Database Name**: `lex_bot_db`
   * **Master Username**: `postgres`
   * **Publicly Accessible**: No
2. **Qdrant Vector Database**:
   * **Self-hosted Docker Container** on EC2 instance on Port `6333`.

### F. Amazon S3 Storage Buckets
1. **Shared Document Storage Bucket**: `draftmate-drafts-022104541864` (Private access)
2. **Frontend Website Bucket**: `draftmate-frontend-prod` (Private access via CloudFront OAC)

### G. CloudFront & Domain Management
1. **CloudFront Distribution**: Frontend static hosting pointing to S3 `draftmate-frontend-prod`
2. **ACM Certificates**:
   * Certificate for `draftmate.in` & `*.draftmate.in` in `us-east-1` (CloudFront)
   * Certificate for `api.draftmate.in` in `ap-south-1` (API Gateway / EC2 / ALB)
3. **Route 53 Hosted Zone**: `draftmate.in`

---

## 4. Complete Variable Mapping Table

### Table A: AWS Infrastructure Variables

| Variable Name | Example / Production Value | Purpose / Description | AWS Console Location |
|---|---|---|---|
| `AWS_REGION` | `ap-south-1` | Primary AWS Deployment Region | AWS Top Navigation Dropdown |
| `AWS_ACCOUNT_ID` | `022104541864` | 12-digit AWS Account Identifier | AWS Account Menu |
| `VPC_ID` | `vpc-0123456789abcdef` | DraftMate VPC ID | VPC Dashboard -> VPCs |
| `PUBLIC_SUBNET_1` | `subnet-0a1b2c3d4e5f6g7h8` | Public Subnet in Zone A | VPC Dashboard -> Subnets |
| `PUBLIC_SUBNET_2` | `subnet-0h7g6f5e4d3c2b1a0` | Public Subnet in Zone B | VPC Dashboard -> Subnets |
| `SECURITY_GROUP_EC2` | `sg-0123456789ec2` | Security Group for Compute | VPC Dashboard -> Security Groups |
| `SECURITY_GROUP_DB` | `sg-0123456789db` | Security Group for PostgreSQL | VPC Dashboard -> Security Groups |
| `ECR_REPO_NAME` | `draftmate-app` | Docker Image Repository Name | Amazon ECR -> Private Repositories |
| `ECR_REPOSITORY_URI` | `022104541864.dkr.ecr.ap-south-1.amazonaws.com/draftmate-app` | Full ECR URI | Amazon ECR -> View Push Commands |
| `S3_DOCS_BUCKET` | `draftmate-drafts-022104541864` | S3 Bucket for OpenXML Drafts | S3 Dashboard |
| `S3_FRONTEND_BUCKET` | `draftmate-frontend-prod` | S3 Bucket for Static Web Assets | S3 Dashboard |
| `RDS_ENDPOINT` | `draftmate-postgres.c123456.ap-south-1.rds.amazonaws.com` | PostgreSQL Database Endpoint Host | RDS Dashboard -> Databases |
| `RDS_PORT` | `5432` | PostgreSQL Database Port | RDS Dashboard |
| `RDS_DB_NAME` | `lex_bot_db` | Primary PostgreSQL Database Name | RDS Configuration |
| `CLOUDFRONT_DIST_ID` | `E1A2B3C4D5E6F` | CloudFront Distribution ID | CloudFront Dashboard |

---

### Table B: DraftMate Application Environment Variables (`.env`)

| Variable Name | Recommended Production Value | Description & Purpose |
|---|---|---|
| **Environment & URLs** | | |
| `ENVIRONMENT` | `production` | App Execution Mode (`production` / `development`) |
| `FRONTEND_URL_PROD` | `https://draftmate.in` | Allowed CORS Origin for Production Frontend |
| `FRONTEND_URL_DEV` | `http://localhost:5173` | Development Frontend URL |
| `VITE_API_BASE_URL` | `https://api.draftmate.in` | Frontend API Endpoint Host |
| **AWS Credentials** | | |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM User Access Key for S3 access |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY` | IAM User Secret Key |
| `AWS_REGION` | `ap-south-1` | AWS S3 Target Region |
| `S3_BUCKET_NAME` | `draftmate-drafts-022104541864` | Primary Document Storage Bucket |
| `S3_BUCKET` | `draftmate-drafts-022104541864` | Used by Query Service (Same as S3_BUCKET_NAME) |
| **Database Configuration** | | |
| `POSTGRES_HOST` | `draftmate-postgres.c123456.ap-south-1.rds.amazonaws.com` | RDS Database Host Endpoint (or `127.0.0.1` if local docker) |
| `POSTGRES_PORT` | `5432` | Database Connection Port |
| `POSTGRES_USER` | `postgres` | RDS Database Master User |
| `POSTGRES_PASSWORD` | `Draftmate9989` | RDS Database Password |
| `POSTGRES_DB` | `lex_bot_db` | Main PostgreSQL Database Name |
| `PSQL_PASSWD` | `Draftmate9989` | Alias used by Converter Service |
| `POSTGRES_DSN` | `postgresql://postgres:Draftmate9989@draftmate-postgres.c123456.ap-south-1.rds.amazonaws.com:5432/lex_bot_db` | Full SQLAlchemy Connection String |
| `DATABASE_URL` | `postgresql://postgres:Draftmate9989@draftmate-postgres.c123456.ap-south-1.rds.amazonaws.com:5432/lex_bot_db` | Used by Deep Research Backend |
| `QDRANT_HOST` | `qdrant` | Qdrant Vector Host (`qdrant` for docker, `127.0.0.1` for local) |
| **AI & LLM Services** | | |
| `GOOGLE_API_KEY` | `AIzaSy...` | Gemini LLM API Key |
| `GEMINI_API_KEY` | `AIzaSy...` | Used by Enhance Bot (Same as GOOGLE_API_KEY) |
| `OPENAI_API_KEY` | `sk-proj-...` | OpenAI GPT Models API Key |
| `VOYAGE_API_KEY` | `pa-...` | Voyage AI Vector Embedding API Key |
| `TAVILY_API_KEY` | `tvly-...` | Tavily Web Search API Key |
| `FIRECRAWL_API_KEY` | `fc-...` | Firecrawl Scraping Key |
| `FIRECRAWLER_API_KEY`| `fc-...` | Used by Enhance Bot |
| `SARVAM_API_KEY` | `sarvam-...` | Sarvam AI Translation Key |
| **Auth & Security** | | |
| `JWT_SECRET` | `a_very_strong_random_secret_at_least_32_characters_long` | JWT Token Sign Key |
| `GOOGLE_CLIENT_ID` | `462761102428-...apps.googleusercontent.com` | Google OAuth Client ID |
| `VITE_CLIENT_ID` | `462761102428-...apps.googleusercontent.com` | Google OAuth Client ID for Frontend |
| `GOOGLE_CLIENT_SECRET`| `GOCSPX-...` | Google OAuth Client Secret |
| **ONLYOFFICE Config** | | |
| `ONLYOFFICE_API_URL` | `http://onlyoffice-server:8081` | ONLYOFFICE Server Address |
| `SHARED_STORAGE_PATH`| `/app/shared_drafts` | Path for shared OpenXML document processing |

---

## 5. Step-by-Step Low-Cost Deployment Execution

### Step 1: Create AWS Budget Alert (CRITICAL to protect $9 Credit)
1. Open **AWS Billing & Cost Management Console**.
2. Click **Budgets** -> Click **Create budget**.
3. Select **Zero spend budget** or **Cost budget**:
   * Set target amount: **$5.00**.
   * Add email notification when actual cost exceeds **$4.00** and **$7.00**.
4. Click **Create budget**.

---

### Step 2: Provision VPC, Security Groups & RDS Free Tier
Run these commands using your local AWS CLI or AWS CloudShell:

```bash
# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region ap-south-1 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=draftmate-vpc --region ap-south-1

# 2. Create Security Group for EC2
EC2_SG=$(aws ec2 create-security-group --group-name draftmate-ec2-sg --description "EC2 Web Server" --vpc-id $VPC_ID --region ap-south-1 --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 80 --cidr 0.0.0.0/0 --region ap-south-1
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 --region ap-south-1
aws ec2 authorize-security-group-ingress --group-id $EC2_SG --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region ap-south-1

# 3. Create Security Group for DB
DB_SG=$(aws ec2 create-security-group --group-name draftmate-db-sg --description "RDS PostgreSQL SG" --vpc-id $VPC_ID --region ap-south-1 --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 5432 --cidr 10.0.0.0/16 --region ap-south-1
```

---

### Step 3: Launch EC2 Compute & Deploy Docker Stack
To host your application within the free tier budget:

1. Launch a **`t4g.small`** or **`t3.micro`** EC2 instance in `draftmate-vpc`.
2. Connect to the instance and install Docker & Docker Compose:
   ```bash
   sudo yum update -y
   sudo yum install docker git -y
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker ec2-user
   ```
3. Clone the repo and start services:
   ```bash
   git clone <YOUR_GIT_REPO_URL>
   cd draftmate_frontend_main_2
   # Setup your production .env file
   cp .env.example .env
   # Start the unified container stack
   docker compose -f docker-compose.single.yml up --build -d
   ```

---

### Step 4: Setup S3 Static Frontend + CloudFront CDN
1. **Build Frontend**:
   ```bash
   npm run build
   ```
2. **Sync Assets to S3**:
   ```bash
   aws s3 sync dist/ s3://draftmate-frontend-prod/ --delete --region ap-south-1
   ```
3. Point your domain `draftmate.in` in Route 53 to CloudFront distribution.

---

## 6. Verification & Health Check

After deployment, verify that all backend microservices and databases are online:

* **Nginx Health Check**: `http://<EC2_PUBLIC_IP>:8080/health`
* **Frontend Web Application**: `https://draftmate.in`
* **API Subdomain Gateway**: `https://api.draftmate.in/health`
* **RDS PostgreSQL Verification**:
  ```bash
  psql -h <RDS_ENDPOINT> -U postgres -d lex_bot_db -c "\dt"
  ```
* **Qdrant Vector DB Verification**:
  ```bash
  curl http://localhost:6333/readyz
  ```
