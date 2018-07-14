'use strict';

// override Smartcar's browser lint rules for Jest tests
// note that Jest ships with jsdom so window is loaded globally in Jest tests

/* eslint strict: ['error', 'global'] */
/* global require, __dirname, beforeAll, afterAll */

const config = require('./config');
const express = require('express');
const nightwatch = require('nightwatch');
const path = require('path');

describe('postMessage', () => {
  let client;
  let redirect;
  const shared = {};

  beforeAll(() => {
    shared.client = nightwatch.initClient(config.get('nightwatch'));
    shared.browser = shared.client.api();

    // client setup
    client = express()
      // for single page
      .get('/spa',
        (_, res) => res.sendFile(path.join(__dirname, '/spa.html')))
      .get('/sdk.js',
        (_, res) => res.sendFile(path.join(__dirname, '../../src/sdk.js')))
      .listen(3000);

    // redirect setup
    redirect = express()
      .use('/', express.static(path.join(__dirname, '../../src')))
      .listen(4000);
  });

  afterAll(() => {
    client.close();
    redirect.close();
  });

  test('using single page app variant, fires onComplete on postMessage from' +
    'expected origin specified by `origin` param', (done) => {
      // minimal test, does not go through OAuth flow, just tests that redirect
      // page hosted on separate backend posts back to origin parameter which
      // is then handled as expected by front end at origin

      // see spa.html for code run on page load
      shared.browser
        .url('http://localhost:3000/spa')
        // this assertion will be retried until it succeeds or we timeout
        .assert.urlEquals('http://localhost:3000/on-post-message-url')
        .end();

      shared.client.start(done);
    });
});
