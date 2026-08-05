import pytest
import os
from unittest import mock
from agents.wordpress_agent import WordPressAgent
from agents.content_agent import ArticleDraft

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

def test_push_draft_success():
    draft = ArticleDraft(title="Test", body="Body", facts_used={})
    
    agent = WordPressAgent()
    
    with mock.patch('agents.wordpress_agent.request_with_retry') as mock_req:
        mock_response = mock.Mock()
        mock_response.json.return_value = {"id": 123}
        mock_req.return_value = mock_response
        
        article_id = agent.push_draft(draft)
        
        assert article_id == "123"
        
        # Verify payload structure and status
        call_args = mock_req.call_args
        assert call_args is not None
        
        payload = call_args.kwargs['json']
        assert payload['status'] == 'draft' # Guardrail 1
        assert "Responsible Gambling Notice" in payload['content']

def test_push_draft_failure():
    draft = ArticleDraft(title="Test", body="Body", facts_used={})
    agent = WordPressAgent()
    
    with mock.patch('agents.wordpress_agent.request_with_retry') as mock_req:
        mock_req.side_effect = Exception("Network error")
        
        article_id = agent.push_draft(draft)
        assert article_id is None
