// We override Smartcar's browser lint rules for Jest tests.
// Note that Jest ships with jsdom so window is loaded globally in Jest tests.

/* eslint strict: ['error', 'global'] */
/* global require, expect, jest */

'use strict';

describe('redirect', () => {
  beforeEach(() => {
    // reset window.opener before each test
    window.opener = undefined;
    jest.resetModules();
  });

  test('throws error if window.opener undefined', () => {
    // eslint-disable-next-line global-require
    expect(() => require('../../src/redirect'))
      .toThrow('window.opener must be defined');
  });

  test('calls close', () => {
    // eslint-disable-next-line no-empty-function
    window.opener = {postMessage: () => {}};

    const mockClose = jest.fn();
    window.close = mockClose;

    require('../../src/redirect'); // eslint-disable-line global-require
    expect(mockClose).toBeCalled();
  });

  test('calls window.postMessage & window.close', () => {
    window.opener = {};

    const mockClose = jest.fn();
    window.close = mockClose;

    const mockPostMessage = jest.fn();
    window.opener.postMessage = mockPostMessage;

    require('../../src/redirect'); // eslint-disable-line global-require

    // verify postMessage and close are called on load
    expect(mockPostMessage).toBeCalled();
    expect(mockClose).toBeCalled();
  });

  test('should post to self hosted origin', () => {
    window.opener = {};

    const selfHostedOrigin = 'https://www.the-next-awesome-car-app.com';
    jsdom.reconfigure({url: selfHostedOrigin}); // eslint-disable-line no-undef

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect'); // eslint-disable-line global-require
    expect(mockPost).toBeCalledWith(expect.anything(), selfHostedOrigin);
  });

  test('should post to origin param', () => {
    window.opener = {};

    const appOrigin = 'https://www.the-next-awesome-car-app.com';
    const cdnOrigin = `https://cdn.smartcar.com/redirect?origin=${appOrigin}`;
    jsdom.reconfigure({url: cdnOrigin}); // eslint-disable-line no-undef

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect'); // eslint-disable-line global-require
    expect(mockPost).toBeCalledWith(expect.anything(), appOrigin);
  });

  test('if redirect origin is not cdn.smartcar.com then isSmartcarHosted: false',
    () => {
      window.opener = {};

      const selfHostedOrigin = 'https://www.the-next-awesome-car-app.com';
      jsdom.reconfigure({url: selfHostedOrigin}); // eslint-disable-line no-undef

      const mockPost = jest.fn();
      window.opener.postMessage = mockPost;

      require('../../src/redirect'); // eslint-disable-line global-require
      expect(mockPost)
        .toBeCalledWith(
          {isSmartcarHosted: false, error: null, code: null, state: null},
          selfHostedOrigin
        );
    });

  test('if redirect origin is cdn.smartcar.com then isSmartcarHosted: true',
    () => {
      window.opener = {};

      const appOrigin = 'https://www.the-next-awesome-car-app.com';
      const cdnOrigin = `https://cdn.smartcar.com/redirect?origin=${appOrigin}`;
      jsdom.reconfigure({url: cdnOrigin}); // eslint-disable-line no-undef

      const mockPost = jest.fn();
      window.opener.postMessage = mockPost;

      require('../../src/redirect'); // eslint-disable-line global-require
      expect(mockPost)
        .toBeCalledWith(
          {isSmartcarHosted: true, error: null, code: null, state: null},
          appOrigin
        );
    });

  test('should post message with expected parameters', () => {
    window.opener = {};

    const appOrigin = 'https://www.the-next-awesome-car-app.com';
    const code = 'super-secret-code';
    const errDesc = 'this-is-an-error-description';
    const state = 'some-random-state';
    const cdnOrigin = `https://cdn.smartcar.com/redirect?origin=${appOrigin}&` +
      `code=${code}&error_description=${errDesc}&state=${state}`;
    jsdom.reconfigure({url: cdnOrigin}); // eslint-disable-line no-undef

    const mockPost = jest.fn();
    window.opener.postMessage = mockPost;

    require('../../src/redirect'); // eslint-disable-line global-require
    expect(mockPost).toBeCalledWith(
      {
        code,
        error: errDesc,
        state,
        isSmartcarHosted: true,
      },
      appOrigin
    );
  });
});
