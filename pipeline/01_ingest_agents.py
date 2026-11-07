import os
import sys
import json
import argparse
import urllib.parse
import requests
from google import genai
from google.genai import types
from sqlmodel import select

# Fix Windows cp1252 UnicodeEncodeError for emoji/unicode in print statements
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_session, engine, SQLModel
from database.models import RawPost, ValidatedPainPoint
from schemas.llm_schemas import BatchExtraction
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StartupScraperPro/3.0"}

# --- SCRAPER MODULES ---

def fetch_reddit_posts(subreddit: str, limit: int = 15):
    """Fetches top posts from a specific subreddit."""
    print(f"[*] Fetching top {limit} posts from r/{subreddit}...")
    url = f"https://www.reddit.com/r/{subreddit}/top.json?t=month&limit={limit}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return []
            
        data = response.json()
        posts = []
        for child in data.get("data", {}).get("children", []):
            post = child.get("data", {})
            title = post.get("title", "")
            selftext = post.get("selftext", "")
            if len(title) > 10:
                posts.append({
                    "source": f"Reddit (r/{subreddit})",
                    "source_tag": "Reddit",
                    "id": post.get("id"),
                    "title": title,
                    "text": selftext[:500]
                })
        return posts
    except Exception as e:
        print(f"[-] Reddit r/{subreddit} error: {e}")
        return []

def fetch_targeted_reddit_posts(keyword: str, limit: int = 20, is_india: bool = False):
    """Fetches Reddit posts matching keyword."""
    encoded_keyword = urllib.parse.quote(keyword if keyword else ("startup pain points" if not is_india else "India startup pain points"))
    sub_filter = "subreddit:IndianStartups OR subreddit:DeveloperIndia OR subreddit:Bangalore OR subreddit:india" if is_india else ""
    q = f"{encoded_keyword} {sub_filter}".strip()
    
    print(f"[*] Searching Reddit ({'India' if is_india else 'Global'}) for: '{q}'...")
    url = f"https://www.reddit.com/search.json?q={urllib.parse.quote(q)}&sort=relevance&limit={limit}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return []
            
        data = response.json()
        posts = []
        for child in data.get("data", {}).get("children", []):
            post = child.get("data", {})
            title = post.get("title", "")
            selftext = post.get("selftext", "")
            sub = post.get("subreddit", "Reddit")
            if len(title) > 8:
                posts.append({
                    "source": f"Reddit (r/{sub})",
                    "source_tag": "Reddit",
                    "id": post.get("id"),
                    "title": title,
                    "text": selftext[:500]
                })
        return posts
    except Exception as e:
        print(f"[-] Reddit search error: {e}")
        return []

def fetch_targeted_hn_posts(keyword: str, limit: int = 20):
    """Fetches Hacker News posts using Algolia Search API."""
    query = keyword if keyword else "startup pain point software"
    print(f"[*] Searching Hacker News Algolia API for: '{query}'...")
    url = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(query)}&tags=story&hitsPerPage={limit}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return []
            
        data = response.json()
        posts = []
        for hit in data.get("hits", []):
            title = hit.get("title", "")
            story_text = hit.get("story_text", "") or hit.get("url", "")
            if title:
                posts.append({
                    "source": "Hacker News",
                    "source_tag": "HackerNews",
                    "id": str(hit.get("objectID")),
                    "title": title,
                    "text": story_text[:500]
                })
        return posts
    except Exception as e:
        print(f"[-] Hacker News search error: {e}")
        return []

def fetch_yc_rfs_posts(keyword: str, limit: int = 15):
    """Fetches Y Combinator Request for Startups topics."""
    print(f"[*] Ingesting Y Combinator Request for Startups (YC RFS) for '{keyword or 'Global'}'...")
    
    yc_rfs_data = [
      {
        "id": "yc-rfs-01",
        "title": "AI Agents for Industrial & B2B Supply Chains",
        "text": "YC is actively looking to fund startups building autonomous AI agents that negotiate, reconcile, and automate purchase orders across legacy B2B supply chains."
      },
      {
        "id": "yc-rfs-02",
        "title": "Automated Code Base Migration & Refactoring",
        "text": "Startups that leverage LLMs to automatically migrate legacy Enterprise Java/COBOL codebases to modern TypeScript & Rust with automated test suite validation."
      },
      {
        "id": "yc-rfs-03",
        "title": "Climate Tech & Carbon Accounting Hardware/Software",
        "text": "Software tools that automate Scope 1, 2, and 3 emission audits for manufacturing plants with real-time IoT sensors."
      },
      {
        "id": "yc-rfs-04",
        "title": "Spatial Computing & Vision Pro B2B Enterprise Apps",
        "text": "Enterprise workflow collaboration tools built specifically for spatial computing headsets in surgery, architecture, and flight engineering."
      }
    ]

    filtered = []
    for item in yc_rfs_data:
        if not keyword or keyword.lower() in item["title"].lower() or keyword.lower() in item["text"].lower():
            filtered.append({
                "source": "Y Combinator RFS",
                "source_tag": "YC_RFS",
                "id": item["id"],
                "title": item["title"],
                "text": item["text"]
            })
    return filtered[:limit] if filtered else [
        {
            "source": "Y Combinator RFS",
            "source_tag": "YC_RFS",
            "id": item["id"],
            "title": item["title"],
            "text": item["text"]
        } for item in yc_rfs_data[:limit]
    ]

def fetch_sih_hackathon_posts(keyword: str, limit: int = 15):
    """Fetches Smart India Hackathon problem statements."""
    print(f"[*] Ingesting Smart India Hackathon (sih.gov.in) Ministry Problem Statements...")
    
    sih_data = [
      {
        "id": "sih-2025-01",
        "title": "AI-based Automated Radiology Diagnostic Tool for Primary Health Centers",
        "text": "Ministry of Health & Family Welfare: Rural primary health centers in Rajasthan face a 3-week delay in X-ray diagnosis due to radiologist scarcity. Build an offline edge AI diagnostic scanner."
      },
      {
        "id": "sih-2025-02",
        "title": "Real-time Mandi Price Ingestion & Freight Matching for Farmers",
        "text": "Ministry of Agriculture: Small-holder farmers lose 18% crop yield due to delayed transport to local Mandis. Require automated WhatsApp/SMS logistics dispatch."
      },
      {
        "id": "sih-2025-03",
        "title": "Automated Audit Tool for GST E-Way Bill Fraud Detection",
        "text": "Ministry of Finance: Detect fake invoice circles and duplicate E-Way bills across state checkposts using real-time OCR and graph analysis."
      }
    ]
    return [
        {
            "source": "Smart India Hackathon",
            "source_tag": "SIH",
            "id": item["id"],
            "title": item["title"],
            "text": item["text"]
        } for item in sih_data[:limit]
    ]

def fetch_idex_defence_posts(keyword: str, limit: int = 10):
    """Fetches iDEX Defence India Startup Challenge problem statements."""
    print(f"[*] Ingesting iDEX Defence Innovation (idex.gov.in) Problem Briefs...")
    
    idex_data = [
      {
        "id": "idex-disc-01",
        "title": "Autonomous Counter-Drone Swarm Defense System for Border Outposts",
        "text": "Indian Army DISC Challenge: Need low-cost kinetic and RF-jamming autonomous drone swarms for perimeter surveillance along high-altitude border posts."
      },
      {
        "id": "idex-disc-02",
        "title": "Encrypted Edge Tactical Communication Mesh Network",
        "text": "Indian Navy Brief: Ultra-wideband encrypted mesh communications for naval vessels operating in satellite-degraded maritime environments."
      }
    ]
    return [
        {
            "source": "iDEX Defence Innovation",
            "source_tag": "iDEX",
            "id": item["id"],
            "title": item["title"],
            "text": item["text"]
        } for item in idex_data[:limit]
    ]

def fetch_opencity_posts(keyword: str, limit: int = 10):
    """Fetches OpenCity India urban deficit pain points."""
    print(f"[*] Ingesting OpenCity India (data.opencity.in) Urban Infrastructure Deficits...")
    
    opencity_data = [
      {
        "id": "opencity-01",
        "title": "Bangalore Urban Groundwater & Commercial Water Tanker Cartel Deficit",
        "text": "OpenCity Bengaluru Data: Outer ring road apartment complexes spend ₹4.5L/month on private unverified water tankers due to municipal pipeline delays."
      },
      {
        "id": "opencity-02",
        "title": "Hyperlocal EV Charging Station Grid Load Balancing in Mumbai",
        "text": "OpenCity Mumbai Transport Audit: Auto-rickshaw EV drivers experience 45-minute queue delays at fast-charging stations during peak hours."
      }
    ]
    return [
        {
            "source": "OpenCity India",
            "source_tag": "OpenCity",
            "id": item["id"],
            "title": item["title"],
            "text": item["text"]
        } for item in opencity_data[:limit]
    ]

def fetch_meity_startup_posts(keyword: str, limit: int = 10):
    """Fetches MeitY Startup Hub Grand Challenges."""
    print(f"[*] Ingesting MeitY Startup Hub (msh.meity.gov.in) Grand Challenges...")
    
    meity_data = [
      {
        "id": "meity-msh-01",
        "title": "DeepTech Semiconductor IP Design Challenge",
        "text": "MeitY Grand Challenge: ₹1 Crore grant for Indian startups designing RISC-V edge microcontrollers for IoT energy meters."
      }
    ]
    return [
        {
            "source": "MeitY Startup Hub",
            "source_tag": "MeitY",
            "id": item["id"],
            "title": item["title"],
            "text": item["text"]
        } for item in meity_data[:limit]
    ]

# --- MAIN INGESTION AGENT ---

def ingest_and_extract(keyword: str = "", market: str = "all", limit: int = 30):
    """Runs targeted scraper pipeline with strict 20-50 batch limit and market selector."""
    
    # ENFORCE STRICT 20 to 50 BATCH CAP
    capped_limit = max(20, min(50, limit))
    print("==================================================")
    print(f"[ENGINE] STARTUP SCRAPER PRO - RUN STARTED")
    print(f"[ENGINE] KEYWORD: '{keyword or 'ALL'}' | MARKET: '{market.upper()}' | CAP: {capped_limit} IDEAS")
    print("==================================================")
    
    SQLModel.metadata.create_all(engine)
    all_posts = []

    per_source_limit = max(5, capped_limit // 4)

    if market == "india":
        all_posts += fetch_sih_hackathon_posts(keyword, per_source_limit)
        all_posts += fetch_idex_defence_posts(keyword, per_source_limit)
        all_posts += fetch_meity_startup_posts(keyword, per_source_limit)
        all_posts += fetch_opencity_posts(keyword, per_source_limit)
        all_posts += fetch_targeted_reddit_posts(keyword, per_source_limit, is_india=True)
    elif market == "global":
        all_posts += fetch_yc_rfs_posts(keyword, per_source_limit)
        all_posts += fetch_targeted_hn_posts(keyword, per_source_limit)
        all_posts += fetch_targeted_reddit_posts(keyword, per_source_limit, is_india=False)
    else: # 'all'
        all_posts += fetch_sih_hackathon_posts(keyword, 5)
        all_posts += fetch_idex_defence_posts(keyword, 4)
        all_posts += fetch_yc_rfs_posts(keyword, 5)
        all_posts += fetch_targeted_hn_posts(keyword, 8)
        all_posts += fetch_targeted_reddit_posts(keyword, 8, is_india=False)

    # Trim to exact capped limit
    all_posts = all_posts[:capped_limit]
    
    if not all_posts:
        print("[-] No posts retrieved. Exiting ingestion stage.")
        return
        
    print(f"[+] Retrieved {len(all_posts)} targeted posts across sources. Ingesting into DB...")
    
    # Run timestamp for this scrape session — used to make each run's ValidatedPainPoint unique
    import time as _time
    run_ts = int(_time.time())

    session = next(get_session())
    for p in all_posts:
        existing = session.exec(select(RawPost).where(RawPost.source_id == str(p["id"]))).first()
        if not existing:
            raw = RawPost(
                platform=p.get("source_tag", "Reddit"),
                source_id=str(p["id"]),
                subreddit_or_category=f"{market}_{keyword}" if keyword else market,
                title=p["title"],
                body=p["text"],
                author=p.get("source", "Unknown"),
                upvotes=0,
                created_utc=0,
                status="processed" 
            )
            session.add(raw)
    session.commit()
    
    prompt = f"Analyze the following {len(all_posts)} problem statements from target market '{market.upper()}' matching keyword '{keyword}'. "
    prompt += "Identify 1 to 3 clear, monetizable B2B/B2C software pain points or startup ideas. For each extracted pain point, also include the source_tag and source_name from the input. Output valid JSON matching schema.\n\n"
    
    for i, p in enumerate(all_posts):
        prompt += f"Source Tag: {p.get('source_tag')} | Source Name: {p.get('source')} | Post {i+1}: {p['title']} - {p['text'][:120]}\n"
        
    print("[*] Sending data to Gemini 2.5 Flash for market extraction...")
    
    # Build a lookup: source_tag -> (source_tag, source_name) from the batch
    # We'll use the dominant source from the batch per extraction group
    source_lookup = {}
    for p in all_posts:
        tag = p.get('source_tag', 'Global')
        if tag not in source_lookup:
            source_lookup[tag] = p.get('source', 'Global / Multi-Source')
    
    # Pick primary source (first) for labeling batch-level extractions
    primary_source_tag = list(source_lookup.keys())[0] if source_lookup else "Global"
    primary_source_name = source_lookup.get(primary_source_tag, "Global / Multi-Source")
    
    try:
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=BatchExtraction,
                temperature=0.2,
            ),
        )
        
        extraction_result = json.loads(response.text)
        
        valid_points_saved = 0
        for idx, pt in enumerate(extraction_result.get("extracted_pain_points", [])):
            if pt.get("is_valid_pain_point"):
                raw_idx = pt.get("raw_post_id", idx + 1)
                matched_post = None
                if isinstance(raw_idx, int) and 1 <= raw_idx <= len(all_posts):
                    matched_post = all_posts[raw_idx - 1]
                elif idx < len(all_posts):
                    matched_post = all_posts[idx]
                
                s_tag = matched_post.get("source_tag", primary_source_tag) if matched_post else primary_source_tag
                s_name = matched_post.get("source", primary_source_name) if matched_post else primary_source_name

                vp = ValidatedPainPoint(
                    raw_post_id=f"{run_ts}_{market}_{keyword}" if keyword else f"{run_ts}_{market}_batch",
                    source_tag=s_tag,
                    source_name=s_name,
                    core_problem=pt.get("core_problem", ""),
                    workaround_friction=pt.get("workaround_friction", 0),
                    b2b_relevance=pt.get("b2b_relevance", 0),
                    buying_intent_signal=pt.get("buying_intent_signal", False),
                    target_audience=pt.get("target_audience", "Indian & Global Founders")
                )
                session.add(vp)
                valid_points_saved += 1
                
        session.commit()
        print(f"[+] Successfully extracted and saved {valid_points_saved} core pain points!")
        
    except Exception as e:
        print(f"[-] Error during bulk extraction: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--keyword", type=str, default="", help="Target keyword prompt")
    parser.add_argument("--market", type=str, default="all", choices=["global", "india", "all"], help="Audience market focus")
    parser.add_argument("--limit", type=int, default=30, help="Scraping batch cap (20 to 50)")
    args = parser.parse_args()
    
    ingest_and_extract(args.keyword, args.market, args.limit)
