/**
* If you use a Smartcar hosted redirect (by selecting the option in the
* developer dashboard) this code is served automatically. If you host your own
* redirect you can source this file (along with sourcing the Javascript SDK on
* your front end) to close out the redirect and trigger specified `onComplete`
*/

(function() {
  'use strict';
  if (!window.opener) {
    throw new Error('window.opener must be defined');
  }

  const params = new URLSearchParams(window.location.search);

  const message = {
    isSmartcarHosted: window.location.origin === 'https://cdn.smartcar.com',
    code: params.get('code'),
    error: params.get('error_description'),
    state: params.get('state'),
  };

  // may still host with origin param even if not using smartcar hosted redirect
  // if a developer chooses not to use Smartcar hosting but still wants to have
  // a separate front and back end they can serve their redirect page with an
  // `origin` query paramater specifying the front-end origin to post back to.
  // if no origin parameter is given then the postMessage is sent back to the
  // same origin the redirect is hosted at (this assumes server side rendered).
  const targetOrigin = params.get('origin') || window.location.origin;

  window.opener.postMessage(message, targetOrigin);
  window.close();
})();
