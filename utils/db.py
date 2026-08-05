import sqlite3
import os
from contextlib import contextmanager
from utils.logger import get_logger

logger = get_logger("db_utils")

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'history.db')
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'schema.sql')

@contextmanager
def get_db_connection(db_path=DB_PATH):
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db(db_path=DB_PATH, schema_path=SCHEMA_PATH):
    """Initialize the SQLite database with the schema."""
    with get_db_connection(db_path) as conn:
        with open(schema_path, 'r') as f:
            conn.executescript(f.read())
        conn.commit()
    logger.info("Database initialized.")
