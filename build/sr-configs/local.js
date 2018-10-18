'use strict';

/**
 * Run locally to write the next version into the package.json and update the
 * readme
 */
module.exports = {
  ci: false,
  dryRun: true,
  repositoryUrl: 'git@github.com:smartcar/javascript-sdk',
  verifyConditions: [],
  verifyRelease: {
    path: '@semantic-release/exec',
    cmd:
      './build/write-package-version.js ${nextRelease.version} && npm run readme && npm run jsdoc',
  },
  prepare: [],
  publish: [],
  success: [],
  fail: [],
};
