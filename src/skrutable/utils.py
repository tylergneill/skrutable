import time
from functools import wraps

_DEBUG_TIMING = True

_section_totals = {}  # flat dict of all timing buckets: scan sub-keys, id type keys, wiggle, etc.

def timed(key):
	"""Decorator that accumulates wall time for the wrapped call into _section_totals[key]."""
	def decorator(fn):
		@wraps(fn)
		def wrapper(*args, **kwargs):
			if _DEBUG_TIMING:
				t0 = time.perf_counter()
				result = fn(*args, **kwargs)
				_section_totals[key] = _section_totals.get(key, 0.0) + time.perf_counter() - t0
				return result
			return fn(*args, **kwargs)
		return wrapper
	return decorator
