var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var typescript = require('gulp-typescript');
var fs = require('fs');

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
