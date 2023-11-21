export default {
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'dandi',
            fileName: (format) => `dandi.${format}.js`,
            formats: ['es', 'umd'],
        },
    }
}