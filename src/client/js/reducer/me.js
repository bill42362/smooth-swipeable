// me.js
'use strict';
import { fromJS } from 'immutable';

import { MERGE_ME_DATA, LOGOUT } from '../ActionTypes.js';

export const defaultState = fromJS({});

/**
 * Personal data including authing, preference, balance, etc.
 * @module reducer/me
 */
const me = (state = defaultState, action) => {
  switch (action.type) {
    case MERGE_ME_DATA:
      return _MERGE_ME_DATA(action.payload)(state);
    case LOGOUT:
      return _LOGOUT(action.payload)(state);
    default:
      return state;
  }
};

/**
 * Merge me data
 * @kind reducer/actionType
 * @name MERGE_ME_DATA
 * @param {object} meData - meData
 * @return {Immutable.Map} New state
 */
const _MERGE_ME_DATA = meData => state => {
  return state.mergeDeep(meData);
};

/**
 * Logout
 * @kind reducer/actionType
 * @name LOGOUT
 * @return {Immutable.Map} New state
 */
const _LOGOUT = () => () => {
  return defaultState;
};

export default me;
