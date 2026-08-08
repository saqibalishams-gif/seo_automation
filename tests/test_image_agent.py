import pytest
import os
import tempfile
from utils.db import init_db, get_db_connection
from agents.image_agent import ImageAgent

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp()
    init_db(db_path=path)
    
    with get_db_connection(path) as conn:
        conn.execute(
            '''INSERT INTO image_licenses (user_id, game_name, provider, file_path, license_type, license_notes) 
               VALUES (?, ?, ?, ?, ?, ?)''',
            (1, "Licensed Game", "ProviderA", "data/images/licensed_game.jpg", "screenshot_with_permission", "Permission granted via email")
        )
        conn.commit()
        
    yield path
    os.close(fd)
    os.unlink(path)

def test_image_happy_path(temp_db):
    agent = ImageAgent()
    image = agent.get_licensed_image("Licensed Game", "ProviderA", user_id=1, db_path=temp_db)
    
    assert image is not None
    assert image["file_path"] == "data/images/licensed_game.jpg"
    assert image["license_type"] == "screenshot_with_permission"

def test_image_skip_path(temp_db):
    agent = ImageAgent()
    image = agent.get_licensed_image("Unlicensed Game", "ProviderA", user_id=1, db_path=temp_db)
    
    assert image is None
