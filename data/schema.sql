CREATE TABLE IF NOT EXISTS publish_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    article_id TEXT,
    published_at TIMESTAMP NOT NULL,
    UNIQUE(game_name, provider)
);

CREATE TABLE IF NOT EXISTS trusted_facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    rtp REAL,
    volatility TEXT,
    max_win TEXT,
    release_date TEXT,
    min_bet REAL,
    max_bet REAL,
    UNIQUE(game_name, provider)
);

CREATE TABLE IF NOT EXISTS image_licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    file_path TEXT NOT NULL,
    license_type TEXT NOT NULL,
    license_notes TEXT,
    UNIQUE(game_name, provider)
);
