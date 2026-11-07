import os
import praw
from google import genai
from google.genai import types
from schema import BatchExtraction
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 1. Initialize Reddit Client (PRAW)
# WARNING: Do NOT use a personal account for aggressive scraping. Create a dedicated bot account.
reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT", "PainPointExtractorBot/0.1")
)

# 2. Initialize Gemini Client (Using the official google-genai SDK)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def fetch_posts(subreddit_name: str, limit: int = 50):
    """Fetches a batch of posts from a specific subreddit."""
    print(f"[*] Fetching {limit} posts from r/{subreddit_name}...")
    subreddit = reddit.subreddit(subreddit_name)
    posts = []
    
    # We fetch 'hot' or 'top' to get high-engagement complaints
    for submission in subreddit.top(time_filter="month", limit=limit):
        if not submission.selftext: # Skip link-only posts
            continue
        posts.append({
            "id": submission.id,
            "title": submission.title,
            "text": submission.selftext[:1000] # Truncate massive rants to save tokens
        })
    return posts

def extract_pain_points(posts: list):
    """Feeds a batch of posts to Gemini 1.5 Flash to extract validated pain points using Structured Output."""
    
    # Format the batch into a single prompt payload
    payload = "Evaluate the following Reddit posts and extract ONLY genuine, monetizable pain points.\n\n"
    for p in posts:
        payload += f"--- POST ID: {p['id']} ---\nTITLE: {p['title']}\nBODY: {p['text']}\n\n"
        
    print(f"[*] Sending {len(posts)} posts to Gemini 1.5 Flash for extraction...")
    
    # Use Gemini 1.5 Flash for fast, cheap structured extraction
    response = client.models.generate_content(
        model='gemini-3.8-flash',
        contents=payload,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BatchExtraction,
            temperature=0.1, # Keep it deterministic and analytical
        ),
    )
    
    # The SDK automatically handles the JSON validation if we use structured outputs,
    # but we can parse the returned JSON string here.
    return response.text

if __name__ == "__main__":
    # Example Usage
    target_sub = "SaaS"
    raw_posts = fetch_posts(target_sub, limit=20)
    
    if raw_posts:
        result = extract_pain_points(raw_posts)
        print("\n--- EXTRACTION RESULTS ---")
        print(result)
    else:
        print("No text posts found.")
