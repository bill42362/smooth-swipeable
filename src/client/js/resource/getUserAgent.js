// getUserAgent.js
'use strict';
import UAParser from 'ua-parser-js';

let parser = undefined;
let userAgent = undefined;
let isOnIOS = undefined;
let isOnAndroid = undefined;
let isOnApple = undefined;
let isOnMobile = undefined;
let browserVersion = undefined;
let isSafari = undefined;
let isIosSafari = undefined;
let isIosChrome = undefined;
let isIosSafari10 = undefined;
let isIosGreaterEqual12_2 = undefined;
let isOnDesktopSafari = undefined;
let isRecordAllowed = undefined;
let isFbInAppBrowser = undefined;
let isLineInAppBrowser = undefined;
let isWechatInAppBrowser = undefined;
let isInAppBrowser = undefined;
let isInPwa = undefined;
let isIphoneXSeriesPWA = undefined;

const SERVER_AGENT_NAME = 'Server';
const isClient = typeof window !== 'undefined';

export const getUserAgent = () => {
  if (!parser) {
    parser = new UAParser();
  }
  if (!userAgent) {
    userAgent = parser.getResult();
  }
  return userAgent;
};

export const getIsOnApple = () => {
  if (undefined === isOnApple) {
    isOnApple = ['iOS', 'Mac OS'].includes(getUserAgent().os.name);
  }
  return isOnApple;
};

export const getIsOnAndroid = () => {
  if (undefined === isOnAndroid) {
    isOnAndroid = ['Android'].includes(getUserAgent().os.name);
  }
  return isOnAndroid;
};

export const getIsOnIOS = () => {
  if (undefined === isOnIOS) {
    isOnIOS = ['iOS'].includes(getUserAgent().os.name);
  }
  return isOnIOS;
};

export const getIsOnMobile = () => {
  if (undefined === isOnMobile) {
    isOnMobile = !!getUserAgent().device.type;
  }
  return isOnMobile;
};

export const getXUserAgent = () => {
  return `swag/2.31.0 (${getIsOnApple() ? 'iPhone' : 'Android'}; ${
    getUserAgent().os.name
  })`;
};

export const getIsIos10 = () => {
  if (undefined === isIosSafari10) {
    if (!getIsOnIOS()) {
      isIosSafari10 = false;
    } else {
      if (undefined === browserVersion) {
        browserVersion = parseInt(getUserAgent().os.version.split('.')[0], 10);
      }
      if (10 !== browserVersion) {
        isIosSafari10 = false;
      } else {
        isIosSafari10 = true;
      }
    }
  }
  return isIosSafari10;
};

export const getIsGreaterEqualIos12_2 = () => {
  if (undefined === isIosGreaterEqual12_2) {
    if (!getIsOnIOS()) {
      isIosGreaterEqual12_2 = false;
    } else {
      if (undefined === browserVersion) {
        browserVersion = parseFloat(getUserAgent().os.version, 10);
      }
      if (12.2 <= browserVersion) {
        isIosGreaterEqual12_2 = true;
      } else {
        isIosGreaterEqual12_2 = false;
      }
    }
  }
  return isIosGreaterEqual12_2;
};

export const getIsIosSafari = () => {
  if (!getIsOnIOS()) {
    isIosSafari = false;
  } else {
    const { browser } = getUserAgent();
    const { name } = browser;
    if (name === 'Mobile Safari') {
      isIosSafari = true;
    } else {
      isIosSafari = false;
    }
  }
  return isIosSafari;
};

export const getIsIosChrome = () => {
  if (!getIsOnIOS()) {
    isIosChrome = false;
  } else {
    if (/chrome/gi.test(getUserAgent()?.browser?.name)) {
      isIosChrome = true;
    } else {
      isIosChrome = false;
    }
  }
  return isIosChrome;
};

export const getIsOnDesktopSafari = () => {
  if (undefined === isOnDesktopSafari) {
    isOnDesktopSafari = 'Safari' === getUserAgent().browser.name;
  }
  return isOnDesktopSafari;
};

export const getIsSafari = () => {
  getIsOnDesktopSafari();
  getIsIosSafari();

  isSafari = isOnDesktopSafari || isIosSafari;
  return isSafari;
};

export const getIsFbInAppBrowser = () => {
  if (undefined === isFbInAppBrowser) {
    if (isClient) {
      isFbInAppBrowser = userAgent.browser.name === 'Facebook';
    }
  }
  return isFbInAppBrowser;
};

export const getIsLineInAppBrowser = () => {
  if (undefined === isLineInAppBrowser) {
    if (isClient) {
      isLineInAppBrowser = userAgent.browser.name === 'Line';
    }
  }
  return isLineInAppBrowser;
};

export const getIsWechatInAppBrowser = () => {
  if (undefined === isWechatInAppBrowser) {
    if (isClient) {
      const reg = /wechat/i;
      isWechatInAppBrowser = reg.test(userAgent.browser.name);
    }
  }
  return isWechatInAppBrowser;
};

export const getIsInAppBrowser = () => {
  if (undefined === isInAppBrowser) {
    if (isClient) {
      isInAppBrowser =
        getIsWechatInAppBrowser() ||
        getIsLineInAppBrowser() ||
        getIsFbInAppBrowser();
    }
  }
  return isInAppBrowser;
};

export const getIsRecordAllowed = () => {
  if (undefined !== isRecordAllowed) {
    return isRecordAllowed;
  }
  if (false === getIsOnMobile()) {
    isRecordAllowed = false;
    return isRecordAllowed;
  }
  if (true === getIsOnIOS()) {
    isRecordAllowed = true;
    return isRecordAllowed;
  }
  const {
    browser: { name },
  } = getUserAgent();
  if (/(samsung|edge|UCBrowser|chrome)/gi.test(name)) {
    isRecordAllowed = true;
    return isRecordAllowed;
  }
  isRecordAllowed = false;
  return isRecordAllowed;
};

export const getIsInPwa = () => {
  if (undefined === isInPwa) {
    isInPwa =
      isClient &&
      !!window.matchMedia &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && window.navigator.standalone));
  }
  return isInPwa;
};

export const userAgentString = isClient
  ? navigator.userAgent
  : SERVER_AGENT_NAME;

export const getIsIphoneXSeriesPWA = () => {
  if (undefined === isIphoneXSeriesPWA) {
    const isInPwa = getIsInPwa();
    const isIphone = getUserAgent()?.device?.model?.includes('iPhone');
    const isIPhoneX =
      isIphone &&
      window.devicePixelRatio &&
      window.devicePixelRatio === 3 &&
      window.screen.width === 375 &&
      window.screen.height === 812;
    const isIPhoneXSMax =
      isIphone &&
      window.devicePixelRatio &&
      window.devicePixelRatio === 3 &&
      window.screen.width === 414 &&
      window.screen.height === 896;
    const isIPhoneXR =
      isIphone &&
      window.devicePixelRatio &&
      window.devicePixelRatio === 2 &&
      window.screen.width === 414 &&
      window.screen.height === 896;
    isIphoneXSeriesPWA = isInPwa && (isIPhoneX || isIPhoneXSMax || isIPhoneXR);
  }
  return isIphoneXSeriesPWA;
};
export default getUserAgent;
