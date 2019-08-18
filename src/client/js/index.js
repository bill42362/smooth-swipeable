// index.js
'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { fromJS } from 'immutable';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import ReactGA from 'react-ga';

import reducer from './reducer/reducer.js';
import App from './component/App.jsx';

const isProd = 'production' === process.env.NODE_ENV;

if (process.env.GOOGLE_ANALYTICS_ID) {
  ReactGA.initialize(process.env.GOOGLE_ANALYTICS_ID, { debug: false });
  ReactGA.pageview(window.location.pathname + window.location.search);
}

// Store:
const composeEnhancer = isProd
  ? compose
  : window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  reducer,
  fromJS({}),
  composeEnhancer(applyMiddleware(thunk))
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-root')
);
