.PHONY: test test-python test-js clean-old-builds create-new-build build-test-pypi-package build-official-pypi-package

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
