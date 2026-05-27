pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '3', artifactNumToKeepStr: '3'))
    }

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
                sh """
                    trivy fs --format table -o trivy-raw.txt .
                    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Trivy Report</title></head><body style="background:#1e1e1e;color:#d4d4d4;"><pre>' > trivy-fs-report.html
                    cat trivy-raw.txt >> trivy-fs-report.html
                    echo '</pre></body></html>' >> trivy-fs-report.html
                """
                archiveArtifacts artifacts: 'trivy-fs-report.html', allowEmptyArchive: true
            }
        }
        
        stage('OWASP: Dependency check') {
            steps {
                script {
                    // This forces Jenkins to actually download the tool if it's not installed yet
                    tool 'DP-Check'
                }
                // Requires OWASP plugin installed in Jenkins
                dependencyCheck additionalArguments: '--scan ./', odcInstallation: 'DP-Check'
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
                sh """
                    docker build \\
                        --build-arg VITE_CLIENT_ID=462761102428-dnm0f7tmt3dbv0l41aun71k4lj1c9hig.apps.googleusercontent.com \\
                        --build-arg VITE_API_BASE_URL=http://app.draftde.free.nf/api \\
                        --build-arg VITE_CASHFREE_MODE=sandbox \\
                        -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -f Dockerfile.frontend .
                """
                sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -f Dockerfile ."
            }
        }
        
        stage('Docker: Push to DockerHub') {
            steps {
                sh "echo \$DOCKER_CREDENTIALS_PSW | docker login -u \$DOCKER_CREDENTIALS_USR --password-stdin"
                sh "docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                sh "docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}"
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
                        # Deploy using the ubuntu users default kubeconfig for Kind
                        /usr/local/bin/helm upgrade --install draftmate ./draftmate-chart \\
                            -f ./draftmate-chart/values.yaml \\
                            -f ./draftmate-chart/values-secrets.yaml \\
                            --set frontend.image.tag=${BUILD_NUMBER} \\
                            --set backend.image.tag=${BUILD_NUMBER} \\
                            --namespace default --create-namespace
                    '
                """
            }
        }
    }
    
    post {
        always {
            sh """
                # Delete the specific images from 3 builds ago to save space, but preserve the global layer cache!
                docker rmi ${FRONTEND_IMAGE}:\$((${BUILD_NUMBER} - 3)) || true
                docker rmi ${BACKEND_IMAGE}:\$((${BUILD_NUMBER} - 3)) || true
                
                # Delete any dangling invisible layers
                docker image prune -f
            """
            cleanWs()
            echo "Pipeline complete! Check the UI for status."
        }
    }
}
