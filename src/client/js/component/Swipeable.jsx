// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  fromEvent,
  merge,
  animationFrameScheduler,
  timer,
  empty,
  interval,
} from 'rxjs';
import { map, concatMap, takeUntil, last, catchError } from 'rxjs/operators';

const ANIMATE_TIME = 300;

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
    offsetX: 0,
    offsetY: 0,
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
        merge(
          this.move.pipe(
            takeUntil(this.end),
            map(movePosiiton => ({
              x: movePosiiton.x - startPosition.x,
              y: movePosiiton.y - startPosition.y,
            }))
          ),
          this.move.pipe(
            takeUntil(this.end),
            last(),
            catchError(() => empty()),
            map(movePosiiton => ({
              isFinal: true,
              x: movePosiiton.x - startPosition.x,
              y: movePosiiton.y - startPosition.y,
            }))
          )
        )
      )
    );

    this.drag.subscribe(({ x, y, isFinal }) => {
      if (!isFinal) {
        return this.setState({ offsetX: x, offsetY: y });
      }

      const { clientWidth: width } = this.base;
      const startTime = Date.now();
      const isCancelled = 2 * Math.abs(x) < width;
      const targetX = isCancelled ? 0 : x > 0 ? width : -width;
      return interval(null, animationFrameScheduler)
        .pipe(takeUntil(timer(ANIMATE_TIME)))
        .subscribe(
          () => {
            const offsetTime = Date.now() - startTime;
            const offsetX = ((targetX - x) * offsetTime) / ANIMATE_TIME;
            return this.setState({ offsetX: x + offsetX });
          },
          null,
          () => {
            if (!isCancelled) {
              const { index, childrenLength, setSwipeableIndex } = this.props;
              let nextIndex = index - (x > 0 ? 1 : -1);
              if (-1 === nextIndex) {
                nextIndex = childrenLength - 1;
              } else if (nextIndex === childrenLength) {
                nextIndex = 0;
              }
              setSwipeableIndex({ index: nextIndex });
            }
            return this.setState({ offsetX: 0, offsetY: 0 });
          }
        );
    });
  }

  componentWillUnmount() {
    this.mouseStart.unsubscribe();
    this.touchStart.unsubscribe();
    this.mouseMove.unsubscribe();
    this.touchMove.unsubscribe();
    this.mouseEnd.unsubscribe();
    this.touchEnd.unsubscribe();
    this.drag.unsubscribe();
  }

  render() {
    const { offsetX, offsetY } = this.state;
    const { renderProp } = this.props;
    return (
      <StyledSwipeable ref={el => (this.base = el)}>
        <Axis>{`(${offsetX}, ${offsetY})`}</Axis>
        {renderProp({ offsetX })}
      </StyledSwipeable>
    );
  }
}

Swipeable.propTypes = {
  renderProp: PropTypes.func,
  index: PropTypes.number,
  childrenLength: PropTypes.number,
  setSwipeableIndex: PropTypes.func,
};

Swipeable.defaultProps = {
  renderProp: () => null,
  index: 0,
  childrenLength: 1,
  setSwipeableIndex: () => null,
};

const StyledSwipeable = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Axis = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
`;

export default Swipeable;
