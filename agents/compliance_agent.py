import json
import os
from utils.logger import get_logger

logger = get_logger("compliance_agent")

DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'markets_allowlist.json')

def check_market_allowlist(target_market: str, config_path: str = DEFAULT_CONFIG_PATH) -> bool:
    """
    Checks if a target market is explicitly allowed in the JSON config.
    Any market not explicitly present is treated as blocked.
    """
    if not os.path.exists(config_path):
        logger.error(f"Compliance block: Allowlist file not found at {config_path}. Defaulting to blocked.")
        return False
        
    try:
        with open(config_path, 'r') as f:
            allowlist = json.load(f)
            
        if not isinstance(allowlist, list):
            logger.error("Compliance block: Allowlist is not a JSON list. Defaulting to blocked.")
            return False
            
        is_allowed = target_market in allowlist
        if is_allowed:
            logger.info(f"Compliance pass: Market '{target_market}' is allowed.")
        else:
            logger.warning(f"Compliance block: Market '{target_market}' is not in the allowlist.")
            
        return is_allowed
    except Exception as e:
        logger.error(f"Compliance block: Error reading allowlist ({e}). Defaulting to blocked.")
        return False
