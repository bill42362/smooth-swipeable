// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  fromEvent,
  race,
  animationFrameScheduler,
  timer,
  empty,
  interval,
} from 'rxjs';
import {
  share,
  map,
  concatMap,
  takeUntil,
  first,
  takeLast,
  catchError,
  bufferCount,
} from 'rxjs/operators';

const ANIMATE_TIME = 300;

// to control global scroll behavior.
let shouldPreventDefault = false;
const preventDefault = e => shouldPreventDefault && e.preventDefault();

const mapMouseToPosition = e => {
  e.preventDefault();
  return {
    x: e.pageX || e.clientX,
    y: e.pageY || e.clientY,
  };
};

const mapTouchToPosition = e => {
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

    this.start = race(
      this.mouseStart.pipe(map(mapMouseToPosition)),
      this.touchStart.pipe(map(mapTouchToPosition))
    ).pipe(share());
    this.move = race(
      this.mouseMove.pipe(map(mapMouseToPosition)),
      this.touchMove.pipe(map(mapTouchToPosition))
    ).pipe(share());
    this.end = race(
      this.mouseEnd.pipe(map(mapMouseToPosition)),
      this.touchEnd.pipe(map(mapTouchToPosition))
    ).pipe(share());

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
    this.dragStart = this.start.pipe(
      concatMap(() => this.move.pipe(first(), takeUntil(this.end)))
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
    this.click = this.start.pipe(
      concatMap(() => this.end.pipe(takeUntil(this.move)))
    );

    this.drag.subscribe(({ x, y }) =>
      this.setState({ offsetX: x, offsetY: y })
    );

    document.addEventListener('touchmove', preventDefault, { passive: false });
    this.dragStart.subscribe(() => (shouldPreventDefault = true));
    const swipeThreshold = (50 - siblingOffset) / 100;
    // eslint-disable-next-line no-unused-vars
    this.dragEnd.subscribe(([first, _, last]) => {
      shouldPreventDefault = false;
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

    const clickThreshold = siblingOffset / 100;
    this.click.subscribe(({ x }) => {
      const { index } = this.props;
      const { clientWidth: width } = this.base;
      if (x > (1 - clickThreshold) * width) {
        return this.scrollToIndex({ index: index + 1 });
      } else if (x < clickThreshold * width) {
        return this.scrollToIndex({ index: index - 1 });
      }
    });
  }

  componentWillUnmount() {
    document.removeEventListener('touchmove', preventDefault, {
      passive: false,
    });
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
