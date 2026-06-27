# Draftmate - Premium Legal-Tech Marketplace

Draftmate is a modern, venture-grade SaaS marketplace connecting clients with top-tier legal professionals. Designed to feel like "LinkedIn for Lawyers" combined with the frictionless booking experience of modern health-tech platforms, Draftmate offers an elegant discovery experience and high-conversion advocate portfolios.

---

## 🌟 Key Features

* **Premium Advocate Discovery**: An expansive marketplace allowing clients to search, filter, and discover advocates by practice area, location, and verified status.
* **Executive Advocate Portfolios**: Dynamic, beautifully designed profile pages for each advocate, featuring experience timelines, achievement highlights, and practice area badges.
* **Frictionless Consultations**: Built-in modals for booking video, phone, or in-person consultations, sending direct inquiries, and sharing profiles via native APIs and QR codes.
* **Dynamic Avatar System**: Graceful fallback UI that generates elegant, deterministic gradient initials for advocates missing profile photos.
* **Premium UX/UI**: Silky smooth micro-interactions powered by Framer Motion, strict mobile-first responsive design, and sophisticated typographic hierarchy.

---

## 🛠️ Technology Stack

**Frontend:**
* **Framework:** React 19 + Vite
* **Routing:** React Router v7
* **Styling:** Vanilla CSS / Utility Classes + Lucide React (Icons)
* **Animations:** Framer Motion
* **State & Data Fetching:** TanStack React Query

**Backend:**
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL
* **Security:** JWT Authentication, CORS Middleware, Slowapi (Rate Limiting)
* **Database Driver:** Psycopg2

---

## 🚀 Getting Started

Follow these steps to run the complete Draftmate ecosystem locally.

### 1. Environment Configuration

Create a `.env` file in the root directory of the project:

```env
# Database Credentials
POSTGRES_HOST=localhost
POSTGRES_DB=draftmate
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
POSTGRES_DSN=postgresql://postgres:your_password@localhost:5432/draftmate

# Frontend API Target
VITE_API_BASE_URL=http://localhost:8005
```

### 2. Database Initialization

1. Ensure PostgreSQL (v15+) is running locally.
2. Create the database: `CREATE DATABASE draftmate;`
3. Import the production schema: 
   ```bash
   psql -U postgres -d draftmate -f backend/login_db/production_schema.sql
   ```
4. Run the database fix script to ensure core tables are present:
   ```bash
   python backend/fix_db.py
   ```
5. Seed the marketplace with premium dummy advocates:
   ```bash
   python backend/seed_ecosystem.py
   ```

### 3. Start the Backend (FastAPI)

```bash
cd backend/Advocate_Profile
python -m uvicorn main:app --reload --port 8005
```
*The backend API will be available at `http://localhost:8005`.*

### 4. Start the Frontend (React + Vite)

```bash
# Return to the project root
npm install
npm run dev
```
*The marketplace will be available at `http://localhost:5173/advocates`.*

---

## 📱 Project Structure Highlights

- `src/pages/AdvocateDiscovery.jsx` - The main marketplace landing page featuring advanced filtering, carousels, and search.
- `src/pages/AdvocateProfile.jsx` - The premium portfolio view for individual advocates.
- `src/components/Advocate/AdvocateCard.jsx` - The highly interactive card component used across the marketplace.
- `src/components/Advocate/ConsultationModal.jsx` - The lead-capture / booking form flow.
- `backend/Advocate_Profile/main.py` - Core FastAPI routing, including CORS and rate limiting.

---

## 🛡️ License

Draftmate Proprietary Codebase. All rights reserved.
