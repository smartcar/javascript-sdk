/* eslint-env node */
/* eslint-disable no-console */
'use strict';

const chalk = require('chalk');
const request = require('request');
const semver = require('semver');

const {version} = require('./package');

const primaryColor = (text) => chalk.yellow(text);
const highlight = (text) => chalk.cyan.bold(text);

request.get('https://registry.npmjs.org/@smartcar/auth', function(err, res, body) {
  if (err) {
    return;
  }

  body = JSON.parse(body);

  const {latest} = body['dist-tags'];

  if (semver.gt(latest, version)) {
    console.warn(
      primaryColor('\nYour Smartcar JavaScript SDK is outdated! Please update by running:\n'),
      highlight('> npm i @smartcar/auth@latest\n'),
    );
  }
});
