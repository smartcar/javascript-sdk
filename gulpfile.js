/* eslint-env node */

'use strict';

const awspublish = require('gulp-awspublish');
const babel = require('gulp-babel');
const gulp = require('gulp');
const rename = require('gulp-rename');
const template = require('gulp-template');
const uglify = require('gulp-uglify');
const {version} = require('./package');

// building

// builds js files by babeling, uglifying, and versioning
gulp.task('build-js', function() {
  return gulp.src('src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({suffix: `-${version}`}))
    .pipe(gulp.dest('dist'));
});

// builds html file by templating and versioning
gulp.task('build-html', function() {
  return gulp.src('src/redirect.html')
    .pipe(template({redirectJS: `'/redirect-${version}.js'`}))
    .pipe(rename(`redirect-${version}`))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['build-js', 'build-html']);

// publishing
const S3_REGION = 'us-west-2';
const S3_BUCKET = 'smartcar-production-javascript-sdk';

const publisher = awspublish.create({
  region: S3_REGION,
  params: {Bucket: S3_BUCKET},
});

// we strip the `.html` extension from our html file so add content-type header
// to identify the file as `text/html`
gulp.task('publish-html', function() {
  const headers = {
    'content-type': 'text/html',
  };

  return gulp.src(`dist/redirect-${version}`)
    .pipe(publisher.publish(headers))
    .pipe(awspublish.reporter());
});

gulp.task('publish-js', function() {
  return gulp.src('dist/**/*.js')
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});

gulp.task('publish', ['publish-html', 'publish-js']);
