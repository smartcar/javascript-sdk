'use strict';

/* eslint-env node */

class Smartcar {
  /**
   * @callback OnComplete
   * @param {?Error} error - something went wrong in Connect; this
   * normally indicates that the user denied access to your application or does not
   * have a connected vehicle
   * @param {String} code - the authorization code to be exchanged from a
   * backend sever for an access token
   * @param {Object} [state] - contains state if it was set on the initial
   * authorization request
   * @param {String} [virtualKeyUrl] - virtual key URL used by Tesla to register
   * Smartcar's virtual key on a vehicle. This registration will be required in order to use
   * any commands on a Tesla vehicle. It is an optional argument as it is only included in
   * specific cases.
   */

  /**
   * Initializes Smartcar class.
   *
   * @constructor
   * @param {Object} options - the SDK configuration object
   * @param {String} options.clientId - the application's client id
   * @param {String} options.redirectUri - the registered redirect uri of the
   * application
   * @param {String[]} [options.scope] - requested permission scopes
   * @param {OnComplete} [options.onComplete] - called on completion of Smartcar Connect
   * @param {Boolean} [options.testMode=false] - Deprecated, please use `mode` instead.
   * Launch Smartcar Connect in [test mode](https://smartcar.com/docs/guides/testing/).
   * @param {String} [options.mode='live'] - Determine what mode Smartcar Connect should be
   * launched in. Should be one of test, live or simulated.
 */
  constructor(options) {
    // polyfill String.prototype.startsWith for IE11 support
    // istanbul ignore next
    if (!String.prototype.startsWith) {
      // eslint-disable-next-line no-extend-native
      String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
      };
    }

    // ensure options are well formed
    Smartcar._validateConstructorOptions(options);

    this.clientId = options.clientId;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.onComplete = options.onComplete;
    this.mode = 'live';
    if (options.hasOwnProperty('testMode')) {
      // eslint-disable-next-line no-console
      console.warn(
        'The "testMode" parameter is deprecated, please use the "mode" parameter instead.',
      );
      this.mode = options.testMode === true ? 'test' : 'live';
    } else if (options.hasOwnProperty('mode')) {
      this.mode = options.mode;
    }
    if (!['test', 'live', 'simulated'].includes(this.mode)) {
      throw new Error(
        'The "mode" parameter MUST be one of the following: \'test\', \'live\', \'simulated\'',
      );
    }
    this.responseType = 'code';
    // identifier for matching message event and multiple Smartcar instances
    // it is a string composed of a timestamp and a 8-digit random number
    this.instanceId = (new Date()).getTime() + String(Math.random()).slice(2, 10);

    // handler
    this.messageHandler = (event) => {
      // bail if message from unexpected source
      if (!this.redirectUri.startsWith(event.origin)) {
        return;
      }

      const message = event.data || {};
      // bail if `message.name` is not `SmartcarAuthMessage`
      // this prevents attempting to handle messages intended for others
      if (message.name !== 'SmartcarAuthMessage') {
        return;
      }

      // bail if `state` is invalid
      let stateObject;
      try {
        stateObject = JSON.parse(window.atob(message.state));
      } catch (e) {
        return;
      }

      const {originalState, instanceId} = stateObject;
      // bail if `instanceId` doesn't match
      if (instanceId !== this.instanceId) {
        return;
      }

      // if onComplete not specified do nothing, assume developer is conveying
      // completion information from backend server receiving redirect to front
      // end (not using onComplete)
      if (this.onComplete) {
        // if auth errored generate appropriate error else null
        const generateError = (error, description) => {
          if (!error) {
            return null;
          }

          switch (error) {
            case 'access_denied':
              return new Smartcar.AccessDenied(description);
            case 'invalid_subscription':
              return new Smartcar.InvalidSubscription(description);
            case 'vehicle_incompatible':
              const params = event.data;

              // This field will always exist if vehicleInfo is returned
              if (!params.vin) {
                return new Smartcar.VehicleIncompatible(description, null);
              }

              // These fields are required when vehicleInfo is returned
              const vehicleInfo = {
                vin: params.vin,
                make: params.make,
                year: Number(params.year),
              };

              // This field is optional
              if (params.model) {
                vehicleInfo.model = params.model;
              }

              return new Smartcar.VehicleIncompatible(description, vehicleInfo);
            default:
              return new Error(`Unexpected error: ${error} - ${description}`);
          }
        };

        const err = generateError(message.error, message.errorDescription);

        const virtualKeyUrl = message.virtualKeyUrl;

        /**
         * Call `onComplete` with parameters even if developer is not using
         * a Smartcar-hosted redirect. Regardless of if they are using a
         * Smartcar-hosted redirect they may still want `onComplete` to do
         * something with message.
         *
         * If empty onComplete is passed, parameters will be harmlessly ignored.
         *
         * If a developer chooses to pass an `onComplete` expecting these
         * parameters they must also handle populating the corresponding query
         * parameters in their redirect uri.
         */
        this.onComplete(err, message.code, originalState, virtualKeyUrl);
      }
    };

    // add handler for postMessage event on completion of Smartcar Connect
    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Validate options passed to Smartcar constructor.
   *
   * See constructor documentation for enumeration of options properties.
   *
   * @private
   * @param {Object} options - the SDK configuration object
   */
  static _validateConstructorOptions(options) {
    if (!options.clientId) {
      throw new TypeError('A client ID option must be provided');
    }

    if (!options.redirectUri) {
      throw new TypeError('A redirect URI option must be provided');
    }

    if (options.redirectUri.startsWith('https://javascript-sdk.smartcar.com')) {
      // require onComplete method with at least two parameters (error & code)
      // when hosting on Smartcar CDN
      if (!options.onComplete || options.onComplete.length < 2) {
        throw new Error(
          "When using Smartcar's CDN redirect an onComplete function with at" +
            ' least 2 parameters (error & code) is required to handle' +
            ' completion of Connect',
        );
      }

      const usesOldUriScheme = (/redirect-[0-9]+\.[0-9]+\.[0-9]+\?/).test(options.redirectUri);

      if (usesOldUriScheme) {
        // eslint-disable-next-line no-console
        console.warn(
          "\nThe Smartcar redirect URI you're using is outdated! To update it, please see:\nhttps://github.com/smartcar/javascript-sdk#1-register-a-javascript-sdk-redirect-uri\n",
        );
      }
    }
  }

  /**
   * Position and size settings for the popup window.
   *
   * @see Please reference the {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open#Window_features|Window.open()#Window Features}
   * MDN article for more details
   *
   * @typedef {Object} WindowOptions
   * @property {String} [top]
   * @property {String} [left]
   * @property {String} [width]
   * @property {String} [height]
   */

  /**
   * Calculate popup window size and position based on current window settings.
   *
   * @private
   * @param {WindowOptions} options
   * @return {String} a string of window settings
   */
  static _getWindowOptions(windowOptions) {
    Object.keys(windowOptions).forEach((option) => {
      const numValue = parseFloat(windowOptions[option]);
      if (isNaN(numValue)) {
        windowOptions[option] = '';
      } else if (numValue < 100 && (option === 'width' || option === 'height')) {
        windowOptions[option] = '100';
      } else {
        windowOptions[option] = String(numValue);
      }
    });

    // Sets default popup window size as percentage of screen size
    // Note that this only applies to desktop browsers
    const windowSettings = {
      width: window.screen.width * 0.3,
      height: window.screen.height * 0.75,
    };

    const widthOffset = (window.outerWidth - windowSettings.width) / 2;
    const heightOffset = (window.outerHeight - windowSettings.height) / 8;

    let options = '';
    options += `top=${windowOptions.top || window.screenY + heightOffset},`;
    options += `left=${windowOptions.left || window.screenX + widthOffset},`;
    options += `width=${windowOptions.width || windowSettings.width},`;
    options += `height=${windowOptions.height || windowSettings.height},`;

    return options;
  }

  /**
   * Generates Smartcar OAuth URL.
   *
   * @param {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary state passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @param {String} [options.vehicleInfo.make] - `vehicleInfo` is an
   * object with an optional property `make`, which allows users to bypass the
   * car brand selection screen. For a complete list of supported brands, please
   * see our [API Reference](https://smartcar.com/docs/api#authorization)
   * documentation.
   * @param {Boolean|Object} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. If `single_select`
   * is passed in as an object with the property `vin`, Smartcar will only authorize
   * the vehicle with the specified VIN. See the
   * [API reference](https://smartcar.com/docs/api/#connect-match)
   * for more information.
   * @param {String[]} [options.flags] - An optional space-separated list of feature
   * flags that your application has early access to.
   *
   * @return {String} Connect URL to redirect user to.
   *
   * @example
   * https://connect.smartcar.com/oauth/authorize?
   * response_type=code
   * &client_id=8229df9f-91a0-4ff0-a1ae-a1f38ee24d07
   * &scope=read_odometer read_vehicle_info
   * &redirect_uri=https://example.com/home
   * &state=0facda3319
   * &make=TESLA
   * &single_select=true
   * &single_select_vin=5YJSA1E14FF101307
   * &flags=country:DE color:00819D
   */
  getAuthUrl(options) {
    options = options || {};

    let link = '';
    link += 'https://connect.smartcar.com/oauth/authorize';
    link += `?response_type=${this.responseType}`;
    link += `&client_id=${this.clientId}`;
    link += `&redirect_uri=${encodeURIComponent(this.redirectUri)}`;

    // map forcePrompt to approvalPrompt, two options: 'force' and 'auto'
    const forcePrompt = options.forcePrompt === true;
    link += `&approval_prompt=${forcePrompt ? 'force' : 'auto'}`;

    // If scope is not specified, Smartcar will default to requesting all scopes
    // from the user
    if (this.scope) {
      link += `&scope=${encodeURIComponent(this.scope.join(' '))}`;
    }

    link += `&mode=${this.mode}`;

    if (options.singleSelect !== undefined && options.singleSelect !== null) {
      let singleSelectParamAdded = false;
      if (typeof options.singleSelect === 'object') {
        const availableParams = ['vin'];
        for (const param of availableParams) {
          if (param in options.singleSelect) {
            link += `&single_select_${param}=${options.singleSelect[param]}`;
            singleSelectParamAdded = true;
          }
        }
        if (!singleSelectParamAdded) {
          link += '&single_select=false';
        } else {
          link += '&single_select=true';
        }
      } else {
        link += `&single_select=${options.singleSelect === true}`;
      }
    }

    // augment state to track the corresponding instance
    const state = {
      instanceId: this.instanceId,
    };
    if (options.state) {
      state.originalState = options.state;
    }
    // convert the augmented state to a base64 string
    link += `&state=${window.btoa(JSON.stringify(state))}`;

    if (options.vehicleInfo) {
      const availableParams = ['make'];
      for (const param of availableParams) {
        if (param in options.vehicleInfo) {
          link += `&${param}=${encodeURIComponent(options.vehicleInfo[param])}`;
        }
      }
    }

    if (options.flags) {
      link += `&flags=${encodeURIComponent(options.flags.join(' '))}`;
    }

    return link;
  }

  /**
   * Launches Smartcar Connect in a new window.
   *
   * @param {Object} options - the link configuration object
   * @param {String} [options.state] - arbitrary state passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @param {String} [options.vehicleInfo.make] - `vehicleInfo` is an
   * object with an optional property `make`, which allows users to bypass the
   * car brand selection screen. For a complete list of supported makes, please
   * see our [API Reference](https://smartcar.com/docs/api#authorization)
   * documentation.
   * @param {Boolean|Object} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. If `single_select`
   * is passed in as an object with the property `vin`, Smartcar will only authorize
   * the vehicle with the specified VIN. See the
   * [API reference](https://smartcar.com/docs/api/#connect-match)
   * for more information.
   * @param {String[]} [options.flags] - An optional space-separated list of feature
   * flags that your application has early access to.
   * @param {WindowOptions} [options.windowOptions] - position and size settings for
   * the popup window
   */
  openDialog(options) {
    const windowOptions = Smartcar._getWindowOptions(options.windowOptions || {});
    const href = this.getAuthUrl(options);
    window.open(href, 'Connect your car', windowOptions);
  }

  /**
   * Adds an on-click event listener to the element with the provided id.
   *
   * On-click event calls openDialog when the specified element is clicked.
   *
   * @param {Object} options - clickHandler configuration object
   * @param {String} [options.id] - id of the element to add click handler to
   * @param {String} [options.selector] - css selector of the element(s) to add click handler to
   * @param {String} [options.state] - arbitrary state passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @param {String} [options.vehicleInfo.make] - `vehicleInfo` is an
   * object with an optional property `make`, which allows users to bypass the
   * car brand selection screen. For a complete list of supported makes, please
   * see our [API Reference](https://smartcar.com/docs/api#authorization)
   * documentation.
   * @param {Boolean|Object} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. If `single_select`
   * is passed in as an object with the property `vin`, Smartcar will only authorize
   * the vehicle with the specified VIN. See the
   * [API reference](https://smartcar.com/docs/api/#connect-match)
   * for more information.
   * @param {String[]} [options.flags] - An optional space-separated list of feature
   * flags that your application has early access to.
   * @param {WindowOptions} [options.windowOptions] - position and size settings for
   * the popup window
   */
  addClickHandler(options) {
    const {id, selector} = options;

    // check if id or selector option exists
    if (!id && !selector) {
      throw new Error('Could not add click handler: id or selector must be provided.');
    }

    // find all the DOM elements that match the id and selector
    const elements = [];
    if (id) {
      const element = document.getElementById(id);
      if (element) {
        elements.push(element);
      }
    }
    if (selector) {
      elements.push(...document.querySelectorAll(selector));
    }
    if (!elements.length) {
      throw new Error(`
        Could not add click handler: element with '${id || selector}' was not found.
      `);
    }

    // _elementToClickHandler stores all the element - clickHandler pairs under the same instance
    // because it is possible to call addClickHandler multiple times with different options
    if (!this._elementToClickHandler) {
      this._elementToClickHandler = new Map();
    }
    const clickHandler = () => {
      this.openDialog(options);
      // this is equivalent to calling:
      // event.preventDefault();
      // event.stopPropogation();
      return false;
    };

    elements.forEach((element) => {
      // register element - clickHandler pair
      this._elementToClickHandler.set(element, clickHandler);
      // register eventListener
      element.addEventListener('click', clickHandler);
    });
  }

  /**
   * Remove Smartcar's event listeners.
   *
   * 1. remove listener on the global window object:
   * The Smartcar SDK uses a global 'message' event listener to recieve the
   * authorization code from the pop-up dialog. Call this method to remove the
   * event listener from the global window.
   *
   * 2. remove click event listeners on DOM elements
   * The Smartcar SDK also provides an `addClickHandler` method to attach click
   * events to DOM elements. These event listeners will also be removed by calling
   * this `unmount` method.
   */
  unmount() {
    window.removeEventListener('message', this.messageHandler);
    if (this._elementToClickHandler) {
      for (const [element, clickHandler] of this._elementToClickHandler.entries()) {
        element.removeEventListener('click', clickHandler);
      }
    }
  }
}

/**
 * Access denied error returned by Connect.
 *
 * @extends Error
 */
Smartcar.AccessDenied = class extends Error {
  /**
   * @param {String} message - detailed error description
   */
  constructor(message) {
    super(message);
    this.name = 'AccessDenied';
  }
};

/**
 * Vehicle incompatible error returned by Connect. Will optionally
 * have a vehicleInfo object if the user chooses to give permissions to provide
 * that information. See our [Connect documentation](https://smartcar.com/docs/api#smartcar-connect)
 * for more details.
 *
 * @extends Error
 */
Smartcar.VehicleIncompatible = class extends Error {
  /**
   * @param {String} message - detailed error description
   * @param {?Object} vehicleInfo - If a vehicle is incompatible, the user has
   * the option to return vehicleInfo to the application.
   * @param {String} vehicleInfo.vin - returned if user gives permission.
   * @param {String} vehicleInfo.make - returned if user gives permission.
   * @param {Number} vehicleInfo.year - returned if user gives permission.
   * @param {String} [vehicleInfo.model] - optionally returned if user gives permission.
   */
  constructor(message, vehicleInfo) {
    super(message);
    this.name = 'VehicleIncompatible';
    this.vehicleInfo = vehicleInfo;
  }
};

/**
 * Invalid subscription error returned by Connect.
 *
 * @extends Error
 */
Smartcar.InvalidSubscription = class extends Error {
  /**
   * @param {String} message - detailed error description
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidSubscription';
  }
};
