import os
import sys
import requests
import time
from datetime import datetime
from sqlmodel import select

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_session
from database.models import RawPost

def ingest_from_reddit_without_api(subreddit_name: str, limit: int = 100):
    """
    Fetches posts from Reddit by using the public .json endpoint.
    Bypasses the need for PRAW and Reddit Developer API Keys.
    """
    print(f"[*] Fetching top posts from r/{subreddit_name} without API keys...")
    
    # Reddit blocks default Python user-agents. We must disguise it as a normal browser.
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    url = f"https://www.reddit.com/r/{subreddit_name}/top.json?t=month&limit={limit}"
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 429:
            print("[-] Reddit rate-limited us. We need to wait.")
            return
        elif response.status_code != 200:
            print(f"[-] Failed to fetch: HTTP {response.status_code}")
            return
            
        data = response.json()
        posts = data.get('data', {}).get('children', [])
        
        session = next(get_session())
        new_posts_count = 0
        
        for post in posts:
            post_data = post['data']
            post_id = post_data.get('id')
            
            # Skip if we already have it
            existing = session.exec(select(RawPost).where(RawPost.source_id == post_id)).first()
            if existing:
                continue
                
            body_text = post_data.get('selftext', '')
            if not body_text or len(body_text) < 50:
                continue # Skip link-only or very short posts
                
            raw_post = RawPost(
                platform="reddit_public",
                source_id=post_id,
                subreddit_or_category=subreddit_name,
                title=post_data.get('title', ''),
                body=body_text[:10000],
                author=post_data.get('author', 'unknown'),
                upvotes=post_data.get('score', 0),
                created_utc=post_data.get('created_utc', 0.0)
            )
            
            session.add(raw_post)
            new_posts_count += 1
            
        session.commit()
        print(f"[+] Successfully ingested {new_posts_count} new posts from r/{subreddit_name}.")
        
    except Exception as e:
        print(f"[-] Error during ingestion: {e}")
        session.rollback()
    finally:
        if session:
            session.close()

if __name__ == "__main__":
    # You can change these to any subreddits you want
    target_subs = ["developersIndia", "StartUpIndia", "SaaS"]
    for sub in target_subs:
        ingest_from_reddit_without_api(sub, limit=50)
        time.sleep(2) # Sleep for 2 seconds between requests so Reddit doesn't block us
