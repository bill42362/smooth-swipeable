// media.js
'use strict';
import { css } from 'styled-components';

import { breakpoint } from '../style/variables.js';

const SIZE = {
  tablet: breakpoint.tablet,
  mobile: breakpoint.mobile,
};

const media = Object.keys(SIZE).reduce((acc, key) => {
  return {
    ...acc,
    [key]: (...args) => css`
      @media (max-width: ${SIZE[key]}px) {
        ${css(...args)}
      }
    `,
  };
}, {});

export default media;
