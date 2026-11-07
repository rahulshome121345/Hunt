import subprocess
import sys
import logging
import argparse
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def run_script(script_path, keyword="", market="all", limit=30):
    logging.info(f"Starting {script_path}...")
    cmd = [sys.executable, script_path]
    if "01_ingest_agents.py" in script_path:
        if keyword:
            cmd.extend(["--keyword", keyword])
        if market:
            cmd.extend(["--market", market])
        if limit:
            cmd.extend(["--limit", str(limit)])

    # Force UTF-8 encoding for ALL subprocess calls to prevent Windows cp1252 UnicodeEncodeError
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"

    try:
        subprocess.run(cmd, check=True, env=env)
        logging.info(f"Successfully completed {script_path}.")
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running {script_path}. Exiting pipeline.")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keyword", type=str, default="", help="Target keyword prompt")
    parser.add_argument("--market", type=str, default="all", choices=["global", "india", "all"], help="Audience focus market")
    parser.add_argument("--limit", type=int, default=30, help="Scraping batch cap (20 to 50)")
    args = parser.parse_args()

    logging.info(f"Starting Startup Scraper Pro Engine (Keyword: '{args.keyword}', Market: '{args.market}', Cap: {args.limit})...")
    
    scripts = [
        "database/db.py",
        "pipeline/01_ingest_agents.py",
        "pipeline/02_ph_market_research.py",
        "pipeline/03_gemini_verdict.py",
        "sync_turso.py"
    ]
    
    for script in scripts:
        run_script(script, args.keyword, args.market, args.limit)
        
    logging.info("Background Engine completed all tasks successfully.")

if __name__ == "__main__":
    main()
