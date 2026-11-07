import sys
sys.path.append('.')
from database.db import engine
from sqlmodel import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE validatedpainpoint ADD COLUMN source_tag TEXT DEFAULT 'Global'"))
        conn.commit()
        print("Added source_tag column.")
    except Exception as e:
        print(f"source_tag: {e}")
    
    try:
        conn.execute(text("ALTER TABLE validatedpainpoint ADD COLUMN source_name TEXT DEFAULT 'Global / Multi-Source'"))
        conn.commit()
        print("Added source_name column.")
    except Exception as e:
        print(f"source_name: {e}")
