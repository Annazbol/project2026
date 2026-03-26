from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

DATABASE_URL = "postgresql+psycopg2://postgres:1234@localhost:5432/db"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

def create_tables():
    Base.metadata.create_all(engine)

if __name__ == "__main__":
    create_tables()
    print("Таблицы созданы")