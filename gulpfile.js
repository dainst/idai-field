var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var electronConnect = require('electron-connect');
var packager = require('electron-packager');
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var pkg = require('./package.json');
var webserver = require('gulp-webserver');
var argv = require('yargs').argv;
var replace = require('gulp-replace');

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function () {

    return gulp.src([
        'app/app.scss',
        'node_modules/mdbootstrap/css/bootstrap.css',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/leaflet.pm/dist/leaflet.pm.css'
    ])
        .pipe(sass({
            includePaths: [
                'node_modules/idai-components-2/src/scss',
                'node_modules/mdbootstrap/sass',
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

// runs the development server and sets up browser reloading
var electronServer = electronConnect.server.create({path: './'});
gulp.task('run', function () {
    electronServer.start();
    watch();
});


gulp.task('make-dist', function () {
    gulp.src('index.html').pipe(gulp.dest('dist/'));
    gulp.src('package.json').pipe(gulp.dest('dist/'));
    gulp.src('systemjs.config.js').pipe(gulp.dest('dist/'));
    gulp.src('main.js').pipe(gulp.dest('dist/'));
    gulp.src('menu.js').pipe(gulp.dest('dist/'));
    gulp.src('app/**/*').pipe(gulp.dest('dist/app/'));
    gulp.src('fonts/**/*').pipe(gulp.dest('dist/fonts/'));
    gulp.src('img/**/*').pipe(gulp.dest('dist/img/'));
    gulp.src('config/**/*').pipe(gulp.dest('dist/config/'));
    gulp.src('imaegstore/**/*').pipe(gulp.dest('dist/imagestore/'));
    gulp.src('node_modules/@angular/**/*').pipe(gulp.dest('dist/node_modules/@angular/'));
    gulp.src('node_modules/@ng-bootstrap/**/*').pipe(gulp.dest('dist/node_modules/@ng-bootstrap/'));
    gulp.src('node_modules/leaflet/**/*').pipe(gulp.dest('dist/node_modules/leaflet/'));
    gulp.src('node_modules/leaflet.pm/**/*').pipe(gulp.dest('dist/node_modules/leaflet.pm/'));
    gulp.src('node_modules/leaflet-imageoverlay-rotated/**/*')
        .pipe(gulp.dest('dist/node_modules/leaflet-imageoverlay-rotated/'));
    gulp.src('node_modules/systemjs/**/*').pipe(gulp.dest('dist/node_modules/systemjs/'));
    gulp.src('node_modules/zone.js/**/*').pipe(gulp.dest('dist/node_modules/zone.js/'));
    gulp.src('node_modules/reflect-metadata/**/*').pipe(gulp.dest('dist/node_modules/reflect-metadata/'));
    gulp.src('node_modules/mdbootstrap/**/*').pipe(gulp.dest('dist/node_modules/mdbootstrap'));
    gulp.src('node_modules/angular2-uuid/**/*').pipe(gulp.dest('dist/node_modules/angular2-uuid/'));
    gulp.src('node_modules/rxjs/**/*').pipe(gulp.dest('dist/node_modules/rxjs/'));
    gulp.src('node_modules/idai-components-2/**/*').pipe(gulp.dest('dist/node_modules/idai-components-2/'));
    gulp.src('node_modules/papaparse/**/*').pipe(gulp.dest('dist/node_modules/papaparse/'));
    gulp.src('node_modules/ts-md5/**/*').pipe(gulp.dest('dist/node_modules/ts-md5/'));
    gulp.src('node_modules/identicon.js/**/*').pipe(gulp.dest('dist/node_modules/identicon.js/'));
    gulp.src('node_modules/pouchdb/**/*').pipe(gulp.dest('dist/node_modules/pouchdb/'));
    gulp.src('src/templates/**/*').pipe(gulp.dest('dist/src/templates/'));
});

// builds an electron app package for different platforms
gulp.task('package', [], function () {

    packager({
        dir: 'dist/',
        name: pkg.name,
        platform: ['win32'],
        arch: 'all',
        version: '1.4.13',
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
    fs.access(path, fs.F_OK, function (err) {

        if (err) {
            fs.createReadStream(path + '.template').pipe(fs.createWriteStream(path));
        } else {
            console.log('Will not create ' + path + ' from template because file already exists.');
        }
    });
}

// Creates configfiles if the do not exist already
//
gulp.task('create-configs', function (callback) {

    createConfig('./config/config.json');
    createConfig('./config/Configuration.json');

});

gulp.task('versioning', function () {
    var buildNo = "SNAPSHOT";

    if (argv.build !== true && argv.build !== false && argv.build != undefined) {
        buildNo = argv.build;
    } else console.log("No build number given, falling back to \"SNAPSHOT\"");

    var versionString = "v" + pkg.version + " (build #" + buildNo + ")";

    console.log("Updated version string: " + versionString);

    return gulp.src(['app/info-window.html'])
        .pipe(replace(/"VERSION-STRING"/g, versionString))
        .pipe(gulp.dest('dist/app/'));
});
