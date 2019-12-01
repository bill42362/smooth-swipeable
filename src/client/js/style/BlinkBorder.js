// BlinkBorder.js
'use strict';
import { css, keyframes } from 'styled-components';

export const BlinkBorderKeyframes = keyframes`
  0% {
    border-color: #ff9f43;
  }
  100% {
    border-color: transparent;
  }
`;

const BlinkBorder = css`
  ${BlinkBorderKeyframes}
`;

export default BlinkBorder;
