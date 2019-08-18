// Home.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Swipeable from '../component/Swipeable.jsx';
const email = 'bill42362@gmail.com';

export class Home extends React.PureComponent {
  render() {
    const { data, index } = this.props;
    const colorName = data[index].id.replace(/-/g, ' ').toUpperCase();
    return (
      <StyledHome>
        <Header>
          <Index color={data[index].code}>{colorName}</Index>
        </Header>
        <SwipeableWrapper>
          <Swipeable currentIndex={index}>
            {data.map(color => (
              <SwipeableItemWrapper key={color.id}>
                <Item color={color.code}>
                  <Name>{color.id.replace(/-/g, ' ').toUpperCase()}</Name>
                  <Code>{color.code}</Code>
                </Item>
              </SwipeableItemWrapper>
            ))}
          </Swipeable>
        </SwipeableWrapper>
        <Footer>
          <Email href={`mailto:${email}`}>{email}</Email>
        </Footer>
      </StyledHome>
    );
  }
}

Home.propTypes = {
  data: PropTypes.array,
  index: PropTypes.number,
  setIndex: PropTypes.func,
};

Home.defaultProps = {
  data: [],
  index: 0,
  setIndex: () => null,
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
`;
const SwipeableItemWrapper = styled.div`
  flex: none;
  width: 100%;
  height: 100%;
  padding: 24px 12px;
`;

const Item = styled.div.attrs(({ color }) => ({
  style: { backgroundColor: color },
}))`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #222f3e;
`;

const Name = styled.div`
  font-size: 20px;
`;
const Code = styled.div`
  margin-top: 8px;
  font-size: 14px;
`;

const Footer = styled.div`
  flex: auto;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 20px;
`;
const Email = styled.a`
  color: #54a0ff;
`;

export default Home;
