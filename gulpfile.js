/* eslint-env node */

'use strict';

const awspublish = require('gulp-awspublish');
const babel = require('gulp-babel');
const gulp = require('gulp');
const path = require('path');
const rename = require('gulp-rename');
const template = require('gulp-template');
const uglify = require('gulp-uglify');
const umd = require('gulp-umd');
const {version} = require('./package');

/**
 * UMD wrap sdk.js
 */
gulp.task('build:umd', function() {
  return gulp.src('src/sdk.js')
    .pipe(umd({
      // CommonJS export name
      exports: function() { return 'Smartcar'; },
      // Global namespace for Web.
      namespace: function() { return 'Smartcar'; },
      // returnExports template with istanbul ignore
      template: path.join(__dirname, 'build/returnExports.js'),
    }))
    .pipe(gulp.dest('dist/umd'));
});

/**
 * Build sdk.js for npm publishing.
 */
gulp.task('build:npm', ['build:umd'], function() {
  return gulp.src('dst/umd/sdk.js')
    .pipe(babel())
    .pipe(gulp.dest('dist/npm'));
});

/**
 * Build JS for CDN publishing.
 */
gulp.task('build:cdn:js', ['build:umd'], function() {
  return gulp.src(['src/redirect.js', 'dist/umd/sdk.js'])
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({suffix: `-${version}`}))
    .pipe(gulp.dest('dist/cdn'));
});

/**
 * Build HTML for CDN publishing
 */
gulp.task('build:cdn:html', function() {
  return gulp.src('src/redirect.html')
    .pipe(template({version}))
    .pipe(rename(`redirect-${version}`))
    .pipe(gulp.dest('dist/cdn'));
});

/**
 * Build all tasks for CDN publishing.
 */
gulp.task('build:cdn', ['build:cdn:js', 'build:cdn:html']);

/**
 * Build all tasks for CDN and npm publishing.
 */
gulp.task('build', ['build:cdn', 'build:npm']);

// Setup AWS publisher to the Smartcar CDN.
const publisher = awspublish.create({
  region: 'us-west-2',
  params: {Bucket: 'smartcar-production-javascript-sdk'},
});

/**
 * Publish redirect HTML to the CDN.
 *
 * We strip the `.html` extension from our html file so add content-type header
 * to identify the file as `text/html`.
 */
gulp.task('publish:cdn:html', function() {
  return gulp.src(`dist/cdn/redirect-${version}`)
    .pipe(publisher.publish({'content-type': 'text/html'}))
    .pipe(awspublish.reporter());
});

/**
 * Publish JS to the CDN.
 */
gulp.task('publish:cdn:js', function() {
  return gulp.src('dist/cdn/**/*.js')
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});

/**
 * Publish all files to the CDN.
 */
gulp.task('publish:cdn', ['publish:cdn:html', 'publish:cdn:js']);
