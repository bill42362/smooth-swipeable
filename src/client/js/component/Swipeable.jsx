// Swipeable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  fromEvent,
  merge,
  race,
  animationFrameScheduler,
  timer,
  empty,
  interval,
} from 'rxjs';
import {
  share,
  map,
  switchMap,
  concatMap,
  takeUntil,
  first,
  takeLast,
  startWith,
  endWith,
  catchError,
  bufferCount,
} from 'rxjs/operators';

const ANIMATE_TIME = 300;

// to control global scroll behavior.
let shouldPreventTouchMove = false;
const preventTouchMove = e => shouldPreventTouchMove && e.preventDefault();

const mapMouseToPosition = e => {
  e.preventDefault();
  return {
    x: e.pageX || e.clientX,
    y: e.pageY || e.clientY,
  };
};

const mapTouchToPosition = e => {
  e.stopPropagation();
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

  scrollToIndexStream = ({ index }) => {
    const { offsetX: x } = this.state;
    const { siblingOffset, index: currentIndex } = this.props;
    const { clientWidth: width } = this.base;
    const startTime = Date.now();
    const itemWidth = (width * (100 - 2 * siblingOffset)) / 100;
    const targetX = Math.sign(currentIndex - index) * itemWidth;
    const newIndex = this.getNewIndexAfterScroll({ index });
    return interval(null, animationFrameScheduler).pipe(
      takeUntil(timer(ANIMATE_TIME)),
      map(() => {
        const offsetTime = Date.now() - startTime;
        const offsetX = ((targetX - x) * offsetTime) / ANIMATE_TIME;
        return { x: x + offsetX, y: 0 };
      }),
      endWith({ x: 0, y: 0, newIndex })
    );
  };

  componentDidMount() {
    const { siblingOffset } = this.props;

    this.mouseStart = fromEvent(this.base, 'mousedown');
    this.touchStart = fromEvent(this.base, 'touchstart');
    this.mouseMove = fromEvent(document, 'mousemove');
    this.touchMove = fromEvent(document, 'touchmove');
    this.mouseEnd = fromEvent(document, 'mouseup');
    // { capture: true } to prevent triggering child click.
    this.touchEnd = fromEvent(document, 'touchend', { capture: true });

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
      concatMap(() => this.move.pipe(first(), takeUntil(this.end)))
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
    this.dragStart.subscribe(() => (shouldPreventTouchMove = true));
    this.dragEnd.subscribe(() => (shouldPreventTouchMove = false));

    const clickThreshold = siblingOffset / 100;
    const swipeThreshold = (50 - siblingOffset) / 100;
    this.result = this.start.pipe(
      switchMap(startPosition =>
        merge(
          this.move.pipe(
            map(movePosiiton => ({
              ...movePosiiton,
              type: 'move',
            }))
          ),
          this.end.pipe(
            map(endPosition => ({
              ...endPosition,
              type: 'end',
            }))
          )
        ).pipe(
          first(),
          concatMap(event => {
            if ('move' === event.type) {
              const { offsetX, offsetY } = this.state;
              return merge(
                this.move.pipe(
                  startWith(event),
                  takeUntil(this.end),
                  map(movePosiiton => ({
                    x: movePosiiton.x - startPosition.x + offsetX,
                    y: movePosiiton.y - startPosition.y + offsetY,
                  }))
                ),
                this.move.pipe(
                  takeUntil(this.end),
                  map(movePosiiton => ({
                    x: movePosiiton.x - startPosition.x,
                    y: movePosiiton.y - startPosition.y,
                    timestamp: Date.now(),
                  })),
                  takeLast(3),
                  bufferCount(3),
                  catchError(() => empty()),
                  // eslint-disable-next-line no-unused-vars
                  concatMap(([first, _, last]) => {
                    const { index } = this.props;
                    const { clientWidth: width } = this.base;
                    if (!last) {
                      return this.scrollToIndexStream({ index });
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
                      return this.scrollToIndexStream({
                        index: index - direction.x,
                      });
                    } else if (last.x > swipeThreshold * width) {
                      return this.scrollToIndexStream({ index: index - 1 });
                    } else if (last.x < -swipeThreshold * width) {
                      return this.scrollToIndexStream({ index: index + 1 });
                    }
                    return this.scrollToIndexStream({ index });
                  })
                )
              );
            } else if ('end' === event.type) {
              const { x } = event;
              const { index } = this.props;
              const { clientWidth: width } = this.base;
              if (x > (1 - clickThreshold) * width) {
                return this.scrollToIndexStream({ index: index + 1 });
              } else if (x < clickThreshold * width) {
                return this.scrollToIndexStream({ index: index - 1 });
              } else {
                return empty();
              }
            }
            return { x: 0, y: 0 };
          })
        )
      )
    );
    this.result.subscribe(({ x, y, newIndex }) => {
      if (undefined !== newIndex) {
        this.props.setSwipeableIndex({ index: newIndex });
      }
      return this.setState({ offsetX: x, offsetY: y });
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
