// webpack.dev.js

const webpack = require('webpack');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const stickyboardConfig = require('./stickyboard.config');

const NODE_ENV = process.env.NODE_ENV || 'production';
const isProductionMode = NODE_ENV === 'production';
const isWebpackDevServerMode = process.env.WEBPACK_DEV_SERVER_MODE === 'true';
console.log('================ webpack.config.js ================');
console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`isProductionMode: ${isProductionMode}`);
console.log(`isWebpackDevServerMode: ${isWebpackDevServerMode}`);
console.log('================================================');

// Load .env configuration
const envFilePath = isProductionMode ? '.env.production' : '.env.development';
const envLoadResult = require('dotenv').config({ path: envFilePath }).parsed;
if (envLoadResult.error) {
    throw envLoadResult.error;
}
// reduce it to an object
const envKeys = Object.keys(envLoadResult).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(envLoadResult[next]);
    return prev;
}, {});

const config = {
    mode: NODE_ENV,
    entry: path.join(__dirname, 'src', 'index.js'),
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].[hash].js',
        publicPath: isWebpackDevServerMode ? '/' : '/dist/',
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                    plugins: [
                        '@babel/plugin-proposal-class-properties',
                        '@babel/plugin-proposal-export-default-from',
                        '@babel/plugin-proposal-object-rest-spread',
                        '@babel/plugin-syntax-dynamic-import',
                        '@babel/plugin-transform-runtime',
                        [
                            'babel-plugin-transform-imports',
                            {
                                '@material-ui/core': {
                                    'transform': '@material-ui/core/esm/${member}',
                                    'preventFullImport': true
                                },
                                '@material-ui/icons': {
                                    'transform': '@material-ui/icons/esm/${member}',
                                    'preventFullImport': true
                                }
                            }
                        ]
                    ]
                }
            },
        }, {
            test: /\.css$/,
            loaders: [
                'style-loader',
                'css-loader'
            ]
        }, {
            test: /\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
            use: {
                loader: 'file-loader',
                options: {
                    name(file) {
                        if (process.env.NODE_ENV === 'development') {
                            return '[path][name].[ext]';
                        }

                        return '[contenthash].[ext]';
                    },
                },
            }
        }]
    },
    resolve: {
        modules: ['src', 'node_modules'],
        alias: {
            react: path.resolve('./node_modules/react')
        },
        symlinks: false,
    },
    plugins: [
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        new webpack.DefinePlugin(envKeys),
        // Ignore all locale files of moment.js
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new HtmlWebpackPlugin({
            ...stickyboardConfig,
            template: 'src/view/index.ejs',
        }),
        new CompressionPlugin({
            filename: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0.8
        }),
        // If you want to run bundle analyzer,
        // release below comments with require statements above
        // new BundleAnalyzerPlugin({
        //     analyzerHost: '127.0.0.1',
        //     analyzerPort: 9000
        // })
    ],
    node: {
        fs: 'empty'
    }
}

if (!isProductionMode) {
    config['devtool'] = 'inline-source-map';
}

// Add devServer config if the mode is webpack dev server mode
if (isWebpackDevServerMode) {
    config['devServer'] = {
        contentBase: path.join(__dirname, 'dist'),
        hot: true,
        inline: true,
        compress: true,
        public: 'localhost:8080',
    };
}

module.exports = config;
