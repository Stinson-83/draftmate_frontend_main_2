import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    POSTGRES_DSN = os.getenv("POSTGRES_DSN")
    if POSTGRES_DSN:
        return psycopg2.connect(POSTGRES_DSN, cursor_factory=RealDictCursor)
    else:
        return psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            dbname=os.getenv("POSTGRES_DB", "draftmate"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", "password"),
            port=os.getenv("POSTGRES_PORT", "5432"),
            cursor_factory=RealDictCursor
        )

dummy_profiles = [
    {
        "slug": "rajesh-kumar",
        "title": "Rajesh Kumar",
        "bar_council_number": "D/123/2010",
        "years_experience": 15,
        "bio": "Senior Criminal Defense Lawyer with over 15 years of experience in the High Court of Delhi. Specializes in white-collar crimes, bail matters, and complex trial litigation.",
        "consultation_fee": 5000.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=11",
        "banner_image_url": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1200",
        "location": "New Delhi, Delhi",
        "court_affiliation": "High Court of Delhi",
        "profile_completion_score": 95,
        "is_verified": True,
        "is_public": True,
        "experience": [
            {"company": "Kumar & Associates", "role": "Senior Partner", "start_date": "2015-01-01", "is_current": True, "description": "Leading the criminal defense litigation team."}
        ],
        "education": [
            {"institution": "National Law University, Delhi", "degree": "LL.B.", "start_year": 2005, "end_year": 2010}
        ]
    },
    {
        "slug": "priya-sharma",
        "title": "Priya Sharma",
        "bar_council_number": "MH/456/2014",
        "years_experience": 10,
        "bio": "Corporate Lawyer advising startups and fortune 500s on M&A, VC funding, and compliance. Recognized by Legal500 as a rising star in corporate law.",
        "consultation_fee": 8000.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=5",
        "banner_image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        "location": "Mumbai, Maharashtra",
        "court_affiliation": "Bombay High Court",
        "profile_completion_score": 100,
        "is_verified": True,
        "is_public": True,
        "experience": [
            {"company": "AZB & Partners", "role": "Senior Associate", "start_date": "2016-06-01", "is_current": True, "description": "Corporate restructuring and M&A deals."}
        ],
        "education": [
            {"institution": "NLSIU, Bangalore", "degree": "B.A. LL.B.", "start_year": 2009, "end_year": 2014}
        ]
    },
    {
        "slug": "arjun-patel",
        "title": "Arjun Patel",
        "bar_council_number": "GJ/789/2018",
        "years_experience": 6,
        "bio": "Cyber Law Specialist focusing on data privacy, tech contracts, and digital rights. Certified Ethical Hacker and regular speaker at tech-law conferences.",
        "consultation_fee": 3000.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=12",
        "banner_image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200",
        "location": "Ahmedabad, Gujarat",
        "court_affiliation": "Gujarat High Court",
        "profile_completion_score": 85,
        "is_verified": True,
        "is_public": True,
        "experience": [
            {"company": "TechLaw Partners", "role": "Associate", "start_date": "2019-01-01", "is_current": True, "description": "Advising IT firms on GDPR and DPDP Act compliance."}
        ],
        "education": [
            {"institution": "GNLU", "degree": "LL.M. in Cyber Law", "start_year": 2017, "end_year": 2018}
        ]
    },
    {
        "slug": "neha-verma",
        "title": "Neha Verma",
        "bar_council_number": "UP/321/2005",
        "years_experience": 19,
        "bio": "Family Court Advocate with a compassionate approach to divorce, child custody, and alimony matters. Dedicated to out-of-court settlements and mediation.",
        "consultation_fee": 2500.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=20",
        "banner_image_url": "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1200",
        "location": "Lucknow, UP",
        "court_affiliation": "Family Court, Lucknow",
        "profile_completion_score": 75,
        "is_verified": False,
        "is_public": True,
        "experience": [
            {"company": "Verma Legal Clinic", "role": "Founder", "start_date": "2010-01-01", "is_current": True, "description": "Family law and mediation."}
        ],
        "education": [
            {"institution": "Lucknow University", "degree": "LL.B.", "start_year": 2002, "end_year": 2005}
        ]
    },
    {
        "slug": "vikram-singh",
        "title": "Vikram Singh",
        "bar_council_number": "D/999/1995",
        "years_experience": 30,
        "bio": "Senior Advocate, Supreme Court of India. Constitutional law expert with numerous landmark judgments reported in SCC.",
        "consultation_fee": 25000.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=33",
        "banner_image_url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1200",
        "location": "New Delhi, Delhi",
        "court_affiliation": "Supreme Court of India",
        "profile_completion_score": 90,
        "is_verified": True,
        "is_public": True,
        "experience": [
            {"company": "Chambers of Vikram Singh", "role": "Senior Advocate", "start_date": "2008-01-01", "is_current": True, "description": "Appellate litigation and constitutional matters."}
        ],
        "education": [
            {"institution": "Campus Law Centre, DU", "degree": "LL.B.", "start_year": 1992, "end_year": 1995}
        ]
    },
    {
        "slug": "aditi-mehra",
        "title": "Aditi Mehra",
        "bar_council_number": "KA/555/2016",
        "years_experience": 8,
        "bio": "Intellectual Property Lawyer managing trademark and patent portfolios for creative agencies and tech innovators in Bangalore.",
        "consultation_fee": 4000.00,
        "profile_image_url": "https://i.pravatar.cc/300?img=47",
        "banner_image_url": "https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?auto=format&fit=crop&q=80&w=1200",
        "location": "Bangalore, Karnataka",
        "court_affiliation": "Karnataka High Court",
        "profile_completion_score": 98,
        "is_verified": True,
        "is_public": True,
        "experience": [
            {"company": "IP Boutique", "role": "Managing Partner", "start_date": "2020-01-01", "is_current": True, "description": "IP prosecution and litigation."}
        ],
        "education": [
            {"institution": "NLSIU, Bangalore", "degree": "B.A. LL.B.", "start_year": 2011, "end_year": 2016}
        ]
    }
]

def seed_database():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        for p in dummy_profiles:
            # Create unique user for each advocate
            email = f"{p['slug'].replace('-', '.')}@example.com"
            cur.execute("""
                INSERT INTO users (id, email, full_name, user_type)
                VALUES (gen_random_uuid(), %s, %s, 'ADVOCATE')
                ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING id
            """, (email, p['title']))
            user_res = cur.fetchone()
            user_id = user_res['id']
            
            print(f"Using user_id: {user_id} for {p['title']}")
            
            # Upsert Advocate
            cur.execute("""
                INSERT INTO advocate_profiles (user_id, slug, title, bar_council_number, years_experience, bio, consultation_fee, profile_image_url, banner_image_url, location, court_affiliation, profile_completion_score, is_verified, is_public)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET 
                    user_id = EXCLUDED.user_id,
                    title = EXCLUDED.title, 
                    bio = EXCLUDED.bio, 
                    consultation_fee = EXCLUDED.consultation_fee,
                    profile_image_url = EXCLUDED.profile_image_url,
                    banner_image_url = EXCLUDED.banner_image_url,
                    location = EXCLUDED.location
                RETURNING id
            """, (user_id, p['slug'], p['title'], p['bar_council_number'], p['years_experience'], p['bio'], p['consultation_fee'], p['profile_image_url'], p['banner_image_url'], p['location'], p['court_affiliation'], p['profile_completion_score'], p['is_verified'], p['is_public']))
            
            advocate_id = cur.fetchone()['id']
            print(f"Seeded: {p['title']} ({advocate_id})")
            
            # Insert Experience
            cur.execute("DELETE FROM advocate_experience WHERE advocate_id = %s", (advocate_id,))
            for exp in p.get('experience', []):
                cur.execute("""
                    INSERT INTO advocate_experience (advocate_id, company, role, start_date, is_current, description)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (advocate_id, exp['company'], exp['role'], exp['start_date'], exp['is_current'], exp['description']))
                
            # Insert Education
            cur.execute("DELETE FROM advocate_education WHERE advocate_id = %s", (advocate_id,))
            for edu in p.get('education', []):
                cur.execute("""
                    INSERT INTO advocate_education (advocate_id, institution, degree, start_year, end_year)
                    VALUES (%s, %s, %s, %s, %s)
                """, (advocate_id, edu['institution'], edu['degree'], edu['start_year'], edu['end_year']))

        conn.commit()
        print("✅ Seeding completed successfully.")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_database()
