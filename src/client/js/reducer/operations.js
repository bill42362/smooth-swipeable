// operations.js
'use strict';
import { fromJS } from 'immutable';
import {
  MERGE_OPERATION_DATA,
  REMOVE_OPERATION_DATA,
  // -- PLOP_PREPEND_REDUCER_ACTION_TYPE --
  LOGOUT,
} from '../ActionTypes.js';

export const defaultState = fromJS({
  chatroom: {
    inputValue: '',
  },
});

/**
 * Operations.
 * @module reducer/operations
 */
const operations = (state = defaultState, action) => {
  switch (action.type) {
    case MERGE_OPERATION_DATA:
      return _MERGE_OPERATION_DATA(action.payload)(state);
    case REMOVE_OPERATION_DATA:
      return _REMOVE_OPERATION_DATA(action.payload)(state);
    // -- PLOP_PREPEND_REDUCER_SWITCH_CASE --
    case LOGOUT:
      return _LOGOUT(action.payload)(state);
    default:
      return state;
  }
};

/**
 * Merge operation data
 * @kind reducer/actionType
 * @name MERGE_OPERATION_DATA
 * @param {array} {selectPath} - operation data select path
 * @param {any} {data} - operation data
 * @return {Immutable.Map} New state
 */
const _MERGE_OPERATION_DATA = ({ selectPath, data }) => state => {
  return state.mergeDeepIn(selectPath, data);
};

/**
 * Remove operation data
 * @kind reducer/actionType
 * @name REMOVE_OPERATION_DATA
 * @param {array} {selectPath} - operation data select path
 * @return {Immutable.Map} New state
 */
const _REMOVE_OPERATION_DATA = ({ selectPath }) => state => {
  return state.setIn(selectPath, defaultState.getIn(selectPath));
};

// -- PLOP_PREPEND_REDUCER_ACTION_HANDLER --

/**
 * Logout
 * @kind reducer/actionType
 * @name LOGOUT
 * @return {Immutable.Map} New state
 */
const _LOGOUT = () => () => {
  return defaultState;
};

export default operations;
