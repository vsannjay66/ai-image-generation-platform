from pydantic import BaseModel, EmailStr


from datetime import datetime


from typing import Optional

class token(BaseModel):
    access_token:str
    token_type:str

class user(BaseModel):
    username:Optional[str]=None
    email:EmailStr
    password:str

class create_user(user):
    email:EmailStr
    password:str


class chatsessionrename(BaseModel):
    title:Optional[str]="new chat"


class chatsessioncreate(BaseModel):
    title:Optional[str]="new chat"

class chatsessionout(BaseModel):
    id:int
    title:str
    created_at:datetime

    class Config:
        from_attributes=True



class generateimage(BaseModel):
    session_id:int
    prompt:str

class generateimageout(BaseModel):
    id:int
    session_id:int
    image_url:str
    prompt:str
    created_at:datetime

    class Config:
        from_attributes=True
