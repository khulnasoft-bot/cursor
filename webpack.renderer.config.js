const rules = require('./webpack.rules')

rules.push({
    test: /\.css$/,
    use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    plugins: [require('tailwindcss'), require('autoprefixer')],
                },
            },
        },
    ],
})

rules.push({})

module.exports = {
    // Put your normal webpack config below here
    module: {
        rules,
    },
    cache: {
        type: 'filesystem',
    },
    externals: 'node-pty',
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
        fallback: {
            fs: false,
            path: false,
            url: false,
            os: false,
            http: false,
            https: false,
            util: require.resolve('util'),
            stream: require.resolve('stream-browserify'),
            crypto: false,
            querystring: false,
            assert: require.resolve('assert'),
            'node:util': require.resolve('util'),
            'node:zlib': require.resolve('browserify-zlib'),
            'node:buffer': require.resolve('buffer'),
            'node:stream': require.resolve('stream-browserify'),
            'node:events': require.resolve('events'),
            'node:assert': require.resolve('assert'),
        },
    },
}
