// We override Smartcar's browser lint rules for Jest tests.
// Note that Jest ships with jsdom so window is loaded globally in Jest tests.

/* eslint strict: ["error", "global"] */
/* global require, expect, jest */

'use strict';

const _ = require('lodash');
const $ = require('jquery');

require('../src/sdk.js');

describe('sdk', () => {

  beforeEach(() => {
    // reset window._smartcar before each test
    window._smartcar = undefined;
  });

  describe('constructor', () => {

    test('throws error if window._smartcar already defined', () => {
      window._smartcar = jest.fn();

      const options = {
        clientId: 'clientId',
        redirectUri: 'https://smartcar.com',
        scope: ['read_vehicle_info', 'read_odometer'],
        onComplete: jest.fn(),
      };

      expect(() => new window.Smartcar(options)).toThrow('window._smartcar is already defined');
    });

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
      state: 'platform=web',
      forcePrompt: true,
    };

    // expected OAuth link
    const expectedLink = 'https://connect.smartcar.com/oauth/authorize?response_type=code&client_id=clientId&redirect_uri=https%3A%2F%2Fsmartcar.com&approval_prompt=force&scope=read_vehicle_info%20read_odometer&state=platform=web';

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

      $(`#${id}`).click();

      expect(mockOpen).toHaveBeenCalledWith(expectedLink, 'Connect your car', expectedOptions);
    });

  });

});
