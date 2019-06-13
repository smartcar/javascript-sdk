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
    .pipe(template({version, majorVersion}))
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
 * Build redirect for CDN publishing.
 */
gulp.task('build:cdn:redirect', function() {
  return gulp
    .src('src/redirect.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest(`dist/cdn/v${majorVersion}`));
});

/**
 * Build SDK for CDN publishing.
 */
gulp.task('build:cdn:sdk', ['build:umd'], function() {
  return gulp
    .src('dist/umd/sdk.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest(`dist/cdn/${version}`));
});

/**
 * Build all JS for CDN publishing.
 */
gulp.task('build:cdn:js', ['build:cdn:redirect', 'build:cdn:sdk']);

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
  if (Number(majorVersion) !== 2) {
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
 * Publish legacy HTML to the CDN. These files must be uploaded to the root of
 * the bucket and depend on /v2/redirect.js existing.
 *
 * We strip the `.html` extension from our html file so add content-type header
 * to identify the file as `text/html`.
 */
gulp.task('publish:cdn:html:legacy', function() {
  return gulp
    .src('dist/cdn/legacy/*')
    .pipe(publisher.publish({'content-type': 'text/html'}))
    .pipe(awspublish.reporter());
});

/**
 * Publish HTML to the CDN in the major version folder (e.g. /v2/redirect).
 *
 * We strip the `.html` extension from our html file so add content-type header
 * to identify the file as `text/html`.
 */
gulp.task('publish:cdn:html', function() {
  return gulp
    .src(`dist/cdn/v${majorVersion}/redirect`)
    .pipe(rename({prefix: `v${majorVersion}/`}))
    .pipe(publisher.publish({'content-type': 'text/html'}))
    .pipe(awspublish.reporter());
});

/**
 * Publish JS to the CDN in the major version folder (e.g. /v2/redirect.js).
 */
gulp.task('publish:cdn:redirect', function() {
  return gulp
    .src(`dist/cdn/v${majorVersion}/*.js`)
    .pipe(rename({prefix: `v${majorVersion}/`}))
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});

/**
 * Publish SDK to the CDN in the version folder (e.g. /2.2.0/sdk.js).
 */
gulp.task('publish:cdn:sdk', function() {
  return gulp
    .src(`dist/cdn/${version}/sdk.js`)
    .pipe(rename({prefix: `${version}/`}))
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});

/**
 * Publish JS to the CDN.
 */
gulp.task('publish:cdn:js', ['publish:cdn:sdk', 'publish:cdn:redirect']);

/**
 * Publish all files to the CDN.
 */
gulp.task('publish:cdn', ['publish:cdn:js', 'publish:cdn:html', 'publish:cdn:html:legacy']);
