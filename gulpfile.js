var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var modRewrite = require('connect-modrewrite');
var electronConnect = require('electron-connect');
var electron = require('gulp-electron');
var process = require('process');

var pkg = require('./package.json');

var paths = {
	'build': 'dist/',
	'release': 'release/',
	'cache': 'cache/',
	'lib': 'node_modules/',
	'bootstrap': 'node_modules/bootstrap-sass/assets/'
};

const tscConfig = require('./tsconfig.json');

var electronServer = electronConnect.server.create({path: paths.build});

// compile sass and concatenate to single css file in build dir
gulp.task('sass', function() {

	return gulp.src('src/scss/app.scss')
	  	.pipe(sass({includePaths: [paths.bootstrap + 'stylesheets/'], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest(paths.build + '/css'));
});

gulp.task('copy-fonts', function() {
	return gulp.src(paths.bootstrap + '/fonts/**/*', { base: paths.bootstrap + '/fonts' })
  	.pipe(gulp.dest(paths.build + '/fonts'));
});

gulp.task('copy-html', function() {

	return gulp.src('src/index.html')
		.pipe(gulp.dest(paths.build));
});

gulp.task('copy-templates', function() {

	return gulp.src('src/templates/**/*.html')
		.pipe(gulp.dest(paths.build + '/templates'));
});

gulp.task('copy-img', function() {

	return gulp.src('src/img/**/*')
		.pipe(gulp.dest(paths.build + '/img'));
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
	return del([paths.build + '/**/*', paths.release + '/**/*']);
});

gulp.task('compile-ts', function () {

	return gulp
		.src('src/app/**/*.ts')
		.pipe(typescript(tscConfig.compilerOptions))
		.pipe(gulp.dest('dist/app'));
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
gulp.task('server', ['sass', 'copy-fonts', 'copy-html', 'copy-img', 'copy-templates', 'concat-deps', 'prepare-package'], function() {

	electronServer.start();

	gulp.watch('main.js', ['prepare-package'], electronServer.restart);

	gulp.watch('src/scss/**/*.scss', ['sass']);
	gulp.watch('src/app/**/*.ts', ['compile-ts']);
	gulp.watch('src/templates/**/*.html', ['copy-templates']);
	gulp.watch('src/index.html', ['copy-html']);
	gulp.watch('src/img/**/*', ['copy-img']);

	// TODO: get electron.reload working
	gulp.watch('dist/**/*', electronServer.restart);
});

// copy necessary files to dist in order for them to be included in package
gulp.task('prepare-package', function() {
	return gulp.src(['main.js','package.json']).pipe(gulp.dest('dist'));
})

// builds an electron app package for different platforms
gulp.task('package', ['build', 'prepare-package'], function() {
 
    gulp.src("")
	    .pipe(electron({
	        src: paths.build,
	        packageJson: pkg,
	        release: paths.release,
	        cache: paths.cache,
	        version: 'v0.36.3',
	        packaging: true,
	        platforms: ['win32-ia32', 'darwin-x64'],
	        platformResources: {
	            darwin: {
	                CFBundleDisplayName: pkg.name,
	                CFBundleIdentifier: pkg.name,
	                CFBundleName: pkg.name,
	                CFBundleVersion: pkg.version,
	                icon: 'dist/img/logo.icns'
	            },
	            win: {
	                "version-string": pkg.version,
	                "file-version": pkg.version,
	                "product-version": pkg.version,
	                "icon": 'dist/img/logo.ico'
	            }
	        }
	    }))
    .pipe(gulp.dest(""));
});

gulp.task('default', function() {
	runSequence('clean', 'package');
});