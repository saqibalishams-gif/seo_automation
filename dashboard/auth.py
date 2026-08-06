import hashlib
import secrets
from typing import Optional, Dict

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyCookie
from utils.db import get_db_connection

cookie_scheme = APIKeyCookie(name="session_token", auto_error=False)

def hash_password(password: str) -> str:
    # A simple SHA-256 hash (in a real production app, use bcrypt or PBKDF2)
    # Since we are avoiding third-party C-extensions, we use hashlib.
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def get_current_user_id(session_token: str = Depends(cookie_scheme)) -> int:
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE token = ?", (session_token,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )
            
        return row['user_id']

def get_user_settings(user_id: int) -> dict:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return {}
        return dict(row)
