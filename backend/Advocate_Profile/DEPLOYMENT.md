# DraftMate Advocate Profile Service - AWS Deployment Guide

This guide covers the complete AWS deployment of the Advocate Profile service using:
- Amazon EC2
- Amazon RDS (PostgreSQL)
- Amazon S3
- Nginx
- Docker
- Supervisor

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [RDS PostgreSQL Setup](#rds-postgresql-setup)
3. [S3 Bucket Setup](#s3-bucket-setup)
4. [EC2 Instance Setup](#ec2-instance-setup)
5. [Docker and Supervisor Configuration](#docker-and-supervisor-configuration)
6. [Nginx Setup](#nginx-setup)
7. [Backup Strategy](#backup-strategy)
8. [Deployment Steps](#deployment-steps)

---

## Prerequisites
- AWS Account
- Domain name (optional, but recommended)
- AWS CLI configured on your local machine (optional)
- Docker and Docker Compose installed locally (for testing)

---

## RDS PostgreSQL Setup
1. Go to AWS RDS Dashboard
2. Click "Create database"
3. Choose "Standard create"
4. Engine options:
   - Engine type: PostgreSQL
   - Version: 15.x (or latest stable)
5. Template: "Production" or "Free tier"
6. DB instance identifier: `draftmate-db`
7. Master username: `postgres` (or your choice)
8. Master password: Create a strong password
9. DB instance class: `db.t3.micro` (free tier eligible) or higher
10. Storage:
    - Allocated storage: 20 GiB
    - Storage autoscaling: Enable
11. Connectivity:
    - Don't connect to an EC2 compute resource
    - Public access: Yes (for initial setup, you can restrict later)
    - VPC: Default VPC
    - VPC security group: Create new
12. Database options:
    - Database name: `draftmate`
    - Port: 5432
13. Backup: Enable automated backups
14. Click "Create database"
15. After creation, edit the VPC security group to allow inbound traffic on port 5432 from your EC2 security group

---

## S3 Bucket Setup
1. Go to AWS S3 Dashboard
2. Click "Create bucket"
3. Bucket name: `draftmate-advocate-files-{your-region}`
   (must be globally unique)
4. Region: Choose your preferred region (e.g., ap-south-1)
5. Object Ownership: ACLs enabled
6. Block Public Access:
   - Uncheck "Block all public access"
   - Acknowledge the warning (we'll configure bucket policy)
7. Leave other options as default
8. Click "Create bucket"
9. Go to bucket > Permissions > Bucket policy
10. Add the following policy (replace `YOUR-BUCKET-NAME`):
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadForObjects",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            }
        ]
    }
    ```

11. Go to IAM > Users > Create User (for S3 access)
12. Create a user with programmatic access
13. Attach a policy with permissions for the bucket:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                ],
                "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            }
        ]
    }
    ```
14. Save the Access Key ID and Secret Access Key

---

## EC2 Instance Setup
1. Go to AWS EC2 Dashboard
2. Launch Instance
3. Name: `draftmate-advocate-profile-server`
4. Application and OS Images: Ubuntu Server 22.04 LTS (HVM)
5. Instance type: t2.micro (free tier eligible)
6. Key pair: Create or use existing
7. Network settings:
   - Create security group
   - Allow SSH from your IP
   - Allow HTTP and HTTPS traffic from anywhere
8. Storage: 30 GiB
9. Launch instance

### Connect to EC2 instance
```bash
# Replace with your key and public IP
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Initial server setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx docker.io docker-compose supervisor git
sudo systemctl enable nginx
sudo systemctl start nginx
sudo usermod -aG docker $USER
```

---

## Docker and Supervisor Configuration
1. Clone the repository to EC2:
```bash
cd ~
git clone https://your-repo-url.git draftmate
cd draftmate/backend/Advocate_Profile
```

2. Create .env file:
```bash
cp .env.example .env
nano .env
```
Fill in all the environment variables from RDS and S3 setup.

3. Create Supervisor config file: `/etc/supervisor/conf.d/advocate-profile.conf`
```ini
[program:advocate-profile]
directory=/home/ubuntu/draftmate/backend/Advocate_Profile
command=docker-compose up --build
autostart=true
autorestart=true
stdout_logfile=/var/log/advocate-profile-stdout.log
stderr_logfile=/var/log/advocate-profile-stderr.log
user=ubuntu
```

4. Also create docker-compose.yml for Advocate Profile service (or use the existing project-wide one):
If you need a standalone one, create in the Advocate_Profile directory:
```yaml
version: '3.8'
services:
  advocate-profile:
    build: .
    ports:
      - "8007:8007"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8007/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

5. Start with supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start advocate-profile
```

---

## Nginx Setup
Create Nginx config file: `/etc/nginx/sites-available/advocate-profile`
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:8007;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/advocate-profile /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

---

## Backup Strategy

### RDS Backups (Automatic)
- RDS automated backups are enabled by default (configured during setup)
- Retention period: 7-35 days
- Manual snapshots can be created via AWS Console

### S3 Bucket Versioning
Enable S3 versioning for your bucket to keep previous versions of files:
1. Go to your S3 bucket > Properties > Versioning > Enable

### Database Backups (Manual)
Create a backup script and set up cron:
```bash
# Create ~/scripts/backup-db.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="draftmate-db-$DATE.sql"
# Use pg_dump
# You'll need to install psql client on EC2
pg_dump -h your-rds-endpoint -U postgres -d draftmate > $BACKUP_FILE
# Copy to S3
aws s3 cp $BACKUP_FILE s3://your-db-backup-bucket/
rm $BACKUP_FILE
```
Add to crontab:
```bash
crontab -e
# Add daily backup at 2 AM:
0 2 * * * /home/ubuntu/scripts/backup-db.sh
```

---

## Deployment Steps
1. Push all your code changes
2. SSH to EC2
3. Pull latest code
4. Restart Docker container via Supervisor
```bash
sudo supervisorctl restart advocate-profile
```
5. Check logs with:
```bash
sudo supervisorctl status
sudo tail -f /var/log/advocate-profile-stdout.log
```

---

## Monitoring
- Check service status with Supervisor: `sudo supervisorctl status`
- Check container status: `docker ps`
- Check Nginx status: `sudo systemctl status nginx`
- Check EC2 metrics in CloudWatch

---

## Troubleshooting
- If the service won't start: Check supervisor and docker logs
- Database connection issues: Verify RDS security group and credentials
- File upload issues: Verify S3 bucket policy and IAM user permissions
