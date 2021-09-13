import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import { terser } from "rollup-plugin-terser";

export default {
    input: 'src/index.ts',
    output: [{
        file: 'dist/bundle.js',
        name: 'UIGauges',
        format: 'umd'
    },{
        file: 'dist/bundle.min.js',
        name: 'UIGauges',
        format: 'umd',
        plugins: [terser()],
        sourcemap: true,
    },{
        file: 'dist/bundle.esm.js',
        format: 'esm'
    },{
        file: 'dist/bundle.esm.min.js',
        format: 'esm',
        plugins: [terser()],
        sourcemap: true,
    }],
    plugins: [
        nodeResolve(),
        typescript(),
        scss({
            output: 'dist/bundle.min.css',
            outputStyle: 'compressed',
            sourceMap: true,
        }),
    ]
};