# 🌐 DraftMate Domain & HTTPS Setup Guide

This guide explains exactly what you need to change to stop using the messy `http://ec2-...amazonaws.com:8080` URL and start running your app on **`https://draftmate.in`** (or any other custom domain).

Mapping a real domain involves four major steps: 
1. Reserving a static IP address on AWS.
2. Updating your DNS records.
3. Enabling HTTPS (SSL/TLS) inside your Kubernetes cluster.
4. Updating your third-party integrations (like Google Login) to trust the new domain.

---

## 1. Reserve an Elastic IP on AWS
Right now, every time you stop and start your EC2 instance, AWS gives it a random new Public IP address. If you map your domain to a random IP, your website will break every time the server restarts.

**What to do:**
1. Go to the AWS EC2 Console.
2. On the left sidebar, click **Elastic IPs**.
3. Click **Allocate Elastic IP address** and save it.
4. Select the new IP, click **Actions > Associate Elastic IP address**, and attach it to your DraftMate EC2 instance.

*Your server now has a permanent IP address!* Update your `start_draftmate.ps1` script to use this new IP, as the old one is gone.

---

## 2. Update Your Domain DNS Records
You need to tell the internet that `draftmate.in` lives at your new AWS Elastic IP.

**What to do:**
1. Log into your domain registrar (GoDaddy, Namecheap, Route53, Hostinger, etc.).
2. Go to the **DNS Management** or **DNS Settings** page.
3. Create an **A Record**:
   * **Host / Name:** `@` (or leave it blank)
   * **Points to / Value:** `<YOUR_NEW_ELASTIC_IP>`
   * **TTL:** 300 seconds (or lowest available)
4. *(Optional)* Create a **CNAME Record** for `www`:
   * **Host / Name:** `www`
   * **Points to / Value:** `draftmate.in`

*(Note: DNS changes can take up to 24 hours to propagate globally, though they usually take about 15 minutes).*

---

## 3. Enable the NGINX Ingress Controller (Ports 80 & 443)
Right now, you are using the `draftmate-tunnel.service` to forward port `8080`. For a production domain, you want traffic to flow over standard web ports (`80` for HTTP, `443` for HTTPS) using an Ingress Controller.

**What to do on your EC2 Instance:**
1. Install the NGINX Ingress Controller for Kind:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
   ```
2. Disable the temporary port-forward service we created earlier:
   ```bash
   sudo systemctl disable --now draftmate-tunnel.service
   ```
   *(Traffic will now flow automatically from your EC2 Host Port 80 directly into the NGINX Ingress Controller).*

---

## 4. Update the Kubernetes Helm Chart (`values.yaml`)
You need to tell Kubernetes to accept traffic meant for `draftmate.in` and route it to your frontend.

**File to Edit:** `~/draftmate_frontend_main_2/draftmate-chart/values.yaml`

Find the `ingress:` section and update it:
```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: draftmate.in       # <--- CHANGE THIS from draftmate.test
      paths:
        - path: /
          pathType: Prefix
```
Apply the changes:
```bash
helm upgrade draftmate ./draftmate-chart
```
*(Your site is now available at `http://draftmate.in`!)*

---

## 5. Enable HTTPS (SSL Certificates)
Browsers will mark your site as "Not Secure" until you install an SSL certificate. Kubernetes uses **Cert-Manager** to automatically generate free Let's Encrypt certificates.

**What to do:**
1. Install Cert-Manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml
   ```
2. Create a ClusterIssuer. Save the following as `issuer.yaml` and run `kubectl apply -f issuer.yaml`:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       email: your-email@draftmate.in  # <--- YOUR EMAIL
       server: https://acme-v02.api.letsencrypt.org/directory
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   ```
3. Update `values.yaml` to request the certificate:
   ```yaml
   ingress:
     enabled: true
     className: "nginx"
     annotations:
       cert-manager.io/cluster-issuer: "letsencrypt-prod"  # <--- ADD THIS
     hosts:
       - host: draftmate.in
         paths:
           - path: /
             pathType: Prefix
     tls:                                                  # <--- ADD THIS BLOCK
       - secretName: draftmate-tls
         hosts:
           - draftmate.in
   ```
4. Run `helm upgrade draftmate ./draftmate-chart` again.

---

## 6. Update Third-Party Integrations (CRITICAL)
Your third-party integrations (like Google Login or Cashfree) currently expect traffic to originate from `http://localhost` or `http://ec2...`. If you don't update them, users will get a `redirect_uri_mismatch` error when trying to log in.

### A. Google Cloud Console (Google Login)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Click on your existing **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript origins**, add:
   * `https://draftmate.in`
4. Under **Authorized redirect URIs**, add any callback URLs your app uses (if any):
   * `https://draftmate.in/login` 
   * `https://draftmate.in/auth/google/callback` (or whatever your specific route is)

### B. Your `.env` Variables
Ensure your application knows its new official domain. 
Update your `~/draftmate_frontend_main_2/.env` file:
```bash
FRONTEND_URL_PROD="https://draftmate.in"
```
Re-run the credentials script to inject it, and restart your pods!
```bash
python3 ~/update_creds.py
helm upgrade draftmate ./draftmate-chart
```
