const gulp = require('gulp');
const mocha = require('gulp-mocha');
const spawn = require('child_process').spawn;

gulp.task('default', () =>
  gulp.src(['**/*.test.js', '!node_modules/**/*.js'], {read: false})
  // `gulp-mocha` needs filepaths so you can't have any plugins before it
    .pipe(mocha({reporter: 'nyan'}))
);
	
gulp.task('test', ['default']);

