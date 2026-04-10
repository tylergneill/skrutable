import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/skrutable.bundle.js',
        format: 'umd',
        name: 'Skrutable',
    },
    plugins: [resolve(), commonjs(), json()],
};