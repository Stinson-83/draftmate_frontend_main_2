import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET") or "draftmate_jwt_production_signing_key_2026"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
