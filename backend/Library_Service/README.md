# DraftMate Library Service

The backend microservice for DraftMate's Library module, providing API endpoints for managing:
- Clients
- Cases
- Hearings
- Calendar Events
- Video Links
- Case Tracking (e-Courts integration)
- Notes
- Bookmarks


## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
Copy `.env.example` to `.env` and fill in your values:
```
POSTGRES_DSN=postgresql://user:password@localhost:5432/draftmate
SECRET_KEY=your-super-secret-key-here
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
S3_BUCKET=your-s3-bucket-name
```

3. Run the server:
```bash
python main.py
```

Or using Uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8010
```


## API Documentation

Swagger UI will be available at:
- http://localhost:8010/docs
- http://localhost:8010/redoc


## Current Features

- ✅ Full CRUD for Clients (Active)
- ✅ CRUD for Cases, Hearings, Calendar Events, Video Links, Notes, Bookmarks (Basic)
- ✅ JWT Authentication
- ✅ PostgreSQL with SQLAlchemy
- ✅ CORS and Security Headers
- ✅ Health Check Endpoint


## Future Work

- e-Courts integration
- S3 file storage for documents
- Notifications
- Reports and analytics
