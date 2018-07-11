/**
* If you use a Smartcar hosted redirect (by selecting the option in the
* developer dashboard) this code is served automatically. If you host your own
* redirect you can source this file (along with using the Javascript SDK to
* close out the redirect and trigger your specified `onComplete` function.
*/

(function() {
  'use strict';
  if (!window.opener) {
    throw new Error('window.opener must be defined');
  }

  const params = new URLSearchParams(window.location.search);

  const maybeOriginParam = params.get('origin');

  const message = maybeOriginParam
    ? {
      name: 'smartcarAuthMessage',
      authCode: params.get('code'),
      error: params.get('error_description'),
      state: params.get('state'),
    }
    : {name: 'smartcarAuthMessage'};

  const targetOrigin = maybeOriginParam
    ? maybeOriginParam
    : window.location.origin;

  window.opener.postMessage(message, targetOrigin);
  window.close();
})();
