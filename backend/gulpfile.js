'use strict';
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');

gulp.task('default', () =>
  gulp.src(['**/*.test.js', '!node_modules/**/*.js'], {read: false})
  // `gulp-mocha` needs filepaths so you can't have any plugins before it
    .pipe(mocha({reporter: 'nyan'}))
);

gulp.task('eslint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
      // eslint() attaches the lint output to the "eslint" property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError());
});

gulp.task('test', ['default']);
