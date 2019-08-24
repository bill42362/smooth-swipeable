// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { fromEvent, merge, of, animationFrameScheduler, timer } from 'rxjs';
import {
  map,
  concatMap,
  takeUntil,
  first,
  switchMap,
  repeat,
} from 'rxjs/operators';

const mapMouseToPosition = e => {
  e.preventDefault();
  return {
    x: e.pageX || e.clientX,
    y: e.pageY || e.clientY,
  };
};

const mapTouchToPosition = e => {
  e.preventDefault();
  const [touch] = e.changedTouches;
  return {
    x: touch.pageX || touch.clientX,
    y: touch.pageY || touch.clientY,
  };
};

export class Swipeable extends React.PureComponent {
  state = {
    deltaX: 0,
    deltaY: 0,
  };

  componentDidMount() {
    this.mouseStart = fromEvent(this.base, 'mousedown');
    this.touchStart = fromEvent(this.base, 'touchstart');
    this.mouseMove = fromEvent(document, 'mousemove');
    this.touchMove = fromEvent(document, 'touchmove');
    this.mouseEnd = fromEvent(document, 'mouseup');
    this.touchEnd = fromEvent(document, 'touchend');

    this.start = merge(
      this.mouseStart.pipe(map(mapMouseToPosition)),
      this.touchStart.pipe(map(mapTouchToPosition))
    );
    this.move = merge(
      this.mouseMove.pipe(map(mapMouseToPosition)),
      this.touchMove.pipe(map(mapTouchToPosition))
    );
    this.end = merge(
      this.mouseEnd.pipe(map(mapMouseToPosition)),
      this.touchEnd.pipe(map(mapTouchToPosition))
    );

    this.drag = this.start.pipe(
      concatMap(startPosition =>
        this.move.pipe(takeUntil(this.end)).pipe(
          map(movePosiiton => ({
            x: movePosiiton.x - startPosition.x,
            y: movePosiiton.y - startPosition.y,
          }))
        )
      )
    );
    this.drop = this.start.pipe(
      concatMap(startPosition =>
        this.end.pipe(first()).pipe(
          map(endPosition => {
            const { x: startX } = startPosition;
            const { x: endX } = endPosition;
            const isForward = startX < endX;
            const isCancelled =
              2 * Math.abs(startX - endX) < this.base.clientWidth;
            return isCancelled ? 0 : isForward ? 1 : -1;
          })
        )
      )
    );

    this.drag.subscribe(delta => this.setState({ deltaX: delta.x }));
    this.drop.subscribe(() => this.setState({ deltaX: 0 }));
    this.drop
      .pipe(
        switchMap(target =>
          of(target, animationFrameScheduler).pipe(
            repeat(),
            takeUntil(timer(600))
          )
        )
      )
      .subscribe(target => target);
  }

  componentWillUnmount() {
    this.mouseStart.unsubscribe();
    this.touchStart.unsubscribe();
    this.mouseMove.unsubscribe();
    this.touchMove.unsubscribe();
    this.mouseEnd.unsubscribe();
    this.touchEnd.unsubscribe();
    this.drag.unsubscribe();
    this.end.unsubscribe();
  }

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
      <StyledSwipeable ref={el => (this.base = el)}>
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
