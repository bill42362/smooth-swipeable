// buildHtml.js
'use strict';
import fs from 'fs';
import HtmlMinifier from 'html-minifier';
import flushChunks from 'webpack-flush-chunks';

import EnvConfig from '../../config.json';
import renderHtml from './renderHtml.js';

const nodeEnv = process.env.NODE_ENV || EnvConfig.NODE_ENV || 'production';
const isProd = 'production' === nodeEnv;
const minifyConfig = {
  collapseWhitespace: true,
  html5: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  minifyJS: true,
};

const buildHtml = async () => {
  const clientStats = require(`../../dist/client/stats.json`);

  const { assets, children } = clientStats;
  const [pwaManifestAsset] = assets.filter(asset =>
    asset.name.match(/^manifest.*\.json$/gi)
  );
  const pwaManifestTag = pwaManifestAsset
    ? `<link rel=manifest href=/${pwaManifestAsset.name}>`
    : '';

  const faviconPlugin = children.filter(child =>
    child.name.match('favicon')
  )[0];
  let faviconTags = '';
  if (faviconPlugin) {
    faviconTags = eval(faviconPlugin.modules[0].source)
      .html.join('')
      .replace('black-translucent', 'black');
  }

  const { js } = flushChunks(clientStats, {
    chunkNames: [],
    before: ['vendors'],
    after: ['bundle'],
  });
  const jsTags = js.toString();
  const relativeJsTags = jsTags.replace(/='\/js/gi, "='js");

  const { html } = await renderHtml({
    jsTags: EnvConfig.USE_ABSOLUTE_ROUTE ? relativeJsTags : jsTags,
    faviconTags,
    pwaManifestTag,
    preloadedState: {},
  });

  const minifiedHtml = HtmlMinifier.minify(html, minifyConfig);
  const path = `${__dirname}/../../dist/client/html`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
    console.log(`/dist/client/html dir created.`);
  }
  fs.writeFileSync(`${path}/index.html`, minifiedHtml, 'utf8');

  return { html: minifiedHtml };
};

buildHtml().catch(error => console.log('buildHtml() error:', error));
