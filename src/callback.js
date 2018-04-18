/**
 * callback.js should be imported in the file served by your redirect uri
 */

(function() {
  'use strict';

  if (!window.opener) {
    throw new Error('window.opener is undefined');
  }

  if (!window.opener._smartcar) {
    throw new Error('window.opener._smartcar is undefined');
  }

  // onComplete will not be defined if the user does not pass it in when
  // initializing Smartcar
  if (window.opener._smartcar.onComplete) {
    window.opener._smartcar.onComplete();
  }

  window.close();
})();
