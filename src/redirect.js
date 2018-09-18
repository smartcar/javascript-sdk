/**
* If you use a Smartcar hosted redirect this code is served automatically. If
* you host your own redirect you can source this file (along with sourcing the
* Javascript SDK on your front end) to close out the redirect and trigger
* specified `onComplete`
*/

(function(window) {
  'use strict';
  if (!window.opener) {
    throw new Error('window.opener must be defined');
  }

  const params = new URLSearchParams(window.location.search);

  const message = {
    name: 'SmartcarAuthMessage',
    isSmartcarHosted: window.location.origin === 'https://cdn.smartcar.com',
    code: params.get('code'),
    error: params.get('error_description'),
    state: params.get('state'),
  };

  // may still host with `app_origin` param even if not using smartcar hosted
  // redirect if a developer chooses not to use Smartcar hosting but still wants
  // to have a separate client & server they can serve their redirect page with
  // an `app_origin` query paramater specifying the client origin to post back
  // to. if no `app_origin` parameter is given then we post a message back to
  // the same origin the redirect is hosted at (this assumes server side
  // rendered).
  const targetOrigin = params.get('app_origin') || window.location.origin;

  window.opener.postMessage(message, targetOrigin);
  window.close();
})(window);
