'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
var normalize = require('../utils/path').normalize;
var Manager = require('../modules/GlobalManager');
var HappyPack = require('happypack');

var envNames = ['local', 'dev', 'prd'];

var Config = function () {
    function Config(cwd) {
        (0, _classCallCheck3.default)(this, Config);

        var dir = normalize(cwd).split('/');
        var projectDir = dir[dir.length - 1];

        // 检查初始环境
        var modulePath = sysPath.join(cwd, 'node_modules');
        if (!fs.existsSync(modulePath)) {
            fs.mkdirSync(modulePath);
            fs.mkdirSync(sysPath.join(cwd, YKIT_CACHE_DIR));
        }

        var extraConfig = {
            cwd: cwd,
            entryExtNames: {
                css: ['.css', '.less', '.sass', '.scss'],
                js: ['.js', '.jsx', '.ts', '.tsx']
            },
            requireRules: ['fekit_modules|fekit.config:main|./src/index.js'],
            middleware: []
        };

        this._config = extend({
            context: sysPath.join(cwd, 'src'),
            entry: {},
            output: {
                local: {
                    path: './prd/',
                    filename: '[name][ext]',
                    chunkFilename: '[id].chunk.js'
                },
                dev: {
                    path: './dev/',
                    filename: '[name][ext]',
                    chunkFilename: '[id].chunk.js'
                },
                prd: {
                    path: './prd/',
                    filename: '[name].min[ext]',
                    chunkFilename: '[id].chunk.min.js'
                }
            },
            module: {
                preLoaders: [],
                loaders: [{
                    // 这里添加 __ykit__ 标识是为了当有其它 js loader 时候去掉此项默认配置
                    test: /\.(js|jsx|__ykit__)$/,
                    exclude: /node_modules/,
                    loader: require.resolve('happypack/loader')
                }, {
                    test: /\.json$/,
                    exclude: /node_modules/,
                    loader: require.resolve('json-loader')
                }, {
                    test: /\.css$/,
                    loader: ExtractTextPlugin.extract(require.resolve('css-loader'))
                }],
                postLoaders: [],
                rules: []
            },
            plugins: [require('../plugins/extTemplatedPathPlugin.js'), require('../plugins/requireModulePlugin.js'), new CaseSensitivePathsPlugin(), new webpack.HashedModuleIdsPlugin(), new extend(HappyPack({
                loaders: [{
                    loader: require.resolve('babel-loader'),
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    query: {
                        cacheDirectory: true,
                        presets: [[require.resolve('babel-preset-env'), {
                            targets: ['> 1%', 'last 3 versions', 'ios 8', 'android 4.2'],
                            useBuiltIns: 'usage',
                            debug: false,
                            modules: false
                        }]],
                        plugins: []
                    }
                }],
                threads: 4,
                verbose: false
            }), { __ykit__: true })],
            resolve: {
                root: [],
                modules: ['node_modules'],
                extensions: ['.js', '.css', '.json', '.string', '.tpl'],
                alias: {}
            },
            devtool: ''
        }, extraConfig);

        Manager.mixYkitConf(extraConfig);
    }

    (0, _createClass3.default)(Config, [{
        key: 'setExports',
        value: function setExports(entries) {
            var _this = this;

            if (entries && Array.isArray(entries)) {
                [].concat(entries).forEach(function (entry) {
                    if (typeof entry === 'string' || Array.isArray(entry)) {
                        var entryFile = Array.isArray(entry) ? entry[entry.length - 1] : entry;

                        // 抽取 entry 名字
                        var name = entryFile;
                        if (name.indexOf('./') == 0) {
                            name = name.substring(2);
                        } else if (name[0] == '/') {
                            name = name.substring(1);
                        }

                        // 兼容 entry "/scripts/xxx" 和 "scripts/xxx" 的形式
                        if (typeof entry === 'string') {
                            if (entry[0] == '/') {
                                entry = '.' + entry;
                            } else if (entry[0] !== '.') {
                                entry = './' + entry;
                            }
                        }

                        _this._config.entry[name] = Array.isArray(entry) ? entry : [entry];
                    }
                });
                return this;
            }
        }
    }, {
        key: 'setOutput',
        value: function setOutput(output) {
            extend(this._config.output, output);
            return this;
        }
    }, {
        key: 'setSync',
        value: function setSync(syncConfig) {
            if (syncConfig) {
                if ((typeof syncConfig === 'undefined' ? 'undefined' : (0, _typeof3.default)(syncConfig)) === 'object') {
                    this._config.sync = syncConfig;
                } else if (typeof syncConfig === 'function') {
                    this._config.sync = syncConfig();
                }
            }
        }
    }, {
        key: 'setCompiler',
        value: function setCompiler(compileConfig, userConfig, env) {
            var _this2 = this;

            if (compileConfig) {
                var nextConfig = {};

                // 获取用户定义的 compile 配置
                if ((typeof compileConfig === 'undefined' ? 'undefined' : (0, _typeof3.default)(compileConfig)) === 'object') {
                    nextConfig = compileConfig;
                } else if (typeof compileConfig === 'function') {
                    nextConfig = compileConfig.bind(userConfig)(extend({}, this._config)) || {};
                }

                // 处理 context
                if (nextConfig.context && !sysPath.isAbsolute(nextConfig.context)) {
                    nextConfig.context = sysPath.resolve(this._config.cwd, nextConfig.context);
                }
                // 处理 loaders => loader
                if (nextConfig.module && nextConfig.module.loaders) {
                    nextConfig.module.loaders.map(function (loader) {
                        if (loader.loaders && !loader.loader) {
                            loader.loader = loader.loaders.join('!');
                            delete loader.loaders;
                        }
                        return loader;
                    });
                }

                // 处理 alias 中 { xyz: "/some/dir" } 的情况
                if (nextConfig.resolve && nextConfig.resolve.alias) {
                    var alias = nextConfig.resolve.alias;
                    (0, _keys2.default)(alias).map(function (key) {
                        var isRelativePath = alias[key].indexOf(USER_HOME) === -1 && alias[key].indexOf(process.cwd()) === -1;
                        if (key.indexOf('$') !== key.length - 1 && /^\/.+/.test(alias[key]) && isRelativePath) {
                            alias[key] = normalize(sysPath.join(_this2._config.cwd, alias[key]));
                        }
                    });
                    extend(true, this._config.resolve.alias, alias);
                }

                // 处理 output
                var userOutputObj = extend({}, nextConfig.output);
                envNames.forEach(function (name) {
                    return delete userOutputObj[name];
                });
                nextConfig.output[env] = extend({}, nextConfig.output[env], userOutputObj);

                extend(true, this._config, nextConfig);
            }
        }
    }, {
        key: 'getConfig',
        value: function getConfig() {
            return this._config;
        }
    }, {
        key: 'getWebpackConfig',
        value: function getWebpackConfig() {
            return this.getConfig();
        }
    }, {
        key: 'applyMiddleware',
        value: function applyMiddleware(mw) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            if (typeof mw === 'function') {
                if (options.global) {
                    mw.global = true;
                }
                Manager.mixYkitConf({
                    middleware: Manager.getYkitConf('middleware').concat(mw)
                });
            }
        }
    }, {
        key: 'getMiddlewares',
        value: function getMiddlewares() {
            return Manager.getYkitConf('middleware');
        }
    }]);
    return Config;
}();

module.exports = Config;