/* eslint-env node */
/* eslint-disable no-console */

'use strict';

var fs = require('fs');
var COVERAGE_FILE = '.nyc_output/coverage.json';

var after = function(runner) {

  var coverage = runner.page.evaluate(function() {
    return window.__coverage__;
  });

  if (coverage) {
    console.log('Writing coverage to ', COVERAGE_FILE);
    fs.write(COVERAGE_FILE, JSON.stringify(coverage), 'w');
  } else {
    console.log('No coverage data generated');
  }

};


module.exports = {afterEnd: after};
