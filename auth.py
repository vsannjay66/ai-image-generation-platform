import os 
import json 
from jose import jwt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from dotenv import load_dotenv

from database import get_db
from model import User

load_dotenv()

Secret_key = os.getenv("Secret_key","SX9CfsAbblGdnLiSeajEiLU03C21AAJ2m23iNi")
Algorithm = os.getenv("Algorithm","HS256")

access_token=30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #password hashing
auth=OAuth2PasswordBearer(tokenUrl="token") #url

def hash(password:str):
    return pwd_context.hash(password)

def verfiy(plain:str,hashed:str):
    return pwd_context.verify(plain,hashed)

def accesstoken(data:dict):
    to_encode=data.copy()
    expire=datetime.utcnow()+timedelta(minutes=access_token)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,Secret_key,algorithm=Algorithm)


def getuser(token:str=Depends(auth),db:Session=Depends(get_db)):
    try:
        payload=jwt.decode(token,Secret_key,algorithms=[Algorithm])
        email=payload.get("sub")
    except Exception as e:
        raise HTTPException(status_code=401,detail="Invalid Token")
    if email is None:
        raise HTTPException(status_code=401,detail="Invalid Token")
    user=db.query(User).filter(User.email==email).first()
    if user is None:
        raise HTTPException(status_code=401,detail="User not found")
    return user



