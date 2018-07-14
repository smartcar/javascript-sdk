'use strict';

/* eslint strict: ['error', 'global'] */
/* global require, __dirname, module */

const convict = require('convict');
const path = require('path');

convict.addFormat({
  name: 'CI',
  validate: () => undefined,
  coerce: (isCI) => { return isCI === 'true' ? 'travis' : 'local'; },
});

const config = convict({
  env: {
    doc: 'The test environment.',
    format: 'CI',
    default: 'local',
    env: 'CI',
  },
  nightwatch: {
    // eslint-disable-next-line camelcase
    selenium_host: {
      doc: 'Selenium hostname.',
      format: String,
      default: 'localhost',
    },
    desiredCapabilities: {
      browserName: {
        doc: 'Browser name.',
        format: String,
        default: 'chrome',
      },
      javascriptEnabled: {
        doc: 'Flag to enable Javascript in nightwatch.',
        format: Boolean,
        default: true,
      },
      acceptSslCerts: {
        doc: 'Accept SSL Certificates.',
        format: Boolean,
        default: true,
      },
      chromeOptions: {
        args: {
          doc: 'Args sent to nightwatch.',
          format: Array,
          default: ['--no-sandbox'],
        },
      },
    },
    silent: {
      doc: 'Whether to run silently',
      format: Boolean,
      default: true,
    },
    globals: {
      waitForConditionTimeout: {
        doc: 'Wait for condition',
        format: Number,
        default: 200,
      },
      retryAssertionTimeout: {
        doc: 'Wait for condition',
        format: Number,
        default: 3000,
      },
    },
  },
});

const env = config.get('env');
config.loadFile(path.join(__dirname, env + '.json'));
config.validate({allowed: 'strict'});

module.exports = config;
