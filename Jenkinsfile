pipeline {
    agent any

    environment {
        // We will configure these credentials in Jenkins
        DOCKER_CREDENTIALS = credentials('docker-hub-creds')
        FRONTEND_IMAGE = 'preetkakdiya/draftmate-frontend'
        BACKEND_IMAGE = 'preetkakdiya/draftmate-backend'
    }

    stages {
        stage('Workspace cleanup') {
            steps {
                cleanWs()
            }
        }
        
        stage('Git: Code Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Trivy: Filesystem scan') {
            steps {
                sh "trivy fs --format table -o trivy-fs-report.html ."
            }
        }
        
        stage('OWASP: Dependency check') {
            steps {
                script {
                    // This forces Jenkins to actually download the tool if it's not installed yet
                    tool 'DP-Check'
                }
                // Requires OWASP plugin installed in Jenkins
                dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }
        
        stage('SonarQube: Code Analysis') {
            steps {
                script {
                    // This uses the tool name you configured in Jenkins!
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sonar-server') {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=draftmate -Dsonar.sources=."
                    }
                }
            }
        }
        
        stage('SonarQube: Code Quality Gates') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }
        
        stage('Docker: Build Images') {
            steps {
                sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend ."
                sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile ."
            }
        }
        
        stage('Docker: Push to DockerHub') {
            steps {
                sh "echo \$DOCKER_CREDENTIALS_PSW | docker login -u \$DOCKER_CREDENTIALS_USR --password-stdin"
                sh "docker push ${FRONTEND_IMAGE}:latest"
                sh "docker push ${BACKEND_IMAGE}:latest"
            }
        }
        
        stage('Helm: Deploy to Kubernetes') {
            steps {
                sh """
                    # WARNING: Change the IP below to your company's actual Kubernetes EC2 Public IP!
                    ssh -o StrictHostKeyChecking=no -i /var/lib/jenkins/.ssh/k8s.pem ubuntu@54.221.83.201 '
                        cd /home/ubuntu/draftmate_frontend_main_2
                        git stash
                        git pull origin preet/k8s-setup
                        # Deploy using the ubuntu user's default kubeconfig for Kind
                        helm upgrade --install draftmate ./draftmate-chart \\
                            -f ./draftmate-chart/values.yaml \\
                            -f ./draftmate-chart/values-secrets.yaml \\
                            --namespace default --create-namespace
                        
                        # Force Kubernetes to pull the newly built latest image
                        kubectl rollout restart deployment frontend backend --namespace default
                    '
                """
            }
        }
    }
    
    post {
        always {
            echo "Pipeline complete! Check the UI for status."
        }
    }
}
