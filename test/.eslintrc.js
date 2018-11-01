'use strict';

module.exports = {
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    node: true,
    jest: true,
  },
  globals: {
    jsdom: false, // false indicates that jsdom is a read-only global
  },
};
