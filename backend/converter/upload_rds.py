from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

load_dotenv()
endpoint="user-end-db-nn.cklim28o48mo.us-east-1.rds.amazonaws.com"
db_name="user-end-db-nn"


Database_url= f"postgresql+psycopg2://postgres:{os.getenv("PSQL_PASSWD")}@{endpoint}:5432/{db_name}"

engine= create_engine(Database_url)
SessionLocal=sessionmaker(bind=engine, autoflush=False)
Base= declarative_base()
