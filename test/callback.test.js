'use strict';

/* eslint-disable global-require */

describe('callback', () => {

  beforeEach(() => {
    // reset window.opener before each test
    window.opener = undefined;
    jest.resetModules();
  });

  test('throws error if window.opener undefined', () => {
    expect(() => require('../src/callback')).toThrow('window.opener is undefined');
  });

  test('throws error if window.opener._smartcar is undefined', () => {
    window.opener = {};

    expect(() => require('../src/callback')).toThrow('window.opener._smartcar is undefined');
  });

  test('calls close if onComplete undefined', () => {
    const mockClose = jest.fn();
    window.close = mockClose;

    window.opener = {_smartcar: {}};

    require('../src/callback');

    expect(mockClose).toHaveBeenCalled();
  });

  test('calls onComplete and window.close()', () => {
    const mockClose = jest.fn();
    window.close = mockClose;

    const mockOnComplete = jest.fn();
    window.opener = {
      _smartcar: {
        onComplete: mockOnComplete,
      },
    };


    require('../src/callback');

    // we want to verify onComplete and onClose are called when callback is loaded
    expect(mockOnComplete).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
