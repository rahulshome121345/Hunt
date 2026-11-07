from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class RawPost(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    platform: str = Field(index=True) # e.g., 'reddit', 'hackernews'
    source_id: str = Field(unique=True, index=True) # The ID from the platform (e.g., Reddit submission ID)
    subreddit_or_category: str
    title: str
    body: str
    author: Optional[str] = None
    upvotes: int = Field(default=0)
    created_utc: float
    status: str = Field(default="unprocessed", index=True) # 'unprocessed', 'processed', 'failed'
    ingested_at: datetime = Field(default_factory=datetime.utcnow)

class ValidatedPainPoint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    raw_post_id: str = Field(index=True)  # Stores market_keyword or source reference
    source_tag: Optional[str] = Field(default="Global", index=True)  # SIH, iDEX, MeitY, OpenCity, HackerNews, Reddit, YC_RFS
    source_name: Optional[str] = Field(default="Global / Multi-Source")  # Full display name
    core_problem: str
    workaround_friction: int
    b2b_relevance: int
    buying_intent_signal: bool
    target_audience: str
    cluster_id: Optional[int] = Field(default=None, index=True)  # Will be populated by the clustering step
    extracted_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessOpportunity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    cluster_id: int = Field(unique=True, index=True)
    problem_summary: str
    saas_solution_idea: str
    target_buyer: str
    pricing_model_hypothesis: str
    evidence_count: int = Field(default=0) # Number of posts in this cluster
    synthesized_at: datetime = Field(default_factory=datetime.utcnow)

class MarketValidation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    validated_pain_point_id: int = Field(foreign_key="validatedpainpoint.id", index=True, unique=True)
    competitors_found: str # Storing as string/JSON for simplicity in SQLite
    market_saturation_score: int # 1 (Empty) to 10 (Saturated)
    final_verdict: str
    recommendation_light: str # GREEN, YELLOW, RED
    is_saved: bool = Field(default=False, index=True) # Used for the Incubator
    validated_at: datetime = Field(default_factory=datetime.utcnow)

class BrainstormMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    market_validation_id: int = Field(foreign_key="marketvalidation.id", index=True)
    role: str # "user" or "model"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
