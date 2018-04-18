// We override Smartcar's browser lint rules for Jest tests.
// Note that Jest ships with jsdom so window is loaded globally in Jest tests.

/* eslint strict: ["error", "global"] */
/* global require, expect, jest */

'use strict';

test('callback', () => {
  const mockOnComplete = jest.fn();
  window.opener = {
    smartcar: {
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
