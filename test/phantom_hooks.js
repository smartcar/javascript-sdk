'use strict';
module.exports = {
  afterEnd: function(runner) {
    var fs = require('fs');
    var coverage = runner.page.evaluate(function() {
      // jshint browser:true
      return window.__coverage__;
    });

    if (coverage) {
      console.log('Writing coverage to coverage/coverage.json');
      fs.write('.nyc_output/coverage.json', JSON.stringify(coverage), 'w');
    } else {
      console.log('No coverage data generated');
    }
  },
};
