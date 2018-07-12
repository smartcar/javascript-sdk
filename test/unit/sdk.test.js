'use strict';

require('../../src/sdk.js');

describe('sdk', () => {
  const CDN_ORIGIN = 'https://javascript-sdk.smartcar.com';

  beforeEach(() => { window.Smartcar._hasBeenInstantiated = false; });

  describe('constructor', () => {
    test('throws error if constructor called without redirectUri', () => {
      expect(() => new window.Smartcar({clientId: 'uuid'}))
        .toThrow('A redirect URI option must be provided');
    });

    test('throws error if constructor called without clientId', () => {
      expect(() => new window.Smartcar({redirectUri: 'http://example.com'}))
        .toThrow('A client ID option must be provided');
    });

    test('throws error if smartcar already instantiated', () => {
      // initial instantiation
      // eslint-disable-next-line no-new
      new window.Smartcar({redirectUri: 'http://example.com', clientId: 'my-id'});
      expect(() =>
        new window.Smartcar({redirectUri: 'http://example.com', clientId: 'my-id'})
      )
        .toThrow(
          'Smartcar has already been instantiated in the window. Only one' +
          ' instance of Smartcar can be defined.'
        );
    });

    test('throws error if using Smartcar hosting without onComplete', () => {
      expect(() => new window.Smartcar({
        redirectUri: CDN_ORIGIN,
        clientId: 'my-id',
      }))
        .toThrow(
          "When using Smartcar's CDN redirect an onComplete function with at" +
          ' least 2 parameters (error & code) is required to handle' +
          ' completion of authorization flow'
        );
    });

    test(
      // eslint-disable-next-line max-len
      'throws error if using Smartcar hosting & passing onComplete with less than 2 parameters',
      () => {
        expect(() => window.Smartcar({
          redirectUri: CDN_ORIGIN,
          clientId: 'my-id',
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: (_) => {}, // stub function w/ < 2 params
        }))
          .toThrow(
            "When using Smartcar's CDN redirect an onComplete function with at" +
            ' least 2 parameters (error & code) is required to handle' +
            ' completion of authorization flow'
          );
      }
    );

    test('initializes correctly w/ self hosted redirect',
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: 'https://selfhosted.com',
          scope: ['read_vehicle_info', 'read_odometer'],
          onComplete: jest.fn(),
        };

        const smartcar = new window.Smartcar(options);

        Object.entries(options).forEach(
          ([key, option]) => expect(smartcar[key]).toEqual(option)
        );

        // this is set within the constructor
        expect(smartcar.responseType).toEqual('code');
        expect(smartcar.development).toEqual(false);

        // make sure onComplete can be called
        smartcar.onComplete();
        expect(options.onComplete).toBeCalled();
      });

    test('initializes correctly w/ smartcar CDN hosted redirect',
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}/redirect?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((_, __) => {}), // stub function w/ >= 2 params
        };

        const smartcar = new window.Smartcar(options);

        Object.entries(options).forEach(
          ([key, option]) => expect(smartcar[key]).toEqual(option)
        );

        // this is set within the constructor
        expect(smartcar.responseType).toEqual('code');
        expect(smartcar.development).toEqual(false);

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

      const smartcar = new window.Smartcar(options);

      expect(smartcar.onComplete).toBe(undefined);
    });

    test("doesn't break if onComplete is not passed", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
      };

      const smartcar = new Smartcar(options);

      const evnt = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://selfhosted.com',
      };

      smartcar.messageHandler(evnt);
    });

    test("doesn't fire onComplete w/o origin", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new window.Smartcar(options);

      const evnt = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
      };

      smartcar.messageHandler(evnt);

      expect(smartcar.onComplete)
        .not
        .toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test("doesn't fire onComplete when redirectUri & origin disagree", () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://selfhosted.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-empty-function
        onComplete: jest.fn(() => {}),
      };

      const smartcar = new window.Smartcar(options);

      const evnt = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: false,
          code: 'super-secret-code',
          error: undefined,
          state: 'some-state',
        },
        origin: 'https://some-other-url.com',
      };

      smartcar.messageHandler(evnt);

      expect(smartcar.onComplete)
        .not
        .toBeCalledWith(null, expect.anything(), expect.anything());
    });

    test(
      "doesn't fire onComplete or error when event.data is undefined",
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: 'https://selfhosted.com',
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-empty-function
          onComplete: jest.fn(() => {}),
        };

        const smartcar = new window.Smartcar(options);

        const evnt = {
          origin: 'https://selfhosted.com',
        };

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .not
          .toBeCalledWith(null, expect.anything(), expect.anything());
      }
    );

    test(
      "doesn't fire onComplete when message has no name field",
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: 'https://selfhosted.com',
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-empty-function
          onComplete: jest.fn(() => {}),
        };

        const smartcar = new window.Smartcar(options);

        const evnt = {
          data: {
            isSmartcarHosted: false,
            code: 'super-secret-code',
            error: undefined,
            state: 'some-state',
          },
          origin: 'https://selfhosted.com',
        };

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .not
          .toBeCalledWith(null, expect.anything(), expect.anything());
      }
    );

    test(
      "doesn't fire onComplete when message.name is not 'SmartcarAuthMessage'",
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: 'https://selfhosted.com',
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-empty-function
          onComplete: jest.fn(() => {}),
        };

        const smartcar = new window.Smartcar(options);

        const evnt = {
          data: {
            name: 'definitely not SmartcarAuthMessage',
            isSmartcarHosted: false,
            code: 'super-secret-code',
            error: undefined,
            state: 'some-state',
          },
          origin: 'https://selfhosted.com',
        };

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .not
          .toBeCalledWith(null, expect.anything(), expect.anything());
      }
    );

    test(
      // eslint-disable-next-line max-len
      'fires onComplete when redirectUri & origin agree, & message.name is SmartcarAuthMessage',
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new window.Smartcar(options);

        const evnt = {
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

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .toBeCalledWith(null, expect.anything(), expect.anything());
      }
    );

    test('fires onComplete w/o error when error: null in postMessage', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-unused-vars, no-empty-function
        onComplete: jest.fn((__, _) => {}),
      };

      const smartcar = new window.Smartcar(options);

      const evnt = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: true,
          code: 'super-secret-code',
          error: null,
          state: 'some-state',
        },
        origin: CDN_ORIGIN,
      };

      smartcar.messageHandler(evnt);

      expect(smartcar.onComplete)
        .toBeCalledWith(null, 'super-secret-code', 'some-state');
    });

    test('fires onComplete w/o error when error key not in postMessage', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
        scope: ['read_vehicle_info', 'read_odometer'],
        // eslint-disable-next-line no-unused-vars, no-empty-function
        onComplete: jest.fn((__, _) => {}),
      };

      const smartcar = new window.Smartcar(options);

      const evnt = {
        data: {
          name: 'SmartcarAuthMessage',
          isSmartcarHosted: true,
          code: 'super-secret-code',
          errorDescription: 'this doesnt matter',
          state: 'some-state',
        },
        origin: CDN_ORIGIN,
      };

      smartcar.messageHandler(evnt);

      expect(smartcar.onComplete)
        .toBeCalledWith(null, 'super-secret-code', 'some-state');
    });

    test(
      // eslint-disable-next-line max-len
      'fires onComplete w/ AccessDenied error when `error: access_denied` in postMessage',
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new window.Smartcar(options);
        const errorDescription = 'describes the error';

        const evnt = {
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

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .toBeCalledWith(new window.Smartcar.AccessDenied(errorDescription),
            'super-secret-code', 'some-state');
      }
    );

    test(
      // eslint-disable-next-line max-len
      'fires onComplete w/ "Unexpected error" error when `error` key has value other than `access_denied`',
      () => {
        const options = {
          clientId: 'clientId',
          redirectUri: `${CDN_ORIGIN}?app_origin=https://app.com`,
          scope: ['read_vehicle_info', 'read_odometer'],
          // eslint-disable-next-line no-unused-vars, no-empty-function
          onComplete: jest.fn((__, _) => {}),
        };

        const smartcar = new window.Smartcar(options);
        const error = 'not_access_denied';
        const errorDescription = 'describes the error';

        const evnt = {
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

        smartcar.messageHandler(evnt);

        expect(smartcar.onComplete)
          .toBeCalledWith(
            Error(`Unexpected error: ${error} - ${errorDescription}`),
            'super-secret-code',
            'some-state'
          );
      }
    );
  });

  describe('getAuthUrl', () => {

    test('generates basic link without optional params', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        onComplete: jest.fn(),
      };

      const smartcar = new window.Smartcar(options);

      const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=auto';
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

      const smartcar = new window.Smartcar(options);

      const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=foobarbaz';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

    test('generates development mode link', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        development: true,
      };

      const smartcar = new window.Smartcar(options);

      const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=foobarbaz&mock=true';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

    test('does not add mock to url if development false', () => {
      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
        development: false,
      };

      const smartcar = new window.Smartcar(options);

      const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=foobarbaz';
      const link = smartcar.getAuthUrl({
        state: 'foobarbaz',
        forcePrompt: true,
      });
      expect(link).toEqual(expectedLink);
    });

  });

  describe('getWindowOptions', () => {

    test('correctly computes size of popup window', () => {
      window.outerWidth = 1024;
      window.outerHeight = 768;
      window.screenX = 10;
      window.screenY = 20;

      // computed width: (1024 - 430) / 2 = 297
      // computed height: (768 - 500) / 8 = 134
      const expectedOptions = 'top=53.5,left=307,width=430,height=500,';

      expect(window.Smartcar._getWindowOptions()).toBe(expectedOptions);
    });

  });

  describe('openDialog and addClickHandler', () => {

    // computed width: (1024 - 430) / 2 = 297
    // computed height: (768 - 500) / 8 = 134
    const expectedOptions = 'top=53.5,left=307,width=430,height=500,';

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
    const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=foobarbaz';

    beforeEach(() => {
      // set window options
      window.outerWidth = 1024;
      window.outerHeight = 768;
      window.screenX = 10;
      window.screenY = 20;
    });

    test('openDialog calls window.open with correct args', () => {
      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new window.Smartcar(options);

      smartcar.openDialog(dialogOptions);

      expect(mockOpen).toHaveBeenCalledWith(expectedLink, 'Connect your car', expectedOptions);
    });

    test('addClickHandler throws error if id does not exist', () => {
      const id = 'connect-car-button';

      // setup document body
      document.body.innerHTML =
      `<div>
      <button id="${id}">Connect your car</button>
      </div>`;

      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new window.Smartcar(options);
      const clickHandlerOptions = {
        id: 'incorrect-id',
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      expect(() => smartcar.addClickHandler(clickHandlerOptions)).toThrow(
        'Could not add click handler: element with id \'incorrect-id\' was not found.'
      );
    });

    test('addClickHandler adds event listener that calls openDialog on click event', () => {
      const id = 'connect-car-button';

      // setup document body
      document.body.innerHTML =
      `<div>
      <button id="${id}">Connect your car</button>
      </div>`;

      // mock window.open
      const mockOpen = jest.fn();
      window.open = mockOpen;

      const smartcar = new window.Smartcar(options);
      const clickHandlerOptions = {
        id,
        state: dialogOptions.state,
        forcePrompt: dialogOptions.forcePrompt,
      };

      smartcar.addClickHandler(clickHandlerOptions);

      expect(mockOpen).toHaveBeenCalledTimes(0);

      document.getElementById(id).click();

      expect(mockOpen).toHaveBeenCalledWith(expectedLink, 'Connect your car', expectedOptions);
    });

  });

});
