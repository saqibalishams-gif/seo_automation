import pytest
from unittest import mock
import tempfile
import os
import json
from scripts.orchestrator import run
from utils.db import init_db, get_db_connection

@pytest.fixture
def temp_orchestrator_env():
    # Setup temp DB
    fd_db, db_path = tempfile.mkstemp()
    os.close(fd_db)
    init_db(db_path=db_path)
    
    with get_db_connection(db_path) as conn:
        conn.execute(
            '''INSERT INTO trusted_facts (game_name, provider, rtp, volatility, max_win) 
               VALUES (?, ?, ?, ?, ?)''',
            ("Sweet Bonanza 1000", "Pragmatic Play", 96.53, "High", "21100x")
        )
        conn.commit()
        
    # Setup temp allowlist
    fd_json, json_path = tempfile.mkstemp()
    os.close(fd_json)
    with open(json_path, 'w') as f:
        json.dump(["UK"], f)
        
    yield db_path, json_path
    
    os.unlink(db_path)
    os.unlink(json_path)

@mock.patch('scripts.orchestrator.run_single_candidate')
def test_orchestrator_volume_limit(mock_run_single, temp_orchestrator_env):
    db_path, json_path = temp_orchestrator_env
    
    mock_run_single.return_value = ("dummy_draft", "SUCCESS")
    
    # The default DiscoveryAgent returns 2 candidates
    # We set max volume to 1 and ensure only 1 is processed
    processed = run(target_market="UK", max_volume=1, dry_run=True)
    assert processed == 1
    assert mock_run_single.call_count == 1

def test_orchestrator_dry_run(temp_orchestrator_env):
    db_path, json_path = temp_orchestrator_env
    
    with mock.patch('scripts.orchestrator.run_single_candidate') as mock_run_single:
        mock_run_single.return_value = ("dummy_draft", "SUCCESS")
        
        # We need to manually set kwargs to db_path for the pipeline, or just let it use mocked default DB_PATH
        processed = run(target_market="UK", max_volume=2, dry_run=True)
        
        assert processed == 2
        
        # Check that dry_run=True was passed to the pipeline
        call_args = mock_run_single.call_args_list[0]
        assert call_args.kwargs['dry_run'] == True
