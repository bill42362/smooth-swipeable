// Home.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export class Home extends React.PureComponent {
  render() {
    const { index } = this.props;
    return (
      <StyledHome>
        <div>{index}</div>
      </StyledHome>
    );
  }
}

Home.propTypes = {
  index: PropTypes.number,
};

Home.defaultProps = {
  index: 0,
};

const StyledHome = styled.div``;

export default Home;
