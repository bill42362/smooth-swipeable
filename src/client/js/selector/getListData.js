// getListData.js
'use strict';
import { Collection } from 'immutable';
import createCachedSelector from 're-reselect';

/**
 * Select list data by data key
 * @kind selector
 * @param {Immutable.Map} state - root state.
 * @param {array} selectPath - select path.
 * @param {string} dataKey - select data key.
 * @return {any} The selected list data.
 */
const getListData = createCachedSelector(
  (state, selectPath) => state.getIn(['lists', ...selectPath]),
  (state, selectPath, dataKey) => dataKey,
  (list, dataKey) => {
    let result = undefined;
    if (list) {
      result = list.get(dataKey);
    }
    return result instanceof Collection ? result.toJS() : result;
  }
)((state, selectPath, dataKey) => `${selectPath.join(':')}:${dataKey}`);

export default getListData;
