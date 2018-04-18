// We override Smartcar's browser lint rules for Jest tests.
// Note that Jest ships with jsdom so window is loaded globally in Jest tests.

/* eslint strict: ["error", "global"] */
/* global require, expect, jest */

'use strict';

describe('callback', () => {

  beforeEach(() => {
    // reset window.opener before each test
    window.opener = undefined;
    jest.resetModules();
  });

  test('throws error if window.opener undefined', () => {
    // eslint-disable-next-line global-require
    expect(() => require('../src/callback')).toThrow('window.opener is undefined');
  });

  test('throws error if window.opener._smartcar is undefined', () => {
    window.opener = {};

    // eslint-disable-next-line global-require
    expect(() => require('../src/callback')).toThrow('window.opener._smartcar is undefined');
  });

  test('calls onComplete and window.close()', () => {
    const mockOnComplete = jest.fn();
    window.opener = {
      _smartcar: {
        onComplete: mockOnComplete,
      },
    };

    const mockClose = jest.fn();
    window.close = mockClose;

    require('../src/callback'); // eslint-disable-line global-require

    // we want to verify onComplete and onClose are called when callback is loaded
    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
