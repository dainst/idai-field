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
	'release': 'release/',
	'cache': 'cache/',
	'lib': 'node_modules/',
	'bootstrap': 'node_modules/bootstrap-sass/assets/',
	'mdi': 'node_modules/mdi/'
};

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

const tscConfig = require('./tsconfig.json');

var electronServer = electronConnect.server.create({path: paths.build});

// compile sass and concatenate to single css file in build dir
gulp.task('sass', function() {

	return gulp.src('src/scss/app.scss')
	  	.pipe(sass({includePaths: [
			paths.bootstrap + 'stylesheets/',
			paths.mdi + 'scss/'
		], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest(paths.build + '/css'));
});

gulp.task('copy-fonts', function() {

	return gulp.src([
			paths.mdi + '/fonts/**/*',
			paths.bootstrap + '/fonts/**/*'
		])
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

gulp.task('copy-config', function() {

	return gulp.src('src/config/**/*.json')
		.pipe(gulp.dest(paths.build + '/config'));
});

gulp.task('build', [
	'sass',
	'compile-ts',
	'copy-html',
	'copy-templates',
	'copy-img',
	'copy-fonts',
	'copy-config',
	'concat-deps',
    'test-compile-ts',
	'e2e-move-js'
]);

// clean
gulp.task('clean', function() {
	return del([paths.build + '/**/*', paths.release + '/**/*']);
});

gulp.task('compile-ts', function () {

	return gulp
		.src('src/app/**/*.ts')
		.pipe(embedTemplates({basePath: "src", sourceType:'ts'}))
		//.pipe(sourcemaps.init())
		.pipe(typescript(tscConfig.compilerOptions))
		//.pipe(sourcemaps.write('dist/app/maps'))
		.pipe(gulp.dest(paths.build + 'app'));
});

gulp.task('test-compile-ts', function () {

    return gulp
        .src('src/test/**/*.ts')
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(gulp.dest(paths.build + 'test'));
});

gulp.task('e2e-move-js', function () {

    return gulp
			.src('src/e2e/**/*.js')
			.pipe(gulp.dest(paths.build + 'e2e'));
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

function watch() {
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/app/**/*.ts', ['compile-ts']);
    gulp.watch('src/config/**/*.json', ['copy-config']);
    gulp.watch('src/templates/**/*.html', ['copy-templates','compile-ts']);
    gulp.watch('src/index.html', ['copy-html']);
    gulp.watch('src/img/**/*', ['copy-img']);
    gulp.watch('src/test/**/*ts', ['test-compile-ts']);
    gulp.watch('src/e2e/**/*js', ['e2e-move-js']);
}

gulp.task('test-watch', ['build', 'prepare-package', 'package-node-dependencies'], function() {
    watch();
});

gulp.task('webserver-watch',['build', 'prepare-package', 'package-node-dependencies'],  function() {
	gulp.src('dist')
			.pipe(webserver({
				fallback: 'index.html',
				port: 8081
			}));
	watch();
});

// runs the development server and sets up browser reloading
gulp.task('run', ['build', 'prepare-package', 'package-node-dependencies'], function() {

	electronServer.start();
	gulp.watch('main.js', ['prepare-package'], electronServer.restart);
	watch();
	gulp.watch('dist/**/*', electronServer.reload);
});


// copy necessary files to dist in order for them to be included in package
// and remove dev dependencies from index.html
gulp.task('prepare-package', function() {

	gulp.src('src/index.html')
		.pipe(gulp.dest(paths.build));
	return gulp.src(['main.js','package.json']).pipe(gulp.dest('dist'));
});

gulp.task('package-node-dependencies', function() {
    gulp.src('node_modules/angular2-uuid/*' )
        .pipe(gulp.dest('dist/lib/angular2-uuid/'));
});

// builds an electron app package for different platforms
gulp.task('package', [], function() {

	packager({
		dir: paths.build,
		name: pkg.name,
		platform: ['win32', 'darwin', 'linux'],
		arch: 'all',
		version: '0.36.10',
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
	runSequence('clean', 'build', 'prepare-package','package-node-dependencies','test', 'package');
});