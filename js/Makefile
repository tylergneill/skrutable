# dist/extension/chrome/ and dist/extension/firefox/ are committed so that
# the extension can be loaded unpacked or zipped for store submission without
# requiring a build step. Run the appropriate target below after any changes.

.PHONY: build build-extension-chrome build-extension-firefox \
        release-extension-chrome release-extension-firefox \
        all clean

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

clean:
	rm -rf dist/
