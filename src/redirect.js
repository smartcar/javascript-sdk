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
  const origin = window.location.origin;

  const message = {
    name: 'SmartcarAuthMessage',
    isSmartcarHosted: origin === 'https://javascript-sdk.smartcar.com',
    code: params.get('code'),
    error: params.get('error_description'),
    state: params.get('state'),
  };

  /**
   * Even if not using a Smartcar hosted redirect this script can stil be loaded
   * in the self hosted redirect page.
   *
   * If the redirect URI has a valid `app_origin` param (an HTTPS URL) the
   * extracted code will be posted to the origin specified by `app_origin`.
   *
   * If no `app_origin` parameter is given (only possible when self hosting,
   * this parameter is required for using a Smartcar hosted redirect) then
   * the `code` (or error) is posted to the same origin the redirect is hosted
   * at (this assumes a server side rendered architecture).
   */
  const targetOrigin = params.get('app_origin') || origin;

  window.opener.postMessage(message, targetOrigin);
  window.close();
})(window);
