from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

from agent.core import get_interview_chain, generate_feedback
from agent.monitoring import log_interaction
from models import ChatRequest, ChatResponse, FeedbackRequest

app = FastAPI(title="Interview Practice Partner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Interview Practice Partner API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        chain = get_interview_chain()
        
        # Determine role and state if provided, otherwise default
        role = request.role if request.role else "General Candidate"
        state = "Interview in progress"
        
        config = {"configurable": {"session_id": request.session_id}}
        
        response = chain.invoke(
            {"input": request.message, "role": role, "state": state},
            config=config
        )
        
        log_interaction(request.session_id, request.message, response)
        
        return ChatResponse(response=response, state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback", response_model=ChatResponse)
async def feedback(request: FeedbackRequest):
    try:
        feedback_text = generate_feedback(request.session_id)
        return ChatResponse(response="Interview Concluded", feedback=feedback_text, state="Finished")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
