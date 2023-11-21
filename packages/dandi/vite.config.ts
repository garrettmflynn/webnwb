import { dirname } from 'node:path';
import { exec } from 'node:child_process'

import chalk from 'chalk';

const __dirname = dirname(new URL(import.meta.url).pathname);

export default {
    plugins: [
        {
            name: 'dts-generator',
            buildEnd: (error?: Error) => {
                if (!error) {
                return new Promise((res, rej) => {
                    exec(`tsc --emitDeclarationOnly --outDir ./dist/types`,{
                    cwd: __dirname
                    }, (err, stdout, stderr) => {
                        console.log(chalk.yellow(stdout))
                        res()
                    });
                });
                }
            },
        }
    ],
    build: {
        emptyOutDir: false,
        lib: {
            entry: 'src/index.ts',
            name: 'dandi',
            fileName: (format) => `dandi.${format}.js`,
            formats: ['es', 'umd'],
        },
    }
}