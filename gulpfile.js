'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var $ = require('gulp-load-plugins')();
var version = require('./package').version;

// Serve demo page
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

gulp.task('compress', function() {
  return gulp.src('src/*.js')
    .pipe($.uglify())
    .pipe($.rename({
      suffix: "-" + version
    }))
    .pipe(gulp.dest('dist/javascript-sdk'));
});

gulp.task('publish', function() {

  var S3_REGION = 'us-west-2';
  var S3_BUCKET = 'smartcar-javascript-sdk';

  var publisher = $.awspublish.create({
    region: S3_REGION,
    params: {
      Bucket: S3_BUCKET,
    }
  });

  return gulp.src('dist/**/*.js')
    .pipe(publisher.publish())
    .pipe($.awspublish.reporter());

});
