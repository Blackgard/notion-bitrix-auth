const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        popup: './src/js/popup.js',
        content: './src/js/content.js',
        background: './src/js/background.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(html)$/,
                use: ['html-loader'],
            },
        ],
    },
    resolve: { 
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "buffer": require.resolve("buffer/"),
            "stream": require.resolve("stream-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "path": require.resolve("path-browserify")
        }
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    },
    devServer: {
        devMiddleware: {
            writeToDisk: true,
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
        }),
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'src/icons', to: 'icons' }
            ],
        }),
        new CleanWebpackPlugin(),
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './build'),
    },
};