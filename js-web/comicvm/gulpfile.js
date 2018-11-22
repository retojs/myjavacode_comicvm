var gulp = require('gulp');
var del = require('del');

// TODO: separate images from app, copy into app in a gulp task

/**
 * Gulp Tasks
 *
 * - gulp build : executes the tasks
 *                 - deploy:app
 *                 - deploy:backend
 *                 - deploy:cf
 *
 * - gulp deploy : copies files into the public folder
 *
 * -- deploy:all : copies everything that is needed, images, stories etc.
 *                 this all takes a while...
 *
 * -- deploy:app : copies all the scripts (js/html/css) of the frontend app.
 *                 these are the files that frequently change
 *
 * -- deploy:backend: deploys the backend app.
 *
 * -- deploy:cf : copies the cloud foundry manifest.yml and package.json
 *
 */

gulp.task('clean', function () {
    return del(['public/**/*']);
});


gulp.task('clean:app', function () {
    return del('public/app/**/*');
});
gulp.task('app', ['clean:app'], function () {
    return gulp.src('app/**/*')
        .pipe(gulp.dest('public/app'));
});
gulp.task('clean:app-script', function () {
    return del('public/app/script/**/*');
});
gulp.task('app-script', ['clean:app-script'], function () {
    return gulp.src('app/script/**/*')
        .pipe(gulp.dest('public/app/script'));
});
gulp.task('clean:app-css', function () {
    return del('public/app/css/**/*');
});
gulp.task('app-css', ['clean:app-css'], function () {
    return gulp.src('app/css/**/*')
        .pipe(gulp.dest('public/app/css'));
});


gulp.task('clean:backend', function () {
    return del('public/backend/**/*');
});
gulp.task('backend', ['clean:backend'], function () {
    return gulp.src('backend/**')
        .pipe(gulp.dest('public/backend'));
});
gulp.task('clean:run', function () {
    return del('public/run.js');
});
gulp.task('run', ['clean:run'], function () {
    return gulp.src('run.js')
        .pipe(gulp.dest('public'));
});


gulp.task('clean:stories', function () {
    return del('public/Stories/**/*');
});
gulp.task('stories', ['clean:stories'], function () {
    return gulp.src('Stories/**/*')
        .pipe(gulp.dest('public/Stories'));
});


gulp.task('clean:cf', function () {
    return del(['manifest.yml', 'package.json']);
});
gulp.task('cf', ['clean:cf'], function () {
    return gulp.src('cf/**/*')
        .pipe(gulp.dest('public/'));
});


gulp.task('deploy:all', ['app', 'backend', 'stories', 'cf']);
gulp.task('deploy:app', ['app-script', 'app-css']);
gulp.task('deploy:backend', ['backend', 'run']);
gulp.task('deploy:cf', ['cf']);

gulp.task('build', ['deploy:app', 'deploy:backend', 'deploy:cf']);


/**
 * E2E Tests with Protractor
 *
 * @see: http://www.kramnameloc.com/getting-started-with-protractor
 */
