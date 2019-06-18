'use strict';

const express = require('express');
const nightwatch = require('nightwatch');
const path = require('path');

const config = require('./config');
const {version} = require('../../package.json');

const majorVersion = version.slice(0, version.indexOf('.'));

describe('postMessage', () => {
  let client, redirect;
  const clientPort = 3000;
  const redirectPort = 4000;

  const shared = {};

  beforeAll(() => {
    shared.client = nightwatch.initClient(config.get('nightwatch'));
    shared.browser = shared.client.api();

    // append version
    const addMajorVersion = (appendee) => `v${majorVersion}/${appendee}`;
    const addVersion = (appendee) => `${version}/${appendee}`;

    // get path to files released under major version (redirect, redirect.js)
    const getMajorVersionedPath = (file, ext) => `../../dist/cdn/${addMajorVersion(file)}.${ext}`;

    // get path to files released under full semver (sdk.js)
    const getFullVersionedPath = (file, ext) => `../../dist/cdn/${addVersion(file)}.${ext}`;

    // redirect hosted at /redirect
    // file structure -> dist/v${majorVersion}/redirect
    const redirectHtmlPath = `../../dist/cdn/${addMajorVersion('redirect')}`;
    // built redirect references /v${majorVersion}/redirect.js
    const redirectJavascriptPath = `/${addMajorVersion('redirect')}.js`;

    // client setup
    client = express()
      // for single page
      .get('/spa', (_, res) => res.sendFile(path.join(__dirname, '/spa.html')))
      // for server side
      .get('/server-side', (_, res) => res.sendFile(path.join(__dirname, '/server-side.html')))
      // for server side
      .get('/redirect', (_, res) =>
        res.sendFile(
          path.join(__dirname, redirectHtmlPath),
          // force treating of extensionless file as html
          {headers: {'content-type': 'text/html'}},
        ),
      )
      .get(redirectJavascriptPath, (_, res) =>
        res.sendFile(path.join(__dirname, getMajorVersionedPath('redirect', 'js'))),
      )
      // for both single page and server side
      .get('/sdk.js', (_, res) =>
        res.sendFile(path.join(__dirname, getFullVersionedPath('sdk', 'js'))),
      )
      .listen(clientPort);

    // mock out Smartcar Javascript SDK CDN
    redirect = express()
      .get('/redirect', (_, res) =>
        res.sendFile(
          path.join(__dirname, redirectHtmlPath),
          // force treating of extensionless file as html
          {headers: {'content-type': 'text/html'}},
        ),
      )
      .get(redirectJavascriptPath, (_, res) =>
        res.sendFile(path.join(__dirname, getMajorVersionedPath('redirect', 'js'))),
      )
      .listen(redirectPort);
  });

  afterAll(() => {
    client.close();
    redirect.close();
  });

  test('single page app = fires onComplete on postMessage from expected origin', (done) => {
    // minimal test, does not go through Connect, just tests that redirect
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

  test('single page app = fires onComplete on postMessage from expected origin', (done) => {
    // minimal test, does not go through Connect, just tests that with
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
