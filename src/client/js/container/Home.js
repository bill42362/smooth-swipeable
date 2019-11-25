// Home.js
import { connect } from 'react-redux';

import { MERGE_OPERATION_DATA } from '../ActionTypes.js';
import getOperationData from '../selector/getOperationData.js';
import Home from '../component/Home.jsx';

const selectPath = ['swipeable'];
const colors = [
  { id: 'jigglypuff', code: '#ff9ff3' },
  { id: 'casandora-yellow', code: '#feca57' },
  { id: 'pastel-red', code: '#ff6b6b' },
  { id: 'megaman', code: '#48dbfb' },
  { id: 'wild-caribbean-green', code: '#1dd1a1' },
];

const mapStateToProps = state => {
  return {
    data: colors,
    index: getOperationData(state, selectPath, 'index'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setSwipeableIndex: ({ index }) =>
      dispatch({
        type: MERGE_OPERATION_DATA,
        payload: { selectPath, data: { index } },
      }),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
