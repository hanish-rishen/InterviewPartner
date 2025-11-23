from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    session_id: str
    role: Optional[str] = None  # e.g., "Sales", "Engineer"

class ChatResponse(BaseModel):
    response: str
    feedback: Optional[str] = None
    state: Optional[str] = None

class FeedbackRequest(BaseModel):
    session_id: str
