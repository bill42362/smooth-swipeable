// lists.js
'use strict';
import { fromJS } from 'immutable';
import {
  ADD_LIST_ITEMS,
  REMOVE_LIST_ITEMS,
  SET_LIST_ITEMS,
  // -- PLOP_PREPEND_REDUCER_ACTION_TYPE --
  LOGOUT,
} from '../ActionTypes.js';

export const defaultState = fromJS({});

/**
 * Lists.
 * @module reducer/lists
 */
const lists = (state = defaultState, action) => {
  switch (action.type) {
    case ADD_LIST_ITEMS:
      return _ADD_LIST_ITEMS(action.payload)(state);
    case REMOVE_LIST_ITEMS:
      return _REMOVE_LIST_ITEMS(action.payload)(state);
    case SET_LIST_ITEMS:
      return _SET_LIST_ITEMS(action.payload)(state);
    // -- PLOP_PREPEND_REDUCER_SWITCH_CASE --
    case LOGOUT:
      return _LOGOUT(action.payload)(state);
    default:
      return state;
  }
};

/**
 * Add list items
 * @kind reducer/actionType
 * @name ADD_LIST_ITEMS
 * @param {array} {selectPath} - list select path
 * @param {array} [{itemIds}=[]] - list item ids
 * @param {number} [{totalCount}] - list total count
 * @param {number} [{nextPage}] - list next page
 * @param {number} [{lastPage}] - list last page
 * @return {Immutable.Map} New state
 */
const _ADD_LIST_ITEMS = ({
  selectPath = [`unknown-${Math.random()}`],
  itemIds = [],
  totalCount,
  nextPage,
  lastPage,
}) => state => {
  const currentIds = state.getIn([...selectPath, 'itemIds']) || fromJS([]);
  return state
    .mergeDeepIn(selectPath, { totalCount, nextPage, lastPage })
    .setIn(
      [...selectPath, 'itemIds'],
      currentIds.concat(itemIds.filter(itemId => !currentIds.includes(itemId)))
    );
};

/**
 * Remove list item
 * @kind reducer/actionType
 * @name REMOVE_LIST_ITEMS
 * @param {array} {selectPath} - list select path
 * @param {array} {itemIds} - list item ids
 * @return {Immutable.Map} New state
 */
const _REMOVE_LIST_ITEMS = ({
  selectPath = [`unknown-${Math.random()}`],
  itemIds = [],
}) => state => {
  const currentIds = state.getIn([...selectPath, 'itemIds']) || fromJS([]);
  return state.setIn(
    [...selectPath, 'itemIds'],
    currentIds.filter(id => itemIds.every(itemId => id !== itemId))
  );
};

/**
 * Set list items
 * @kind reducer/actionType
 * @name SET_LIST_ITEMS
 * @param {object} payload - payload
 * @return {Immutable.Map} New state
 */
const _SET_LIST_ITEMS = ({
  selectPath = [`unknown-${Math.random()}`],
  itemIds = [],
  totalCount,
  nextPage,
  lastPage,
}) => state => {
  const ids = fromJS(itemIds);
  return state
    .mergeDeepIn(selectPath, { totalCount, nextPage, lastPage })
    .setIn([...selectPath, 'itemIds'], ids);
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

export default lists;
