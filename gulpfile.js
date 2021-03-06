var gulp = require('gulp'),
    concat = require('gulp-concat'),
    jade = require('gulp-jade'),
    jshint = require('gulp-jshint'),
    less = require('gulp-less'),
    livereload = require('gulp-livereload'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    wrapper = require('gulp-wrapper'),

    del = require('del'),
    fs = require('fs'),
    moment = require('moment'),
    lr = false
    ;

var bwr = JSON.parse(fs.readFileSync('./.bowerrc')),// standard require() doesn't work here, tries to parse as JS
    vendor = function (path) {
        return bwr.directory + path;
    },

    dist = './public/',
    sources = './src/',
    masks = {
        all: '{,*/}*.*',
        css: '{,*/}*.css',
        html: '*.html',
        jade: '{,*/}*.jade',
        js: '{,*/}*.js'
    },
    paths = {
        css: dist + 'css/',
        jade: sources + 'jade/',
        js: dist + 'js/',
        less: [
            sources + 'less/',
            vendor('bootstrap/less/')
        ],
        server: dist
    },
    src = {
        jade: sources + 'jade/*.jade',
        js: sources + 'js/*.js',
        less: sources + 'less/styles*.less'
    },
    pkg = require('./package.json'),

    banner = function () {
        return ['/* ', pkg.name, 'v' + pkg.version + ',',
            moment().format('YYYY.MM.DD'), ' */\n'
        ].join(' ');
    },
    options = {
        less: {
            compress: true,
            ieCompat: false,
            paths: paths.less
        }
    };

/*
 * Clean auto-built files
 */
gulp.task('clean', function (cb) {
    del([
        paths.css + masks.css,
        paths.js + masks.js,
        paths.server + masks.html
    ], cb);
});

/*
 * Jade template sources.
 */
gulp.task('jade', function () {
    return gulp.src(src.jade)
        .pipe(jade())
        .pipe(gulp.dest(paths.server))
});

/*
 * Jade template sources.
 */
gulp.task('jshint', function () {
    return gulp.src(src.js)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
});

/*
 * LESS sources.
 * All CSS files in the root directory are built as separate stylesheets.
 */
gulp.task('less', function () {
    return gulp.src(src.less)
        .pipe(less(options.less))
        .pipe(wrapper({ footer: '\n\n' + banner() }))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(gulp.dest(paths.css));
});

/*
 * Build scripts.
 */
gulp.task('build', function () {
    return gulp.src([
        vendor('dataset.js'),
        src.js
    ])
        .pipe(concat('scroll.js', { newLine: ';\n\n' }))
        .pipe(wrapper({ header: banner() + '\n' }))
        .pipe(gulp.dest(paths.js));
});

/*
 * Concat Vendor scripts.
 */
gulp.task('vendor', function () {
    return gulp.src([
        // Temporary, for quick proto
        vendor('jbone/dist/jbone.min.js')
    ])
        .pipe(concat('vendor.js', { newLine: ';\n\n' }))
        .pipe(uglify())
        .pipe(wrapper({
            header: banner() + '\n',
            footer: ';\n $ = jBone;\n'
        }))
        .pipe(gulp.dest(paths.js));
});


/*
 * Build, Watch & Default tasks.
 * Runs pre-build automatically on run.
 */
gulp.task('build-all', ['clean', 'jshint', 'build', 'vendor', 'less', 'jade']);

gulp.task('serve', ['build-all'], function() {
    var http = require('http'),
        ecstatic = require('ecstatic');

    http.createServer(ecstatic({
        root: __dirname + paths.server.substr(1),
        autoIndex: true,
        baseDir: '/',
        defaultExt: 'html'
    })).listen(3001);

    lr = livereload.listen();
});

gulp.task('watch', ['serve'], function () {
    gulp.watch(src.jade, ['jade']);
    gulp.watch(src.js, ['jshint', 'build']);
    gulp.watch(src.less, ['less']);

    gulp.watch(paths.server + masks.all).on('change', livereload.changed);
});

gulp.task('default', ['build-all']);
