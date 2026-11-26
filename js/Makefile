# dist/extension/ is gitignored. Run 'make all' to build locally for testing,
# or 'make release-extension-*' to build release builds before store submission.

.PHONY: build build-extension-chrome build-extension-firefox \
        release-extension-chrome release-extension-firefox \
        all clean-bundle clean-extensions clean

# Build the skrutable JS library bundle (dist/skrutable.bundle.js)
build:
	npm run build

# Build the Chrome extension for local development (bundles local dist/)
build-extension-chrome:
	node extension/build.cjs chrome

# Build the Firefox extension for local development (bundles local dist/)
build-extension-firefox:
	node extension/build.cjs firefox

# Build the Chrome extension for release (uses CDN bundle URL)
release-extension-chrome:
	node extension/build.cjs chrome --release

# Build the Firefox extension for release (uses CDN bundle URL)
release-extension-firefox:
	node extension/build.cjs firefox --release

# Build library + both extensions for local development
all: build build-extension-chrome build-extension-firefox

# Remove the built library bundle.
clean-bundle:
	rm -f dist/skrutable.bundle.js

clean-extensions:
	rm -rf dist/extension/

clean: clean-bundle clean-extensions
