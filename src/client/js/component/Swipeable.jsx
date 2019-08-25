// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  fromEvent,
  merge,
  of,
  animationFrameScheduler,
  timer,
  concat,
} from 'rxjs';
import {
  map,
  concatMap,
  takeUntil,
  first,
  switchMap,
  repeat,
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

  componentDidMount() {
    const { childrenLength, setSwipeableIndex } = this.props;

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
            return {
              target: isCancelled ? 0 : isForward ? 1 : -1,
              endDeltaX: endX - startX,
            };
          })
        )
      )
    );

    this.drag.subscribe(({ x, y }) =>
      this.setState({ offsetX: x, offsetY: y })
    );
    this.drop
      .pipe(
        switchMap(data => {
          const startTime = Date.now();
          return concat(
            of({ ...data, startTime }, animationFrameScheduler).pipe(
              repeat(),
              takeUntil(timer(ANIMATE_TIME))
            ),
            of({ ...data, isFinal: true })
          );
        })
      )
      .subscribe(({ startTime, target, endDeltaX, isFinal }) => {
        if (isFinal) {
          const { index } = this.props;
          let nextIndex = index - target;
          if (-1 === nextIndex) {
            nextIndex = childrenLength - 1;
          } else if (nextIndex === childrenLength) {
            nextIndex = 0;
          }
          this.setState({ offsetX: 0, offsetY: 0 });
          return setSwipeableIndex({ index: nextIndex });
        }
        const offsetTime = Date.now() - startTime;
        const targetX = target * this.base.clientWidth;
        const offsetX = ((targetX - endDeltaX) * offsetTime) / ANIMATE_TIME;
        return this.setState({ offsetX: endDeltaX + offsetX });
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
    this.end.unsubscribe();
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
