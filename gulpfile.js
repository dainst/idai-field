var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var fs = require('fs');
var path = require('path');
var pkg = require('./package.json');
var webserver = require('gulp-webserver');
var replace = require('gulp-replace');

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function () {

    return gulp.src([
        'app/app.scss',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/Leaflet.vector-markers/dist/leaflet-vector-markers.css',
        'node_modules/leaflet.pm/dist/leaflet.pm.css'
    ])
        .pipe(sass({
            includePaths: [
                'node_modules/roboto-fontface/css/roboto/sass',
                'node_modules/idai-components-2/src/scss',
                'node_modules/bootstrap/scss',
                'node_modules/mdi/scss/'
            ], precision: 8
        }))
        .pipe(concat('app.css'))
        .pipe(gulp.dest('app'));
});

function watch() {
    gulp.watch('app/**/*.scss', ['convert-sass']);
}

gulp.task('webserver-watch', function () {
    gulp.src('./') // Yes, ./ is right. While developing, for convenience reasons
    // e2e tests should run against the base dir,
    // instead the dist dir. Only in ci the dist has to be tested.
        .pipe(webserver({
            port: 8081
        }));
    watch();
});


const tscConfig = require('./tsconfig.json');
gulp.task('compile', ['convert-sass'], function () {
    // fonts
    gulp.src([
        'node_modules/roboto-fontface/fonts/**/*',
        'node_modules/mdi/fonts/**/*'
    ])
        .pipe(gulp.dest('fonts'));

    // templates
    gulp.src('node_modules/idai-components-2/src/templates/**/*').pipe(gulp.dest('src/templates/'));

    // sources
    gulp
        .src('app/**/*.ts')
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(gulp.dest('app/'));
    // test sources
    return gulp
        .src('test/**/*.ts')
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(gulp.dest('test/'));
});

// builds an electron app package for different platforms
gulp.task('package', [], function () {

    packager({
        dir: 'dist/',
        name: pkg.name,
        platform: ['win32'],
        arch: 'all',
        version: '1.6.1',
        appBundleId: pkg.name,
        appVersion: pkg.version,
        'download.cache': 'cache/',
        helperBundleId: pkg.name,
        icon: 'dist/img/logo',
        out: 'release/'
    }, function (err, appPath) {
        if (err)
            throw err;

        var folderPaths = appPath.toString().split(',');
        for (var i in folderPaths) {
            var fileName = folderPaths[i].substring(folderPaths[i].lastIndexOf(path.sep) + 1);
            var output = fs.createWriteStream('release/' + fileName + '.zip');

            var archive = archiver('zip');
            archive.on('error', function (err) {
                throw err;
            });
            archive.pipe(output);
            archive.directory(folderPaths[i], fileName, {'name': fileName});
            archive.finalize();
        }
    });
});

function createConfig(path) {

    fs.access(path, fs.F_OK, function(err) {
        if (err) {
            fs.createReadStream(path + '.template').pipe(fs.createWriteStream(path));
        } else {
            console.log('Will not create ' + path + ' from template because file already exists.');
        }
    });
}

// Creates config files if they do not exist already
//
gulp.task('create-configs', function (callback) {

    createConfig('./config/Configuration.json');
});
