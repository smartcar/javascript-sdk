/* eslint-env node */

'use strict';

const gulp = require('gulp');
const {version} = require('./package');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync');

const reload = browserSync.reload;

gulp.task('demo', function() {
  browserSync({
    port: 5000,
    notify: false,
    logPrefix: 'sdk-demo',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function(snippet) {
          return snippet;
        },
      },
    },
    server: {
      baseDir: 'demo',
      routes: {
        '/scripts': 'src',
      },
    },
  });

  gulp.watch(['src/*'], reload);
  gulp.watch(['demo/*'], reload);

});

gulp.task('test', function() {
  return gulp.src('src/*.js')
    .pipe($.babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('cover', function() {
  return gulp.src('instrumented/*.js')
    .pipe($.babel())
    .pipe(gulp.dest('instrumented'));
});

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
