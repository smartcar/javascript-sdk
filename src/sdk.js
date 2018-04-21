window.Smartcar = (function(window) {
  'use strict';

  /**
   * Initializes Smartcar class
   * @param {Object} options - the SDK configuration object
   * @param {String} options.clientId - the applications' client id
   * @param {String} options.redirectUri - the registered redirect uri of the application
   * @param {String[]} [options.scope] - requested permission scopes
   * @param {Function} [options.onComplete] - called upon completion of the Auth flow
   * @constructor
   */
  function Smartcar(options) {
    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.onComplete = options.onComplete;
    this.grantType = 'code';

    // window._smartcar is used to preserve reference to smartcar when we call
    // onComplete in the callback (see callback.js)
    if (window._smartcar) {
      // throw error if more than one instance
      // eslint-disable-line max-len
      throw new Error('Smartcar has already been instantiated in the window. Only one instance of Smartcar can be defined. See https://github.com/smartcar/javascript-sdk for more information');
    } else {
      window._smartcar = this;
    }
  }

  /**
   * Generates Smartcar OAuth URL
   * @param  {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary parameter passed to the redirect uri
   * @param {Boolean} [options.forcePrompt] - force permission approval screen to show
   * on every authentication, even if the user has previously consented to the
   * exact scope of permission
   * @return {String} - generated OAuth link
   */
  Smartcar.prototype.generateLink = function(options) {
    options = options || {};

    let link = '';
    link += 'https://connect.smartcar.com/oauth/authorize';
    link += `?response_type=${this.grantType}`;
    link += `&client_id=${this.clientId}`;
    link += `&redirect_uri=${encodeURIComponent(this.redirectUri)}`;

    // We map forcePrompt to approvalPrompt, which has two options: 'force' and 'auto'
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

    return link;
  };

  /**
   * Calculate the popup window size and position based on the current window
   * settings.
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
   * @param {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary parameter passed to the redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval screen to
   * show on every authentication, even if the user has previously consented
   * to the exact scope of permission
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
  * @param {Object} options - clickHandler configuration object
  * @param {String} [options.id] - id of the element for which to add the click handler
  * @param {String} [options.state] - arbitrary parameter passed to the redirect uri
  * @param {Boolean} [options.forcePrompt] - force permission approval screen to
  * show on every authentication, even if the user has previously consented
  * to the exact scope of permission
   */
  Smartcar.prototype.addClickHandler = function(options) {
    const id = options.id;
    const dialogOptions = {
      state: options.state,
      forcePrompt: options.forcePrompt,
    };

    if (!document.getElementById(id)) {
      throw new Error(`Could not add click handler: element with id '${id}' was not found.`);
    }

    document.getElementById(id).addEventListener('click', () => this.openDialog(dialogOptions));
  };

  return Smartcar;
})(window);
