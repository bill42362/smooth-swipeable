const presets = [
  [
    '@babel/env',
    {
      targets: '> 0.2%, not dead',
      useBuiltIns: 'usage',
      corejs: '3',
    },
  ],
  '@babel/react',
];

const plugins = [
  'lodash',
  'react-hot-loader/babel',
  '@babel/plugin-syntax-dynamic-import',
  ['babel-plugin-styled-components', { ssr: true }],
  '@babel/plugin-proposal-object-rest-spread',
  '@babel/plugin-transform-spread',
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  ['@babel/plugin-proposal-optional-chaining', { loose: false }],
  [
    'transform-assets',
    {
      extensions: ['png', 'jpg', 'gif', 'svg', 'ico'],
      name: '/img/[name].[ext]?[hash:8]',
    },
  ],
];

const overrides = [
  {
    test: ['**/server/**'],
    sourceType: 'unambiguous',
    presets: [
      [
        '@babel/env',
        {
          modules: 'commonjs',
        },
      ],
    ],
  },
];

module.exports = { presets, plugins, overrides };
