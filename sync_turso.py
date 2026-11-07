import os
import sqlite3
import asyncio
import libsql_client
from dotenv import load_dotenv

async def sync():
    load_dotenv()
    turso_url = os.getenv("TURSO_DATABASE_URL")
    turso_token = os.getenv("TURSO_AUTH_TOKEN")
    
    if turso_url:
        turso_url = turso_url.replace("libsql://", "https://").replace("wss://", "https://")

    if not turso_url or not turso_token:
        print("Turso credentials missing. Skipping sync.")
        return
        
    print(f"Connecting to Turso via HTTP...")
    try:
        client = libsql_client.create_client(url=turso_url, auth_token=turso_token)
    except Exception as e:
        print(f"Failed to create Turso client: {e}")
        return
    
    print("Reading local database...")
    local_db = sqlite3.connect("painpoints.db")
    local_db.row_factory = sqlite3.Row
    cursor = local_db.cursor()
    
    # Get all tables
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"Found {len(tables)} tables to sync.")
    
    # Tables must be created and inserted in order of foreign key dependencies!
    ordered_tables = [
        "rawpost",
        "validatedpainpoint",
        "marketvalidation",
        "businessopportunity",
        "brainstormmessage"
    ]
    
    # Create tables in Turso in the correct order
    for table_name in ordered_tables:
        cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        row = cursor.fetchone()
        if not row:
            continue
            
        table_sql = row['sql']
        # Modify CREATE TABLE to include IF NOT EXISTS to prevent Turso errors
        table_sql = table_sql.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
        try:
            await client.execute(table_sql)
        except Exception:
            pass # Table already exists, silent continue
            
    # Copy data for each table in the correct order
    for table_name in ordered_tables:
            
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        if not rows:
            continue
            
        print(f"Syncing {len(rows)} rows for table {table_name}...")
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        cols = [c[1] for c in cursor.fetchall()]
        
        placeholders = ", ".join(["?" for _ in cols])
        col_names = ", ".join(cols)
        
        insert_sql = f"INSERT OR REPLACE INTO {table_name} ({col_names}) VALUES ({placeholders})"
        
        batch_statements = []
        for row in rows:
            # Convert row to list of values
            val_list = []
            for col in cols:
                val_list.append(row[col])
            batch_statements.append(libsql_client.Statement(insert_sql, val_list))
                
        try:
            await client.batch(batch_statements)
            print(f"Successfully batch inserted {len(rows)} rows into {table_name}")
        except Exception as e:
            print(f"Error batch inserting into {table_name}: {e}")
            
    await client.close()
    local_db.close()
    print("Turso Sync 100% Complete!")

if __name__ == "__main__":
    asyncio.run(sync())
