import pytest
import tempfile
import os
from utils.db import init_db, get_db_connection
from agents.discovery_agent import Candidate
from pipelines.content_pipeline import run_single_candidate
from agents.content_agent import check_differentiation, ArticleDraft

@pytest.fixture
def temp_pipeline_db():
    fd, path = tempfile.mkstemp()
    init_db(db_path=path)
    
    # Insert trusted facts for our test candidate
    with get_db_connection(path) as conn:
        conn.execute(
            '''INSERT INTO trusted_facts (game_name, provider, rtp, volatility, max_win) 
               VALUES (?, ?, ?, ?, ?)''',
            ("Sweet Bonanza 1000", "Pragmatic Play", 96.53, "High", "21100x")
        )
        conn.commit()
        
    yield path
    os.close(fd)
    os.unlink(path)

@pytest.fixture(autouse=True)
def mock_env():
    with mock.patch.dict(os.environ, {
        "WP_URL": "http://test",
        "WP_USERNAME": "user",
        "WP_APP_PASSWORD": "password",
        "OPENAI_API_KEY": "test",
        "CASINO_DATA_API_KEY": "test"
    }):
        yield

from unittest import mock

def test_full_pipeline_success(temp_pipeline_db):
    candidate = Candidate("Sweet Bonanza 1000", "Pragmatic Play", "http://example.com")
    
    with mock.patch('pipelines.content_pipeline.check_market_allowlist') as mock_compliance, \
         mock.patch('agents.wordpress_agent.WordPressAgent.push_draft') as mock_wp, \
         mock.patch('agents.content_agent.ContentAgent.draft_article') as mock_draft:
         
        mock_compliance.return_value = True
        mock_wp.return_value = "999"
        
        # We must return a dummy draft that passes the check_differentiation lint!
        dummy_draft = ArticleDraft(
            title="Sweet Bonanza 1000 Slot Review",
            body="This is by our expert. Who this game suits: everyone. It's better than 21100x. comparison included.",
            facts_used={}
        )
        mock_draft.return_value = dummy_draft
        
        draft, status = run_single_candidate(candidate, target_market="UK", db_path=temp_pipeline_db)
        
        assert draft is not None
        assert status == "SUCCESS"
    assert "Sweet Bonanza 1000 Slot Review" in draft.title
    assert "21100x" in draft.body
    assert check_differentiation(draft.body) == True

def test_differentiation_lint_fails():
    bad_draft = "This is a generic rewrite of a slot game. It is very basic and plain."
    assert check_differentiation(bad_draft) == False
    
def test_differentiation_lint_passes():
    good_draft_1 = "This is a review. By our expert team."
    good_draft_2 = "Comparison table below..."
    good_draft_3 = "Who this game suits: high rollers."
    
    assert check_differentiation(good_draft_1) == True
    assert check_differentiation(good_draft_2) == True
    assert check_differentiation(good_draft_3) == True
