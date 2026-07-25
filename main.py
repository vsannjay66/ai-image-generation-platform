import os
import random
import urllib.parse

import requests
from sqlalchemy.orm import Session

from auth import accesstoken, getuser, verfiy,hash,getuser

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from datetime import datetime

from database import get_db,engine,SessionLocal,base

import model

import schema
from fastapi import FastAPI,Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import  chat_sessions, generated_image, User

base.metadata.create_all(bind=engine)

app=FastAPI(title="AI Image Generation API")

# Allow the React frontend (any origin in dev) to call this API.
# We use Bearer tokens, not cookies, so credentials can stay off with "*".
origins=os.getenv("CORS_ORIGINS","*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/register")
def register(user:schema.create_user,db=Depends(get_db)):
    existing_user=db.query(model.User).filter(model.User.email==user.email).first()

    if existing_user:
        raise HTTPException(status_code=400,detail="User already exists")

    new_user=model.User(email=user.email,hash=hash(user.password),created_at=datetime.utcnow())

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token=accesstoken({"sub":new_user.email})
    return {"access_token":token}

@app.post("/auth/login")
def login(user:schema.user,db=Depends(get_db)):
    user_in_db=db.query(model.User).filter(model.User.email==user.email).first()

    if not user_in_db:
        raise HTTPException(status_code=400,detail="Invalid Credentials")
    else:
        if not verfiy(user.password,user_in_db.hash):
            raise HTTPException(status_code=400,detail="Invalid Credentials")

    token=accesstoken({"sub":user_in_db.email})
    return {"access_token":token}



@app.post("/chat_sessions/create",response_model=schema.chatsessionout)
def create_chat(payload:schema.chatsessioncreate,db=Depends(get_db),current_user:str=Depends(getuser)):
    session=model.chat_sessions(user_id=current_user.id,title=payload.title,created_at=datetime.utcnow())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.get("/chat_sessions")
def get_sessions(db=Depends(get_db),current_user:str=Depends(getuser)):
    return db.query(model.chat_sessions).filter(model.chat_sessions.user_id==current_user.id).all()


@app.put("/chat_sessions/{session_id}/rename",response_model=schema.chatsessionout)
def rename_chat(session_id:int,payload:schema.chatsessionrename,db=Depends(get_db),current_user:str=Depends(getuser)):
    session=_get_ownded_session(session_id,db,current_user)
    session.title=payload.title
    db.commit()
    db.refresh(session)

    return session

@app.delete("/chat_sessions/{session_id}")
def delete_chat(session_id:int,db=Depends(get_db),current_user:str=Depends(getuser)):
    session=_get_ownded_session(session_id,db,current_user)
    db.delete(session)
    db.commit()
    return {"detail": "Session deleted"}


def _get_ownded_session(session_id:int,db:Session,current_user:str)->model.chat_sessions:
    session=db.query(model.chat_sessions).filter(model.chat_sessions.id==session_id,model.chat_sessions.user_id==current_user.id).first()
    if not session:
        raise HTTPException(status_code=404,detail="Session not found")
    return session


def _generate_with_huggingface(prompt:str)->str|None:
    """Try HuggingFace Inference Providers (fal-ai + FLUX.1-schnell).
    Returns an image URL, or None if unavailable (no token / out of credits / error)."""
    hf_api_token=os.getenv("HF_API_TOKEN")
    if not hf_api_token:
        return None
    try:
        response=requests.post(
            "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell",
            headers={"Authorization":f"Bearer {hf_api_token}"},
            json={"prompt":prompt},
            timeout=90,
        )
        if not response.ok:
            return None  # e.g. 402 out of credits -> fall back to the free provider
        data=response.json()
        return data["images"][0]["url"]
    except (requests.exceptions.RequestException,KeyError,IndexError,TypeError,ValueError):
        return None


def _generate_with_pollinations(prompt:str)->str:
    """Free, no-API-key text-to-image. The returned URL renders the image on load."""
    encoded=urllib.parse.quote(prompt)
    seed=random.randint(1,1_000_000)  # fresh image even for a repeated prompt
    return f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true&seed={seed}"


def image_generation_service(prompt:str)->str:
    # Prefer HuggingFace (uses your token); fall back to a free provider so the
    # app keeps working even when HF credits are exhausted.
    return _generate_with_huggingface(prompt) or _generate_with_pollinations(prompt)



@app.post("/chat_sessions/generate_image",response_model=schema.generateimageout)

def generate_image(payload:schema.generateimage,db=Depends(get_db),current_user:str=Depends(getuser)):
    session=_get_ownded_session(payload.session_id,db,current_user)
    image_url=image_generation_service(payload.prompt)
    generated_image=model.generated_image(session_id=session.id,image_url=image_url,prompt=payload.prompt,created_at=datetime.utcnow())
    db.add(generated_image)
    db.commit()
    db.refresh(generated_image)
    return generated_image


@app.get("/chat_sessions/history/{session_id}",response_model=list[schema.generateimageout])
def get_generated_images(session_id:int,db=Depends(get_db),current_user:str=Depends(getuser)):
    _get_ownded_session(session_id,db,current_user)
    return db.query(model.generated_image).filter(model.generated_image.session_id==session_id).order_by(model.generated_image.created_at.desc()).all()


@app.get("/history")
def get_all_generated_images(db=Depends(get_db),current_user:str=Depends(getuser)):

    session_ids=[s.id for s in db.query(model.chat_sessions).filter(model.chat_sessions.user_id==current_user.id)]
    return db.query(model.generated_image).filter(model.generated_image.session_id.in_(session_ids)).order_by(model.generated_image.created_at.desc()).all()



@app.get("/health")
def root():
    return {"status":"ok"}