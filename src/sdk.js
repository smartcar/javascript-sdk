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
   * Initializes Smartcar class
   *
   * @param {Object} options - the SDK configuration object
   * @param {String} options.clientId - the applications' client id
   * @param {String} options.redirectUri - the registered redirect uri of the
   * application
   * @param {String[]} [options.scope] - requested permission scopes
   * @param {Function} [options.onComplete] - called on completion of auth flow
   * @param {Boolean} [options.development=false] - launch Smartcar auth in
   * development mode to enable the mock vehicle brand
   * @param {Boolean} [options.useSmartcarHostedRedirect=false] - use Smartcar's
   * CDN to host auth flow redirect (recommended for single page apps)
   * @constructor
   */
  function Smartcar(options) {
    // allow only one instance of Smartcar
    if (Smartcar._hasBeenInstantiated) {
      throw new Error('Smartcar has already been instantiated in the window.' +
        ' Only one instance of Smartcar can be defined. See' +
        ' https://github.com/smartcar/javascript-sdk for more information');
    } else {
      Smartcar._hasBeenInstantiated = true;
    }

    // require onComplete method with at least two parameters (error & code)
    // when hosting on Smartcar CDN
    if (options.useSmartcarHostedRedirect && (!options.onComplete
      || options.onComplete.length < 2)) {
      throw new Error("When using Smartcar's CDN redirect an onComplete" +
        ' function with at least 2 parameters is required to handle' +
        ' completion of authorization flow');
    }

    this.clientId = options.clientId;
    this.redirectUri = options.useSmartcarHostedRedirect
      ? `https://cdn.smartcar.com/redirect?origin=${options.redirectUri}`
      : options.redirectUri;
    this.scope = options.scope;
    this.onComplete = options.onComplete;
    this.development = options.development || false;
    this.responseType = 'code';
    // expose AccessDenied error class
    this.AccessDenied = AccessDenied;

    // handler
    this.messageHandler = (event) => {
      // bail if message from unexpected source
      if (!this.redirectUri.startsWith(event.origin)) { return; }

      const message = event.data;
      // bail if message does not contain `isSmartcarHosted` key
      // this prevents attempting to handle messages intended for others
      if (!message.hasOwnProperty('isSmartcarHosted')) { return; }

      // if onComplete not specified do nothing, assume user is conveying
      // completion information from backend server receiving redirect to front
      // end (not using onComplete)
      /* istanbul ignore else  */
      if (this.onComplete) {
        const maybeError = message.error
          ? new AccessDenied(message.error)
          : null;

        // call with parameters even if developer is not using smartcar hosting
        // as they may still want onComplete to do something with message
        // if empty onComplete is passed, parameters will be harmlessly ignored
        // if a developer chooses to pass an `onComplete` expecting these
        // parameters they must also handle populating the corresponding query
        // parameters in their redirect uri
        this.onComplete(maybeError, message.code, message.state);
      }
    };

    // add handler for postMessage event on completion of auth flow
    window.addEventListener('message', this.messageHandler);
  }

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

  return Smartcar;
})(window);
