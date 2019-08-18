// App.jsx
'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';
import styled, {
  createGlobalStyle,
  StyleSheetManager,
} from 'styled-components';
import styledNormalize from 'styled-normalize';

const GlobalStyle = createGlobalStyle`
  ${styledNormalize};
  *, ::after, ::before { box-sizing: border-box; }
  html { touch-action: manipulation; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
      Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-weight: 400;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior-y: contain;
  }
  a { color: inherit; text-decoration: none; }
  a > * { opacity: inherit; }
  button { cursor: pointer; }
  input::-webkit-input-placeholder,
  input::-moz-placeholder {
    line-height: normal !important;
  }
`;

const App = () => {
  return (
    <StyledApp>
      <GlobalStyle />
      Hello!
    </StyledApp>
  );
};

const StyledApp = styled.div``;

const StyledBody = ({ sheet }) => {
  if (!sheet) {
    return <App />;
  }
  return (
    <StyleSheetManager sheet={sheet.instance}>
      <App />
    </StyleSheetManager>
  );
};

StyledBody.propTypes = {
  ...App.propTypes,
  sheet: PropTypes.object,
};

export default hot(module)(StyledBody);
