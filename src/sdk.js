window.Smartcar = (function(window) {
  'use strict';
  // accesss denied error class
  class AccessDenied extends Error { // eslint-disable-line no-restricted-syntax
    constructor(message) {
      super(message);
      this.name = 'AccessDenied';
    }
  }

  /**
   * @callback OnComplete
   * @param {?Error} error - should be only AccessDenied error but can be common
   * Error in case of unxpected issues. Indicates end user declined to provide
   * access to their vehicle
   * @param {String} code - the authorization code to be exchanged from a
   * backend sever for an access token
   * @param {Object} state - user provided state for holding miscellaneous data
   * connected to authenticating user
   */

  /**
   * @typedef Options
   *
   * @property {String} clientId - the application's client id
   * @property {String} redirectUri - the registered redirect uri of the
   * application
   * @property {String[]} [scope] - requested permission scopes
   * @property {OnComplete} [onComplete] - called on completion of auth flow
   * @property {Boolean} [development=false] - launch Smartcar auth in
   * development mode to enable the mock vehicle brand
   */

  /**
   * Initializes Smartcar class
   *
   * @param {Options} options - the SDK configuration object
   * @constructor
   */
  function Smartcar(options) {
    // ensure options are well formed
    Smartcar._validateConstructorOptions(options);

    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.onComplete = options.onComplete;
    this.development = options.development || false;
    this.responseType = 'code';

    // handler
    this.messageHandler = (event) => {
      // bail if message from unexpected source
      if (!this.redirectUri.startsWith(event.origin)) { return; }

      const message = event.data || {};
      // bail if `message.name` is not `SmartcarAuthMessage`
      // this prevents attempting to handle messages intended for others
      if (message.name !== 'SmartcarAuthMessage') { return; }

      // if onComplete not specified do nothing, assume developer is conveying
      // completion information from backend server receiving redirect to front
      // end (not using onComplete)
      /* istanbul ignore else */
      if (this.onComplete) {
        // if auth errored generate appropriate error else null
        const generateError = (error, description) => {
          if (!error) {
            return null;
          }

          return error === 'access_denied'
            ? new AccessDenied(description)
            : new Error(`Unexpected error: ${error} - ${description}`);
        };
        const err = generateError(message.error, message.errorDescription);

        /**
         * Call `onComplete` with parameters even if developer is not using
         * a Smartcar hosted redirect. Regardless of if they are using a
         * Smartcar hosted redirect they may still want `onComplete` to do
         * something with message.
         *
         * If empty onComplete is passed, parameters will be harmlessly ignored.
         *
         * If a developer chooses to pass an `onComplete` expecting these
         * parameters they must also handle populating the corresponding query
         * parameters in their redirect uri.
         */
        this.onComplete(err, message.code, message.state);
      }
    };

    // add handler for postMessage event on completion of auth flow
    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Validate options passed to Smartcar constructor. See constructor
   * documentation for enumeration of options properties.
   *
   * @param {Options} options - the SDK configuration object
   * @private
   */
  Smartcar._validateConstructorOptions = function(options) {
    // allow only one instance of Smartcar
    if (Smartcar._hasBeenInstantiated) {
      throw new Error(
        'Smartcar has already been instantiated in the window. Only one' +
        ' instance of Smartcar can be defined.'
      );
    } else {
      Smartcar._hasBeenInstantiated = true;
    }

    if (!options.redirectUri) {
      throw new TypeError('A redirect URI option must be provided');
    }

    if (!options.clientId) {
      throw new TypeError('A client ID option must be provided');
    }

    if (options.redirectUri.startsWith('https://javascript-sdk.smartcar.com')) {
      // require `onComplete` method with at least two parameters (error & code)
      // when hosting on Smartcar CDN
      if (!options.onComplete || options.onComplete.length < 2) {
        throw new Error(
          "When using Smartcar's CDN redirect an onComplete function with at" +
          ' least 2 parameters (error & code) is required to handle' +
          ' completion of authorization flow'
        );
      }

      // require `app_origin` query parameter containing HTTPS served URI
      try {
        const searchParams = (new URL(options.redirectUri)).searchParams;
        // `.get()` returns null if query parameter doesn't exist which will
        // then error as null isn't a valid url
        const appOriginUrl = new URL(searchParams.get('app_origin'));
        if (appOriginUrl.protocol !== 'https:') {
          throw new Error(); // throw to force descriptive error in catch
        }
      } catch (err) {
        throw new Error(
          "When using Smartcar's CDN redirect an `app_origin` query" +
          ' parameter is required to specify the origin the extracted' +
          ' `code` should be sent to. This `app_origin` URI must be served' +
          ' over HTTPS'
        );
      }
    }
  };

  /**
   * Generates Smartcar OAuth URL
   *
   * @param  {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary parameter passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @return {String} - generated OAuth link
   */
  Smartcar.prototype.generateLink = function(options) {
    options = options || {};

    let link = '';
    link += 'https://connect.smartcar.com/oauth/authorize';
    link += `?response_type=${this.responseType}`;
    link += `&client_id=${this.clientId}`;
    link += `&redirect_uri=${encodeURIComponent(this.redirectUri)}`;

    // map forcePrompt to approvalPrompt, two options: 'force' and 'auto'
    const forcePrompt = options.forcePrompt || false;
    link += `&approval_prompt=${forcePrompt ? 'force' : 'auto'}`;

    // If scope is not specified, Smartcar will default to requesting all scopes
    // from the user
    if (this.scope) {
      link += `&scope=${encodeURIComponent(this.scope.join(' '))}`;
    }

    if (options.state) {
      link += `&state=${options.state}`;
    }

    if (this.development) {
      link += '&mock=true';
    }

    return link;
  };

  /**
   * Calculate popup window size and position based on current window settings
   *
   * @return {String} a string of window settings
   */
  Smartcar._getWindowOptions = function() {
    // Sets default popup window size
    const windowSettings = {
      width: 430,
      height: 500,
    };

    const width = (window.outerWidth - windowSettings.width) / 2;
    const height = (window.outerHeight - windowSettings.height) / 8;

    let options = '';
    options += `top=${window.screenY + height},`;
    options += `left=${window.screenX + width},`;
    options += `width=${windowSettings.width},`;
    options += `height=${windowSettings.height},`;

    return options;
  };

  /**
   * Launch the OAuth dialog flow
   *
   * @param {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary parameter passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @return {String} - generated OAuth link
   */
  Smartcar.prototype.openDialog = function(options) {
    const href = this.generateLink(options);
    const windowOptions = Smartcar._getWindowOptions();
    window.open(href, 'Connect your car', windowOptions);

    // this is equivalent to calling event.preventDefault();
    return false;
  };

  /**
  * Add an on-click event listener to the element with the provided id.
  * On-click event calls openDialog when the specified element is clicked.
  *
  * @param {Object} options - clickHandler configuration object
  * @param {String} [options.id] - id of the element to add click handler to
  * @param {String} [options.state] - arbitrary parameter passed to redirect uri
  * @param {Boolean} [options.forcePrompt] - force permission approval screen to
  * show on every authentication, even if the user has previously consented
  * to the exact scope of permission
   */
  Smartcar.prototype.addClickHandler = function(options) {
    const id = options.id;
    const dialogOptions = {
      state: options.state,
      forcePrompt: options.forcePrompt,
      development: this.development,
    };

    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Could not add click handler: element with id '${id}'` +
        ' was not found.');
    }

    element.addEventListener('click', () => this.openDialog(dialogOptions));
  };

  // expose AccessDenied error class
  Smartcar.AccessDenied = AccessDenied;
  return Smartcar;
})(window);
