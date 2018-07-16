'use strict';

// override Smartcar's browser lint rules for Jest tests
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
      // for server side
      .get('/server-side',
        (_, res) => res.sendFile(path.join(__dirname, '/server_side.html')))
      // for server side
      .get('/redirect.html',
        (_, res) => res.sendFile(path.join(__dirname, '../../src/redirect.html')))
      .get('/redirect.js',
        (_, res) => res.sendFile(path.join(__dirname, '../../src/redirect.js')))
      // for both single page and server side
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

  test('using server side rendered variant, fires onComplete on postMessage' +
    'from expected origin (same as redirect origin)', (done) => {
    // minimal test, does not go through OAuth flow, just tests that with
    // redirect and front end hosted on same server, redirect page posts back
    // to the correct front end origin (same origin as itself) which is then
    // handled as expected by front end at origin

    // see server_side.html for code run on page load
    shared.browser
      .url('http://localhost:3000/server-side')
      // this assertion will be retried until it succeeds or we timeout
      .assert.urlEquals('http://localhost:3000/on-post-message-url')
      .end();

    shared.client.start(done);
  });
});
