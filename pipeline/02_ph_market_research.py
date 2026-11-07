import os
import sys
import json
from duckduckgo_search import DDGS
from sqlmodel import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_session, engine, SQLModel
from database.models import ValidatedPainPoint, MarketValidation

def search_product_hunt(pain_point: str):
    """Searches Product Hunt via DuckDuckGo to find competitors."""
    query = f"site:producthunt.com {pain_point}"
    print(f"[*] Searching DuckDuckGo: {query}")
    
    results = []
    try:
        ddgs = DDGS()
        search_results = ddgs.text(query, max_results=5)
        if search_results:
            for r in search_results:
                results.append({
                    "title": r.get("title", ""),
                    "description": r.get("body", ""),
                    "url": r.get("href", "")
                })
    except Exception as e:
        print(f"[-] DuckDuckGo search failed: {e}")
        
    return results

def research_competitors():
    SQLModel.metadata.create_all(engine)
    session = next(get_session())
    
    # Process all unvalidated pain points (up to 50 per batch)
    unvalidated_points = session.exec(
        select(ValidatedPainPoint).where(
            ~ValidatedPainPoint.id.in_(
                select(MarketValidation.validated_pain_point_id)
            )
        ).limit(50)
    ).all()
    
    if not unvalidated_points:
        print("No new pain points to research.")
        return
        
    for vp in unvalidated_points:
        competitors = search_product_hunt(vp.core_problem)
        
        validation = MarketValidation(
            validated_pain_point_id=vp.id,
            competitors_found=json.dumps(competitors),
            market_saturation_score=0,
            final_verdict="Pending Gemini Analysis",
            recommendation_light="PENDING"
        )
        session.add(validation)
        session.commit()
        print(f"[+] Found {len(competitors)} competitors for: {vp.core_problem[:50]}")
        
    session.close()

if __name__ == "__main__":
    research_competitors()
