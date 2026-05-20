#!/bin/bash
# DraftMate Jenkins Master Node Setup Script
# Run this script ON the NEW Jenkins EC2 instance.

set -e

echo "🚀 Starting DraftMate Jenkins Server Bootstrap..."

# 1. Update system and install Java
echo "☕ Installing Java (OpenJDK 17)..."
sudo apt-get update -y
sudo apt-get install -y fontconfig openjdk-17-jre

# 2. Install Jenkins
echo "🏗️ Installing Jenkins..."
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y jenkins
sudo systemctl enable --now jenkins

# 3. Install Docker (Jenkins needs this to build images)
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl apt-transport-https
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 4. Add Jenkins to Docker Group
echo "🔐 Configuring permissions..."
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu
sudo systemctl restart jenkins

echo "================================================="
echo "✅ JENKINS SERVER SETUP COMPLETE!"
echo "Jenkins is now running on Port 8080 of this machine."
echo ""
echo "Please wait 30 seconds for Jenkins to fully boot, then copy the password below:"
echo "-------------------------------------------------"
sleep 15
sudo cat /var/lib/jenkins/secrets/initialAdminPassword || echo "(Password not ready yet. Run 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword' in a few seconds)"
echo "-------------------------------------------------"
echo "Go to http://<YOUR_NEW_AWS_IP>:8080 and paste that password!"
echo "================================================="
