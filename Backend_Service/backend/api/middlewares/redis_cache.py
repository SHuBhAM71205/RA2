import json
import base64
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from backend.core.reddis import get_redis_client

logger = logging.getLogger(__name__)

# Cache expiration times (in seconds)
PROFILE_CACHE_TTL = 5 * 60  # 5 minutes
RESUME_CACHE_TTL = 60  # 1 minute


async def redis_profile_cache_set(user_id: UUID, profile: dict) -> bool:
    """
    Cache user profile data in Redis with proper serialization.
    
    Args:
        user_id: User UUID
        profile: Profile dictionary to cache
        
    Returns:
        True if successful, False otherwise
    """
    try:
        redis_client = get_redis_client()
        cache_key = f"profile_cache:{user_id}"
        
        # Serialize profile as JSON
        serialized_profile = json.dumps(profile)
        
        # Set with expiration
        await redis_client.set(cache_key, serialized_profile, ex=PROFILE_CACHE_TTL)
        logger.info(f"Profile cached for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Error caching profile for user {user_id}: {str(e)}")
        return False


async def redis_profile_cache_get(user_id: UUID) -> Optional[dict]:
    """
    Retrieve cached user profile from Redis.
    
    Args:
        user_id: User UUID
        
    Returns:
        Profile dictionary if cached, None otherwise
    """
    try:
        redis_client = get_redis_client()
        cache_key = f"profile_cache:{user_id}"
        
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            profile = json.loads(cached_data)
            logger.info(f"Profile cache hit for user {user_id}")
            return profile
        
        logger.info(f"Profile cache miss for user {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving profile cache for user {user_id}: {str(e)}")
        return None


async def redis_resume_cache_set(user_id: UUID, resume_data: bytes) -> bool:
    """
    Cache resume file data in Redis with base64 encoding.
    
    Args:
        user_id: User UUID
        resume_data: Resume file bytes
        
    Returns:
        True if successful, False otherwise
    """
    try:
        redis_client = get_redis_client()
        cache_key = f"resume_cache:{user_id}"
        
        # Encode binary data to base64 for storage
        encoded_resume = base64.b64encode(resume_data).decode('utf-8')
        
        # Store with metadata
        cache_payload = json.dumps({
            "data": encoded_resume,
            "size": len(resume_data),
            "cached_at": datetime.now(timezone.utc).isoformat()
        })
        
        await redis_client.set(cache_key, cache_payload, ex=RESUME_CACHE_TTL)
        logger.info(f"Resume cached for user {user_id} (size: {len(resume_data)} bytes)")
        return True
    except Exception as e:
        logger.error(f"Error caching resume for user {user_id}: {str(e)}")
        return False


async def redis_resume_cache_get(user_id: UUID) -> Optional[bytes]:
    """
    Retrieve cached resume data from Redis.
    
    Args:
        user_id: User UUID
        
    Returns:
        Resume file bytes if cached, None otherwise
    """
    try:
        redis_client = get_redis_client()
        cache_key = f"resume_cache:{user_id}"
        
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            payload = json.loads(cached_data)
            # Decode base64 back to bytes
            resume_bytes = base64.b64decode(payload["data"])
            logger.info(f"Resume cache hit for user {user_id}")
            return resume_bytes
        
        logger.info(f"Resume cache miss for user {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error retrieving resume cache for user {user_id}: {str(e)}")
        return None


async def redis_cache_invalidate(cache_key: str) -> bool:
    """
    Invalidate a cache entry.
    
    Args:
        cache_key: The cache key to invalidate
        
    Returns:
        True if successful, False otherwise
    """
    try:
        redis_client = get_redis_client()
        await redis_client.delete(cache_key)
        logger.info(f"Cache invalidated: {cache_key}")
        return True
    except Exception as e:
        logger.error(f"Error invalidating cache {cache_key}: {str(e)}")
        return False


# Backward compatibility - deprecated functions
async def reddis_profile_cache_middleware(user_id: UUID, profile) -> bool:
    """Deprecated: Use redis_profile_cache_set instead."""
    if isinstance(profile, dict):
        return await redis_profile_cache_set(user_id, profile)
    return False


async def reddis_resume_cache_middleware(user_id: UUID, resume: bytes) -> bool:
    """Deprecated: Use redis_resume_cache_set instead."""
    if isinstance(resume, bytes):
        return await redis_resume_cache_set(user_id, resume)
    return False
