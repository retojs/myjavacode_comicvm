const gulp = require('gulp');
const del = require('del');

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

function clean() {
    return del(['public/**/*']);
}

exports.clean = clean;

function cleanApp() {
    return del('public/app/**/*');
}

exports.cleanApp = cleanApp;

function copyApp() {
    return gulp.src('app/**/*')
        .pipe(gulp.dest('public/app'));
}

const app = gulp.series(cleanApp, copyApp);
exports.app = app;

function cleanAppScript() {
    return del('public/app/script/**/*');
}

exports.cleanAppScript = cleanAppScript;

function copyAppScript() {
    return gulp.src('app/script/**/*')
        .pipe(gulp.dest('public/app/script'));
}

const appScript = gulp.series(cleanAppScript, copyAppScript);
exports.appScript = appScript;

function cleanAppCss() {
    return del('public/app/css/**/*');
}

exports.cleanAppCss = cleanAppCss;

function copyAppCss() {
    return gulp.src('app/css/**/*')
        .pipe(gulp.dest('public/app/css'));
}

const appCss = gulp.series(cleanAppCss, copyAppCss);
exports.appCss = appCss;

function cleanBackend() {
    return del('public/backend/**/*');
}

exports.cleanBackend = cleanBackend;

function copyBackend() {
    return gulp.src('backend/**')
        .pipe(gulp.dest('public/backend'));
}

const backend = gulp.series(cleanBackend, copyBackend);
exports.backend = backend;

function cleanRun() {
    return del('public/run.js');
}

exports.cleanRun = cleanRun;

function copyRun() {
    return gulp.src('run.js')
        .pipe(gulp.dest('public'));
}

const run = gulp.series(cleanRun, copyRun);
exports.run = run;

function cleanStories() {
    return del('public/Stories/**/*');
}

exports.cleanStories = cleanStories;

function copyStories() {
    return gulp.src('Stories/**/*')
        .pipe(gulp.dest('public/Stories'));
}

const stories = gulp.series(cleanStories, copyStories);
exports.stories = stories;

function cleanCF() {
    // return del(['manifest.yml', 'package.json']);
}

exports.cleanCF = cleanCF;

function copyCF() {
    return gulp.src('cf/**/*')
        .pipe(gulp.dest('public/'));
}

function cleanDependencies() {
    return del('public/node_modules/**/*');
}
exports.cleanDependencies = cleanDependencies;

const cf = gulp.series(cleanCF, copyCF);
exports.cf = cf;

const deployAll = gulp.series(app, backend, stories, cf);
const deployApp = gulp.series(appScript, appCss);
const deployBackend = gulp.series(backend, run);

const build = gulp.series(deployApp, deployBackend, cf);

exports.deployAll = deployAll;
exports.deployApp = deployApp;
exports.deployBackend = deployBackend;

exports.build = build;