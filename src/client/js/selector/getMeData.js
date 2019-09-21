// getMeData.js
'use strict';
import { Collection } from 'immutable';
import createCachedSelector from 're-reselect';

/**
 * Select me data by data key
 * @kind selector
 * @param {Immutable.Map} state - root state.
 * @param {string} dataKey - select key.
 * @return {any} The selected me data.
 */
const getMeData = createCachedSelector(
  state => state.get('me'),
  (state, dataKey) => dataKey,
  (me, dataKey) => {
    let result = undefined;
    if (me) {
      result = me.get(dataKey);
      if ('source' === dataKey) {
        return {
          dash: 'https://livestream.swag.live/sample.mpd',
          hls: 'https://livestream.swag.live/sample.m3u8',
        };
      }
    }
    return result instanceof Collection ? result.toJS() : result;
  }
)((state, dataKey) => dataKey);

export default getMeData;
