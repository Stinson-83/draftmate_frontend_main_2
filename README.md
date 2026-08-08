# DraftMate - All-in-One Legal Practice Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.109.0-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/AWS-EC2%2FS3%2FRDS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS">
  <img src="https://img.shields.io/badge/Docker-24.0-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Nginx-1.24-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
</p>

<p align="center">
  DraftMate is a comprehensive legal practice management platform that combines AI-powered drafting, research, case management, and advocate discovery into a single, unified solution.
</p>

---

## Table of Contents
1. [About DraftMate](#about-draftmate)
2. [Tech Stack](#tech-stack)
3. [Core Features](#core-features)
4. [Architecture Overview](#architecture-overview)
5. [Getting Started](#getting-started)
6. [Deployment](#deployment)
7. [API Documentation](#api-documentation)
8. [Security](#security)
9. [Contributing](#contributing)
10. [License](#license)
11. [Support](#support)

---

## About DraftMate

DraftMate empowers legal professionals with:
- AI-driven legal document drafting and enhancement
- Advanced legal research with AI chat
- Complete practice management (clients, cases, hearings, calendar)
- Advocate discovery and profile management
- e-Courts integration readiness
- Secure cloud-based deployment

---

## Tech Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.9.6
- **State Management**: TanStack React Query 5.100.14
- **UI/Styling**: Tailwind CSS (implied), Framer Motion 12.40.0
- **Authentication**: @react-oauth/google 0.13.4
- **Other Libraries**: React Markdown 9.0.1, Sonner 2.0.7, Lucide React 0.555.0

### Backend (Microservices)
- **Framework**: FastAPI 0.109.0
- **ASGI Server**: Uvicorn 0.27.0
- **Database ORM**: SQLAlchemy 2.0.25
- **Migrations**: Alembic 1.13.1
- **Authentication**: JWT (python-jose 3.3.0)
- **Password Hashing**: Passlib 1.7.4 (bcrypt)
- **Rate Limiting**: SlowAPI 0.1.9
- **File Uploads**: Python-Multipart 0.0.6
- **AWS SDK**: Boto3 1.34.0

### Database
- **Primary**: PostgreSQL (with pgvector for AI embeddings)
- **Vector DB**: Qdrant (for semantic search)

### Cloud Infrastructure (AWS)
- **Compute**: EC2
- **Storage**: S3
- **Database**: RDS for PostgreSQL
- **Networking**: VPC, Security Groups, Nginx Reverse Proxy
- **Secret Management**: AWS Secrets Manager (recommended)
- **Monitoring**: CloudWatch

### DevOps & Tools
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Version Control**: Git
- **Package Managers**: npm (frontend), pip (backend)

---

## Core Features

### User Features
- 📝 **AI Document Drafting**: Generate legal documents with AI
- ✨ **Document Enhancement**: Improve existing drafts with AI
- 🔍 **Legal Research Chat**: AI-powered research with citations
- 📄 **PDF Editor**: Merge, split, compress PDF files
- 📚 **Case Search**: Search Indian legal cases (Indian Kanoon integration)
- 👨‍⚖️ **Advocate Discovery**: Find and connect with verified advocates
- 💬 **Direct Messaging**: Chat with advocates securely
- 📅 **Consultation Booking**: Schedule online/offline consultations

### Advocate Features
- 🎛️ **Advocate Dashboard**: Complete practice management hub
- 📋 **Profile Management**: Create and manage public profile
- 📊 **Analytics Dashboard**: Track profile views, consultation requests
- 📝 **Case Management**: Manage all cases in one place
- 🔔 **Notifications**: Real-time alerts for new requests, messages
- 💰 **Consultation Management**: Accept/reject/complete consultations
- 📤 **File Uploads**: Upload profile images, documents to S3

### Library Module (Full Practice Management)
The complete end-to-end practice management solution:
- 📚 **Bare Acts**: Access and search central and state acts
- ⚖️ **Judgments**: Browse and search case law
- 📝 **Notes**: Take and organize notes linked to acts/sections
- 🔖 **Bookmarks**: Bookmark acts, sections, judgments with folders
- 📋 **Forms**: Access legal forms and templates
- 📖 **Legal Dictionary**: Look up legal terms
- 📔 **Lawyer Diary**: Daily case and client notes
- 📅 **Court Calendar**: Track hearing dates and deadlines
- 🔔 **Hearing Tracker**: Monitor all hearings with status updates
- 🔗 **Video Links**: Store and join virtual court hearing links
- 👥 **Client CRM**: Manage clients with complete profiles
- 📂 **Case Management**: Full case lifecycle tracking
- 🕵️ **Case Tracking**: e-Courts integration (CNR search, status tracking)
- ⚙️ **Integration Settings**: Manage e-Courts and third-party integrations

### Admin Features
- 👥 **Verification Management**: Review and approve advocate verification requests
- 📊 **Platform Analytics**: Track platform usage and growth
- 🛡️ **Moderation**: Moderate content and user reports

---

## Architecture Overview

### Microservices Architecture
DraftMate uses a modular microservices architecture for scalability:
| Service | Port | Purpose |
|---------|------|---------|
| **Frontend** | 5173 (dev), 80 (prod) | React + Vite UI |
| **Auth (login_db)** | 8009 | User authentication, session management |
| **Advocate Profile** | 8007 | Advocate profiles, discovery, consultations |
| **Deep Research (Lex Bot)** | 8004 | AI research chat, semantic search |
| **Drafter** | 8003 | AI legal document drafting |
| **Enhance Bot** | — | Document enhancement |
| **PDF Editor** | 8005 | PDF manipulation tools |
| **Converter** | 8000 | File conversion |
| **Query** | — | Legal case search |
| **Legal Workflow** | 8010 | Legal workflow automation |
| **Notification** | 8015 | Real-time notifications |
| **Library Service** | 8010 (new) | Library module, practice management |

### Deployment Architecture
```
                    ┌─────────────────┐
                    │   Cloudflare    │ (Optional CDN)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx Proxy   │ (Port 80/443)
                    └──────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │ Frontend  │  │ Microservices │ │   RDS (PG)   │
    │ (S3/EC2)  │  │   (EC2)      │ │  + Qdrant    │
    └───────────┘  └──────────────┘  └─────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
      ┌───────▼─────┐ ┌──▼────────┐ ┌─▼──────────┐
      │ Library Svc │ │ Advocate  │ │ Auth Svc  │
      │ (8010)      │ │ Profile  │ │ (8009)    │
      └─────────────┘ └───────────┘ └───────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- AWS Account (for production deployment)
- Google OAuth Credentials (for login)

### Local Development Commands

Depending on what component your development team is working on, use the following commands:

#### 🎨 Frontend Only Development
```bash
npm run dev
```
- **URL**: `http://localhost:5173`
- Runs the Vite development server with hot-reload for UI & page development.

#### ⚙️ Full Backend Microservices & Databases (Recommended)
```bash
docker compose up --build -d
```
- **URL**: `http://localhost:8080`
- Starts all 8 backend microservices, databases, and OnlyOffice document editor in background containers.

#### ⚡ Full Stack (Frontend + Local Python Microservices)
```bash
npm run dev:all
```
- Runs Vite frontend and Python uvicorn backend microservices concurrently in one terminal.

#### 🐍 Individual Backend Microservices (Local Python Dev)
```bash
# 1. Auth Service (Port 8009)
cd backend/login_db
uvicorn auth:app --host 0.0.0.0 --port 8009 --reload

# 2. AI Legal Drafter Engine (Port 8003)
cd backend/Drafter
uvicorn Drafter:app --host 0.0.0.0 --port 8003 --reload

# 3. AI Legal Research / Lex Bot (Port 8004)
cd backend/Deep_research
uvicorn lex_bot.app:app --host 0.0.0.0 --port 8004 --reload
```

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
# Environment
ENVIRONMENT=development
FRONTEND_URL_DEV=http://localhost:5173
FRONTEND_URL_PROD=https://your-domain.com

# Authentication
JWT_SECRET=your-strong-32+character-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_CLIENT_ID=your-google-client-id

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=lex_bot_db
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DSN=postgresql://postgres:password@db:5432/lex_bot_db

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-s3-bucket-name
S3_BUCKET=your-s3-bucket-name

# APIs
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
TAVILY_API_KEY=your-tavily-key
IKApi=your-indian-kanoon-key

# Services
ADVOCATE_PROFILE_PORT=8007
NOTIFICATION_SERVICE_URL=http://127.0.0.1:8015
```

---

## Deployment

### AWS Deployment (Production)
1. **Set up EC2 Instance**: Launch an EC2 instance (t3.medium or larger recommended)
2. **Install Docker & Docker Compose**: Follow official Docker installation guide for Ubuntu
3. **Configure RDS**: Launch a PostgreSQL RDS instance with pgvector extension
4. **Set up S3 Bucket**: Create an S3 bucket for file uploads with appropriate permissions
5. **Configure Nginx**: Set up Nginx reverse proxy to route traffic to microservices
6. **Deploy with Docker Compose**:
   ```bash
   # Copy .env file to EC2
   scp .env ec2-user@your-ec2-ip:/home/ec2-user/draftmate/
   
   # SSH into EC2
   ssh ec2-user@your-ec2-ip
   cd draftmate
   
   # Start production services
   docker-compose -f docker-compose.prod.yml up -d
   ```
7. **Set up SSL/TLS**: Use Let's Encrypt with Certbot for HTTPS
8. **Configure CloudWatch**: Set up logging and monitoring

### Library Service Deployment
The Library Service is included in the Docker Compose stack:
- Service name: `library-service`
- Port: 8010
- Health check: `GET /health`
- Database tables: All `library_*` tables are created automatically via SQLAlchemy

---

## API Documentation
API documentation is available via Swagger UI for all FastAPI services:
- **Library Service**: http://localhost:8010/docs
- **Advocate Profile**: http://localhost:8007/docs
- **Auth Service**: http://localhost:8009/docs (if enabled)
- **Lex Bot**: http://localhost:8004/docs

---

## Security
- **JWT Authentication**: All API endpoints are protected with JWT tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **CORS Protection**: Restricted to production frontend URLs
- **Rate Limiting**: SlowAPI to prevent abuse
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **File Upload Validation**: Magic number checks, size limits, MIME validation
- **Environment Variables**: All secrets stored in env vars (use AWS Secrets Manager in production)

For detailed security audit, see [Security Audit Report](#security-audit-report)

---

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support
For support, please:
- Open an issue in the GitHub repository
- Contact our support team at support@draftmate.com
- Check our documentation at docs.draftmate.com

---

<p align="center">
  <strong>DraftMate - Legal Practice, Simplified.</strong>
</p>
