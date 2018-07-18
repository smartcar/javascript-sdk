/* eslint-env node */

'use strict';

const awspublish = require('gulp-awspublish');
const babel = require('gulp-babel');
const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const {version} = require('./package');

gulp.task('build', function() {
  return gulp.src('src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({
      suffix: `-${version}`,
    }))
    .pipe(gulp.dest('dist/javascript-sdk'));
});

gulp.task('publish', function() {

  const S3_REGION = 'us-west-2';
  const S3_BUCKET = 'smartcar-javascript-sdk';

  const publisher = awspublish.create({
    region: S3_REGION,
    params: {
      Bucket: S3_BUCKET,
    },
  });

  return gulp.src('dist/**/*.js')
    .pipe(publisher.publish())
    .pipe(awspublish.reporter());
});
