import os
from sqlmodel import SQLModel, create_engine, Session

# Use a local SQLite database file in the project root
DATABASE_URL = "sqlite:///painpoints.db"

# Create the SQLAlchemy engine
# connect_args={"check_same_thread": False} is needed for SQLite
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """Creates the database and all tables if they don't exist."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yields a database session."""
    with Session(engine) as session:
        yield session

if __name__ == "__main__":
    # Test script to initialize the DB
    print(f"Creating database at {DATABASE_URL}...")
    # Import models here so they are registered with SQLModel.metadata
    from models import RawPost, ValidatedPainPoint, BusinessOpportunity
    create_db_and_tables()
    print("Database and tables created successfully.")
