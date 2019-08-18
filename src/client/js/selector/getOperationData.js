// getOperationData.js
'use strict';
import { Collection } from 'immutable';
import createCachedSelector from 're-reselect';

/**
 * Select operation data by data key
 * @kind selector
 * @param {Immutable.Map} state - root state.
 * @param {array} selectPath - select path.
 * @param {string} dataKey - data key.
 * @return {any} The selected operation data.
 */
const getOperationData = createCachedSelector(
  (state, selectPath) => state.getIn(['operations', ...selectPath]),
  (state, selectPath, dataKey) => dataKey,
  (operation, dataKey) => {
    let result = undefined;
    if (operation) {
      result = operation.get(dataKey);
    }
    return result instanceof Collection ? result.toJS() : result;
  }
)((state, selectPath, dataKey) => `${selectPath.join(':')}:${dataKey}`);

export default getOperationData;
