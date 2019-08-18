// Home.js
import { connect } from 'react-redux';

import Home from '../component/Home.jsx';

const mapStateToProps = state => {
  return {
    state,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setIndex: ({ index }) => dispatch({ type: '', payload: { index } }),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
