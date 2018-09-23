'use strict';

// override Smartcar's browser lint rules for Jest tests
/* eslint strict: ['error', 'global'] */
/* global require, __dirname, beforeAll, afterAll */

const express = require('express');
const nightwatch = require('nightwatch');
const path = require('path');

const config = require('./config');
const {version} = require('../../package.json');

describe('postMessage', () => {
  let client, redirect;
  const clientPort = 3000;
  const redirectPort = 4000;
  const shared = {};

  beforeAll(() => {
    shared.client = nightwatch.initClient(config.get('nightwatch'));
    shared.browser = shared.client.api();

    // append version
    const addVersion = (appendee) => `${appendee}-${version}`;
    // get path to built files
    const getVersionedPath =
      (file, ext) => `../../dist/${addVersion(file)}.${ext}`;

    // redirect hosted at /redirect
    // file structure -> dist/redirect-${version}/index.js
    const redirectIndexPath =
      `../../dist/${addVersion('redirect')}/index.html`;
    // built redirect-${version}.html references redirect-${version}.js
    const redirectJavascriptPath = `/${addVersion('redirect')}.js`;

    // client setup
    client = express()
      // for single page
      .get('/spa', (_, res) =>
        res.sendFile(path.join(__dirname, '/spa.html')))
      // for server side
      .get('/server-side', (_, res) =>
        res.sendFile(path.join(__dirname, '/server-side.html')))
      // for server side
      .get('/redirect', (_, res) =>
        res.sendFile(path.join(__dirname, redirectIndexPath)))
      .get(redirectJavascriptPath, (_, res) =>
        res.sendFile(path.join(__dirname, getVersionedPath('redirect', 'js'))))
      // for both single page and server side
      .get('/sdk.js', (_, res) =>
        res.sendFile(path.join(__dirname, getVersionedPath('sdk', 'js'))))
      .listen(clientPort);

    // redirect setup
    redirect = express()
      .get('/redirect', (_, res) =>
        res.sendFile(path.join(__dirname, redirectIndexPath)))
      .get(redirectJavascriptPath, (_, res) =>
        res.sendFile(path.join(__dirname, getVersionedPath('redirect', 'js'))))
      .listen(redirectPort);
  });

  afterAll(() => {
    client.close();
    redirect.close();
  });

  test('using single page app variant, fires onComplete on postMessage from' +
    ' expected origin specified by `app_origin` query param', (done) => {
    // minimal test, does not go through OAuth flow, just tests that redirect
    // page hosted on separate server posts back to `app_origin` parameter which
    // is then handled as expected by client at `app_origin`

    // see spa.html for code run on page load
    shared.browser
      .url(`http://localhost:${clientPort}/spa`)
      // this assertion will be retried until it succeeds or we timeout
      .assert.urlEquals(`http://localhost:${clientPort}/on-post-message-url`)
      .end();

    shared.client.start(done);
  });

  test('using server side rendered variant, fires onComplete on postMessage' +
    ' from expected origin (same as redirect page origin)', (done) => {
    // minimal test, does not go through OAuth flow, just tests that with
    // redirect and client hosted on same server, redirect page posts back
    // to the correct client origin (same origin as itself) which is then
    // handled as expected by client at origin

    // see server-side.html for code run on page load
    shared.browser
      .url(`http://localhost:${clientPort}/server-side`)
      // this assertion will be retried until it succeeds or we timeout
      .assert.urlEquals(`http://localhost:${clientPort}/on-post-message-url`)
      .end();

    shared.client.start(done);
  });
});
