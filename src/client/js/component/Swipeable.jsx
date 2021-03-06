// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  fromEvent,
  merge,
  race,
  animationFrameScheduler,
  empty,
  interval,
  Subject,
} from 'rxjs';
import {
  share,
  map,
  filter,
  switchMap,
  concatMap,
  takeUntil,
  takeWhile,
  first,
  takeLast,
  catchError,
  bufferCount,
} from 'rxjs/operators';

const SPEED_REDUCING_RATE = 0.03;

let shouldStopPropogation = false;
const checkStopPropogation = e => shouldStopPropogation && e.stopPropagation();

// to control global scroll behavior.
let shouldPreventScroll = false;
const preventTouchMove = e => shouldPreventScroll && e.preventDefault();

const mapMouseToPosition = e => {
  e.preventDefault();
  checkStopPropogation(e);
  return {
    x: e.pageX || e.clientX,
    y: e.pageY || e.clientY,
    timestamp: Date.now(),
  };
};

const mapTouchToPosition = e => {
  checkStopPropogation(e);
  const [touch] = e.changedTouches;
  return {
    x: touch.pageX || touch.clientX,
    y: touch.pageY || touch.clientY,
    timestamp: Date.now(),
  };
};

const getXWithInertia = ({
  initialX,
  initialSpeed,
  initialTimestamp,
  targetX,
}) => {
  const totalDistance = Math.abs(targetX - initialX);

  const deltaTimeMsec = Date.now() - initialTimestamp;
  const breakDuration = initialSpeed / SPEED_REDUCING_RATE;
  const breakDistance = 0.5 * initialSpeed * breakDuration;
  const sameSpeedDistance = Math.max(0, totalDistance - breakDistance);
  const sameSpeedDuration = sameSpeedDistance / initialSpeed;

  if (deltaTimeMsec > sameSpeedDuration + breakDuration) {
    return null;
  }

  const direction = Math.sign(targetX - initialX);
  const sinceBreakDuration = deltaTimeMsec - sameSpeedDuration;
  // prevent too slow to minus speed bug.
  const currentSpeed = Math.max(
    0,
    initialSpeed - sinceBreakDuration * SPEED_REDUCING_RATE
  );

  if (deltaTimeMsec < sameSpeedDuration) {
    return initialX + direction * deltaTimeMsec * initialSpeed;
  } else {
    const currentDistance =
      sameSpeedDistance +
      0.5 * (initialSpeed + currentSpeed) * sinceBreakDuration;
    const bounceDistance =
      0.5 * (sameSpeedDistance + breakDistance + totalDistance);
    if (currentDistance < bounceDistance) {
      return initialX + direction * currentDistance;
    } else {
      return initialX + direction * (2 * bounceDistance - currentDistance);
    }
  }
};

export class Swipeable extends React.PureComponent {
  state = {
    offsetX: 0,
    offsetY: 0,
  };

  beginSwipeIndex = null;
  scrollToIndexSubject = new Subject();
  scrollToIndex = ({ index }) => this.scrollToIndexSubject.next({ index });

  getNewIndexAfterScroll = ({ index }) => {
    const { childrenLength } = this.props;
    if (-1 === index) {
      return childrenLength - 1;
    } else if (childrenLength === index) {
      return 0;
    } else {
      return index;
    }
  };

  decayToIndexStream = ({ index, speed: initialSpeed = 1 }) => {
    const { offsetX: initialX } = this.state;
    const { siblingOffset } = this.props;
    const { clientWidth: width } = this.base;
    const initialTimestamp = Date.now();
    let lastFrameX = initialX;
    const itemWidth = (width * (100 - 2 * siblingOffset)) / 100;
    const targetX = -index * itemWidth;
    return interval(null, animationFrameScheduler).pipe(
      map(() => {
        const x = getXWithInertia({
          initialX,
          initialSpeed,
          initialTimestamp,
          targetX,
        });
        if (null === x) {
          return { x, y: 0 };
        }
        const deltaX = x - lastFrameX;
        lastFrameX = x;
        return { x: deltaX, y: 0 };
      }),
      takeWhile(({ x }) => x !== null)
    );
  };

  componentDidMount() {
    const body = document.getElementsByTagName('body')[0];
    this.mouseStart = fromEvent(this.base, 'mousedown');
    this.touchStart = fromEvent(this.base, 'touchstart');
    this.mouseMove = fromEvent(body, 'mousemove');
    this.touchMove = fromEvent(body, 'touchmove');
    // { capture: true } to prevent triggering child click after swipe.
    this.mouseEnd = fromEvent(body, 'mouseup', { capture: true });
    this.touchEnd = fromEvent(body, 'touchend', { capture: true });

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

    this.dragStart = this.start.pipe(
      concatMap(startEvent =>
        this.move.pipe(
          first(),
          takeUntil(this.end),
          map(e => ({
            deltaX: e.x - startEvent.x,
            deltaY: e.y - startEvent.y,
          }))
        )
      )
    );
    this.dragEnd = this.start.pipe(
      concatMap(() =>
        this.move.pipe(
          first(),
          concatMap(() => this.end.pipe(first()))
        )
      )
    );
    // to prevent scroll during swiping.
    document.addEventListener('touchmove', preventTouchMove, {
      passive: false,
    });
    // to prevent click after swiping.
    document.addEventListener('click', checkStopPropogation, {
      capture: true,
    });
    this.dragStart.subscribe(({ deltaX, deltaY }) => {
      this.beginSwipeIndex = this.props.index;
      shouldStopPropogation = true;
      return (shouldPreventScroll = Math.abs(deltaX) > Math.abs(deltaY));
    });
    this.dragEnd.subscribe(() => {
      // use setTimeout() because dragEnd fires before swipe ending events.
      setTimeout(() => (this.beginSwipeIndex = null));
      shouldPreventScroll = false;
      // use setTimeout() because children click events fires after mouseup.
      return setTimeout(() => (shouldStopPropogation = false));
    });

    this.movement = this.move.pipe(
      bufferCount(2, 1),
      map(([a, b]) => ({
        x: b.x - a.x,
        y: b.y - a.y,
        durationMsec: b.timestamp - a.timestamp,
      })),
      catchError(() => empty())
    );

    const { siblingOffset } = this.props;
    const { clientWidth: width } = this.base;
    const childWidth = (width * (50 - siblingOffset)) / 50;
    this.physical = merge(
      this.dragStart.pipe(
        filter(({ deltaX, deltaY }) => Math.abs(deltaX) > Math.abs(deltaY)),
        map(() => ({ type: 'start' }))
      ),
      this.scrollToIndexSubject.pipe(map(e => ({ ...e, type: 'scroll' })))
    ).pipe(
      switchMap(event => {
        if ('start' === event.type) {
          return merge(
            this.movement.pipe(takeUntil(this.end)),
            this.movement.pipe(
              takeUntil(this.end),
              takeLast(1),
              concatMap(({ x, durationMsec }) => {
                const speed = Math.abs(x) / durationMsec;
                // this.beginSwipeIndex to prevent jump two items.
                if (0.5 < speed && this.beginSwipeIndex === this.props.index) {
                  return this.decayToIndexStream({
                    index: -Math.sign(x),
                    speed: Math.max(1, speed),
                  });
                }
                return this.decayToIndexStream({ index: 0 });
              })
            )
          );
        } else if ('scroll' === event.type) {
          return this.decayToIndexStream({ index: event.index });
        }
        return this.decayToIndexStream({ index: 0 });
      })
    );

    this.physical.subscribe(({ x, y }) => {
      const { offsetX, offsetY } = this.state;
      let newOffsetX = offsetX + x;
      const sign = Math.sign(newOffsetX);
      const absNewOffsetX = Math.abs(newOffsetX);
      if (0.5 * childWidth < absNewOffsetX) {
        newOffsetX = sign * (absNewOffsetX - childWidth);
        this.props.setSwipeableIndex({
          index: this.getNewIndexAfterScroll({
            index: this.props.index - sign,
          }),
        });
      }
      return this.setState({ offsetX: newOffsetX, offsetY: offsetY + y });
    });
  }

  componentWillUnmount() {
    document.removeEventListener('touchmove', preventTouchMove, {
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
        {renderProp({ offsetX, scrollToIndex: this.scrollToIndex })}
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
