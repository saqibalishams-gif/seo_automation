import pytest
import tempfile
import json
import os
from agents.compliance_agent import check_market_allowlist

@pytest.fixture
def temp_allowlist():
    fd, path = tempfile.mkstemp()
    os.close(fd)
    yield path
    try:
        os.unlink(path)
    except FileNotFoundError:
        pass

def test_empty_allowlist_blocks_everything(temp_allowlist):
    with open(temp_allowlist, 'w') as f:
        json.dump([], f)
        
    assert check_market_allowlist("UK", config_path=temp_allowlist) == False
    assert check_market_allowlist("US", config_path=temp_allowlist) == False

def test_populated_allowlist_passes_allowed(temp_allowlist):
    with open(temp_allowlist, 'w') as f:
        json.dump(["UK", "CA"], f)
        
    assert check_market_allowlist("UK", config_path=temp_allowlist) == True
    assert check_market_allowlist("CA", config_path=temp_allowlist) == True
    assert check_market_allowlist("US", config_path=temp_allowlist) == False

def test_missing_file_blocks_everything(temp_allowlist):
    os.unlink(temp_allowlist)
    assert check_market_allowlist("UK", config_path=temp_allowlist) == False
