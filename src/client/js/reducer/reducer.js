// reducer.js
'use strict';
import { combineReducers } from 'redux-immutable';
import me from './me.js';
import lists from './lists.js';
import operations from './operations.js';

const reducer = combineReducers({
  me,
  lists,
  operations,
});

export default reducer;
