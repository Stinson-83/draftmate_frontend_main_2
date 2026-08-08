# DraftMate - End-to-End Work Process Documentation

## Overview

DraftMate is a comprehensive legal-tech SaaS platform that combines AI-powered legal drafting, research capabilities, and an advocate marketplace. This document details the complete end-to-end workflows across all system components.

---

## System Architecture

### Frontend (React + Vite)
- **Port**: 5173
- **Tech Stack**: React 19, Vite, React Router v7, TanStack React Query, Framer Motion
- **Entry Point**: `src/main.jsx` → `src/App.jsx`

### Backend Services (FastAPI)
All services are routed through Nginx reverse proxy on port 8080 (production) or run individually during development.

| Service | Port | Purpose | Directory |
|---------|------|---------|-----------|
| Converter | 8000 | Document conversion (HTML, PDF, etc.) | `backend/converter` |
| Drafter | 8003 | AI-powered legal document generation | `backend/Drafter` |
| Query | 8001 | Legal template search and retrieval | `backend/query` |
| Enhance Bot | 8002 | AI content enhancement and clause improvement | `backend/Enhance_bot` |
| PDF Editor | 8005 | PDF manipulation (merge, split, watermark, etc.) | `backend/PDF_Editor` |
| Deep Research (Lex Bot) | 8004 | AI legal research and chat with RAG | `backend/Deep_research/lex_bot` |
| Advocate Profile | 8007 | Advocate marketplace and profiles | `backend/Advocate_Profile` |
| Auth Service | 8009 | User authentication and session management | `backend/login_db` |
| Notification Service | 8015 | User notifications and alerts | `backend/Notification` |
| Case Search | 8006 | Legal case search and retrieval | `backend/Case_search` |

### Infrastructure
- **Database**: PostgreSQL with pgvector extension (port 5432)
- **Vector Database**: Qdrant for semantic search
- **Reverse Proxy**: Nginx (port 8080)
- **Containerization**: Docker Compose for orchestration

---

## End-to-End Workflows

### 1. User Authentication & Onboarding Flow

#### 1.1 User Registration
**Endpoint**: `POST /auth/register`

**Flow**:
1. User navigates to `/signup` page
2. Enters email and password
3. Frontend sends POST request to Auth Service
4. Backend validates input and creates user record in PostgreSQL
5. Returns success response with user_id
6. Auto-login triggers (see Login flow)

**Backend Processing**:
```python
# backend/login_db/main.py
- Validates email format and password strength
- Checks for existing user
- Hashes password using bcrypt
- Inserts into users table
- Returns user_id
```

#### 1.2 User Login
**Endpoint**: `POST /auth/login`

**Flow**:
1. User navigates to `/login` page
2. Enters credentials or uses Google OAuth
3. Frontend sends POST request to Auth Service
4. Backend verifies credentials
5. Generates session_id and JWT token
6. Returns session data and user profile
7. Frontend stores in localStorage:
   - `session_id`
   - `user_id`
   - `user_profile` (JSON)
8. Redirects to `/dashboard/home`

**Google OAuth Flow**:
1. User clicks "Sign in with Google"
2. Google OAuth popup authenticates user
3. Returns Google token
4. Frontend sends token to `/auth/google-login`
5. Backend validates token with Google
6. Creates or updates user account
7. Returns session data

#### 1.3 User Onboarding
**Endpoint**: None (client-side state management)

**Flow**:
1. New users redirected to `/onboarding`
2. Multi-step form collects:
   - Role selection (Professional/Student)
   - Personal information (name, workplace, designation)
   - Usage preferences (drafting, research, marketplace)
3. Data stored in localStorage as `user_profile`
4. Upon completion, redirects to `/dashboard/home`

---

### 2. Legal Document Drafting Workflow

#### 2.1 Draft Generation
**Endpoint**: `POST /drafter/generate`

**Flow**:
1. User navigates to `/dashboard/editor`
2. Enters drafting prompt in AI Sidebar
3. Frontend sends request to Drafter service:
   ```json
   {
     "prompt": "Draft a non-disclosure agreement for software development",
     "context": "Additional context or requirements"
   }
   ```
4. Drafter service:
   - Processes prompt using LLM (GPT-4/Claude/Gemini)
   - Generates legal document with placeholders
   - Returns HTML content with variable placeholders
5. Frontend displays content in Editor with:
   - Variable highlighting (bold by default)
   - Placeholders in `{{variable_name}}` format
   - AI Sidebar chat for refinement

**Backend Processing**:
```python
# backend/Drafter/Drafter.py
- Receives prompt and context
- Constructs LLM prompt with legal templates
- Calls LLM API (OpenAI/Anthropic/Google)
- Parses response to extract document content
- Identifies and formats variables
- Returns structured HTML with placeholders
```

#### 2.2 Document Editing & Enhancement
**Endpoints**:
- `POST /enhance/enhance_content` - Content enhancement
- `POST /enhance/enhance_clause` - Clause improvement
- `POST /enhance/create_placeholders` - Variable extraction

**Flow**:
1. User selects text in Editor
2. Clicks enhancement option from Floating Toolbar
3. Frontend sends selected text to Enhance Bot
4. AI processes and returns enhanced version
5. Enhancement Preview Modal shows:
   - Original content
   - Enhanced content
   - Accept/Reject options
6. User accepts → replaces text in Editor
7. User rejects → discards changes

#### 2.3 Variable Management
**Endpoint**: `POST /enhance/create_placeholders`

**Flow**:
1. Editor scans document for `{{placeholder}}` patterns
2. Extracts all unique variable names
3. Displays in Variables Sidebar
4. User can:
   - Add custom variables
   - Delete variables
   - Replace variables with actual values
5. Changes reflect in real-time in Editor

#### 2.4 Document Export
**Flow**:
1. User clicks "Download PDF" or "Download Word"
2. Frontend uses `html2pdf.js` for PDF generation
3. For Word conversion:
   - Sends HTML to Converter service
   - Converter transforms HTML to DOCX
   - Returns file for download
4. Document includes:
   - Header/footer if enabled
   - Page numbers if enabled
   - All formatting preserved

---

### 3. AI Legal Research Workflow

#### 3.1 Research Chat Interface
**Endpoint**: `POST /lexbot/chat/stream` (SSE streaming)

**Flow**:
1. User navigates to `/dashboard/research`
2. Selects LLM model (Gemini, GPT-4, etc.)
3. Enters legal query in chat input
4. Frontend initiates SSE connection to Lex Bot
5. Streaming response includes:
   - Status updates ("Searching case laws...", "Analyzing precedent...")
   - Token-by-token answer generation
   - Follow-up questions
   - Source citations
6. Response rendered with:
   - Markdown formatting
   - LaTeX for mathematical expressions
   - Syntax highlighting for code
   - Clickable citation links

**Backend Processing**:
```python
# backend/Deep_research/lex_bot/main.py
- Receives user query and session_id
- Performs web search (Tavily, Serper, Firecrawl)
- Retrieves relevant legal documents
- Uses RAG with Qdrant vector database
- Generates comprehensive answer with citations
- Streams response via Server-Sent Events
- Stores conversation in PostgreSQL
```

#### 3.2 Document Upload & Analysis
**Endpoint**: `POST /lexbot/upload`

**Flow**:
1. User uploads PDF/legal document
2. Frontend sends file to Lex Bot with session_id
3. Backend:
   - Extracts text from PDF
   - Chunks and embeds text
   - Stores in Qdrant vector database
   - Associates with user session
4. User can now ask questions about the document
5. RAG system retrieves relevant passages

#### 3.3 Session Management
**Endpoints**:
- `GET /lexbot/sessions` - List all sessions
- `GET /lexbot/sessions/{session_id}` - Get session history
- `DELETE /lexbot/sessions/{session_id}` - Delete session

**Flow**:
1. Each research conversation has unique session_id
2. Sessions stored in sidebar for easy access
3. Clicking session loads full conversation history
4. Context maintained across messages within session

---

### 4. Advocate Marketplace Workflow

#### 4.1 Advocate Discovery
**Endpoints**:
- `GET /advocate-api/api/v1/discovery/featured` - Featured advocates
- `GET /advocate-api/api/v1/discovery/trending` - Trending advocates
- `GET /advocate-api/api/v1/discovery/recent` - Recently joined
- `GET /advocate-api/api/v1/discovery/search` - Search with filters

**Flow**:
1. User navigates to `/advocates` (public page)
2. Page loads multiple carousels:
   - Featured advocates (curated)
   - Trending advocates (high engagement)
   - Recent advocates (newly joined)
   - Recommended (personalized)
3. User can:
   - Search by name, location, practice area
   - Filter by verification status
   - Sort by relevance, rating, experience
4. Results displayed as AdvocateCard components
5. Clicking card navigates to `/advocate/{slug}`

**Backend Processing**:
```python
# backend/Advocate_Profile/main.py
- Queries advocates table with filters
- Calculates profile completion scores
- Implements pagination
- Tracks view analytics
- Returns sorted results
```

#### 4.2 Advocate Profile View
**Endpoint**: `GET /advocate-api/api/v1/profiles/public/{slug}`

**Flow**:
1. User lands on advocate profile page
2. Frontend fetches profile data by slug
3. Displays comprehensive profile:
   - Professional photo (or gradient initials)
   - Name, designation, workplace
   - Practice areas with badges
   - Experience timeline
   - Achievements and certifications
   - Client reviews and ratings
   - Verification status
4. User can:
   - Book consultation (video/phone/in-person)
   - Send direct inquiry
   - Share profile (QR code, native share)
   - Bookmark profile

#### 4.3 Consultation Booking
**Endpoint**: `POST /advocate-api/api/v1/consultations/request`

**Flow**:
1. User clicks "Book Consultation" on profile
2. ConsultationModal opens with form:
   - Consultation type (video/phone/in-person)
   - Preferred date/time
   - Case description
   - Contact information
3. Frontend sends request to Advocate Profile service
4. Backend:
   - Validates input
   - Creates consultation record
   - Sends notification to advocate
   - Triggers email notification
5. Returns confirmation
6. User sees success message

#### 4.4 Advocate Registration & Onboarding
**Endpoints**:
- `POST /advocate-api/api/v1/auth/register` - Advocate registration
- `POST /advocate-api/api/v1/profiles/me/complete-onboarding` - Complete onboarding

**Flow**:
1. Advocate navigates to `/advocate/signup`
2. Creates account with email/password
3. Redirected to `/advocate/onboarding`
4. Multi-step onboarding collects:
   - Professional details (Bar Council number, specialization)
   - Practice areas
   - Experience and education
   - Profile photo upload
   - Verification documents
5. Upon completion:
   - Profile marked as pending verification
   - Admin notified for review
   - Advocate can access dashboard

#### 4.5 Advocate Dashboard
**Endpoints**:
- `GET /advocate-api/api/v1/profiles/me` - My profile
- `GET /advocate-api/api/v1/consultations` - My consultations
- `GET /advocate-api/api/v1/analytics/dashboard` - Analytics

**Flow**:
1. Advocate logs in via `/advocate/login`
2. Redirected to `/dashboard/advocate-profile`
3. Dashboard displays:
   - Profile completion status
   - Consultation requests
   - Profile views and engagement metrics
   - Messages from clients
   - Verification status
4. Advocate can:
   - Update profile information
   - Respond to consultation requests
   - Manage messages
   - View analytics
   - Submit verification documents

---

### 5. PDF Tools Workflow

#### 5.1 PDF Manipulation Operations
**Endpoints**:
- `POST /pdf/merge` - Merge multiple PDFs
- `POST /pdf/split` - Split PDF into pages
- `POST /pdf/compress` - Compress PDF size
- `POST /pdf/pdf-to-word` - Convert PDF to Word
- `POST /pdf/word-to-pdf` - Convert Word to PDF
- `POST /pdf/rotate` - Rotate PDF pages
- `POST /pdf/watermark` - Add watermark
- `POST /pdf/reorder` - Reorder pages
- `POST /pdf/add_page_numbers` - Add page numbers

**Flow**:
1. User navigates to `/dashboard/pdf-editor`
2. Uploads PDF file(s)
3. Selects operation from toolbar
4. Frontend sends file(s) to PDF Editor service
5. Backend processes PDF using PyPDF2/pdfkit
6. Returns processed file
7. Frontend triggers download

#### 5.2 PDF Preview
**Endpoint**: `POST /pdf/preview`

**Flow**:
1. User uploads PDF
2. Frontend sends to preview endpoint
3. Backend generates preview images
4. Frontend displays page thumbnails
5. User can select pages for operations

---

### 6. Case Search Workflow

#### 6.1 Legal Case Search
**Endpoint**: `GET /case_search/search`

**Flow**:
1. User navigates to `/dashboard/case-search`
2. Enters case name, citation, or keywords
3. Frontend sends query to Case Search service
4. Backend:
   - Searches legal database
   - Returns matching cases
   - Includes case summaries and citations
5. Results displayed with:
   - Case name and citation
   - Court and date
   - Summary
   - Link to full document

#### 6.2 Case Document Retrieval
**Endpoint**: `GET /case_search/doc/{doc_id}`

**Flow**:
1. User clicks on case result
2. Frontend requests full document
3. Backend retrieves and returns document
4. Frontend displays in readable format

---

### 7. Notification System Workflow

#### 7.1 Notification Creation
**Endpoint**: `POST /notification/notifications`

**Flow**:
1. System event triggers notification:
   - Consultation request received
   - Message received
   - Profile verification status change
   - Subscription renewal reminder
2. Backend creates notification record:
   ```json
   {
     "user_id": "user_123",
     "type": "consultation_request",
     "title": "New Consultation Request",
     "message": "You have a new consultation request from John Doe",
     "metadata": {"consultation_id": "123"}
   }
   ```
3. Notification stored in PostgreSQL

#### 7.2 Notification Retrieval
**Endpoints**:
- `GET /notification/notifications/{user_id}` - Get all notifications
- `GET /notification/notifications/{user_id}/count` - Get unread count

**Flow**:
1. Frontend polls for notifications periodically
2. Displays notification bell with unread count
3. Clicking bell opens notification panel
4. Notifications grouped by type and date

#### 7.3 Notification Actions
**Endpoints**:
- `PATCH /notification/notifications/{id}/read` - Mark as read
- `PATCH /notification/notifications/{user_id}/read-all` - Mark all as read
- `DELETE /notification/notifications/{id}` - Delete notification

**Flow**:
1. User clicks notification
2. Frontend marks as read
3. Navigates to relevant page
4. User can delete or mark all as read

---

### 8. Template Search & Download Workflow

#### 8.1 Template Search
**Endpoint**: `POST /query/search`

**Flow**:
1. User navigates to `/dashboard/tools` or uses template search
2. Enters keywords for legal template
3. Frontend sends query to Query service
4. Backend:
   - Searches template database
   - Uses semantic search with embeddings
   - Returns matching templates
5. Results displayed with:
   - Template name and description
   - Category
   - Preview
   - Download options

#### 8.2 Template Download
**Endpoints**:
- `POST /query/download-template` - Download as Word
- `POST /query/download-template-html` - Download as HTML

**Flow**:
1. User selects template
2. Chooses download format
3. Frontend sends request to Query service
4. Backend generates file with:
   - Template content
   - Placeholders for customization
5. Frontend triggers download
6. Template opens in Editor for customization

---

## Data Flow Architecture

### Request Flow
```
User Browser → React Frontend → Nginx Reverse Proxy → Specific Backend Service → PostgreSQL/Qdrant
```

### Response Flow
```
PostgreSQL/Qdrant → Backend Service → Nginx Reverse Proxy → React Frontend → User Browser
```

### Authentication Flow
```
User → Auth Service → JWT Token → Frontend (localStorage) → Subsequent Requests (Bearer Token)
```

---

## State Management

### Client-Side State
- **Session Data**: localStorage (`session_id`, `user_id`, `user_profile`)
- **Draft State**: React component state + localStorage persistence
- **Chat History**: Backend storage with frontend caching
- **Settings**: localStorage (`user_settings`)

### Server-Side State
- **User Sessions**: PostgreSQL sessions table
- **Drafts**: PostgreSQL drafts table
- **Conversation History**: PostgreSQL messages table
- **Vector Embeddings**: Qdrant collections
- **File Storage**: S3 (production) / local (development)

---

## Error Handling

### Frontend Error Handling
- Try-catch blocks around API calls
- Toast notifications for user feedback
- Fallback UI for loading states
- Graceful degradation for missing features

### Backend Error Handling
- HTTP status codes (400, 401, 403, 404, 500)
- Detailed error messages in development
- Generic error messages in production
- Logging for debugging
- Database transaction rollbacks on errors

---

## Security Measures

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Session expiration
- Token refresh mechanism

### Authorization
- Role-based access control (user, advocate, admin)
- Route protection with RequireAuth components
- API endpoint authorization checks

### Data Protection
- CORS configuration
- Rate limiting with Slowapi
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- File upload validation (size, type)

---

## Performance Optimization

### Frontend
- Code splitting with React Router
- Lazy loading of components
- Image optimization
- Debounced search inputs
- Caching with React Query

### Backend
- Database connection pooling
- Query optimization with indexes
- Vector search with Qdrant
- Async processing with workers
- Response caching where appropriate

---

## Deployment Architecture

### Development Environment
- Individual services run on separate ports
- Frontend: Vite dev server (port 5173)
- Backend services: Uvicorn servers
- Database: Local PostgreSQL
- No reverse proxy

### Production Environment
- Docker Compose orchestration
- Nginx reverse proxy (port 8080)
- All services behind single domain
- S3 for file storage
- Managed PostgreSQL (AWS RDS)
- Load balancing for scalability

---

## Monitoring & Logging

### Application Logging
- Structured logging with Python logging module
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging
- Error stack traces

### Performance Monitoring
- API response time tracking
- Database query performance
- User engagement analytics
- System resource monitoring

---

## Future Enhancements

### Planned Features
- Real-time collaboration on drafts
- Advanced document comparison
- Integration with court filing systems
- Mobile applications (iOS/Android)
- Advanced analytics dashboard
- Integration with legal research platforms
- Automated document assembly
- E-signature integration

### Scalability Improvements
- Microservices architecture refinement
- Event-driven architecture with message queues
- CDN for static assets
- Database sharding for large datasets
- Caching layer with Redis

---

## Troubleshooting Guide

### Common Issues

#### Frontend Issues
- **CORS errors**: Check Nginx configuration
- **Authentication failures**: Verify JWT_SECRET
- **State not persisting**: Check localStorage usage

#### Backend Issues
- **Service not responding**: Check port conflicts
- **Database connection failed**: Verify PostgreSQL credentials
- **Slow performance**: Check database indexes and query optimization

#### Integration Issues
- **Service communication failures**: Check Nginx routing
- **File upload failures**: Verify S3 configuration and permissions
- **Notification not sending**: Check SMTP configuration

---

## Conclusion

This end-to-end work process documentation covers all major workflows in the DraftMate platform, from user authentication to complex AI-powered legal drafting and research. The system is designed with scalability, security, and user experience as core principles, leveraging modern web technologies and best practices in legal-tech application development.
