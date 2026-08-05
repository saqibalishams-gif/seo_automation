import pytest
import os
import tempfile
from utils.db import init_db, get_db_connection
from agents.fact_verification_agent import verify_claims

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp()
    init_db(db_path=path)
    
    # Insert some dummy trusted facts for testing
    with get_db_connection(path) as conn:
        conn.execute(
            '''INSERT INTO trusted_facts (game_name, provider, rtp, volatility, max_win, release_date, min_bet, max_bet) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            ("TestGame", "TestProvider", 96.5, "High", "5000x", "2023-01-01", 0.1, 100.0)
        )
        conn.execute(
            '''INSERT INTO trusted_facts (game_name, provider, rtp, volatility) 
               VALUES (?, ?, ?, ?)''',
            ("PartialGame", "TestProvider", 95.0, "Medium")
        )
        conn.commit()
    
    yield path
    os.close(fd)
    os.unlink(path)

def test_perfect_match(temp_db):
    claims = {
        "rtp": 96.5,
        "volatility": "High",
        "max_win": "5000x"
    }
    status, diff = verify_claims("TestGame", "TestProvider", claims, db_path=temp_db)
    assert status == 'MATCH'
    assert len(diff) == 0

def test_intentional_mismatch(temp_db):
    # LLM hallucinates RTP
    claims = {
        "rtp": 98.0, 
        "volatility": "High"
    }
    status, diff = verify_claims("TestGame", "TestProvider", claims, db_path=temp_db)
    assert status == 'MISMATCH'
    assert "rtp" in diff
    assert diff["rtp"]["proposed"] == 98.0
    assert diff["rtp"]["trusted"] == 96.5

def test_missing_game_unavailable(temp_db):
    claims = {"rtp": 99.0}
    status, diff = verify_claims("UnknownGame", "UnknownProvider", claims, db_path=temp_db)
    assert status == 'UNAVAILABLE'

def test_missing_fact_unavailable(temp_db):
    # PartialGame only has rtp and volatility. Asking for max_win should fail.
    claims = {
        "rtp": 95.0,
        "max_win": "10000x"
    }
    status, diff = verify_claims("PartialGame", "TestProvider", claims, db_path=temp_db)
    assert status == 'UNAVAILABLE'
    assert "max_win" in diff
