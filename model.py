from sqlmodel import SQLModel

from database import base

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey,Text,Boolean

from sqlalchemy.orm import relationship


class User(base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    email=Column(String,unique=True,index=True)
    hash=Column(String,nullable=False)
    created_at=Column(DateTime,nullable=False)

    sessions=relationship("chat_sessions",back_populates="owner")


class chat_sessions(base):
    __tablename__="chat_sessions"
    id=Column(Integer,primary_key=True,index=True)
    user_id=Column(Integer,ForeignKey("users.id"))
    title=Column(String,nullable=False)
    created_at=Column(DateTime,nullable=False)

    owner=relationship("User",back_populates="sessions")
    # Alternative string path if using a modern SQLAlchemy registry
    generated_texts=relationship("generated_image",back_populates="session")



class generated_image(base):
    __tablename__="generated_images"
    id=Column(Integer,primary_key=True,index=True)
    session_id=Column(Integer,ForeignKey("chat_sessions.id"))
    image_url=Column(String,nullable=False)
    prompt=Column(Text,nullable=False)
    created_at=Column(DateTime,nullable=False)

    session=relationship("chat_sessions",back_populates="generated_texts")
