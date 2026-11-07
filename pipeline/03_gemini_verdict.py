import os
import sys
import json
from google import genai
from google.genai import types
from sqlmodel import select, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import get_session, engine
from database.models import ValidatedPainPoint, MarketValidation
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_verdict():
    session = next(get_session())
    
    # Process all pending validations (up to 50 per batch)
    pending_validations = session.exec(
        select(MarketValidation, ValidatedPainPoint)
        .join(ValidatedPainPoint)
        .where(MarketValidation.recommendation_light == "PENDING")
        .limit(50)
    ).all()
    
    if not pending_validations:
        print("No pending market validations to score.")
        return
        
    for validation, vp in pending_validations:
        print(f"[*] Scoring Idea: {vp.core_problem[:50]}...")
        
        comps = []
        try:
            comps = json.loads(validation.competitors_found)
        except Exception:
            comps = []

        # NOTE: We intentionally NO LONGER auto-assign GREEN for zero competitors.
        # "No Product Hunt competitors found" does NOT mean it's a Blue Ocean —
        # it may just mean the market is dominated by incumbents not on Product Hunt.
        # Gemini evaluates the DOMAIN itself, not just Product Hunt results.
        
        comp_context = (
            f"Existing competitors on Product Hunt: {validation.competitors_found}"
            if comps
            else "No direct Product Hunt competitors were found, but this does NOT automatically mean it's a Blue Ocean — evaluate based on the known market landscape for this problem domain."
        )

        prompt = f"""
        Act as an aggressive VC analyst. 
        I have a startup idea solving this exact problem: "{vp.core_problem}"
        Target audience: {vp.target_audience}
        
        {comp_context}
        
        Analyze this idea critically:
        - If it is in a generic, crowded market (AI tools, chatbots, email marketing, CRM, generic SaaS, e-commerce, social media analytics, video editing), score market_saturation_score 7-9, RED.
        - If it is niche but has some existing solutions or execution risk, score 4-6, YELLOW.
        - ONLY if it is a genuinely specialized, hard-to-replicate problem in GovTech, deep-tech, defense, rural infra, specialized healthcare, or truly novel B2B niche — score 1-3, GREEN.
        
        Return strict JSON with:
        - market_saturation_score (int): 1-10
        - final_verdict (str): A 2-sentence brutal honest analysis.
        - recommendation_light (str): "RED", "YELLOW", or "GREEN"
        """
        
        try:
            response = client.models.generate_content(
                model='gemini-3.8-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            
            result = json.loads(response.text)
            
            validation.market_saturation_score = result.get("market_saturation_score", 5)
            validation.final_verdict = result.get("final_verdict", "Promising niche problem with moderate market saturation.")
            validation.recommendation_light = result.get("recommendation_light", "YELLOW")
            
            session.add(validation)
            session.commit()
            print(f"   [Verdict]: {validation.recommendation_light} | Saturation: {validation.market_saturation_score}/10")
            
        except Exception as e:
            print(f"   [-] Gemini verdict fallback: {e}")
            validation.market_saturation_score = 5
            validation.final_verdict = "Market validation requires further competitor analysis. Moderate saturation assumed."
            validation.recommendation_light = "YELLOW"
            session.add(validation)
            session.commit()

            
    # Retain top 100 most recent unstored ideas, never deleting saved Incubator ideas!
    try:
        session.exec(text("""
            DELETE FROM marketvalidation 
            WHERE is_saved = 0 AND id NOT IN (
                SELECT id FROM marketvalidation 
                WHERE is_saved = 0 
                ORDER BY validated_at DESC 
                LIMIT 100
            )
        """))
        session.commit()
    except Exception:
        pass
        
    session.close()

if __name__ == "__main__":
    generate_verdict()
