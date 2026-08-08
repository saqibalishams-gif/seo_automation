import pytest
import sqlite3
import datetime
import os
import tempfile
from utils.db import init_db
from agents.history_agent import check_candidate, record_publish

@pytest.fixture
def temp_db():
    # Create a temporary file for the SQLite DB
    fd, path = tempfile.mkstemp()
    
    # Initialize schema
    init_db(db_path=path)
    
    yield path
    
    # Teardown
    os.close(fd)
    os.unlink(path)

def test_new_game_passes_gate(temp_db):
    assert check_candidate("NewGame", "NewProvider", user_id=1, db_path=temp_db) == True

def test_duplicate_within_180_days_is_blocked(temp_db):
    now = datetime.datetime.now(datetime.timezone.utc)
    recent_date = now - datetime.timedelta(days=10)
    
    record_publish("RecentGame", "ProviderA", "123", recent_date, user_id=1, db_path=temp_db)
    
    assert check_candidate("RecentGame", "ProviderA", user_id=1, db_path=temp_db) == False
    
    # Case insensitivity test
    assert check_candidate("recentgame", "providera", user_id=1, db_path=temp_db) == False

def test_duplicate_after_181_days_passes_gate(temp_db):
    now = datetime.datetime.now(datetime.timezone.utc)
    old_date = now - datetime.timedelta(days=185)
    
    record_publish("OldGame", "ProviderB", "124", old_date, user_id=1, db_path=temp_db)
    
    assert check_candidate("OldGame", "ProviderB", user_id=1, db_path=temp_db) == True

def test_record_publish_is_idempotent(temp_db):
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Call twice with same data
    record_publish("IdempotentGame", "ProviderC", "125", now, user_id=1, db_path=temp_db)
    record_publish("IdempotentGame", "ProviderC", "126", now, user_id=1, db_path=temp_db)
    
    # Verify only one row exists
    conn = sqlite3.connect(temp_db)
    cursor = conn.execute("SELECT COUNT(*) FROM publish_history WHERE game_name='IdempotentGame' AND provider='ProviderC'")
    count = cursor.fetchone()[0]
    conn.close()
    
    assert count == 1
