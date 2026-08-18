const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Writes public/dist/manifest.json, e.g.:
// {
//   "bundle": { "js": "/dist/bundle.a1b2c3d4.js", "css": "/dist/bundle.a1b2c3d4.css" },
//   "fonts": { "css": "/dist/fonts.e5f6a7b8.css" },
//   "fontawesome": { "css": "/dist/fontawesome.c9d0e1f2.css" }
// }
// so the server can reference the current hashed filenames without hardcoding them.
class AssetManifestPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('AssetManifestPlugin', (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'AssetManifestPlugin',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
                },
                () => {
                    const manifest = {};
                    for (const [name, entrypoint] of compilation.entrypoints) {
                        const files = entrypoint.getFiles().filter((f) => !f.endsWith('.map'));
                        manifest[name] = {};
                        files.forEach((file) => {
                            const ext = path.extname(file).slice(1); // "js" or "css"
                            manifest[name][ext] = `/dist/${file}`;
                        });
                    }
                    const json = JSON.stringify(manifest, null, 2);
                    compilation.emitAsset('manifest.json', new webpack.sources.RawSource(json));
                }
            );
        });
    }
}

module.exports = {
    entry: {
        app: ["./app/public/scripts/app.js", "./app/public/styles/app.scss"],
        cookie_consent: "./app/public/scripts/cookie-consent.js",
        fontawesome: ["./app/public/scripts/fontawesome.js", "./app/public/styles/fontawesome.scss"],
        fonts: "./app/public/styles/fonts.scss",
        winter_theme: "./app/public/scripts/winter-theme.js",
    },
    output: {
        path: path.join(__dirname, 'public/dist'),
        filename: "[name].[contenthash].js"
    },
    optimization: {
        minimize: true
    },
    mode: "production",
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    presets: ['@babel/preset-env']
                }
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'sass-loader'
                ],
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    }
                ],
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                options: {
                    limit: 1000,
                    mimetype: 'application/font-woff'
                }
            },
            {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader"},
            {
                test: /\.png$/,
                loader: 'url-loader',
                options: {
                    limit: 1000
                }
            },
            {
                test: /\.jpg$/,
                loader: 'url-loader',
                options: {
                    limit: 1000
                }
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css"
        }),
        new AssetManifestPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            Popper: ["popper.js", "default"],
            Alert: 'exports-loader?Alert!bootstrap/js/dist/alert',
            Button: 'exports-loader?Button!bootstrap/js/dist/button',
            Carousel: 'exports-loader?Carousel!bootstrap/js/dist/carousel',
            Collapse: 'exports-loader?Collapse!bootstrap/js/dist/collapse',
            Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
            Modal: 'exports-loader?Modal!bootstrap/js/dist/modal',
            Popover: 'exports-loader?Popover!bootstrap/js/dist/popover',
            Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/dist/scrollspy',
            Tab: 'exports-loader?Tab!bootstrap/js/dist/tab',
            Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip",
            Util: 'exports-loader?Util!bootstrap/js/dist/util',
        })
    ]
};