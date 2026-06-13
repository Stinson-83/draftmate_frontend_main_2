import os

file_path = r'd:\Projects\draftmate_frontend_main_2_avadh\backend\Advocate_Profile\main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update SELECT queries
old_select = "SELECT p.id, p.title as name, p.title, p.slug, p.years_experience, p.bio, \n                   p.consultation_fee, p.is_verified, p.profile_image_url, p.location, p.court_affiliation,"
new_select = "SELECT p.id, p.title as name, p.title, p.slug, p.years_experience, p.bio, \n                   p.consultation_fee, p.is_verified, p.profile_image_url, p.location, p.court_affiliation, p.created_at, p.bar_council_number, p.profile_completion_score, ('ADV-' || EXTRACT(YEAR FROM COALESCE(p.created_at, CURRENT_DATE)) || '-' || UPPER(SUBSTRING(p.id::text FROM 1 FOR 5))) AS advocate_id,"

content = content.replace(old_select, new_select)

# 2. Update search filters
old_search = """        if q:
            base_where += " AND (p.title ILIKE %s OR p.bio ILIKE %s)"
            search_term = f"%{q}%"
            params.extend([search_term, search_term])"""
            
new_search = """        if q:
            base_where += " AND (p.title ILIKE %s OR p.bio ILIKE %s OR p.bar_council_number ILIKE %s OR ('ADV-' || EXTRACT(YEAR FROM COALESCE(p.created_at, CURRENT_DATE)) || '-' || UPPER(SUBSTRING(p.id::text FROM 1 FOR 5))) ILIKE %s)"
            search_term = f"%{q}%"
            params.extend([search_term, search_term, search_term, search_term])"""

content = content.replace(old_search, new_search)

# 3. Add single profile GET advocate_id
old_single_query = """        cur.execute("SELECT * FROM advocate_profiles WHERE slug = %s", (slug,))"""
new_single_query = """        cur.execute("SELECT p.*, ('ADV-' || EXTRACT(YEAR FROM COALESCE(p.created_at, CURRENT_DATE)) || '-' || UPPER(SUBSTRING(p.id::text FROM 1 FOR 5))) AS advocate_id FROM advocate_profiles p WHERE slug = %s", (slug,))"""

content = content.replace(old_single_query, new_single_query)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
