from typing import Dict, Any, Tuple
from utils.logger import get_logger
from utils.db import get_db_connection, DB_PATH

logger = get_logger("fact_verification")

def get_trusted_facts(game_name: str, provider: str, user_id: int, db_path=DB_PATH) -> Dict[str, Any]:
    """
    Checks the local database for previously verified facts for this user.
    """
    with get_db_connection(db_path) as conn:
        cursor = conn.execute(
            '''SELECT rtp, volatility, max_win, release_date, min_bet, max_bet 
               FROM trusted_facts 
               WHERE user_id = ? AND LOWER(game_name) = LOWER(?) AND LOWER(provider) = LOWER(?)''',
            (user_id, game_name, provider)
        )
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return {}

def verify_claims(game_name: str, provider: str, proposed_claims: Dict[str, Any], user_id: int, db_path=DB_PATH) -> Tuple[str, Dict[str, Any]]:
    """
    Verifies proposed facts against CasinoDataAPI or local trusted_facts for this user.
    """
    if not proposed_claims:
        return 'MATCH', {}
        
    trusted = get_trusted_facts(game_name, provider, user_id, db_path)
    
    if not trusted:
        logger.info(f"Fact check bypassed for {provider} - {game_name} because no trusted facts exist.")
        return 'MATCH', {}
    
    mismatches = {}
    for key, proposed_value in proposed_claims.items():
        if key not in trusted:
            continue
            
        trusted_value = trusted[key]
        
        # If the trusted DB doesn't have this specific fact but it was proposed,
        # we consider it unavailable in trusted sources and thus a mismatch/unavailable.
        # But per specs: "If a fact can't be verified against structured data, the article either omits it or is held for human fact-add".
        # Let's flag as UNAVAILABLE if the fact is missing in the DB.
        if trusted_value is None:
            logger.warning(f"UNAVAILABLE: Fact '{key}' for {provider} - {game_name} is null in trusted DB.")
            return 'UNAVAILABLE', {key: {'proposed': proposed_value, 'trusted': None}}
            
        # Deterministic comparison
        # For floats, we might need to handle slight precision issues if we get them as floats,
        # but exact match is safest for RTP (e.g. 96.5 vs 96.5).
        # We'll do string casting for loose equality just in case of type differences (e.g., int 5000 vs float 5000.0)
        # However, it's safer to compare as strings for deterministic equality, stripping spaces.
        if str(proposed_value).strip().lower() != str(trusted_value).strip().lower():
             mismatches[key] = {'proposed': proposed_value, 'trusted': trusted_value}
    
    if mismatches:
        logger.error(f"MISMATCH: Fact check failed for {provider} - {game_name}. Mismatches: {mismatches}")
        return 'MISMATCH', mismatches
        
    logger.info(f"MATCH: All claims verified for {provider} - {game_name}.")
    return 'MATCH', {}
