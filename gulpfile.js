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

// compile sass and concatenate to single css file in build dir
gulp.task('convert-sass', function() {

	return gulp.src('scss/app.scss')
	  	.pipe(sass({includePaths: [
			'node_modules/bootstrap-sass/assets/stylesheets/',
			'node_modules/mdi/scss/'
		], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest('css'));
});

gulp.task('provide-deps', function() {

	gulp.src([
			'node_modules/mdi/fonts/**/*',
			'node_modules/bootstrap-sass/assets/fonts/**/*'
		])
		.pipe(gulp.dest('fonts'));

	// gulp.src('package.json' )
	// 	.pipe(gulp.dest(''));
	// gulp.src('node_modules/ng2-bs3-modal/*' )
	// 	.pipe(gulp.dest('lib/ng2-bs3-modal/'));
	// gulp.src('node_modules/angular2-uuid/*' )
	// 	.pipe(gulp.dest('lib/angular2-uuid/'));

	return gulp.src([
			'node_modules/node-uuid/uuid.js',
			'node_modules/angular2/bundles/angular2-polyfills.js',
			'node_modules/systemjs/dist/system.src.js',
			'node_modules/rxjs/bundles/Rx.js',
			'node_modules/angular2/bundles/angular2.dev.js',
			'node_modules/angular2/bundles/http.dev.js',
			'node_modules/angular2/bundles/router.dev.js',
			'node_modules/jquery/dist/jquery.js'
		])
		.pipe(concat(pkg.name + '-deps.js'))
		//.pipe(uglify()) // this produces an error with the angular beta 15
		.pipe(gulp.dest('lib'));
});

function watch() {
    gulp.watch('scss/**/*.scss',      ['convert-sass']);
}

gulp.task('webserver-watch', function() {
	gulp.src('./')
			.pipe(webserver({
				fallback: 'index.html',
				port: 8081
			}));
	watch();
});


const tscConfig = require('./tsconfig.json');
gulp.task('compile', function () {
	gulp
		.src('app/**/*.ts')
		.pipe(typescript(tscConfig.compilerOptions))
		.pipe(gulp.dest('app/'));
	return gulp
		.src('test/**/*.ts')
		.pipe(typescript(tscConfig.compilerOptions))
		.pipe(gulp.dest('test/'));
});

gulp.task('prepare-run', [
	'provide-deps', 'convert-sass'
]);

// runs the development server and sets up browser reloading
var electronServer = electronConnect.server.create({path: './'});
gulp.task('run', function() {

	electronServer.start();
	watch();
});


// builds an electron app package for different platforms
gulp.task('package', [], function() {

	packager({
		dir: '',
		name: pkg.name,
		platform: ['win32', 'darwin'],
		arch: 'all',
		version: '0.36.10',
		appBundleId: pkg.name,
		appVersion: pkg.version,
		buildVersion: pkg.version,
		'download.cache': 'cache/',
		helperBundleId: pkg.name,
		icon: 'dist/img/logo',
		out: 'release/'
	}, function(err, appPath) {
		if (err)
			throw err;
		
		var folderPaths = appPath.toString().split(',');
		for (var i in folderPaths) {
			var fileName = folderPaths[i].substring(folderPaths[i].lastIndexOf(path.sep) + 1);
    		var output = fs.createWriteStream('release/' + fileName + '.zip');
    		
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

