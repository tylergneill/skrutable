.PHONY: test test-python test-js smoke-test-npm-package browser-check-js clean-old-builds create-new-build build-test-pypi-package build-official-pypi-package

clean-old-builds:
	rm -rf dist build

create-new-build:
	python setup.py sdist bdist_wheel

build-test-pypi-package: clean-old-builds create-new-build
	twine upload --repository-url https://test.pypi.org/legacy/ dist/* -u __token__ -p $$PYPI_TEST_TOKEN

# test in desired context with:
# pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple skrutable==$VERSION

build-official-pypi-package: clean-old-builds create-new-build
	twine upload dist/* -u __token__ -p $$PYPI_TOKEN

# Run both test suites: the Python library (src/) and the JS library (js/).
test: test-python test-js

test-python:
	cd src && pytest skrutable/tests/

# Installs the JS dev dependencies on first run.
test-js:
	cd js && ([ -d node_modules ] || npm ci) && npm test

# Pack the JS library exactly as `npm publish` would, install it in a
# scratch folder and check that it loads (npm has no test registry like
# TestPyPI). Publishes nothing.
smoke-test-npm-package:
	cd js && ([ -d node_modules ] || npm ci) && ./scripts/smoke_test_package.sh

# Build the JS bundles and serve js/ locally so js/browser_check.html can be
# opened in a real browser (module scripts don't load from file:// pages).
# Stop the server with Ctrl-C.
browser-check-js:
	cd js && ([ -d node_modules ] || npm ci) && npm run build && \
	echo "Open http://localhost:8000/browser_check.html (Ctrl-C to stop)" && \
	python3 -m http.server 8000 --bind 127.0.0.1
