import os
import uuid
import random
import psycopg2
from psycopg2.extras import Json
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Setup
salt = bcrypt.gensalt()
hashed_pwd = bcrypt.hashpw(b"password123", salt).decode('utf-8')

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
if POSTGRES_DSN:
    conn = psycopg2.connect(POSTGRES_DSN)
else:
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "draftmate"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        port=os.getenv("POSTGRES_PORT", "5432")
    )
cur = conn.cursor()

# Clear existing dummy data (optional, but good for idempotency)
# We will just append if we don't want to break existing accounts.
# Let's clear users that look like our dummy data email format
cur.execute("DELETE FROM users WHERE email LIKE '%@draftmate-dummy.com'")
conn.commit()

# The 10 Dummy Advocates
advocates_data = [
    {
        "name": "Rajesh Kumar",
        "first_name": "Rajesh",
        "last_name": "Kumar",
        "email": "rajesh@draftmate-dummy.com",
        "practice_areas": ["Criminal Law", "Litigation", "Bail Matters"],
        "location": "New Delhi, Delhi",
        "experience": 15,
        "fee": 3000,
        "is_verified": True,
        "bio": "Senior criminal defense attorney with over 15 years of experience in high-profile litigation at the Delhi High Court. Specialized in white-collar crime and complex bail matters.",
        "languages": ["English", "Hindi", "Punjabi"],
        "views": random.randint(500, 2000),
        "created_days_ago": 120,
        "profile_image": "https://i.pravatar.cc/300?img=11"
    },
    {
        "name": "Priya Sharma",
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya@draftmate-dummy.com",
        "practice_areas": ["Corporate Law", "Mergers & Acquisitions", "Contracts"],
        "location": "Mumbai, Maharashtra",
        "experience": 8,
        "fee": 5000,
        "is_verified": True,
        "bio": "Former partner at a Tier-1 law firm, now advising startups and enterprises on compliance, fundraising, and complex commercial contracts. Known for rapid turnarounds and business-centric legal strategies.",
        "languages": ["English", "Hindi", "Marathi"],
        "views": random.randint(800, 3000),
        "created_days_ago": 60,
        "profile_image": "https://i.pravatar.cc/300?img=5"
    },
    {
        "name": "Arjun Patel",
        "first_name": "Arjun",
        "last_name": "Patel",
        "email": "arjun@draftmate-dummy.com",
        "practice_areas": ["Cyber Law", "Data Privacy", "Technology"],
        "location": "Ahmedabad, Gujarat",
        "experience": 6,
        "fee": 2500,
        "is_verified": False,
        "bio": "Tech-savvy lawyer focusing on data privacy regulations (DPDP Act), cybersecurity incidents, and software licensing agreements. Frequently consults for IT firms and SaaS startups.",
        "languages": ["English", "Gujarati", "Hindi"],
        "views": random.randint(100, 500),
        "created_days_ago": 10,
        "profile_image": "https://i.pravatar.cc/300?img=12"
    },
    {
        "name": "Neha Verma",
        "first_name": "Neha",
        "last_name": "Verma",
        "email": "neha@draftmate-dummy.com",
        "practice_areas": ["Family Law", "Divorce", "Child Custody"],
        "location": "Bangalore, Karnataka",
        "experience": 12,
        "fee": 2000,
        "is_verified": True,
        "bio": "Compassionate family law practitioner dedicated to amicable dispute resolution, mediation, and protecting the rights of clients in complex divorce and custody battles.",
        "languages": ["English", "Kannada", "Hindi"],
        "views": random.randint(300, 1500),
        "created_days_ago": 200,
        "profile_image": "https://i.pravatar.cc/300?img=9"
    },
    {
        "name": "Vikram Singh",
        "first_name": "Vikram",
        "last_name": "Singh",
        "email": "vikram@draftmate-dummy.com",
        "practice_areas": ["Constitutional Law", "Civil Litigation", "Appeals"],
        "location": "New Delhi, Delhi",
        "experience": 25,
        "fee": 15000,
        "is_verified": True,
        "bio": "Designated Senior Advocate practicing primarily at the Supreme Court of India. Takes up selective high-stakes constitutional and civil appellate matters.",
        "languages": ["English", "Hindi"],
        "views": random.randint(1000, 5000),
        "created_days_ago": 300,
        "profile_image": "https://i.pravatar.cc/300?img=33"
    },
    {
        "name": "Meera Joshi",
        "first_name": "Meera",
        "last_name": "Joshi",
        "email": "meera@draftmate-dummy.com",
        "practice_areas": ["Property Law", "Real Estate", "Tenant Disputes"],
        "location": "Pune, Maharashtra",
        "experience": 10,
        "fee": 1500,
        "is_verified": False,
        "bio": "Specializes in property title verifications, RERA disputes, and landlord-tenant litigation. Detailed-oriented approach to safeguarding real estate investments.",
        "languages": ["English", "Marathi"],
        "views": random.randint(50, 300),
        "created_days_ago": 2,
        "profile_image": "https://i.pravatar.cc/300?img=20"
    },
    {
        "name": "Karan Malhotra",
        "first_name": "Karan",
        "last_name": "Malhotra",
        "email": "karan@draftmate-dummy.com",
        "practice_areas": ["Tax Law", "GST", "Customs"],
        "location": "Gurgaon, Haryana",
        "experience": 18,
        "fee": 6000,
        "is_verified": True,
        "bio": "Expert in direct and indirect taxation. Represents multinational corporations before tribunals and high courts for complex tax restructuring and dispute resolution.",
        "languages": ["English", "Hindi"],
        "views": random.randint(400, 1200),
        "created_days_ago": 45,
        "profile_image": "https://i.pravatar.cc/300?img=59"
    },
    {
        "name": "Ayesha Khan",
        "first_name": "Ayesha",
        "last_name": "Khan",
        "email": "ayesha@draftmate-dummy.com",
        "practice_areas": ["Immigration Law", "Visas", "Citizenship"],
        "location": "Hyderabad, Telangana",
        "email": "ayesha@draftmate-dummy.com",
        "experience": 7,
        "fee": 3500,
        "is_verified": True,
        "bio": "Advises individuals and businesses on global mobility, employment visas, and permanent residency programs across the US, UK, and Canada.",
        "languages": ["English", "Urdu", "Telugu"],
        "views": random.randint(600, 1800),
        "created_days_ago": 180,
        "profile_image": "https://i.pravatar.cc/300?img=42"
    },
    {
        "name": "Rohit Desai",
        "first_name": "Rohit",
        "last_name": "Desai",
        "email": "rohit@draftmate-dummy.com",
        "practice_areas": ["Startup Law", "Intellectual Property", "Business Law"],
        "location": "Surat, Gujarat",
        "experience": 5,
        "fee": 2000,
        "is_verified": False,
        "bio": "Passionate about helping early-stage founders. Handles everything from incorporation and founder agreements to trademark filings and seed funding rounds.",
        "languages": ["English", "Gujarati"],
        "views": random.randint(200, 800),
        "created_days_ago": 5,
        "profile_image": "https://i.pravatar.cc/300?img=60"
    },
    {
        "name": "Anjali Mehta",
        "first_name": "Anjali",
        "last_name": "Mehta",
        "email": "anjali@draftmate-dummy.com",
        "practice_areas": ["Consumer Rights", "Medical Negligence"],
        "location": "Jaipur, Rajasthan",
        "experience": 9,
        "fee": 1800,
        "is_verified": True,
        "bio": "A fierce advocate for consumer protection. Frequently appears before state and national consumer disputes redressal commissions fighting against corporate malpractices.",
        "languages": ["English", "Hindi"],
        "views": random.randint(300, 900),
        "created_days_ago": 90,
        "profile_image": "https://i.pravatar.cc/300?img=47"
    }
]

print("Seeding dummy advocates ecosystem...")

for adv in advocates_data:
    user_id = str(uuid.uuid4())
    slug = f"{adv['first_name'].lower()}-{adv['last_name'].lower()}-{str(uuid.uuid4())[:6]}"
    
    # 1. Create dedicated User per advocate (no shared user_id)
    cur.execute("""
        INSERT INTO users (id, email, password_hash, full_name, user_type)
        VALUES (%s, %s, %s, %s, 'ADVOCATE')
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id
    """, (user_id, adv['email'], hashed_pwd, adv['name']))
    
    # Calculate created_at to simulate older accounts
    created_at = datetime.utcnow() - timedelta(days=adv['created_days_ago'])
    
    # 2. Create Profile
    fake_bcn = f"D/{random.randint(1000, 9999)}/{random.randint(2000, 2023)}"
    cur.execute("""
        INSERT INTO advocate_profiles (
            user_id, slug, title, bio, years_experience, 
            consultation_fee, location, is_verified, is_public,
            profile_image_url, bar_council_number, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s, %s, %s)
        RETURNING id
    """, (
        user_id, slug, adv['name'], adv['bio'], adv['experience'],
        adv['fee'], adv['location'], adv['is_verified'], adv['profile_image'],
        fake_bcn, created_at, created_at
    ))
    
    advocate_id = cur.fetchone()[0]
    print(f"  → user_id: {user_id} | advocate_id: {advocate_id}")
    
    # 3. Add Practice Areas (mocked by adding to DB if normalized, or handled via array if we had one)
    # Since we use advocate_practice_areas table:
    for pa in adv['practice_areas']:
        # Ensure practice area exists
        cur.execute("SELECT id FROM practice_areas WHERE name = %s", (pa,))
        res = cur.fetchone()
        if res:
            pa_id = res[0]
        else:
            cur.execute("INSERT INTO practice_areas (name) VALUES (%s) RETURNING id", (pa,))
            pa_id = cur.fetchone()[0]
            
        cur.execute("""
            INSERT INTO advocate_practice_areas (advocate_id, practice_area_id)
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        """, (advocate_id, pa_id))
        
    # 4. Generate fake profile views for analytics to power the Trending section
    for _ in range(adv['views'] // 10): # scale down inserts for speed but keep relational integrity
        # insert batches
        cur.execute("INSERT INTO profile_views (advocate_id, source) VALUES (%s, 'seed')", (advocate_id,))
        
    print(f"Created {adv['name']} ({'Verified' if adv['is_verified'] else 'Unverified'})")

conn.commit()
conn.close()
print("Ecosystem seeding complete!")
