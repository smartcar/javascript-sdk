/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var fs = require('fs');
var COVERAGE_FILE = '.nyc_output/coverage.json';

var after = function(runner) {

  var coverage = runner.page.evaluate(function() {
    return window.__coverage__;
  });

  if (!coverage) {
    return console.error('No coverage data generated');
  }

  coverage = JSON.stringify(coverage);
  coverage = coverage.replace(/"(\w+?)\.js"/g, '"src/$1.js"');
  fs.write(COVERAGE_FILE, coverage, 'w');

};


module.exports = {afterEnd: after};
