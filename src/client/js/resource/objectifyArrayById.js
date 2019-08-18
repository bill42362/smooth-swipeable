// objectifyArrayById.js
'use strict';

export const objectifyArrayById = ({ array, template = {} }) => {
  return array.reduce((current, item) => {
    current[item.id] = { ...template, ...item };
    return current;
  }, {});
};

export default objectifyArrayById;
