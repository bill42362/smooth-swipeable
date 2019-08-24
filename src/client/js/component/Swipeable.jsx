// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

export class Swipeable extends React.PureComponent {
  state = {
    originX: null,
    originY: null,
    deltaX: 0,
    deltaY: 0,
  };

  handleToucheStart = e => {
    e.preventDefault();
    const [touch] = e.changedTouches;
    return this.setState({ originX: touch.pageX, originY: touch.pageY });
  };

  handleToucheMove = e => {
    e.preventDefault();
    const { originX, originY } = this.state;
    const [touch] = e.changedTouches;
    return this.setState({
      deltaX: touch.pageX - originX,
      deltaY: touch.pageY - originY,
    });
  };

  handleToucheEnd = e => {
    e.preventDefault();
    return this.setState({
      originX: null,
      originY: null,
      deltaX: 0,
      deltaY: 0,
    });
  };

  render() {
    const { deltaX, deltaY } = this.state;
    const { children, currentIndex } = this.props;
    const childrenArray = React.Children.toArray(children);
    const previous =
      childrenArray[currentIndex - 1] ||
      childrenArray[childrenArray.length - 1];
    const current = childrenArray[currentIndex];
    const next = childrenArray[currentIndex + 1] || childrenArray[0];
    return (
      <StyledSwipeable
        onTouchMove={this.handleToucheMove}
        onTouchStart={this.handleToucheStart}
        onTouchEnd={this.handleToucheEnd}
      >
        <Axis>{`(${deltaX}, ${deltaY})`}</Axis>
        <ItemWrapper deltaX={deltaX} deltaY={deltaY}>
          {previous}
        </ItemWrapper>
        <ItemWrapper deltaX={deltaX} deltaY={deltaY}>
          {current}
        </ItemWrapper>
        <ItemWrapper deltaX={deltaX} deltaY={deltaY}>
          {next}
        </ItemWrapper>
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
  overflow: hidden;
`;

const Axis = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
`;

const ItemWrapper = styled.div.attrs(({ deltaX }) => ({
  style: { transform: `translateX(calc(-100% + ${deltaX}px))` },
}))`
  position: relative;
  flex: none;
  width: 100%;
  height: 100%;
`;

export default Swipeable;
