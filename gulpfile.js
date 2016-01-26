var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var modRewrite = require('connect-modrewrite');
var electronConnect = require('electron-connect');
var process = require('process');
var packager = require('electron-packager');
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var useref = require('gulp-useref');

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
        .pipe(useref())
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
		//.pipe(sourcemaps.init())
		.pipe(typescript(tscConfig.compilerOptions))
		//.pipe(sourcemaps.write('dist/app/maps'))
		.pipe(gulp.dest('dist/app'));
});

gulp.task('concat-deps', function() {

	return gulp.src([
			paths.lib + '/node-uuid/uuid.js',
			paths.lib + '/angular2/bundles/angular2-polyfills.js',
			paths.lib + '/systemjs/dist/system.src.js',
			paths.lib + '/rxjs/bundles/Rx.js',
			paths.lib + '/angular2/bundles/angular2.dev.js',
			paths.lib + '/angular2/bundles/http.dev.js',
			paths.lib + '/angular2/bundles/router.dev.js'
		])
		.pipe(concat(pkg.name + '-deps.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.build + '/lib'));
});

// runs the development server and sets up browser reloading
gulp.task('server', ['sass', 'copy-fonts', 'copy-html', 'copy-img', 'copy-templates', 'concat-deps', 'compile-ts', 'prepare-package'], function() {

	electronServer.start();

	gulp.watch('main.js', ['prepare-package'], electronServer.restart);

	gulp.watch('src/scss/**/*.scss', ['sass']);
	gulp.watch('src/app/**/*.ts', ['compile-ts']);
	gulp.watch('src/templates/**/*.html', ['copy-templates']);
	gulp.watch('src/index.html', ['copy-html']);
	gulp.watch('src/img/**/*', ['copy-img']);

	// TODO: get electron.reload working
	gulp.watch('dist/**/*', electronServer.reload);
});

// copy necessary files to dist in order for them to be included in package
gulp.task('prepare-package', function() {
	return gulp.src(['main.js','package.json']).pipe(gulp.dest('dist'));
});

gulp.task('package-node-dependencies', function() {
    gulp.src('node_modules/node-uuid/**/*' )
        .pipe(gulp.dest('dist/node_modules/node-uuid'));
});


// builds an electron app package for different platforms
gulp.task('package', ['build', 'prepare-package','package-node-dependencies'], function() {
 
	packager({
		dir: paths.build,
		name: pkg.name,
		platform: ['win32', 'darwin'],
		arch: 'all',
		version: '0.36.4',
		appBundleId: pkg.name,
		appVersion: pkg.version,
		buildVersion: pkg.version,
		cache: paths.cache,
		helperBundleId: pkg.name,
		icon: 'dist/img/logo',
		out: paths.release
	}, function(err, appPath) {
		if (err)
			throw err;
		
		var folderPaths = appPath.toString().split(',');
		for (var i in folderPaths) {
			var fileName = folderPaths[i].substring(folderPaths[i].lastIndexOf(path.sep) + 1);
    		var output = fs.createWriteStream(paths.release + '/' + fileName + '.zip');
    		
    		var archive = archiver('zip');
    		archive.on('error', function(err) {
  				throw err;
			});
    		archive.pipe(output);
    		archive.directory(folderPaths[i], fileName, { 'name': fileName });
    		archive.finalize();
		}
    });
});

gulp.task('default', function() {
	runSequence('clean', 'package');
});