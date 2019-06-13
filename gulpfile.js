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

const majorVersion = version.slice(0, version.indexOf('.'));

/**
 * Add package version to README.
 */
gulp.task('template:readme', function() {
  return gulp
    .src('README.mdt')
    .pipe(template({version}))
    .pipe(rename({extname: '.md'}))
    .pipe(gulp.dest('.'));
});

/**
 * UMD wrap sdk.js
 */
gulp.task('build:umd', function() {
  return gulp
    .src('src/sdk.js')
    .pipe(
      umd({
        // CommonJS export name
        exports: function() {
          return 'Smartcar';
        },
        // Global namespace for Web.
        namespace: function() {
          return 'Smartcar';
        },
        // returnExports template with istanbul ignore
        template: path.join(__dirname, 'build/returnExports.js'),
      }),
    )
    .pipe(gulp.dest('dist/umd'));
});

/**
 * Build sdk.js for npm publishing.
 */
gulp.task('build:npm', ['build:umd'], function() {
  return gulp
    .src('dist/umd/sdk.js')
    .pipe(babel())
    .pipe(gulp.dest('dist/npm'));
});

/**
 * Build JS for CDN publishing.
 */
gulp.task('build:cdn:js', ['build:umd'], function() {
  return gulp
    .src(['src/redirect.js', 'dist/umd/sdk.js'])
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest(`dist/cdn/v${majorVersion}`));
});

/**
 * Build HTML for CDN publishing
 */
gulp.task('build:cdn:html', function() {
  return gulp
    .src('src/redirect.html')
    .pipe(template({majorVersion}))
    .pipe(rename('redirect')) // Removes .html extension
    .pipe(gulp.dest(`dist/cdn/v${majorVersion}`));
});

/**
 * Legacy support for accessing redirect via old URL scheme publishing.
 *
 * Previously, files would be `redirect-{semver}`. Now they are
 * `v{majorVersion}/redirect`.
 *
 * Based on usage data, customers only use 2.0.0, 2.1.0, and 2.1.1 at the time
 * of this change, so we chose to explicitly provide backwards compatibility for
 * these version only.
 *
 */
gulp.task('build:cdn:html:legacy', function(done) {
  // We should only update old files while we're on major version 2
  if (Number(majorVersion) > 2) {
    return done();
  }

  return gulp
    .src('src/redirect.html')
    .pipe(template({majorVersion: '2'}))
    .pipe(rename('redirect-2.0.0'))
    .pipe(gulp.dest('dist/cdn/legacy'))
    .pipe(rename('redirect-2.1.0'))
    .pipe(gulp.dest('dist/cdn/legacy'))
    .pipe(rename('redirect-2.1.1'))
    .pipe(gulp.dest('dist/cdn/legacy'));
});

/**
 * Build all tasks for CDN publishing.
 */
gulp.task('build:cdn', ['build:cdn:js', 'build:cdn:html', 'build:cdn:html:legacy']);

/**
 * Build all tasks for CDN and npm publishing.
 *
 * dist/
 * ├── cdn
 * │   ├── redirect-2.0.0       // HTML file without extension
 * │   ├── redirect-2.0.0.js    // babel-ed, uglify-ed
 * │   └── sdk-2.0.0.js         // UMD wrapped, babel-ed, uglify-ed
 * ├── npm
 * │   └── sdk.js               // UMD wrapped, babel-ed
 * └── umd
 *     └── sdk.js               // UMD wrapped
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
  return gulp
    .src(`dist/cdn/redirect-${version}`)
    .pipe(publisher.publish({'content-type': 'text/html'}))
    .pipe(awspublish.reporter());
});

/**
 * Publish JS to the CDN.
 */
gulp.task('publish:cdn:js', function() {
  return gulp
    .src('dist/cdn/**/*.js')
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});

/**
 * Publish all files to the CDN.
 */
gulp.task('publish:cdn', ['publish:cdn:html', 'publish:cdn:js']);
