from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data'))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(DATA_DIR, 'history.db')}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    history = relationship("PublishHistory", back_populates="user")
    wp_sites = relationship("WordPressSite", back_populates="user")
    drafts = relationship("ContentDraft", back_populates="user")

class WordPressSite(Base):
    __tablename__ = "wordpress_sites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Credentials
    site_url = Column(String, index=True)
    username = Column(String)
    app_password = Column(String)
    
    # Profile / Discovery Data (Stored as JSON strings)
    active_theme = Column(String, default="unknown")
    editor_type = Column(String, default="classic")
    seo_plugin = Column(String, default="none")
    capabilities = Column(String, default="{}")
    category_mapping = Column(String, default="{}")
    
    status = Column(String, default="connected")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="wp_sites")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    wp_url = Column(String, nullable=True)
    wp_username = Column(String, nullable=True)
    wp_app_password = Column(String, nullable=True)
    
    airtable_api_key = Column(String, nullable=True)
    airtable_base_id = Column(String, nullable=True)
    airtable_table_name = Column(String, default="Links")
    
    user = relationship("User", back_populates="settings")

class ContentDraft(Base):
    __tablename__ = "content_drafts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    site_id = Column(Integer, ForeignKey("wordpress_sites.id"), nullable=True)
    
    game_name = Column(String)
    provider = Column(String)
    
    # Store the Universal Content Model JSON
    document_json = Column(String) 
    
    status = Column(String, default="draft") # draft, approved, published, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="drafts")

class PublishHistory(Base):
    __tablename__ = "publish_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    game_name = Column(String)
    provider = Column(String)
    article_id = Column(Integer, nullable=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="history")

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
