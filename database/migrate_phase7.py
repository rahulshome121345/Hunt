import sqlite3
import os
import sys

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "painpoints.db")

def migrate():
    print(f"Migrating database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Add is_saved to marketvalidation
        cursor.execute("ALTER TABLE marketvalidation ADD COLUMN is_saved BOOLEAN DEFAULT 0")
        print("Added is_saved column to marketvalidation.")
    except sqlite3.OperationalError as e:
        print(f"Skipping marketvalidation alter: {e}")
        
    try:
        # Create brainstormmessage table
        cursor.execute("""
        CREATE TABLE brainstormmessage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market_validation_id INTEGER NOT NULL,
            role VARCHAR NOT NULL,
            content VARCHAR NOT NULL,
            created_at DATETIME NOT NULL,
            FOREIGN KEY(market_validation_id) REFERENCES marketvalidation(id)
        )
        """)
        cursor.execute("CREATE INDEX ix_brainstormmessage_market_validation_id ON brainstormmessage (market_validation_id)")
        print("Created brainstormmessage table.")
    except sqlite3.OperationalError as e:
        print(f"Skipping brainstormmessage creation: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
