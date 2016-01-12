var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var modRewrite = require('connect-modrewrite');

var pkg = require('./package.json');

var paths = {
	'build': 'dist/',
	'lib': 'node_modules/',
	'bootstrap': 'node_modules/bootstrap-sass/assets/'
};

const tscConfig = require('./tsconfig.json');

// compile sass and concatenate to single css file in build dir
gulp.task('sass', function() {

	return gulp.src('src/scss/app.scss')
	  	.pipe(sass({includePaths: [paths.bootstrap + 'stylesheets/'], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest(paths.build + '/css'))
	    .pipe(reload({ stream:true }));
});

gulp.task('copy-fonts', function() {
	return gulp.src(paths.bootstrap + '/fonts/**/*', { base: paths.bootstrap + '/fonts' })
  	.pipe(gulp.dest(paths.build + '/fonts'));
});

gulp.task('copy-html', function() {

	return gulp.src('src/index.html')
		.pipe(gulp.dest(paths.build))
		.pipe(reload({ stream:true }));
});

gulp.task('copy-templates', function() {

	return gulp.src('src/templates/**/*.html')
		.pipe(gulp.dest(paths.build + '/templates'))
		.pipe(reload({ stream:true }));
});

gulp.task('copy-img', function() {

	return gulp.src('src/img/**/*')
		.pipe(gulp.dest(paths.build + '/img'))
		.pipe(reload({ stream:true }));
});

gulp.task('build', [
	'sass',
	'compile-ts',
	'copy-html',
	'copy-templates',
	'copy-img',
	'copy-fonts',
	'concat-deps'
]);

// clean
gulp.task('clean', function() {
	return del(paths.build + '/**/*');
});

gulp.task('compile-ts', function () {

	return gulp
		.src('src/app/**/*.ts')
		.pipe(typescript(tscConfig.compilerOptions))
		.pipe(gulp.dest('dist/app'))
		.pipe(reload({ stream:true }));
});

gulp.task('concat-deps', function() {

	return gulp.src([
			paths.lib + '/angular2/bundles/angular2-polyfills.js',
			paths.lib + '/systemjs/dist/system.src.js',
			paths.lib + '/rxjs/bundles/Rx.js',
			paths.lib + '/angular2/bundles/angular2.dev.js',
			paths.lib + '/angular2/bundles/router.dev.js'
		])
		.pipe(concat(pkg.name + '-deps.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.build + '/lib'));
});

// runs the development server and sets up browser reloading
gulp.task('server', ['sass', 'copy-fonts', 'copy-html', 'copy-img', 'copy-templates', 'concat-deps'], function() {

	browserSync({
		server: {
		  baseDir: './dist',
            middleware: [
                // rewrite for AngularJS HTML5 mode, redirect all non-file urls to index.html
                modRewrite(['!\\.html|\\.js|\\.svg|\\.css|\\.png|\\.jpg|\\.gif|\\.json|\\.woff2|\\.woff|\\.ttf$ /index.html [L]']),
            ]
		},
		port: 1235
	});

	gulp.watch('src/scss/**/*.scss', ['sass']);
	gulp.watch('src/app/**/*.ts', ['compile-ts']);
	gulp.watch('src/templates/**/*.html', ['copy-templates']);
	gulp.watch('src/index.html', ['copy-html']);
	gulp.watch('src/img/**/*', ['copy-img']);
});

gulp.task('default', function() {
	runSequence('clean', 'build');
});