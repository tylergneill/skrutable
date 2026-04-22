.PHONY: examples tests build-scheme-detection-vectors test-scheme-detection-small test-scheme-detection-verbose test-scheme-detection-medium test-scheme-detection-medium-verbose test-scheme-detection-large test-scheme-detection-large-verbose

examples:
	python run_examples.py

tests:
	pytest tests

build-scheme-detection-vectors:
	python -m skrutable.generate_scheme_vectors

DETECTION_SEED=123

test-scheme-detection-small:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py

test-scheme-detection-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -s

test-scheme-detection-medium:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py -k medium

test-scheme-detection-medium-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -k medium -s

test-scheme-detection-large:
	DETECTION_SEED=$(DETECTION_SEED) pytest tests/unit_tests/test_scheme_detection.py -k large

test-scheme-detection-large-verbose:
	DETECTION_SEED=$(DETECTION_SEED) DETECTION_VERBOSE=1 pytest tests/unit_tests/test_scheme_detection.py -k large -s
