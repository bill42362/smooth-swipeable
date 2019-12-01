// Home.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Swipeable from '../component/Swipeable.jsx';
import BlinkBorder from '../style/BlinkBorder.js';
import media from '../style/media.js';

import EmailIcon from '../../img/email-icon.svg';
import GithubIcon from '../../img/github-icon.svg';

const SIBLING_OFFSET = 10;
const email = 'bill42362@gmail.com';

export class Home extends React.PureComponent {
  state = {
    clickedFlags: {
      items: {},
      links: {},
    },
  };
  clickTimeouts = {
    items: {},
    links: {},
  };

  updateClickFlag = ({ type, id, value }) => {
    const { clickedFlags } = this.state;
    return this.setState({
      clickedFlags: {
        ...clickedFlags,
        [type]: {
          ...clickedFlags[type],
          [id]: value,
        },
      },
    });
  };

  handleClick = ({ type, id }) => event => {
    event.stopPropagation();
    this.updateClickFlag({ type, id, value: false });
    if (!this.clickTimeouts[type][id]) {
      this.clickTimeouts[type][id] = [];
    }
    clearTimeout(this.clickTimeouts[type][id][0]);
    clearTimeout(this.clickTimeouts[type][id][1]);
    this.clickTimeouts[type][id][0] = setTimeout(
      () => this.updateClickFlag({ type, id, value: true }),
      0
    );
    this.clickTimeouts[type][id][1] = setTimeout(
      () => this.updateClickFlag({ type, id, value: false }),
      3000
    );
  };

  renderItem = ({ color }) => {
    const { clickedFlags } = this.state;
    const { data, index } = this.props;
    const currentItem = data[index];
    const isCurrentItem = color.id === currentItem.id;
    const itemClickHandler = isCurrentItem
      ? this.handleClick({ type: 'items', id: color.id })
      : undefined;
    const linkClickHandler = isCurrentItem
      ? this.handleClick({ type: 'links', id: color.id })
      : undefined;
    return (
      <SwipeableItemWrapper key={color.id}>
        <Item
          isClicked={clickedFlags.items[color.id]}
          color={color.code}
          onTouchEnd={itemClickHandler}
          onClick={itemClickHandler}
        >
          <Name>{color.id.replace(/-/g, ' ').toUpperCase()}</Name>
          <Code>{color.code}</Code>
          <ItemLink
            href="https://rxjs-dev.firebaseapp.com/api"
            target="_blank"
            color={color.code}
            isClicked={clickedFlags.links[color.id]}
            onTouchEnd={linkClickHandler}
            onClick={linkClickHandler}
          >
            RxJS
          </ItemLink>
        </Item>
      </SwipeableItemWrapper>
    );
  };

  componentWillUnmount() {
    Object.keys(this.clickTimeouts).forEach(type =>
      Object.keys(this.clickTimeouts[type]).forEach(id =>
        this.clickTimeouts[type][id]?.forEach(clearTimeout)
      )
    );
  }

  render() {
    const { data, index, setSwipeableIndex } = this.props;
    const colorName = data[index].id.replace(/-/g, ' ').toUpperCase();
    const previousItem = data[index - 1] || data[data.length - 1];
    const currentItem = data[index];
    const nextItem = data[index + 1] || data[0];
    return (
      <StyledHome>
        <Header>
          <Index color={data[index].code}>{colorName}</Index>
        </Header>
        <SwipeableWrapper>
          <Swipeable
            siblingOffset={SIBLING_OFFSET}
            index={index}
            childrenLength={data.length}
            setSwipeableIndex={setSwipeableIndex}
            renderProp={({ offsetX }) => (
              <SwipeableItems offsetX={offsetX}>
                {[previousItem, currentItem, nextItem].map(color =>
                  this.renderItem({ color })
                )}
              </SwipeableItems>
            )}
          />
        </SwipeableWrapper>
        <Footer>
          <Link href="https://github.com/bill42362/smooth-swipeable">
            <img src={GithubIcon} alt="github" />
          </Link>
          <Link href={`mailto:${email}`}>
            <img src={EmailIcon} alt="email" />
          </Link>
        </Footer>
      </StyledHome>
    );
  }
}

Home.propTypes = {
  data: PropTypes.array,
  index: PropTypes.number,
  setSwipeableIndex: PropTypes.func,
};

Home.defaultProps = {
  data: [],
  index: 0,
  setSwipeableIndex: () => null,
};

const StyledHome = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  background-color: #222f3e;
`;

const Header = styled.div`
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Index = styled.div.attrs(({ color }) => ({ style: { color } }))`
  font-size: 24px;
  transition: color 0.6s ease;
`;

const SwipeableWrapper = styled.div`
  height: 70%;
  background-color: #576574;
  overflow: hidden;
`;

const SwipeableItems = styled.div.attrs(({ offsetX }) => ({
  style: {
    transform: `translateX(calc(-${100 - 3 * SIBLING_OFFSET}% + ${offsetX}px))`,
  },
}))`
  display: flex;
  height: 100%;
`;

const SwipeableItemWrapper = styled.div`
  flex: none;
  width: ${100 - 2 * SIBLING_OFFSET}%;
  height: 100%;
  padding: 24px 12px;
`;

const Item = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 16px solid ${({ color }) => color};
  width: 100%;
  height: 100%;
  background-color: ${({ color }) => color};
  color: #222f3e;
  animation: 3s forwards ${({ isClicked }) => (isClicked ? BlinkBorder : '')};
`;

const Name = styled.div`
  font-size: 20px;
`;
const Code = styled.div`
  margin-top: 8px;
  font-size: 14px;
`;
const ItemLink = styled.a`
  display: block;
  position: absolute;
  bottom: 32px;
  border: 4px solid #222f3e;
  border-radius: 8px;
  background-color: #222f3e;
  width: 60%;
  max-width: 200px;
  height: 44px;
  color: ${({ color }) => color};
  text-align: center;
  line-height: 36px;
  animation: 3s forwards ${({ isClicked }) => (isClicked ? BlinkBorder : '')};

  &:hover {
    background-color: #576574;
  }
  ${media.tablet`
    &:hover {
      background-color: #222f3e;
    }
  `}
`;

const Footer = styled.div`
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 20px;
`;
const Link = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  background-color: #576574;

  & + & {
    margin-left: 8px;
  }
  img {
    width: 60%;
    height: auto;
  }
`;

export default Home;
