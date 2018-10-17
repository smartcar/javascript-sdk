'use strict';

/**
 * Only used on master builds, actually builds the release and pushes the
 * assets to the CDN, npm, and publishes a GitHub release.
 */
module.exports = {
  verifyRelease: [
    {
      path: '@semantic-release/exec',
      cmd:
        './build/verify-release.sh ${nextRelease.version} ${lastRelease.version}',
    },
  ],
  prepare: [
    '@semantic-release/npm',
    {
      path: '@semantic-release/exec',
      cmd: 'gulp build',
    },
  ],
  publish: [
    '@semantic-release/npm',
    '@semantic-release/github',
    {
      path: '@semantic-release/exec',
      cmd: 'gulp publish:cdn',
    },
  ],
};
