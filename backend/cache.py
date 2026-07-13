import redis
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6380, db=1, decode_responses=True)

def cache_result(key_prefix, expiry=300):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{str(args)}:{str(kwargs)}"
            try:
                cached = redis_client.get(cache_key)
                if cached:
                    print(f"Cache HIT: {cache_key}")
                    return json.loads(cached)
            except Exception as e:
                print(f"Cache error: {e}")
            print(f"Cache MISS: {cache_key}")
            result = f(*args, **kwargs)
            try:
                redis_client.setex(cache_key, expiry, json.dumps(result))
            except Exception as e:
                print(f"Cache store error: {e}")
            return result
        return wrapper
    return decorator

def clear_cache(pattern):
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            print(f"Cleared {len(keys)} cache entries")
    except Exception as e:
        print(f"Cache clear error: {e}")

def get_cache_stats():
    try:
        info = redis_client.info()
        return {
            'used_memory': info.get('used_memory_human', 'N/A'),
            'total_keys': redis_client.dbsize(),
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0)
        }
    except Exception as e:
        return {'error': str(e)}
