var gulp = require('gulp');
var rename = require('gulp-rename');


gulp.task('copy-fonts', () => {

    return gulp.src([
        'node_modules/@mdi/font/fonts/**/*'
    ])
    .pipe(gulp.dest('src/fonts'));
});


gulp.task('copy-shapefile-tool', () => {

    return gulp.src('java/target/shapefile-tool-*-jar-with-dependencies.jar')
        .pipe(rename('shapefile-tool.jar'))
        .pipe(gulp.dest('tools'));
});


gulp.task('copy-canvaskit', () => {

    return gulp.src('node_modules/@ngageoint/geopackage/dist/canvaskit/canvaskit.wasm')
        .pipe(gulp.dest('tools'));
});
