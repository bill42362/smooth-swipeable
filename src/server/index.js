// index.js
import fs from 'fs';
import https from 'https';
import Express from 'express';
import Helmet from 'helmet';

import clientConfig, { hmrConfig } from '../../webpack/client.babel.js';
import renderHtml from './renderHtml.js';

const PORT = process.env.PORT || 3000;
const shouldUseHttps = process.env.USE_HTTPS;

const app = Express();
let server = undefined;
if (shouldUseHttps) {
  server = https.createServer(
    {
      key: fs.readFileSync('./devserver.key'),
      cert: fs.readFileSync('./devserver.crt'),
    },
    app
  );
}
app.use(Helmet());

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const devOptions = {
  logLevel: hmrConfig.logLevel,
  publicPath: clientConfig.output.publicPath,
  stats: {
    cachedAssets: false,
    reasons: true,
    colors: true,
  },
};
const hotOptions = {
  log: hmrConfig.log,
  path: hmrConfig.path,
  heartbeat: hmrConfig.heartbeat,
};

app.use('/img', Express.static(`${__dirname}/../client/img`));

const compiler = webpack(clientConfig);
app.use(webpackDevMiddleware(compiler, devOptions));
app.use(webpackHotMiddleware(compiler, hotOptions));

const jsTags = `
<script type=text/javascript src=/js/bundle.js></script>
<script type=text/javascript src=/js/vendors~bundle.js></script>
`;
renderHtml({ jsTags })
  .then(({ html }) => {
    app.get('/*', (_, response) => response.send(html));

    if (shouldUseHttps) {
      return server.listen(PORT, () =>
        console.log(`Server is listening ${PORT} port.`)
      );
    }
    return app.listen(PORT, () =>
      console.log(`Server is listening ${PORT} port.`)
    );
  })
  .catch(error => console.log('renderHtml() error:', error));
