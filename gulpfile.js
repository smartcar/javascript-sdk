/* eslint-env node */

'use strict';

const gulp = require('gulp');
const {version} = require('./package');
const $ = require('gulp-load-plugins')();

gulp.task('compress', function() {
  return gulp.src('src/*.js')
    .pipe($.babel())
    .pipe($.uglify())
    .pipe($.rename({
      suffix: `-${version}`,
    }))
    .pipe(gulp.dest('dist/javascript-sdk'));
});

gulp.task('publish', function() {

  const S3_REGION = 'us-west-2';
  const S3_BUCKET = 'smartcar-javascript-sdk';

  const publisher = $.awspublish.create({
    region: S3_REGION,
    params: {
      Bucket: S3_BUCKET,
    },
  });

  return gulp.src('dist/**/*.js')
    .pipe(publisher.publish())
    .pipe($.awspublish.reporter());

});
