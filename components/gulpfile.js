var gulp = require('gulp');
var sass = require('gulp-sass');
var pkg = require('./package.json');
var webserver = require('gulp-webserver');
var concat = require('gulp-concat');

gulp.task('compile', ['convert-sass'], function () {
    gulp.src([
        'node_modules/@mdi/font/fonts/**/*'
    ]).pipe(gulp.dest('src/fonts'));
});

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function () {

    return gulp.src([
        'src/scss/idai-components-2.scss',
        'node_modules/leaflet/dist/leaflet.css',
        'node_modules/Leaflet.vector-markers/dist/leaflet-vector-markers.css'
    ])
        .pipe(sass({
            includePaths: [
                'node_modules/bootstrap/scss',
                'node_modules/@mdi/font/scss/'
            ], precision: 8
        }))
        .pipe(concat(pkg.name + '.css'))
        .pipe(gulp.dest('src/css'));
});

function watch() {
    gulp.watch('src/scss/**/*.scss', ['convert-sass']);
}

gulp.task('webserver-watch', function () {
    gulp.src('./')
        .pipe(webserver({
            fallback: 'index.html',
            port: 8083
        }));
    watch();
});
