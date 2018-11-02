'use strict';

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
      (file, ext) => `../../dist/cdn/${addVersion(file)}.${ext}`;

    // redirect hosted at /redirect
    // file structure -> dist/redirect-${version}
    const redirectHtmlPath = `../../dist/cdn/${addVersion('redirect')}`;
    // built redirect-${version} references redirect-${version}.js
    const redirectJavascriptPath = `/${addVersion('redirect')}.js`;

    // client setup
    client = express()
      // for single page
      .get('/spa', (_, res) =>
        res.sendFile(path.join(__dirname, '/spa.html')))
      .get('/sdk.js', (_, res) =>
        res.sendFile(path.join(__dirname, getVersionedPath('sdk', 'js'))))
      .listen(clientPort);

    // mock out Smartcar Javascript SDK CDN
    redirect = express()
      .get('/redirect', (_, res) =>
        res.sendFile(
          path.join(__dirname, redirectHtmlPath),
          // force treating of extensionless file as html
          {headers: {'content-type': 'text/html'}}
        )
      )
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
});
