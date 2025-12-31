import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';

export default {
    input: 'index.js',
    output: {
        file: 'dist/plugins/example-plugin.js',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        json(),
        url({
            limit: 0, // always emit files, don't inline
            fileName: 'assets/example-[name][extname]'
        }),
        resolve(),
        commonjs()
    ],
    external: (id) => {
        if (id.startsWith('.') || id.startsWith('/')) return false;
        return false;
    }
};
