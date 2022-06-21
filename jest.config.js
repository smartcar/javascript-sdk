'use strict';

/* eslint-env node */

module.exports = {
  testEnvironment: 'jest-environment-jsdom-global',
  moduleFileExtensions: ['js'],
  moduleDirectories: ['node_modules'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
};
