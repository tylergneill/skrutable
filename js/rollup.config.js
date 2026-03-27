import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js', // adjust if your path is different
    output: {
        file: 'dist/skrutable.bundle.js',
        format: 'umd', // or 'iife' for direct <script> use
        name: 'Skrutable', // global variable name for browser
    },
    plugins: [resolve(), commonjs()],
};