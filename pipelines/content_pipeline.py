from typing import Optional, Tuple
from utils.logger import get_logger
from agents.discovery_agent import Candidate
from agents.history_agent import check_candidate
from agents.research_agent import ResearchAgent
from agents.content_agent import ContentAgent, check_differentiation, ArticleDraft
from agents.fact_verification_agent import verify_claims, get_trusted_facts
from agents.image_agent import ImageAgent
from agents.compliance_agent import check_market_allowlist
from agents.wordpress_agent import WordPressAgent

logger = get_logger("content_pipeline")

def run_single_candidate(candidate: Candidate, target_market: str, db_path: str = None, dry_run: bool = False) -> Tuple[Optional[ArticleDraft], str]:
    """
    Runs a single candidate through the strict Phase 8 pipeline sequence.
    Returns a tuple of (draft, status_reason).
    """
    logger.info(f"Starting pipeline for {candidate.provider} - {candidate.game_name} (Market: {target_market}) [Dry Run: {dry_run}]")
    kwargs = {'db_path': db_path} if db_path else {}
    
    # 1. History Gate (Phase 2)
    if not check_candidate(candidate.game_name, candidate.provider, **kwargs):
        logger.info(f"Pipeline stopped: {candidate.game_name} blocked by History Gate.")
        return None, "BLOCKED_HISTORY"
        
    # 2. Research (Phase 4)
    research_agent = ResearchAgent()
    context = research_agent.gather_context(candidate)
    
    # 3. Content Drafting (Phase 4) & Differentiation (Phase 5)
    trusted_facts = get_trusted_facts(candidate.game_name, candidate.provider, **kwargs)
    if not trusted_facts:
        logger.warning(f"No trusted facts found for {candidate.game_name}. AI will invent suitable facts.")
        trusted_facts = {}
        
    content_agent = ContentAgent()
    draft = content_agent.draft_article(candidate, context, trusted_facts)
    
    if not check_differentiation(draft.body):
        logger.error("Pipeline stopped: Draft failed editorial differentiation check.")
        return None, "FAILED_DIFFERENTIATION"
        
    # 4. Fact Verification (Phase 3)
    proposed_claims = {k: v for k, v in trusted_facts.items() if v is not None}
    status, diff = verify_claims(candidate.game_name, candidate.provider, proposed_claims, **kwargs)
    if status != 'MATCH':
        logger.error(f"Pipeline stopped: Fact verification failed with status {status}.")
        return None, f"FAILED_FACT_VERIFICATION_{status}"
        
    # 5. Image Processing Gate (Phase 6)
    image_agent = ImageAgent()
    local_images = image_agent.process_images(candidate)
    
    # 6. Compliance Gate (Phase 7)
    if not check_market_allowlist(target_market):
        logger.info(f"Pipeline stopped: Market '{target_market}' blocked by Compliance Gate.")
        return None, "BLOCKED_COMPLIANCE"
        
    # 7. WordPress Publisher (Phase 7)
    if dry_run:
        logger.info(f"DRY RUN: Would have pushed draft for {candidate.game_name} to WordPress.")
        article_id = "dry_run_id"
    else:
        wp_agent = WordPressAgent()
        article_id = wp_agent.push_draft(draft, images=local_images)
        if not article_id:
            logger.error("Pipeline stopped: Failed to push to WordPress.")
            return None, "FAILED_WP_PUSH"
        
    logger.info(f"Pipeline completed successfully for {candidate.game_name}.")
    return draft, "SUCCESS"
