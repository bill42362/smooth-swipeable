// client.babel.js
import {
  EnvironmentPlugin,
  HotModuleReplacementPlugin,
  NoEmitOnErrorsPlugin,
} from 'webpack';
import os from 'os';
import HappyPack, { ThreadPool } from 'happypack';
import StatsPlugin from 'stats-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import gifsicle from 'imagemin-gifsicle';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import svgo from 'imagemin-svgo';

import EnvConfig from '../config.json';

const happyThreadPool = ThreadPool({ size: os.cpus().length });
const nodeEnv = process.env.NODE_ENV || EnvConfig.NODE_ENV || 'production';
const isProd = 'production' === nodeEnv;
const plugins = [
  new EnvironmentPlugin(EnvConfig),
  new StatsPlugin('stats.json'),
  new HappyPack({
    id: 'eslint',
    threadPool: happyThreadPool,
    debug: false,
    verbose: false,
    loaders: ['eslint-loader'],
  }),
  new HappyPack({
    id: 'babel',
    threadPool: happyThreadPool,
    debug: false,
    verbose: false,
    loaders: [{ loader: 'babel-loader', options: { cacheDirectory: true } }],
  }),
];
const devPlugins = [
  new HotModuleReplacementPlugin(),
  new NoEmitOnErrorsPlugin(),
];
const prodPlugins = [];

if (process.env.BUNDLE_ANALYSE) {
  prodPlugins.push(new BundleAnalyzerPlugin());
}

// hot middleware
export const hmrConfig = {
  path: '/__webpack_hmr',
  timeout: 20000,
  reload: true,
  logLevel: 'warn',
  log: console.log,
  heartbeat: 10 * 1000,
};
const hotMiddlewareScript = `webpack-hot-middleware/client?path=${hmrConfig.path}&timeout=${hmrConfig.timeout}&reload=${hmrConfig.reload}`;

const bundle = ['./src/client/js/index.js'];
const devBundle = [hotMiddlewareScript];

export default {
  name: 'client',
  entry: {
    bundle: isProd ? bundle : [...bundle, ...devBundle],
  },
  output: {
    filename: isProd ? 'js/[name].[chunkhash:8].js' : 'js/[name].js',
    path: `${__dirname}/../dist/client/`,
    publicPath: '/',
    globalObject: "(typeof self !== 'undefined' ? self : this)",
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [{ loader: 'happypack/loader', options: { id: 'eslint' } }],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [{ loader: 'happypack/loader', options: { id: 'babel' } }],
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico|ttf|eof|otf)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1024,
              fallback: 'file-loader',
              name: isProd ? 'img/[name].[hash:8].[ext]' : 'img/[name].[ext]',
            },
          },
          {
            loader: 'img-loader',
            options: {
              enabled: isProd,
              plugins: [
                gifsicle({ interlaced: false }),
                mozjpeg({ progressive: true, arithmetic: false }),
                pngquant({ speed: 2, strip: true }),
                svgo({
                  plugins: [{ removeTitle: true }, { convertPathData: false }],
                }),
              ],
            },
          },
        ],
      },
    ],
  },
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'source-map' : 'cheap-eval-source-map',
  plugins: isProd ? [...plugins, ...prodPlugins] : [...plugins, ...devPlugins],
  optimization: {
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
        parallel: true,
      }),
    ],
    splitChunks: {
      chunks: chunk => chunk.name !== 'serviceWorker',
      minSize: 50000,
      minChunks: 1,
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
