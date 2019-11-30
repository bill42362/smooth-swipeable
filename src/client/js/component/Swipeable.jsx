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
import {
  map,
  concatMap,
  takeUntil,
  takeLast,
  catchError,
  bufferCount,
} from 'rxjs/operators';

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

  scrollToIndex = ({ index }) => {
    const { offsetX: x } = this.state;
    const {
      siblingOffset,
      index: currentIndex,
      setSwipeableIndex,
    } = this.props;
    const { clientWidth: width } = this.base;
    const startTime = Date.now();
    const itemWidth = (width * (100 - 2 * siblingOffset)) / 100;
    const targetX = Math.sign(currentIndex - index) * itemWidth;
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
          const { childrenLength } = this.props;
          if (-1 === index) {
            setSwipeableIndex({ index: childrenLength - 1 });
          } else if (childrenLength === index) {
            setSwipeableIndex({ index: 0 });
          } else {
            setSwipeableIndex({ index });
          }
          return this.setState({ offsetX: 0, offsetY: 0 });
        }
      );
  };

  componentDidMount() {
    const { siblingOffset } = this.props;

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
        this.move.pipe(
          takeUntil(this.end),
          map(movePosiiton => ({
            x: movePosiiton.x - startPosition.x,
            y: movePosiiton.y - startPosition.y,
          }))
        )
      )
    );
    this.dragEnd = this.start.pipe(
      concatMap(startPosition =>
        this.move.pipe(
          takeUntil(this.end),
          map(movePosiiton => ({
            x: movePosiiton.x - startPosition.x,
            y: movePosiiton.y - startPosition.y,
            timestamp: Date.now(),
          })),
          takeLast(3),
          bufferCount(3),
          catchError(() => empty())
        )
      )
    );

    this.drag.subscribe(({ x, y }) =>
      this.setState({ offsetX: x, offsetY: y })
    );

    const swipeThreshold = (50 - siblingOffset) / 100;
    // eslint-disable-next-line no-unused-vars
    this.dragEnd.subscribe(([first, _, last]) => {
      const { index } = this.props;
      const { clientWidth: width } = this.base;
      if (!last) {
        return this.scrollToIndex({ index });
      }
      const time = last.timestamp - first.timestamp;
      const speed = {
        x: Math.abs(last.x - first.x) / time,
        y: Math.abs(last.y - first.y) / time,
      };
      const direction = {
        x: Math.sign(last.x - first.x),
        y: Math.sign(last.y - first.y),
      };
      if (1 < speed.x) {
        return this.scrollToIndex({ index: index - direction.x });
      } else if (last.x > swipeThreshold * width) {
        return this.scrollToIndex({ index: index - 1 });
      } else if (last.x < -swipeThreshold * width) {
        return this.scrollToIndex({ index: index + 1 });
      }
      return this.scrollToIndex({ index });
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
    const { offsetX } = this.state;
    const { renderProp } = this.props;
    return (
      <StyledSwipeable ref={el => (this.base = el)}>
        {renderProp({ offsetX })}
      </StyledSwipeable>
    );
  }
}

Swipeable.propTypes = {
  renderProp: PropTypes.func,
  siblingOffset: PropTypes.number,
  index: PropTypes.number,
  childrenLength: PropTypes.number,
  setSwipeableIndex: PropTypes.func,
};

Swipeable.defaultProps = {
  renderProp: () => null,
  siblingOffset: 0,
  index: 0,
  childrenLength: 1,
  setSwipeableIndex: () => null,
};

const StyledSwipeable = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export default Swipeable;
