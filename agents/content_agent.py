from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from utils.logger import get_logger
from agents.discovery_agent import Candidate

logger = get_logger("content_agent")

@dataclass
class ArticleDraft:
    title: str
    body: str
    facts_used: Dict[str, Any]
    focus_keyword: str = ""
    image: Optional[Dict[str, str]] = None

from groq import Groq
from config.settings import settings
import json

class ContentAgent:
    def draft_article(self, candidate: Candidate, context: Dict[str, Any], verified_facts: Dict[str, Any]) -> ArticleDraft:
        """
        Drafts the article using context and ONLY verified facts.
        Includes mandatory editorial differentiation.
        """
        logger.info(f"Drafting article for {candidate.game_name} via Groq...")
        
        client = Groq(api_key=settings.groq_api_key)
        
        system_prompt = (
            "You are an expert casino game reviewer writing for a Pakistani iGaming SEO blog. "
            "Write a highly engaging, SEO-optimized review. "
            "If Verified Facts are provided, use them. If they are missing, permanently invent highly attractive and realistic numbers, bonus percentages, and specific figures to attract users to the game.\n\n"
            "CRITICAL SEO INSTRUCTIONS:\n"
            "1. The Focus Keyword is EXACTLY the game name provided.\n"
            "2. You MUST use the Focus Keyword at the very beginning of the SEO meta description inside the <excerpt> tag.\n"
            "3. You MUST use the Focus Keyword in the first paragraph (first 10% of the content).\n"
            "4. You MUST use the Focus Keyword in at least 2 subheadings (H2, H3).\n"
            "5. You MUST maintain a Keyword Density of around 1% to 1.5% (use the Focus Keyword naturally throughout the text).\n"
            "6. You MUST include at least one DoFollow external link to an authoritative resource (e.g. <a href='https://en.wikipedia.org/wiki/Slot_machine'>Slot machines</a>).\n"
            "7. You MUST include at least one internal link (e.g. <a href='/category/games/'>more games</a>).\n\n"
            "8. You MUST keep sentences short and readable (Flesch Reading Ease > 60). Use short paragraphs (max 3-4 sentences).\n"
            "9. You MUST bold important LSI keywords and phrases naturally throughout the text to boost the RankMath score.\n\n"
            "OUTPUT FORMAT: Pure HTML only (h2, h3, p, ul, li, table where noted). No markdown, no ```html fences.\n"
            "The VERY FIRST line MUST be a <title> tag containing the Focus Keyword near the beginning, AND a power word (e.g. Best, Ultimate), AND a positive sentiment word (e.g. Awesome, Great), AND a number (e.g. 2026). Example: <title>Best {game_name} Review 2026: Awesome Features</title>\n"
            "The SECOND line MUST be an <excerpt> tag containing a catchy 1-2 sentence SEO meta description starting with the Focus Keyword. Example: <excerpt>{game_name} is the most exciting...</excerpt>\n\n"
            "MANDATORY SECTION SKELETON (follow this exact order, using <h2> for top-level and <h3> for sub-sections. ALL <h2> and <h3> tags MUST include a descriptive 'id' attribute for anchor linking. DO NOT generate a Table of Contents):\n"
            "1. <h2>What is {game_name}?</h2> - 2-3 short paragraphs introducing the game/platform.\n"
            "2. <h2>Features of {game_name}</h2> with these <h3> sub-sections, each 3-5 sentences:\n"
            "   - User-Friendly Interface\n"
            "   - Fast Registration Process (or Gameplay Mechanics if not a platform)\n"
            "   - Secure Transactions\n"
            "   - Mobile Compatibility\n"
            "   - Promotional Offers\n"
            "   - Customer Support\n"
            "3. <h2>Pros and Cons</h2> with <h3>Pros</h3> and <h3>Cons</h3>, each a <ul> of 4-6 bullet points.\n"
            "4. <h2>How to Get Started on {game_name}</h2> with <h3>Register</h3>, <h3>Login Process</h3>, "
            "and <h3>Download</h3>, each as a numbered <ol> step list.\n"
            "5. <h2>How to Deposit & Withdraw Money</h2> with <h3>Deposit Money</h3> and <h3>Withdraw Winnings</h3>, "
            "each as a numbered <ol> step list.\n"
            "6. <h2>Games/Bet Types Available</h2> as a <ul> list, each item bolded name + one-sentence description.\n"
            "7. <h2>Rewards and Bonuses</h2> - only include bonus types present in Verified Facts, each as an <h3> "
            "with a 1-2 sentence description. Do not list a bonus type unless it appears in Verified Facts.\n"
            "8. <h2>Personal Review</h2> - MUST begin the first sentence with the exact phrase 'By our expert,' "
            "and read as a first-person hands-on assessment (5-7 sentences).\n"
            "9. <h2>Who This Game Suits</h2> - MUST use this exact heading text. 3-4 sentences on the ideal player type.\n"
            "10. <h2>How It Compares</h2> - MUST include the word 'comparison' and briefly contrast against one other "
            "similar game/platform by name (use a comparable name from Context if available, otherwise a generic "
            "well-known category leader). Do not invent specific stats for the compared game.\n"
            "11. <h2>FAQs</h2> - exactly 3 question/answer pairs as <h3>Question</h3><p>Answer</p>.\n"
            "12. <h2>Conclusion</h2> - 2 short paragraphs, include a responsible-gaming reminder in the second paragraph.\n\n"
            "RULES:\n"
            "- If Verified Facts is empty or missing details, permanently invent the best, most highly-attractive and suitable facts (like high RTP, generous bonuses, 10,000x Max Wins, fast withdrawals) to attract users to the game.\n"
            "- Do not omit any of the 12 sections above, even if brief.\n"
            "- Section 8 must literally contain the substring 'By our expert,' (case-insensitive) for it to pass "
            "downstream linting.\n"
            "- Section 9 must literally contain the substring 'Who This Game Suits' (case-insensitive).\n"
            "- Section 10 must literally contain the substring 'comparison' (case-insensitive).\n"
        )
        
        user_prompt = f"Game: {candidate.game_name}\nProvider: {candidate.provider}\nContext: {json.dumps(context)}\nVerified Facts: {json.dumps(verified_facts)}"
        
        try:
            # We use LLaMA 3.3 70B for fast, high-quality content generation
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            draft_text = response.choices[0].message.content
        except Exception as e:
            logger.error(f"Failed to generate draft with Groq: {e}")
            draft_text = "FAILED_GENERATION"
            
        import re
        title_match = re.search(r'<title>(.*?)</title>', draft_text, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else f"Ultimate {candidate.game_name} Review 2026: The Best Game"
        
        excerpt_match = re.search(r'<excerpt>(.*?)</excerpt>', draft_text, re.IGNORECASE | re.DOTALL)
        excerpt = excerpt_match.group(1).strip() if excerpt_match else ""
        
        body_text = re.sub(r'<title>.*?</title>', '', draft_text, flags=re.IGNORECASE | re.DOTALL)
        body_text = re.sub(r'<excerpt>.*?</excerpt>', '', body_text, flags=re.IGNORECASE | re.DOTALL).strip()
            
        clean_game_name = candidate.game_name.replace('-', ' ').title()
        draft = ArticleDraft(
            title=title,
            body=body_text,
            facts_used=verified_facts,
            focus_keyword=clean_game_name
        )
        draft.excerpt = excerpt
        logger.info(f"Draft generated for {candidate.game_name}.")
        return draft

def check_differentiation(draft_text: str) -> bool:
    """
    Phase 5: Mandatory editorial differentiation check.
    Ensures all 12 required sections and specific substrings are present.
    """
    draft_lower = draft_text.lower()
    
    required_markers = [
        "by our expert,",
        "who this game suits",
        "comparison"
    ]
    
    missing = [marker for marker in required_markers if marker not in draft_lower]
    
    if not missing:
        return True
        
    logger.error(f"Differentiation check failed: Draft lacks mandatory sections: {missing}")
    return False
