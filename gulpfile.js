var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var electronConnect = require('electron-connect');
var process = require('process');
var packager = require('electron-packager');
var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var shell = require('gulp-shell');
var pkg = require('./package.json');
var exec = require('child_process').exec;
var argv = require('yargs').argv;
var embedTemplates = require('gulp-angular-embed-templates');
var webserver = require('gulp-webserver');

var paths = {
	'build': 'dist/',
	'release': 'release/'
};

gulp.task('clean', function() {
	return del([paths.build + '/**/*', paths.release + '/**/*']);
});


// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function() {

	return gulp.src('src/scss/app.scss')
	  	.pipe(sass({includePaths: [
			'node_modules/bootstrap-sass/assets/stylesheets/',
			'node_modules/mdi/scss/'
		], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest(paths.build + '/css'));
});

gulp.task('provide-resources', function() {
	gulp.src([
				'node_modules/mdi/fonts/**/*',
				'node_modules/bootstrap-sass/assets/fonts/**/*'
			])
			.pipe(gulp.dest(paths.build + '/fonts'));

	return gulp.src('src/img/**/*')
		.pipe(gulp.dest(paths.build + '/img'));
});

gulp.task('provide-configs', function() {

	return gulp.src('src/config/**/*.json')
		.pipe(gulp.dest(paths.build + '/config'));
});

gulp.task('package-node-dependencies', function() {
	gulp.src('node_modules/angular2-uuid/*' )
			.pipe(gulp.dest('dist/lib/angular2-uuid/'));
});

const tscConfig = require('./tsconfig.json');

/**
 * Copies the indext to the dist folder, compiles typescript sources to javascript
 * AND renders the html templates into the component javascript files.
 */
gulp.task('provide-sources', function () {
	gulp.src('src/index.html')
			.pipe(gulp.dest(paths.build));

	return gulp
		.src('src/app/**/*.ts')
		.pipe(embedTemplates({basePath: "src", sourceType:'ts'}))
		.pipe(typescript(tscConfig.compilerOptions))
		.pipe(gulp.dest(paths.build + 'app'));
});

/**
 *
 */
gulp.task('copy-electron-files', function () {
	gulp.src(['package.json']).pipe(gulp.dest('dist')); // also needed for an electron app
	return gulp.src(['main.js']).pipe(gulp.dest('dist'));
});

/**
 * Compiles the typescript written unit tests and copies the
 * javascript written end to end test files.
 */
gulp.task('provide-test-sources', function () {

    gulp
        .src('src/test/**/*.ts')
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(gulp.dest(paths.build + 'test'));
	return gulp
			.src('src/e2e/**/*.js')
			.pipe(gulp.dest(paths.build + 'e2e'));
});

gulp.task('concat-deps', function() {

	return gulp.src([
			'node_modules/node-uuid/uuid.js',
			'node_modules/angular2/bundles/angular2-polyfills.js',
			'node_modules/systemjs/dist/system.src.js',
			'node_modules/rxjs/bundles/Rx.js',
			'node_modules/angular2/bundles/angular2.dev.js',
			'node_modules/angular2/bundles/http.dev.js',
			'node_modules/angular2/bundles/router.dev.js'
		])
		.pipe(concat(pkg.name + '-deps.js'))
		.pipe(uglify())
		.pipe(gulp.dest(paths.build + '/lib'));
});

function watch() {
    gulp.watch('src/scss/**/*.scss',      ['convert-sass']);
    gulp.watch('src/app/**/*.ts',         ['provide-sources']);
    gulp.watch('src/templates/**/*.html', ['provide-sources']);
    gulp.watch('src/index.html',          ['provide-sources']);
    gulp.watch('src/config/**/*.json',    ['provide-configs']);
    gulp.watch('src/img/**/*',            ['provide-resources']);
    gulp.watch('src/test/**/*ts',         ['provide-test-sources']);
    gulp.watch('src/e2e/**/*js',          ['provide-test-sources']);
}

gulp.task('webserver-watch',['build'],  function() {
	gulp.src('dist')
			.pipe(webserver({
				fallback: 'index.html',
				port: 8081
			}));
	watch();
});

gulp.task('test', function (cb) {

	var cmd = 'node_modules/.bin/karma start karma.conf.js --single-run';

	if (argv.ci!=undefined&&argv.ci=='true')
		cmd = 'export CHROME_BIN=/usr/bin/chromium-browser; xvfb-run karma start karma.conf.js --single-run';

	exec(cmd, function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

var electronServer = electronConnect.server.create({path: paths.build});

// runs the development server and sets up browser reloading
gulp.task('run', ['build'], function() {

	electronServer.start();
	gulp.watch('main.js', ['copy-electron-files'], electronServer.restart);
	watch();
	gulp.watch('dist/**/*', electronServer.reload);
});


// builds an electron app package for different platforms
gulp.task('package', [], function() {

	packager({
		dir: paths.build,
		name: pkg.name,
		platform: ['win32', 'darwin'],
		arch: 'all',
		version: '0.36.10',
		appBundleId: pkg.name,
		appVersion: pkg.version,
		buildVersion: pkg.version,
		cache: 'cache/',
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

gulp.task('build', [
	'convert-sass',
	'copy-electron-files',
	'concat-deps',
	'provide-sources',
	'provide-test-sources',
	'provide-resources',
	'provide-configs',
	'package-node-dependencies'
]);

gulp.task('default', function() {
	runSequence('clean', 'build', 'test' );
});