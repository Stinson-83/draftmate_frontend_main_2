# AWS Step-by-Step Production Infrastructure Setup Guide for DraftMate

This guide provides step-by-step instructions to set up the production infrastructure for DraftMate. Every step corresponds directly to the active resource names, configurations, and region settings running on your AWS account.

---

## CRITICAL: Select the Correct AWS Region
Before starting any step in the AWS Web Console, ensure that the dropdown in the top-right corner of your console is set to:
* **Region: ap-south-1 (Asia Pacific - Mumbai)**

You must verify this region is selected at the start of every step below.

---

## STEP 1: Network Setup (VPC & Subnets)
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **VPC Dashboard** -> Click **Create VPC**.
* **Configuration Settings**:
  1. Select the **VPC and more** option.
  2. **Name tag generation**: Enter `draftmate-vpc`.
  3. **IPv4 CIDR block**: Enter `10.0.0.0/16`.
  4. **Number of Availability Zones (AZs)**: Select `2`.
  5. **Number of Public Subnets**: Select `2`.
  6. **Number of Private Subnets**: Select `2`.
  7. **NAT Gateways ($)**: Select **None** (Crucial cost-saving setting).
  8. **VPC Endpoints**: Select **None**.
  9. Click **Create VPC**.
* **Assign Public IPs**: 
  * Go to **Subnets** in the left sidebar.
  * Select both **Public Subnets** -> Click **Actions** -> **Edit subnet settings**.
  * Check **Enable auto-assign public IPv4 address**.
  * Click **Save**.

---

## STEP 2: Configure Security Groups
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **VPC Dashboard** -> Click **Security Groups** -> Click **Create security group**.
* **Create three groups in the `draftmate-vpc`**:

### A. Load Balancer Security Group (`draftmate-alb-sg`)
* **Description**: Allows public web traffic to the load balancer.
* **Inbound Rules**:
  * **Rule 1**: Type: `HTTP` (Port `80`) | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
  * **Rule 2**: Type: `HTTPS` (Port `443`) | Source: `Anywhere-IPv4` (`0.0.0.0/0`)

### B. Fargate Service Security Group (`draftmate-ecs-sg`)
* **Description**: Restricts access to load balancer traffic only.
* **Inbound Rules**:
  * **Rule 1**: Type: `Custom TCP` | Port: `8080` | Source: Select `draftmate-alb-sg`

### C. Database Security Group (`draftmate-db-sg`)
* **Description**: Allows database traffic from internal services.
* **Inbound Rules**:
  * **Rule 1**: Type: `PostgreSQL` (Port `5432`) | Source: Custom -> `10.0.0.0/16` (VPC CIDR)
  * **Rule 2**: Type: `Custom TCP` | Port: `6333` (Qdrant) | Source: Custom -> `10.0.0.0/16`
  * **Rule 3**: Type: `SSH` (Port `22`) | Source: `My IP` (for administrator access)

---

## STEP 3: Setup Database Instances
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.

### A. RDS PostgreSQL Database (`draftmate-postgres`)
* **Console Path**: Go to **RDS Console** -> Click **Create database**.
* **Configuration Settings**:
  1. **Database creation method**: Select `Standard create`.
  2. **Engine options**: Select `PostgreSQL`.
  3. **Templates**: Select `Free Tier`.
  4. **DB instance identifier**: Enter `draftmate-postgres`.
  5. **Credentials**: Master username: `postgres` | Password: `Draftmate9989`.
  6. **DB instance class**: Select `db.t4g.micro` (Free Tier eligible).
  7. **Storage**: GP3 | Allocated storage: `20 GB`.
  8. **Connectivity**:
     * **Virtual Private Cloud (VPC)**: Select `draftmate-vpc`.
     * **Public access**: Select `No`.
     * **VPC security group**: Select **Choose existing** -> Select `draftmate-db-sg` (remove the `default` group).
  9. Click **Create database**.

### B. EC2 Qdrant Vector Database (`draftmate-qdrant-db`)
* **Console Path**: Go to **EC2 Console** -> Click **Launch instances**.
* **Configuration Settings**:
  1. **Name**: Enter `draftmate-qdrant-db`.
  2. **Application and OS Image**: Select **Amazon Linux 2023** (Free Tier eligible).
  3. **Instance Type**: Select `t4g.small` (Matches your current running instance).
  4. **Key pair**: Select or create a `.pem` SSH key pair.
  5. **Network Settings** (Click **Edit**):
     * **VPC**: Select `draftmate-vpc`.
     * **Subnet**: Select a **Private Subnet** (e.g., `10.0.11.0/24`).
     * **Auto-assign public IP**: Select `Disable`.
     * **Firewall (security groups)**: Select **Select existing security group** -> Select `draftmate-db-sg`.
  6. Click **Launch instance**.
* **Provisioning Qdrant (Requires Temporary Internet Access)**:
  Since the database instance is in a Private Subnet, it cannot access the internet to download Docker and Qdrant. Follow these steps to temporarily add internet access, run the setup, and delete the NAT Gateway immediately afterwards to keep costs at zero:

  #### Sub-Step 1: Create a Temporary NAT Gateway
  1. Open the **VPC Console** -> Select Region: **ap-south-1 (Mumbai)**.
  2. Click **NAT Gateways** in the left sidebar -> Click **Create NAT Gateway**.
  3. Configure:
     * **Name**: `draftmate-temp-nat`
     * **Subnet**: Select one of your **Public Subnets** (e.g., `10.0.1.0/24`).
     * **Elastic IP allocation ID**: Click **Allocate Elastic IP** (generates a public IP).
  4. Click **Create NAT Gateway** (wait 1–2 minutes for status to change from `Pending` to `Available`).

  #### Sub-Step 2: Update the Private Route Table
  1. Click **Route Tables** in the left sidebar.
  2. Select the route table associated with your **Private Subnets** (e.g., `draftmate-rtb-private`).
  3. Select the **Routes** tab -> Click **Edit routes**.
  4. Click **Add route**:
     * **Destination**: `0.0.0.0/0`
     * **Target**: Select **NAT Gateway** -> Select `draftmate-temp-nat`.
  5. Click **Save changes**.

  #### Sub-Step 3: SSH and Install Tools
  1. SSH into your Qdrant instance (`10.0.137.16`) via the public Bastion host.
  2. Run the update and Docker/Qdrant installation commands (which now have internet access):
     ```bash
     sudo yum update -y
     sudo yum install docker -y
     sudo systemctl start docker
     sudo systemctl enable docker
     sudo docker run -d -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
     ```
  3. Verify that the Qdrant docker container is running:
     ```bash
     sudo docker ps
     ```

  #### Sub-Step 4: Clean Up & Delete NAT Gateway (CRITICAL to avoid charges)
  Once Qdrant is running, remove the NAT Gateway immediately to return to a $0.00 base-cost setup:
  1. Go to **Route Tables** -> Select your **Private Route Table** -> **Routes** -> **Edit routes**.
  2. **Delete** the route `0.0.0.0/0` pointing to the NAT Gateway -> Click **Save changes**.
  3. Go to **NAT Gateways** -> Select `draftmate-temp-nat` -> Click **Actions** -> **Delete NAT Gateway** -> Type `delete` to confirm.
  4. Go to **Elastic IPs** in the left sidebar -> Select the Elastic IP that was allocated to the NAT Gateway -> Click **Actions** -> **Release Elastic IP addresses** (very important, AWS charges hourly fees for unassociated Elastic IPs).

---

## STEP 4: Create S3 Bucket for Shared Document Storage
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **Amazon S3 Console** -> Click **Create bucket**.
* **Configuration Settings**:
  1. **Bucket name**: Enter `draftmate-drafts-022104541864` (or your chosen globally unique name).
  2. **AWS Region**: Select `ap-south-1 (Mumbai)`.
  3. **Object Ownership**: Select `ACLs disabled (recommended)`.
  4. **Block Public Access settings**: Keep **Block all public access** checked (this bucket stores private user documents).
  5. Click **Create bucket**.
* **Important Note**: Ensure the bucket name matches the `S3_BUCKET_NAME` environment variable in your Fargate Task Definition so the containers can access it.

---

## STEP 5: Amazon ECR Private Repository
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **Amazon ECR** -> Click **Create repository**.
* **Configuration Settings**:
  1. **Visibility settings**: Select `Private`.
  2. **Repository name**: Enter `draftmate-app`.
  3. **Tag immutability**: Select `Disabled`.
  4. Click **Create repository**.

---

## STEP 6: Create Application Load Balancer
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.

### Part A: Create the Target Group
* **Console Path**: Go to **EC2 Console** -> **Target Groups** -> Click **Create target group**.
* **Configuration Settings**:
  1. **Basic configuration**: Select `IP addresses`.
  2. **Target group name**: Enter `ecs-gateway-tg`.
  3. **Protocol / Port**: Select `HTTP` / Enter `8080`.
  4. **VPC**: Select `draftmate-vpc`.
  5. **Health checks**: Health check path: Enter `/health` (Dedicated Nginx endpoint).
  6. **Advanced health check settings**:
     * **Healthy threshold**: `2`
     * **Unhealthy threshold**: `3`
     * **Timeout**: `5 seconds`
     * **Interval**: `15 seconds`
  7. **Target Group Attributes**: Click on the **Attributes** tab after creation -> Under **Stickiness**, ensure that **Stickiness is Disabled** (Crucial to prevent clients from sticking to inactive target groups and receiving 503 errors during deployments).
  8. Click **Next** -> Click **Create target group**.

### Part B: Create the Application Load Balancer (ALB)
* **Console Path**: Go to **EC2 Console** -> **Load Balancers** -> Click **Create load balancer** -> **Application Load Balancer**.
* **Configuration Settings**:
  1. **Load balancer name**: Enter `ecs-express-gateway-alb`.
  2. **Scheme**: Select `Internet-facing`.
  3. **Network mapping**: Select `draftmate-vpc`. Under **Mappings**, check **both Availability Zones** and select the **Public Subnets** for each.
  4. **Security groups**: Select `draftmate-alb-sg`.
  5. **Listeners and routing**: Protocol: `HTTP` | Port: `80` | Default action: Forward to `ecs-gateway-tg`. (Ensure target group stickiness on the forwarding listener rule is **Disabled**).
  6. Click **Create load balancer**.

---

## STEP 7: Configure AWS ECS Fargate
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.

### Part A: Create the ECS Cluster
* **Console Path**: Go to **Amazon ECS Console** -> **Clusters** -> Click **Create cluster**.
* **Configuration Settings**:
  1. **Cluster name**: Enter `default`.
  2. **Infrastructure**: Check **AWS Fargate (serverless)**.
  3. Click **Create**.

### Part B: Register the Task Definition
* **Console Path**: Go to **ECS Console** -> **Task definitions** -> Click **Create new task definition** -> **Create new task definition with JSON**.
* **Configuration Settings**:
  1. Paste the complete JSON configuration from [new-task-def.json](file:///d:/draftmate/draftmate_frontend_main_2/new-task-def.json) (CPU: `2048`, Memory: `4096`, environment credentials).
  2. Click **Create**.

### Part C: Deploy the ECS Service
* **Console Path**: Go to **ECS Console** -> **Clusters** -> Select `default` -> Under **Services** tab, click **Create**.
* **Configuration Settings**:
  1. **Environment**: Launch type -> Select `FARGATE`.
  2. **Task definition**: Family: `default-draftmatebackendservice` | Revision: `latest`.
  3. **Service name**: Enter `draftmatebackendservice`.
  4. **Desired tasks**: Enter `1`.
  5. **Health check grace period**: Enter `120` seconds (Crucial: Allows the container services and models to fully boot before health checks start, preventing boot-loop 503 errors).
  6. **Networking**:
     * **VPC**: Select `draftmate-vpc`.
     * **Subnets**: Select **both Public Subnets** (Required for tasks to connect outbound to external LLMs/APIs).
     * **Security group**: Select **Use existing** -> Select `draftmate-ecs-sg` (remove default).
     * **Public IP**: Select **Turned ON**.
  7. **Load balancing**:
     * **Load balancer type**: Select `Application Load Balancer`.
     * **Load balancer**: Select `ecs-express-gateway-alb`.
     * **Container**: `Main` (Port `8080`).
     * **Use an existing target group**: Select `ecs-gateway-tg`.
  8. Click **Create**.

---

## STEP 8: Configure Scheduled Autoscaling (2:00 AM – 7:00 AM IST Down)
* **AWS Region**: Specify `--region ap-south-1` in your CLI commands.
* **Local Terminal Configuration**: Run the following three commands in your terminal to set up the daily 5-hour scale-down schedule:

```bash
# 1. Register the ecs service desired count target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/default/draftmatebackendservice \
  --min-capacity 0 \
  --max-capacity 1 \
  --region ap-south-1

# 2. Scale down to 0 at 2:00 AM IST (20:30 UTC) daily
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/default/draftmatebackendservice \
  --scheduled-action-name ScaleDownAtMidnight \
  --schedule "cron(30 20 * * ? *)" \
  --scalable-target-action MinCapacity=0,MaxCapacity=0 \
  --region ap-south-1

# 3. Scale back up to 1 at 7:00 AM IST (01:30 UTC) daily
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/default/draftmatebackendservice \
  --scheduled-action-name ScaleUpInMorning \
  --schedule "cron(30 1 * * ? *)" \
  --scalable-target-action MinCapacity=1,MaxCapacity=1 \
  --region ap-south-1
```

---

## STEP 9: GitHub Actions CI/CD Pipeline Configuration
* **Console Path**: Open your repository on **GitHub** -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
* **Required GitHub Secrets**:
  * Name: `AWS_ACCESS_KEY_ID` | Value: Enter your AWS Access Key.
  * Name: `AWS_SECRET_ACCESS_KEY` | Value: Enter your AWS Secret Key.
  * Name: `AWS_REGION` | Value: `ap-south-1`
* **Triggering Deployment & Registering a New Task Definition Revision**:
  Whenever you commit code changes or modify environment variables (e.g., adding API keys or altering DSNs in `new-task-def.json`), you must register a new task definition revision and update the service to run it.

  #### Option 1: Via AWS CLI (Fastest)
  1. Commit and push your code to branch `dockerauto` to build and upload the new Docker image to ECR.
  2. Run the following command in your local terminal to register a new task definition revision from your updated local `new-task-def.json` file:
     ```bash
     aws ecs register-task-definition --cli-input-json file://new-task-def.json --region ap-south-1
     ```
  3. Update the ECS Service to roll out the new revision:
     ```bash
     aws ecs update-service --cluster default --service draftmatebackendservice --task-definition default-draftmatebackendservice --force-new-deployment --region ap-south-1
     ```

  #### Option 2: Via AWS Console (UI-Based)
  1. Open the **Amazon ECS Console** (Region: **ap-south-1 Mumbai**).
  2. Click **Task definitions** in the left sidebar -> Select the `default-draftmatebackendservice` family.
  3. Click **Create new revision** -> Select **Create new revision with JSON**.
  4. Copy the entire updated content of your local `new-task-def.json` file, paste it into the editor, and click **Create**.
  5. Go to **Clusters** -> Click `default` -> Select `draftmatebackendservice` -> Click **Update**.
  6. Under **Task definition Family**, choose the family and select the latest revision number.
  7. Check the **Force new deployment** checkbox, then click **Update**.


---

## STEP 10: Point Custom Domain (`draftmate.in`) via Route 53 & ACM
To serve your application on the custom domain `draftmate.in` securely with SSL (HTTPS):

### Part A: Request a Public SSL Certificate in ACM
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **AWS Certificate Manager (ACM)** -> Click **Request a certificate**.
* **Configuration Settings**:
  1. Certificate type: Select `Request a public certificate` -> click **Next**.
  2. **Domain names**:
     * Fully qualified domain name: Enter `draftmate.in`.
     * Click **Add another name to this certificate** -> Enter `*.draftmate.in` (allows SSL on all subdomains).
  3. **Validation method**: Select `DNS validation`.
  4. Click **Request**.
  5. **DNS Record Verification**: 
     * Once created, click on the **Certificate ID** in the list.
     * Under the **Domains** section, click **Create records in Route 53** (this automatically inserts the validation CNAME records into your Route 53 DNS host).
     * Wait 5–10 minutes for status to change to `Issued`.

### Part B: Add HTTPS (Port 443) Listener to the Load Balancer
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **EC2 Console** -> **Load Balancers** -> Select `ecs-express-gateway-alb`.
* **Configuration Settings**:
  1. Select the **Listeners and rules** tab -> Click **Add listener**.
  2. **Listener details**: Protocol: `HTTPS` | Port: `443`.
  3. **Routing actions**: Forward to target group -> Select `ecs-gateway-tg`.
  4. **Security listener settings**:
     * Security policy: Select `ELBSecurityPolicy-TLS13-1-2-2021-06` (recommended).
     * Default SSL/TLS certificate: Select **From ACM** -> Choose your `draftmate.in` certificate.
  5. Click **Add**.

### Part C: Redirect HTTP traffic to HTTPS (301 Redirect)
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **EC2 Console** -> **Load Balancers** -> Select `ecs-express-gateway-alb`.
* **Configuration Settings**:
  1. Select the **Listeners and rules** tab -> Select the **HTTP:80** listener checkbox -> Click **Manage listener** -> **Edit listener**.
  2. **Actions**: Remove the default forward action.
  3. **New Action**: Select **Redirect to URL**.
  4. Click **Save changes**.

### Part D: Create API Subdomain pointing to the Load Balancer (Backend)
To direct backend calls to the Load Balancer, create a subdomain (e.g. `api.draftmate.in`):
1. **Request SSL for Subdomain**:
   * Go to **ACM Console** (Region: **ap-south-1 Mumbai**).
   * Request a public certificate for `api.draftmate.in` (DNS Validation) -> Create validation records in Route 53.
2. **Bind Certificate to ALB**:
   * Go to **EC2 Load Balancers** (Region: **ap-south-1 Mumbai**).
   * Select `ecs-express-gateway-alb`. Under **Listeners**, edit the HTTPS:443 listener and add/select the `api.draftmate.in` certificate.
3. **Route DNS in Route 53**:
   * Go to **Route 53 Hosted Zones** (Region: **ap-south-1 Mumbai**) -> Click **Create record**.
   * Record name: Enter `api`.
   * Type: `A - Alias to Application Load Balancer` -> Choose Region: `ap-south-1` -> Select `ecs-express-gateway-alb`.
   * Click **Create records**.

---

## STEP 11: OPTION B Setup (Host Frontend on S3 + CloudFront)
This is the recommended setup to keep the landing page online 24/7 for free, while only running the backend during active hours.

### Part A: Create a Private S3 Bucket for Frontend
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **Amazon S3 Console** -> Click **Create bucket**.
* **Configuration Settings**:
  1. **Bucket name**: Enter `draftmate-frontend-prod`.
  2. **Object Ownership**: Select `ACLs disabled (recommended)`.
  3. **Block Public Access settings**: Keep **Block all public access** checked (very secure).
  4. Click **Create bucket**.

### Part B: Create a CloudFront Distribution (CDN & SSL)
* **AWS Console Region**: Select **us-east-1 (N. Virginia)** *ONLY for ACM certificate creation!*
* **Part 1: Request ACM Certificate in us-east-1**:
  * Go to **ACM Console** -> **Change region to us-east-1 (N. Virginia)** (AWS requires CloudFront certificates to reside in N. Virginia).
  * Request a public certificate for `draftmate.in` and `*.draftmate.in` -> Perform DNS validation.
* **Part 2: Create CloudFront Distribution**:
  * Go to **CloudFront Console** (Region: Global) -> Click **Create distribution**.
  * **Origin domain**: Select your S3 bucket `draftmate-frontend-prod.s3.ap-south-1.amazonaws.com`.
  * **Origin access**: Select **Origin access control settings (OAC)** -> Click **Create control setting** -> Click **Create**.
  * **Viewer protocol policy**: Select `Redirect HTTP to HTTPS`.
  * **Alternate domain names (CNAMEs)**: Add `draftmate.in` and `www.draftmate.in`.
  * **Custom SSL certificate**: Select the certificate you created in `us-east-1`.
  * **Default root object**: Enter `index.html`.
  * Click **Create distribution**.
  * **S3 Policy Update**: CloudFront will display a banner with a policy snippet. Click **Copy policy**, go to your S3 bucket `draftmate-frontend-prod` -> **Permissions** -> **Bucket policy** -> Paste and save the policy.

### Part C: Point Domain DNS to CloudFront in Route 53
* **AWS Console Region**: Select **ap-south-1 (Mumbai)**.
* **Console Path**: Go to **Route 53 Console** -> **Hosted zones** -> Select `draftmate.in`.
* **Configuration Settings**:
  1. Click **Create record**.
  2. **Root Domain Record (`draftmate.in`)**:
     * Record name: Leave blank.
     * Record type: `A` -> Toggle **Alias** to **ON**.
     * Route traffic to: `Alias to CloudFront distribution` -> Select your CloudFront distribution domain name.
     * Click **Create records**.
  3. **WWW Subdomain Record (`www.draftmate.in`)**:
     * Click **Create record** again.
     * Record name: Enter `www`.
     * Type: `A` | Alias: `ON` -> Point to the same CloudFront distribution.
     * Click **Create records**.

### Part D: Build and Upload Frontend Code
1. In your local terminal, edit your `.env` file to point `VITE_API_BASE_URL` to your API subdomain:
   ```env
   VITE_API_BASE_URL=https://api.draftmate.in
   ```
2. Build the production assets:
   ```bash
   npm run build
   ```
3. Upload the compiled `dist/` folder contents to S3:
   ```bash
   aws s3 sync dist/ s3://draftmate-frontend-prod/ --delete
   ```

Your static site is now online 24/7 at `https://draftmate.in` and routes backend API requests to Fargate at `https://api.draftmate.in`!
