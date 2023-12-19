'use strict';

/**
 * @jest-environment node
 */

/* eslint-disable global-require */

describe('redirect', () => {
  const CDN_ORIGIN = 'https://javascript-sdk.smartcar.com';

  beforeEach(() => {
    // reset window.opener before each test
    window.opener = undefined;
    jest.resetModules();
  });

  test('throws error if window.opener undefined', () => {
    expect(() => require('../../src/redirect')).toThrow('window.opener must be defined');
  });

  test('calls close', () => {
    // eslint-disable-next-line no-empty-function
    window.opener = {postMessage: () => {}};

    const mockClose = jest.fn();
    window.close = mockClose;

    require('../../src/redirect');
    expect(mockClose).toBeCalled();
  });

  test('calls window.postMessage & window.close', () => {
    window.opener = {};

    const mockClose = jest.fn();
    window.close = mockClose;

    const mockPostMessage = jest.fn();
    window.opener.postMessage = mockPostMessage;

    require('../../src/redirect');

    // verify postMessage and close are called on load
    expect(mockPostMessage).toBeCalled();
    expect(mockClose).toBeCalled();
  });

  test('should post to self hosted origin', () => {
    window.opener = {};

    const selfHostedOrigin = 'https://www.the-next-awesome-car-app.com';
    jsdom.reconfigure({url: selfHostedOrigin});

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect');
    expect(mockPost).toBeCalledWith(expect.anything(), selfHostedOrigin);
  });

  test('should post to `app_origin` param', () => {
    window.opener = {};

    const appOrigin = 'https://www.the-next-awesome-car-app.com';
    const cdnOrigin = `${CDN_ORIGIN}/redirect?app_origin=${appOrigin}`;
    jsdom.reconfigure({url: cdnOrigin});

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect');
    expect(mockPost).toBeCalledWith(expect.anything(), appOrigin);
  });

  // eslint-disable-next-line max-len
  test('if redirect origin is not javascript-sdk.smartcar.com then isSmartcarHosted: false', () => {
    window.opener = {};

    const selfHostedOrigin = 'https://www.the-next-awesome-car-app.com';
    jsdom.reconfigure({url: selfHostedOrigin});

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect');
    expect(mockPost).toBeCalledWith(
      {
        code: null,
        error: null,
        errorDescription: null,
        isSmartcarHosted: false,
        name: 'SmartcarAuthMessage',
        state: null,
        make: null,
        model: null,
        vin: null,
        year: null,
        virtualKeyUrl: null,
      },
      selfHostedOrigin,
    );
  });

  // eslint-disable-next-line max-len
  test('if redirect origin is javascript-sdk.smartcar.com then isSmartcarHosted: true', () => {
    window.opener = {};

    const appOrigin = 'https://www.the-next-awesome-car-app.com';
    const cdnOrigin = `${CDN_ORIGIN}/redirect?app_origin=${appOrigin}`;
    jsdom.reconfigure({url: cdnOrigin});

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect');
    expect(mockPost).toBeCalledWith(
      {
        code: null,
        error: null,
        errorDescription: null,
        isSmartcarHosted: true,
        name: 'SmartcarAuthMessage',
        state: null,
        make: null,
        model: null,
        vin: null,
        year: null,
        virtualKeyUrl: null,
      },
      appOrigin,
    );
  });

  test('should post message with expected parameters', () => {
    window.opener = {};

    const appOrigin = 'https://www.the-next-awesome-car-app.com';
    const code = 'super-secret-code';
    const error = 'vehicle_incompatible';
    const errorDescription = 'this-is-an-error-description';
    const state = 'some-random-state';
    const vin = 'some-vin';
    const make = 'BMW';
    const model = 'M3';
    const year = '2013';
    const virtualKeyUrl = 'https://www.tesla.com/_ak/smartcar.com';

    const params = new URLSearchParams();
    params.set('code', code);
    params.set('error', error);
    params.set('error_description', errorDescription);
    params.set('state', state);
    params.set('vin', vin);
    params.set('make', make);
    params.set('model', model);
    params.set('year', year);
    params.set('virtual_key_url', virtualKeyUrl);

    const cdnOrigin = `${CDN_ORIGIN}/redirect?app_origin=${appOrigin}&${params.toString()}`;

    jsdom.reconfigure({url: cdnOrigin});

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect');
    expect(mockPost).toBeCalledWith(
      {
        code,
        error,
        errorDescription,
        isSmartcarHosted: true,
        name: 'SmartcarAuthMessage',
        state,
        make,
        model,
        vin,
        year,
        virtualKeyUrl,
      },
      appOrigin,
    );
  });
});
