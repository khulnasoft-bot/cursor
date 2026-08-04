// const path = require('path');
module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main/index.ts',
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    externals: 'node-pty',
    cache: {
        type: 'filesystem',
    },
    resolve: {
        // modules: [path.resolve(__dirname, 'src', 'main'), 'node_modules'],
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
        fallback: {
            'node:util': require.resolve('util'),
            'node:zlib': require.resolve('browserify-zlib'),
            'node:buffer': require.resolve('buffer'),
            'node:stream': require.resolve('stream-browserify'),
            'node:events': require.resolve('events'),
        },
    },
}
