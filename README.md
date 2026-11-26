# skrutable

A toolkit and online workbench providing 
transliteration, scansion, and meter identification for Sanskrit text,
as well access to powerful sandhi and compound splitting.

Web-app interface live online at [skrutable.info](https://www.skrutable.info).

skrutable comes in two languages, kept in sync in this repository:

- **Python** ([src/skrutable/](https://github.com/tylergneill/skrutable/tree/main/src/skrutable)): the library behind the web app. Install from [PyPI](https://pypi.org/project/skrutable/) with `pip install skrutable`. See [manual.md](https://github.com/tylergneill/skrutable/blob/main/src/skrutable/manual.md) for instructions.
- **JavaScript** ([js/](https://github.com/tylergneill/skrutable/tree/main/js)): a port that runs entirely in the browser (word splitting aside). Install from [npm](https://www.npmjs.com/package/skrutable-js) with `npm install skrutable-js`. See [js/README.md](https://github.com/tylergneill/skrutable/blob/main/js/README.md) for instructions.

Python leads development, and the JavaScript follows it, version for version.
A browser extension built on the JavaScript library lives with the web app in
[skrutable_front_end](https://github.com/tylergneill/skrutable_front_end).

## Development

For the Python, install in editable mode from the repo root:

```bash
pip install -e .
```

This ensures tests and scripts use the local source instead of any installed version.

For the JavaScript, install its dev dependencies:

```bash
cd js && npm install
```

Run both test suites from the repo root with `make test`
(or one at a time with `make test-python` and `make test-js`).

Feedback welcome!
My name is Tyler 
([Academia](https://uni-leipzig1.academia.edu/TylerNeill),
[LinkedIn](https://www.linkedin.com/in/tyler-g-neill/))
and my Gmail is tyler.g.neill. 

And please share and share-alike! Licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).