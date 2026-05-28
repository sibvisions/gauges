import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';

export default [
    {
        input: 'src/index.ts',
        output: [
            { file: 'dist/bundle.js', name: 'UIGauges', format: 'umd' },
            { file: 'dist/bundle.min.js', name: 'UIGauges', format: 'umd', plugins: [terser()], sourcemap: true },
            { file: 'dist/bundle.esm.js', format: 'esm' },
            { file: 'dist/bundle.esm.min.js', format: 'esm', plugins: [terser()], sourcemap: true }
        ],
        plugins: [
            nodeResolve({ extensions: ['.ts', '.js', '.json', '.node', '.scss', '.css'] }),
            typescript({
                rootDir: "src/",
                tsconfig: './tsconfig.json',
                declaration: false 
            }),
            scss({
                fileName: 'bundle.min.css',
                outputStyle: 'compressed',
                sourceMap: true,
            }),
        ]
    },
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/types/bundle.js', 
            format: 'esm'
        },
        plugins: [
            nodeResolve({ extensions: ['.ts', '.scss', '.css'] }),
            typescript({
                rootDir: "src/",
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: "dist/types/", 
                declarationMap: false,
                compilerOptions: {
                    emitDeclarationOnly: true
                }
            }),
            scss({ emitCompileError: false, output: false }),
            del({ 
                targets: 'dist/types/bundle.js', 
                hook: 'closeBundle' 
            })
        ]
    }
];