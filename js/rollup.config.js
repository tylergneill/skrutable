import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.js',
    output: [
        // For <script> tags and CDN links: exposes a global `Skrutable`.
        {
            file: 'dist/skrutable.bundle.js',
            format: 'umd',
            name: 'Skrutable',
        },
        // For `import` in browsers and bundlers: the JSON data is inlined,
        // so no import attributes are needed.
        {
            file: 'dist/skrutable.esm.js',
            format: 'es',
        },
    ],
    plugins: [resolve(), commonjs(), json()],
};