'use strict';

const publish = require('./publish');

/**
 * Used on every travis build to verify if the readme and package.json have
 * been updated correctly
 */
module.exports = {
  dryRun: true,
  verifyConditions: [],
  verifyRelease: [...publish.verifyRelease],
  prepare: [],
  publish: [],
  success: [],
  fail: [],
};
