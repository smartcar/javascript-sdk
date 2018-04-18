// We override Smartcar's browser lint rules for Jest tests.
// Note that Jest ships with jsdom so window is loaded globally in Jest tests.

/* eslint strict: ["error", "global"] */
/* global require, expect, jest */

'use strict';

const _ = require('lodash');
require('../src/sdk.js');

describe('constructor', () => {
  test('initializes correctly', () => {
    const options = {
      clientId: 'clientId',
      redirectUri: 'https://smartcar.com',
      scope: ['read_vehicle_info', 'read_odometer'],
      onComplete: jest.fn(),
    };

    const smartcar = new window.Smartcar(options);

    _.forEach(options, (option, key) => {
      expect(smartcar[key]).toEqual(option);
    });

    // this is set within the constructor
    expect(smartcar.grantType).toEqual('code');

    // make sure onComplete can be called
    smartcar.onComplete();
    expect(options.onComplete).toHaveBeenCalled();

    expect(window._smartcar).toEqual(smartcar);
  });

  test('defaults onComplete to empty function', () => {
    const options = {
      clientId: 'clientId',
      redirectUri: 'https://smartcar.com',
      scope: ['read_vehicle_info', 'read_odometer'],
    };

    const smartcar = new window.Smartcar(options);

    expect(typeof smartcar.onComplete).toBe('function');
  });
});

describe('generateLink', () => {
  test('generates basic link without optional params', () => {
    const options = {
      clientId: 'clientId',
      redirectUri: 'https://smartcar.com',
      onComplete: jest.fn(),
    };

    const smartcar = new window.Smartcar(options);

    const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=auto';
    const link = smartcar.generateLink();
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

    const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=platform=web';
    const link = smartcar.generateLink({
      state: 'platform=web',
      forcePrompt: true,
    });
    expect(link).toEqual(expectedLink);
  });
});

describe('openDialog', () => {
  // TODO add openDialog tests
});

describe('addClickHandler', () => {
  // TODO add addClickHandler tests
});
