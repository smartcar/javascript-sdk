/**
 * callback.js can be served in the last page of your OAuth Flow to close the
 * popup window and call your callback. The last page of your OAuth Flow can be
 * specified as your redirect_uri.
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
