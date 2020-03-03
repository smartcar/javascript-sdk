'use strict';

const Smartcar = require('../../dist/umd/sdk.js');

const isValidWindowOptions = (str) =>
  (/^top=[0-9.]+,left=[0-9.]+,width=[0-9.]+,height=[0-9.]+,$/).test(str);

describe('sdk', () => {
  const CDN_ORIGIN = 'https://javascript-sdk.smartcar.com';

  describe('constructor', () => {
    test('throws error if constructor called without redirectUri', () => {
      expect(() => new Smartcar({clientId: 'uuid'})).toThrow(
        'A redirect URI option must be provided',
      );
    });

    test('throws error if constructor called without clientId', () => {
      expect(() => new Smartcar({redirectUri: 'http://example.com'})).toThrow(
        'A client ID option must be provided',
      );
    });

    test('throws error if using Smartcar hosting without onComplete', () => {
      expect(
        () =>
          new Smartcar({
            redirectUri: CDN_ORIGIN,
            clientId: 'my-id',
          }),
      ).toThrow(
        "When using Smartcar's CDN redirect an onComplete function with at" +
          ' least 2 parameters (error & code) is required to handle' +
          ' completion of Connect',
      );
    });

    test(// eslint-disable-next-line max-len
      'throws error if using Smartcar hosting & passing onComplete with less than 2 parameters', () => {
        expect(
          () =>
            new Smartcar({
              redirectUri: CDN_ORIGIN,
              clientId: 'my-id',
              // eslint-disable-next-line no-unused-vars, no-empty-function
              onComplete: (_) => {}, // stub function w/ < 2 params
            }),
        ).toThrow(
          "When using Smartcar's CDN redirect an onComplete function with at" +
          ' least 2 parameters (error & code) is required to handle' +
          ' completion of Connect',
        );
      });

    /* eslint-disable no-console, no-empty-function */
    test('warns when using a redirect uri with old scheme', () => {
      const spy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});

      // eslint-disable-next-line no-new
      new Smartcar({
        redirectUri: `${CDN_ORIGIN}/redirect-2.0.0?foo=bar`,
        clientId: 'my-id',
        // eslint-disable-next-line no-unused-vars
        onComplete: jest.fn((__, _) => {}),
      });

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
      /* eslint-enable */
    });

    test('initializes correctly w/ self hosted redirect', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
      };

      const smartcar = new Smartcar(options);

      Object.entries(options).forEach(([key, option]) => expect(smartcar[key]).toEqual(option));

      // this is set within the constructor
      expect(smartcar.responseType).toEqual('code');
      expect(smartcar.mode).toEqual('live');

      // make sure onComplete can be called
      smartcar.onComplete();
      expect(options.onComplete).toBeCalled();
    });

    test('initializes correctly w/ smartcar CDN hosted redirect', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: `${CDN_ORIGIN}/redirect?app_origin=https://app.com`,
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-unused-vars, no-empty-function
        onComplete: jest.fn((_, __) => {}), // stub function w/ >= 2 params
      };

      const smartcar = new Smartcar(options);

      Object.entries(options).forEach(([key, option]) => expect(smartcar[key]).toEqual(option));

      // this is set within the constructor
      expect(smartcar.responseType).toEqual('code');
      expect(smartcar.mode).toEqual('live');

      // make sure onComplete can be called
      smartcar.onComplete();
      expect(options.onComplete).toBeCalled();
    });

    test('onComplete undefined if not specified', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
      };

      const smartcar = new Smartcar(options);

      expect(smartcar.onComplete).toBe(undefined);
    });

    test("doesn't break if onComplete is not passed", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://selfhosted.com',
      };

      smartcar.messageHandler(event);
    });

    test("doesn't fire onComplete w/o origin", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).not.toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test("doesn't fire onComplete when redirectUri & origin disagree", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://some-other-url.com',
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).not.toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test("doesn't fire onComplete or error when event.data is undefined", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        origin: 'https://selfhosted.com',
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).not.toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test("doesn't fire onComplete when message has no name field", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://selfhosted.com',
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).not.toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test("doesn't fire onComplete when message.name is not 'SmartcarAuthMessage'", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'definitely not SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://selfhosted.com',
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).not.toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test(// eslint-disable-next-line max-len
      'fires onComplete when redirectUri & origin agree, & message.name is SmartcarAuthMessage', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: null,
            errorDescription: null,
            state: 'some-state',
          },
          origin: CDN_ORIGIN,
        };

        smartcar.messageHandler(event);

        expect(smartcar.onComplete).toBeCalledWith(null, expect.anything(), expect.anything());
      });

    test('fires onComplete w/o error when error: null in postMessage', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-unused-vars, no-empty-function
        onComplete: jest.fn((__, _) => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: true,
          code: 'super-secret-code',
          error: null,
          state: 'some-state',
        },
        origin: CDN_ORIGIN,
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).toBeCalledWith(null, 'super-secret-code', 'some-state');
    });

    test('fires onComplete w/o error when error key not in postMessage', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-unused-vars, no-empty-function
        onComplete: jest.fn((__, _) => {}),
      };

      const smartcar = new Smartcar(options);

      const event = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: true,
          code: 'super-secret-code',
          errorDescription: 'this doesnt matter',
          state: 'some-state',
        },
        origin: CDN_ORIGIN,
      };

      smartcar.messageHandler(event);

      expect(smartcar.onComplete).toBeCalledWith(null, 'super-secret-code', 'some-state');
    });

    test(// eslint-disable-next-line max-len
      'fires onComplete w/ VehicleIncompatible error when `error: vehicle_incompatible` in postMessage', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const vehicleInfo = {
          vin: 'some_vin',
          year: '2017',
          make: 'TESLA',
          model: 'Model S',
        };

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'vehicle_incompatible',
            errorDescription,
            state: 'some-state',
            ...vehicleInfo,
          },
          origin: CDN_ORIGIN,
        };

        smartcar.messageHandler(event);

        expect(smartcar.onComplete).toBeCalledWith(
          new Smartcar.VehicleIncompatible(errorDescription, vehicleInfo),
          'super-secret-code',
          'some-state',
        );
      });

    test(// eslint-disable-next-line max-len
      'VehicleIncompatible error does not add undefined properties to vehicleInfo', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const vehicleInfo = {
          year: '2017',
          make: 'TESLA',
          vin: 'some_vin',
        };

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'vehicle_incompatible',
            errorDescription,
            state: 'some-state',
            ...vehicleInfo,
          },
          origin: CDN_ORIGIN,
        };

        options.onComplete.mockImplementation(function(err) {
          expect(Object.keys(err.vehicleInfo)).not.toContain('model');
        });

        smartcar.messageHandler(event);
      });

    test(// eslint-disable-next-line max-len
      'VehicleIncompatible returns a number for year', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const vehicleInfo = {
          vin: 'some_vin',
          year: '2017',
          make: 'TESLA',
          model: 'Model S',
        };

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'vehicle_incompatible',
            errorDescription,
            state: 'some-state',
            ...vehicleInfo,
          },
          origin: CDN_ORIGIN,
        };

        options.onComplete.mockImplementation(function(err) {
          expect(typeof err.vehicleInfo.year).toBe('number');
        });

        smartcar.messageHandler(event);
      });

    test(// eslint-disable-next-line max-len
      'VehicleIncompatible returns null for vehicleInfo when no info', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'vehicle_incompatible',
            errorDescription,
            state: 'some-state',
          },
          origin: CDN_ORIGIN,
        };

        options.onComplete.mockImplementation(function(err) {
          expect(err.vehicleInfo).toEqual(null);
        });

        smartcar.messageHandler(event);
      });

    test(// eslint-disable-next-line max-len
      'fires onComplete w/ AccessDenied error when `error: access_denied` in postMessage', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'access_denied',
            errorDescription,
            state: 'some-state',
          },
          origin: CDN_ORIGIN,
        };

        smartcar.messageHandler(event);

        expect(smartcar.onComplete).toBeCalledWith(
          new Smartcar.AccessDenied(errorDescription),
          'super-secret-code',
          'some-state',
        );
      });

    test(// eslint-disable-next-line max-len
      'fires onComplete w/ InvalidSubscription error when `error: invalid_subscription` in postMessage', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const errorDescription = 'describes the error';

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error: 'invalid_subscription',
            errorDescription,
            state: 'some-state',
          },
          origin: CDN_ORIGIN,
        };

        smartcar.messageHandler(event);

        expect(smartcar.onComplete).toBeCalledWith(
          new Smartcar.InvalidSubscription(errorDescription),
          'super-secret-code',
          'some-state',
        );
      });

    test(// eslint-disable-next-line max-len
      'fires onComplete w/ "Unexpected error" error when `error` key has unsupported value', () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new Smartcar(options);
        const error = 'not_access_denied';
        const errorDescription = 'describes the error';

        const event = {
          data: {
            name: 'SmartcarAuthMessage',
            isSmartcarHosted: true,
            code: 'super-secret-code',
            error,
            errorDescription,
            state: 'some-state',
          },
          origin: CDN_ORIGIN,
        };

        smartcar.messageHandler(event);

        expect(smartcar.onComplete).toBeCalledWith(
          Error(`Unexpected error: ${error} - ${errorDescription}`),
          'super-secret-code',
          'some-state',
        );
      });
  });

  describe('getAuthUrl', () => {
    test('generates basic link without optional params', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        onComplete: jest.fn(),
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=auto&mode=live';
      const link = smartcar.getAuthUrl();
      expect(link).toEqual(expectedLink);
    });

    test('generates link with optional scope, state, and forcePrompt', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&state=foobarbaz';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

    test('generates test mode link', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: true,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=test&state=foobarbaz';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

    test('generates live mode link', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&state=foobarbaz';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

    test('generate link when vehicleInfo={...} included', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
      });

      expect(link).toEqual(expectedLink);
    });

    test('ignores erroneous vehicle info', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          pizza: 'isGood',
        },
      });

      expect(link.includes('&pizza=isGood')).toBe(false);
    });

    test('Adds single_select=true when singleSelect included', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&single_select=true&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
        singleSelect: true,
      });

      expect(link).toEqual(expectedLink);
    });

    test('Adds single_select_vin=12345 when singleSelect included as an object', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&single_select_vin=12345&single_select=true&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
        singleSelect: {
          vin: '12345',
        },
      });

      expect(link).toEqual(expectedLink);
    });

    test('Ignores junk properties when singleSelect is included as an object', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&single_select_vin=vin&single_select=true&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
        singleSelect: {
          pizza: '12345',
          vin: 'vin',
        },
      });

      expect(link).toEqual(expectedLink);
    });

    test('Ignores junk properties when singleSelect is included as an object with only junk properties', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&single_select=false&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
        singleSelect: {
          pizza: '12345',
        },
      });

      expect(link).toEqual(expectedLink);
    });

    test('Sets single_select=false with junk values passed to singleSelect', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const expectedLink =
        'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&single_select=false&state=foobarbaz&make=TESLA';

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
        singleSelect: 'dnsadnlksa',
      });

      expect(link).toEqual(expectedLink);
    });

    test('Excludes single_select from url when not passed to getAuthUrl', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        testMode: false,
      };

      const smartcar = new Smartcar(options);

      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
        vehicleInfo: {
          make: 'TESLA',
        },
      });

      expect(link.includes('single_select')).toBe(false);
    });
  });

  describe('openDialog and addClickHandler', () => {
    const options = {
      clientId: 'clientId',
      redirectUri: 'https://smartcar.com',
      scope: ['read_vehicle_info', 'read_odometer'],
      onComplete: jest.fn(),
    };

    const dialogOptions = {
      state: 'foobarbaz',
      forcePrompt: true,
    };

    // expected OAuth link
    const expectedLink =
    'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&mode=live&state=foobarbaz';

    test('openDialog calls window.open', () => {
      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new Smartcar(options);

      expect(window.open).toHaveBeenCalledTimes(0);

      mockOpen.mockImplementation((href, description, windowOptions) => {
        expect(href).toEqual(expectedLink);
        expect(description).toEqual('Connect your car');
        expect(isValidWindowOptions(windowOptions))
          .toBe(true, 'correctly formatted windowOptions');
      });

      smartcar.openDialog(dialogOptions);
      expect(window.open).toHaveBeenCalled();
    });

    test('_getWindowOptions returns a valid windowOptions string', () => {
      const windowOptionsA = {
        top: 0,
        left: '100a',
        width: NaN,
      };
      const windowOptionsB = {
        top: 100,
        left: 100.1,
        width: 20,
        height: 'abcd',
      };

      expect(Smartcar._getWindowOptions(windowOptionsA)).toBe('top=0,left=100,width=0,height=0,');
      expect(Smartcar._getWindowOptions(windowOptionsB)).toBe('top=100,left=100.1,width=100,height=0,');
    });

    test('addClickHandler throws error if both id and selector are not passed in', () => {
      // setup document body
      document.body.innerHTML = `<div>
      <button>Connect your car</button>
      </div>`;

      const smartcar = new Smartcar(options);
      const clickHandlerOptions = {
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      expect(() => smartcar.addClickHandler(clickHandlerOptions)).toThrow(
        'Could not add click handler: id or selector must be provided.',
      );
    });

    test('addClickHandler throws error if id matches no DOM element', () => {
      const id = 'connect-car-button';

      // setup document body
      document.body.innerHTML = `<div>
      <button id="${id}">Connect your car</button>
      </div>`;

      const smartcar = new Smartcar(options);
      const clickHandlerOptions = {
        id: 'incorrect-id',
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      expect(() => smartcar.addClickHandler(clickHandlerOptions)).toThrow(
        "Could not add click handler: element with 'incorrect-id' was not found.",
      );
    });

    test('addClickHandler throws error if selector matches no DOM element', () => {
      const className = 'incorrect-class-name';

      // setup document body
      document.body.innerHTML = `<div>
      <button>Connect your car</button>
      </div>`;

      const smartcar = new Smartcar(options);
      const clickHandlerOptions = {
        selector: `.${className}`,
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      expect(() => smartcar.addClickHandler(clickHandlerOptions)).toThrow(
        "Could not add click handler: element with '.incorrect-class-name' was not found.",
      );
    });

    test('addClickHandler adds event listener that calls openDialog on click event', () => {
      const id = 'connect-car-button';

      // setup document body
      document.body.innerHTML = `<div>
      <button id="${id}">Connect your car</button>
      </div>`;

      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new Smartcar(options);
      const clickHandlerOptions = {
        id,
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      smartcar.addClickHandler(clickHandlerOptions);

      expect(mockOpen).toHaveBeenCalledTimes(0);

      mockOpen.mockImplementation((href, description, windowOptions) => {
        expect(href).toEqual(expectedLink);
        expect(description).toEqual('Connect your car');
        expect(isValidWindowOptions(windowOptions))
          .toBe(true, 'correctly formatted windowOptions');
      });

      document.getElementById(id).click();
      expect(mockOpen).toHaveBeenCalled();
    });

    test('addClickHandler adds event listeners to all DOM elements that match the id/selector options', () => {
      const id = 'connect-car-button';
      const className = 'connect-button-class';

      // setup document body
      document.body.innerHTML = `<div>
      <button id="${id}">Connect your car</button>
      <button class="${className}">Connect your car</button>
      <button class="${className}">Connect your car</button>
      </div>`;

      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new Smartcar(options);
      const clickHandlerOptions = {
        id,
        selector: `.${className}`,
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      smartcar.addClickHandler(clickHandlerOptions);

      expect(mockOpen).toHaveBeenCalledTimes(0);

      mockOpen.mockImplementation((href, description, windowOptions) => {
        expect(href).toEqual(expectedLink);
        expect(description).toEqual('Connect your car');
        expect(isValidWindowOptions(windowOptions))
          .toBe(true, 'correctly formatted windowOptions');
      });

      document.getElementById(id).click();
      document.querySelectorAll(`.${className}`).forEach((element) => element.click());
      expect(mockOpen).toHaveBeenCalledTimes(3);
    });

    test('unmount removes the eventListener from the window object', () => {
      const mockAddEventListener = jest.fn();
      const mockRemoveEventListener = jest.fn();

      window.addEventListener = mockAddEventListener;
      window.removeEventListener = mockRemoveEventListener;

      const smartcar = new Smartcar(options);
      smartcar.unmount();

      expect(mockAddEventListener)
        .toHaveBeenCalledWith('message', smartcar.messageHandler);
      expect(mockRemoveEventListener)
        .toHaveBeenCalledWith('message', smartcar.messageHandler);
    });

    test('unmount removes the click eventListeners attached by addClickHandler', () => {
      const id = 'connect-car-button';
      const classNameA = 'connect-button-classA';
      const classNameB = 'connect-button-classB';

      // mock dom & event listeners
      document.body.innerHTML = `<div>
      <button id="${id}">Connect your car</button>
      <button class="${classNameA}">Connect your car</button>
      <button class="${classNameB}">Fancy connect</button>
      <button class="${classNameB}">Fancy connect</button>
      </div>`;
      document.getElementById(id).addEventListener = jest.fn();
      document.getElementById(id).removeEventListener = jest.fn();
      document.querySelectorAll(`.${classNameA}`).forEach((element) => {
        element.addEventListener = jest.fn();
        element.removeEventListener = jest.fn();
      });
      document.querySelectorAll(`.${classNameB}`).forEach((element) => {
        element.addEventListener = jest.fn();
        element.removeEventListener = jest.fn();
      });

      const smartcar = new Smartcar(options);
      const clickHandlerOptionsA = {
        id,
        selector: `.${classNameA}`,
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };
      const clickHandlerOptionsB = {
        selector: `.${classNameB}`,
        forcePrompt: dialogOptions.forcePrompt,
        state: 'fancy',
      };

      // call addClickHandler for multiple times with different options
      smartcar.addClickHandler(clickHandlerOptionsA);
      smartcar.addClickHandler(clickHandlerOptionsB);

      smartcar.unmount();

      expect(document.getElementById(id).addEventListener).toHaveBeenCalledTimes(1);
      expect(document.getElementById(id).removeEventListener).toHaveBeenCalledTimes(1);
      document.querySelectorAll(`.${classNameA}`)
        .forEach((element) => {
          expect(element.addEventListener).toHaveBeenCalledTimes(1);
          expect(element.removeEventListener).toHaveBeenCalledTimes(1);
        });
      document.querySelectorAll(`.${classNameB}`)
        .forEach((element) => {
          expect(element.addEventListener).toHaveBeenCalledTimes(1);
          expect(element.removeEventListener).toHaveBeenCalledTimes(1);
        });
    });
  });
});
