import os
from sqlmodel import create_engine
from dotenv import load_dotenv

load_dotenv()
turso_url = os.getenv("TURSO_DATABASE_URL", "sqlite:///painpoints.db")
turso_token = os.getenv("TURSO_AUTH_TOKEN", "")

# Attempt to create an engine with libsql
try:
    if turso_token and "?" not in turso_url:
        db_url = f"{turso_url}/?authToken={turso_token}"
    else:
        db_url = turso_url
    engine = create_engine(db_url)
    print("Engine created successfully")
except Exception as e:
    print(f"Error: {e}")
