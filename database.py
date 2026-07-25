import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

database_url=os.getenv("DATABASE_URL","postgresql://postgres:postgres@localhost:5432/postgres")

# Render / Heroku hand out URLs starting with "postgres://", but SQLAlchemy needs "postgresql://".
if database_url.startswith("postgres://"):
    database_url=database_url.replace("postgres://","postgresql://",1)

engine=create_engine(database_url)
SessionLocal=sessionmaker(autocommit=False,autoflush=False,bind=engine)

base=declarative_base()

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()