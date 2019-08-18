// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export class Swipeable extends React.PureComponent {
  state = { x: null, y: null };

  handleToucheMove = e => {
    e.preventDefault();
    const [touch] = e.changedTouches;
    return this.setState({ x: touch.pageX, y: touch.pageY });
  };

  render() {
    const { x, y } = this.state;
    const { children, currentIndex } = this.props;
    const childrenArray = React.Children.toArray(children);
    //const previous = childrenArray[currentIndex - 1] || childrenArray[childrenArray.length - 1];
    const current = childrenArray[currentIndex];
    //const next = childrenArray[currentIndex + 1] || childrenArray[0];
    return (
      <StyledSwipeable>
        <Axis>{`(${x}, ${y})`}</Axis>
        {React.cloneElement(current, {
          onTouchMove: this.handleToucheMove,
        })}
      </StyledSwipeable>
    );
  }
}

Swipeable.propTypes = {
  children: PropTypes.node,
  currentIndex: PropTypes.number,
};

Swipeable.defaultProps = {
  children: '',
  currentIndex: 0,
};

const StyledSwipeable = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const Axis = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
`;

export default Swipeable;
