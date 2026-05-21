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
                    waitForQualityGate abortPipeline: true
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
    }
    
    post {
        always {
            echo "Pipeline complete! Check the UI for status."
        }
    }
}
