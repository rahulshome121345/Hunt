import os
import sys
import praw
from datetime import datetime
from dotenv import load_dotenv

# Add the project root to sys.path so we can import from database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_session
from database.models import RawPost
from sqlmodel import select

load_dotenv()

# Initialize Reddit Client
reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT", "PainPointExtractorBot/0.1")
)

def ingest_from_reddit(subreddit_name: str, limit: int = 100):
    """Fetches posts from Reddit and saves them to the raw database."""
    print(f"[*] Ingesting top {limit} posts from r/{subreddit_name} this month...")
    subreddit = reddit.subreddit(subreddit_name)
    
    session = next(get_session())
    new_posts_count = 0
    
    try:
        for submission in subreddit.top(time_filter="month", limit=limit):
            if not submission.selftext: # Skip link-only posts
                continue
                
            # Check if we already have this post
            existing = session.exec(select(RawPost).where(RawPost.source_id == submission.id)).first()
            if existing:
                continue
                
            # Truncate body if it's absurdly long (e.g., > 10000 chars) to save DB space/tokens
            body_text = submission.selftext[:10000]
            
            # Simple pre-filter: Drop very short posts (likely useless)
            if len(body_text) < 50:
                continue
                
            raw_post = RawPost(
                platform="reddit",
                source_id=submission.id,
                subreddit_or_category=subreddit_name,
                title=submission.title,
                body=body_text,
                author=str(submission.author) if submission.author else "deleted",
                upvotes=submission.score,
                created_utc=submission.created_utc
            )
            session.add(raw_post)
            new_posts_count += 1
            
        session.commit()
        print(f"[+] Successfully ingested {new_posts_count} new posts into the database.")
        
    except Exception as e:
        print(f"[-] Error during ingestion: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    target_subs = ["SaaS", "macapps", "Shopify"]
    for sub in target_subs:
        ingest_from_reddit(sub, limit=50)
