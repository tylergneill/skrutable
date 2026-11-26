# skrutable

A toolkit and online workbench providing 
transliteration, scansion, and meter identification for Sanskrit text,
as well access to powerful sandhi and compound splitting.

Web-app interface live online at [skrutable.info](https://www.skrutable.info).

Install package from [PyPi](https://pypi.org/project/skrutable/) with `pip install skrutable`.

For local development, install in editable mode from the repo root:

```bash
pip install -e .
```

This ensures tests and scripts use the local source instead of any installed version.
Run the tests with `make test-python`.

See [manual.md](https://github.com/tylergneill/skrutable/blob/main/src/skrutable/manual.md) for instructions.

A JavaScript port of the library ([npm](https://www.npmjs.com/package/skrutable-js) package `skrutable-js`)
also lives here, in [js/](https://github.com/tylergneill/skrutable/tree/main/js). It follows the Python library
and may lag behind its latest release.
`make test` runs both test suites.

A browser extension for Chrome and Firefox, built on the JavaScript port, offers the same tools
(transliteration, scansion, meter identification and splitting) in a side panel on any web page, from the toolbar icon or by right-clicking selected text.
It lives with the web app in [skrutable_front_end](https://github.com/tylergneill/skrutable_front_end).

Feedback welcome!
My name is Tyler 
([Academia](https://uni-leipzig1.academia.edu/TylerNeill),
[LinkedIn](https://www.linkedin.com/in/tyler-g-neill/))
and my Gmail is tyler.g.neill. 

And please share and share-alike! Licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).