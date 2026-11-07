from pydantic import BaseModel, Field
from typing import List, Optional

class PainPoint(BaseModel):
    raw_post_id: int = Field(
        description="The exact database ID of the raw post this pain point was extracted from, provided in the prompt."
    )
    is_valid_pain_point: bool = Field(
        description="True if this post describes a genuine, unsolved problem that costs time or money. False if it is just a rant, generic complaint, or has no commercial value."
    )
    core_problem: Optional[str] = Field(
        description="A concise, 1-sentence description of the actual problem."
    )
    workaround_friction: Optional[int] = Field(
        description="Scale 1-10. How painful/hacky is their current workaround? (e.g., manual excel sheets = 9)."
    )
    b2b_relevance: Optional[int] = Field(
        description="Scale 1-10. How relevant is this to a business context (B2B)? Higher means higher willingness to pay."
    )
    buying_intent_signal: Optional[bool] = Field(
        description="Did they explicitly ask for a tool, mention they would pay for a solution, or ask how others solve this?"
    )
    target_audience: Optional[str] = Field(
        description="Who exactly is experiencing this problem? (e.g., 'Junior React Developers', 'Bootstrapped SaaS Founders')."
    )

class BatchExtraction(BaseModel):
    extracted_pain_points: List[PainPoint] = Field(
        description="List of valid pain points extracted from the batch of posts. Ignore invalid posts."
    )

class Competitor(BaseModel):
    name: str = Field(description="Name of the competing product or company.")
    url: Optional[str] = Field(description="URL of the competitor if found.")
    differentiation: str = Field(description="How this pain point could differentiate from this competitor.")

class MarketValidationResult(BaseModel):
    competitors_found: List[Competitor] = Field(description="List of competitors found solving this exact problem.")
    market_saturation_score: int = Field(description="Scale 1-10. 1 = completely empty blue ocean. 10 = extremely saturated red ocean (e.g., Todo lists).")
    final_verdict: str = Field(description="A short VC-style verdict on whether this is worth building.")
    recommendation_light: str = Field(description="Strictly one of: 'GREEN', 'YELLOW', or 'RED'. GREEN means go build it. YELLOW means niche down. RED means too crowded.")
