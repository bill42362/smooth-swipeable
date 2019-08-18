// polyfill.js
'use strict';
import URLSearchParams from '@ungap/url-search-params';

if (!window.URLSearchParams) {
  window.URLSearchParams = URLSearchParams;
}
