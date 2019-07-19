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
   * @param {Boolean} [options.testMode=false] - launch Smartcar Connect in test mode
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
    this.mode = options.testMode === true ? 'test' : 'live';
    this.responseType = 'code';

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
        this.onComplete(err, message.code, message.state);
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
    // allow only one instance of Smartcar
    if (Smartcar._hasBeenInstantiated) {
      throw new Error(
        'Smartcar has already been instantiated in the window. Only one' +
          ' instance of Smartcar can be defined.',
      );
    } else {
      Smartcar._hasBeenInstantiated = true;
    }

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
          "\nThe Smartcar redirect URI you're using is outdated! To update it, please see:\nhttps://smartcar.com/docs/guides/new-redirect-uri\n",
        );
      }
    }
  }

  /**
   * Calculate popup window size and position based on current window settings.
   *
   * @private
   * @return {String} a string of window settings
   */
  static _getWindowOptions() {
    // Sets default popup window size as percentage of screen size
    // Note that this only applies to desktop browsers
    const windowSettings = {
      width: window.screen.width * 0.3,
      height: window.screen.height * 0.75,
    };

    const width = (window.outerWidth - windowSettings.width) / 2;
    const height = (window.outerHeight - windowSettings.height) / 8;

    let options = '';
    options += `top=${window.screenY + height},`;
    options += `left=${window.screenX + width},`;
    options += `width=${windowSettings.width},`;
    options += `height=${windowSettings.height},`;

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
   * @param {Boolean} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. If `single_select`
   * is passed in as an object with the property `vin`, Smartcar will only authorize
   * the vehicle with the specified VIN. Defaults to `false`. See the
   * [Single Select guide](https://smartcar.com/docs/guides/single-select/)
   * for more information.
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

    if (options.singleSelect !== undefined) {
      let singleSelectParamAdded = false;
      if (typeof options.singleSelect === 'object' && options.singleSelect !== null) {
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

    if (options.state) {
      link += `&state=${options.state}`;
    }

    if (options.vehicleInfo) {
      const availableParams = ['make'];
      for (const param of availableParams) {
        if (param in options.vehicleInfo) {
          link += `&${param}=${encodeURIComponent(options.vehicleInfo[param])}`;
        }
      }
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
   * @param {Boolean} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. Defaults to
   * `false`. See the [Single Select guide](https://smartcar.com/docs/guides/single-select/)
   * for more information.
   */
  openDialog(options) {
    const href = this.getAuthUrl(options);
    const windowOptions = Smartcar._getWindowOptions();
    window.open(href, 'Connect your car', windowOptions);
  }

  /**
   * Adds an on-click event listener to the element with the provided id.
   *
   * On-click event calls openDialog when the specified element is clicked.
   *
   * @param {Object} options - clickHandler configuration object
   * @param {String} options.id - id of the element to add click handler to
   * @param {String} [options.state] - arbitrary state passed to redirect uri
   * @param {Boolean} [options.forcePrompt=false] - force permission approval
   * screen to show on every authentication, even if the user has previously
   * consented to the exact scope of permission
   * @param {String} [options.vehicleInfo.make] - `vehicleInfo` is an
   * object with an optional property `make`, which allows users to bypass the
   * car brand selection screen. For a complete list of supported makes, please
   * see our [API Reference](https://smartcar.com/docs/api#authorization)
   * documentation.
   * @param {Boolean} [options.singleSelect] - An optional value that sets the
   * behavior of the grant dialog displayed to the user. If set to `true`,
   * `single_select` limits the user to selecting only one vehicle. Defaults to
   * `false`. See the [Single Select guide](https://smartcar.com/docs/guides/single-select/)
   * for more information.
   */
  addClickHandler(options) {
    const id = options.id;

    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Could not add click handler: element with id '${id}' was not found.`);
    }

    delete options.id;

    element.addEventListener('click', () => {
      this.openDialog(options);
      // this is equivalent to calling:
      // event.preventDefault();
      // event.stopPropogation();
      return false;
    });
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
