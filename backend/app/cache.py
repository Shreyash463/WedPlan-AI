"""Thread-safe in-memory TTL LRU Cache for AI responses and calculations."""
from __future__ import annotations

import collections
import threading
import time
from typing import Any


class TTLCache:
    """Least Recently Used (LRU) Cache with Time-To-Live (TTL) expiration."""

    def __init__(self, maxsize: int = 256, ttl_seconds: int = 3600) -> None:
        self.maxsize = maxsize
        self.ttl = ttl_seconds
        self._cache: collections.OrderedDict[str, tuple[Any, float]] = collections.OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        """Retrieve an item if it exists and has not expired."""
        with self._lock:
            if key not in self._cache:
                return None
            value, expires_at = self._cache[key]
            if time.time() > expires_at:
                del self._cache[key]
                return None
            # Move to end (mark as recently used)
            self._cache.move_to_end(key)
            return value

    def set(self, key: str, value: Any) -> None:
        """Store an item with an expiration timestamp."""
        with self._lock:
            now = time.time()
            if key in self._cache:
                del self._cache[key]
            elif len(self._cache) >= self.maxsize:
                # Evict oldest entry
                self._cache.popitem(last=False)
            self._cache[key] = (value, now + self.ttl)

    def clear(self) -> None:
        """Clear all entries in the cache."""
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        """Return the count of active unexpired items."""
        with self._lock:
            now = time.time()
            # Clean expired on inspect
            expired_keys = [k for k, (_, exp) in self._cache.items() if now > exp]
            for k in expired_keys:
                del self._cache[k]
            return len(self._cache)


# Global ideas cache instance
ideas_cache = TTLCache(maxsize=300, ttl_seconds=3600)
