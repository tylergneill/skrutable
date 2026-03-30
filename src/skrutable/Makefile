test:
	pytest tests

DETECTION_SEED=123

test-small-scheme:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py

test-small-scheme-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -s

test-med-scheme:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py -k medium

test-med-scheme-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -k medium -s

test-large-scheme:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py -k large

test-large-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -k large -s
