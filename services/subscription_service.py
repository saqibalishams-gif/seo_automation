import datetime
from typing import Dict, Any
from utils.db_models import SessionLocal, User, Subscription, UsageRecord, ContentDraft

PLAN_LIMITS = {
    "free": 5,
    "starter": 50,
    "pro": 200,
    "business": 1000
}

def get_or_create_subscription(user_id: int) -> Subscription:
    with SessionLocal() as db:
        sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not sub:
            user = db.query(User).filter(User.id == user_id).first()
            plan = user.subscription_plan if user else "free"
            limit = PLAN_LIMITS.get(plan, 5)
            sub = Subscription(
                user_id=user_id,
                plan=plan,
                status="active",
                article_limit=limit,
                monthly_usage=0,
                start_date=datetime.datetime.utcnow(),
                renewal_date=datetime.datetime.utcnow() + datetime.timedelta(days=30)
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)
        return sub

def check_user_quota(user_id: int) -> bool:
    """
    Returns True if user has remaining article quota, False if quota exceeded.
    """
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
            
        if user.role == "admin":
            return True
            
        # Count drafts created in the last 30 days
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        recent_drafts = db.query(ContentDraft).filter(ContentDraft.user_id == user_id, ContentDraft.created_at >= cutoff).count()
        
        limit = PLAN_LIMITS.get(user.subscription_plan.lower(), 5)
        return recent_drafts < limit

def get_user_usage_summary(user_id: int) -> Dict[str, Any]:
    """
    Returns detailed usage and quota statistics for the user dashboard.
    """
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
            
        plan = user.subscription_plan.lower()
        limit = PLAN_LIMITS.get(plan, 5)
        
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        monthly_articles = db.query(ContentDraft).filter(ContentDraft.user_id == user_id, ContentDraft.created_at >= cutoff).count()
        
        total_drafts = db.query(ContentDraft).filter(ContentDraft.user_id == user_id).count()
        published_count = db.query(ContentDraft).filter(ContentDraft.user_id == user_id, ContentDraft.status == "published").count()
        
        percentage = min(100.0, (monthly_articles / limit) * 100.0) if limit > 0 else 0.0
        
        return {
            "plan": plan.upper(),
            "monthly_usage": monthly_articles,
            "article_limit": limit,
            "usage_percentage": round(percentage, 1),
            "total_drafts": total_drafts,
            "published_count": published_count,
            "quota_exceeded": monthly_articles >= limit
        }
