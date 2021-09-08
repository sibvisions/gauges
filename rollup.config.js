import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';

export default {
    input: 'src/index.ts',
    output: [{
        file: 'dist/bundle.js',
        name: 'UIGauges',
        format: 'iife'
    },{
        file: 'dist/bundle.cjs.js',
        format: 'cjs'
    }],
    plugins: [
        nodeResolve(),
        typescript(),
        scss({
            output: 'dist/bundle.css'
        }),
    ]
};