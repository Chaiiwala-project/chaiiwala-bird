from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from supabase import create_client
from better_profanity import profanity
import re
import os
from dotenv import load_dotenv

load_dotenv()  

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
app=FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

profanity.load_censor_words()
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class Score(BaseModel):
    name:str
    score:int

    @field_validator('name')
    def validate_name(cls, name):
        name = name.strip()

        if len(name) < 3 or len(name) > 20:
            raise ValueError("Name must be between 3 and 20 characters")

        if profanity.contains_profanity(name.lower()):
            raise ValueError("Name contains profanity")

        if not re.match("^[a-zA-Z0-9 ]+$", name):
            raise ValueError("Name can only contain letters, numbers, and spaces")

        return name
    

@app.post("/submit_score")
def submit_score(score: Score):
    try:
        supabase.table("leaderboard").insert({"name": score.name, "score": score.score}).execute()
        return {"message": "Score submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/leaderboard")
def get_leaderboard():
    try:
        response = supabase.table("leaderboard").select("*").order("score", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
