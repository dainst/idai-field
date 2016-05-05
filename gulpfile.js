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

	return gulp.src('src/main/scss/app.scss')
	  	.pipe(sass({includePaths: [
			'node_modules/bootstrap-sass/assets/stylesheets/',
			'node_modules/mdi/scss/'
		], precision: 8}))
	  	.pipe(concat(pkg.name + '.css'))
	    .pipe(gulp.dest('src/main/css'));
});

gulp.task('provide-resources', function() {
	gulp.src([
				'node_modules/mdi/fonts/**/*',
				'node_modules/bootstrap-sass/assets/fonts/**/*'
			])
			.pipe(gulp.dest('src/main/fonts'));
});

gulp.task('concat-deps', function() {

	return gulp.src([
			'node_modules/node-uuid/uuid.js',
			'node_modules/angular2/bundles/angular2-polyfills.js',
			'node_modules/systemjs/dist/system.src.js',
			'node_modules/rxjs/bundles/Rx.js',
			'node_modules/angular2/bundles/angular2.dev.js',
			'node_modules/angular2/bundles/http.dev.js',
			'node_modules/angular2/bundles/router.dev.js',
			'node_modules/jquery/dist/jquery.js',
			'node_modules/bootstrap/dist/js/bootstrap.js',
			'node_modules/ng2-bs3-modal/bundles/ng2-bs3-modal.js'
		])
		.pipe(concat(pkg.name + '-deps.js'))
		//.pipe(uglify()) // this produces an error with the angular beta 15
		.pipe(gulp.dest('src/main/lib'));
});

function watch() {
    gulp.watch('src/main/scss/**/*.scss',      ['convert-sass']);
    gulp.watch('src/main/app/**/*.ts',         ['provide-sources']);
    gulp.watch('src/main/img/**/*',            ['provide-resources']);
}

gulp.task('webserver-watch', function() {
	gulp.src('dist/main/')
			.pipe(webserver({
				fallback: 'index.html',
				port: 8081
			}));
	watch();
});


gulp.task('provide-extra-deps', function() {
	gulp.src('package.json' )
		.pipe(gulp.dest('src/main/'));
	gulp.src('node_modules/ng2-bs3-modal/*' )
		.pipe(gulp.dest('src/main/lib/ng2-bs3-modal/'));
	gulp.src('node_modules/angular2-uuid/*' )
		.pipe(gulp.dest('src/main/lib/angular2-uuid/'));
});

gulp.task('build', [
	'provide-extra-deps','concat-deps', 'convert-sass','provide-resources'
]);

// runs the development server and sets up browser reloading
var electronServer = electronConnect.server.create({path: 'src/main/'});
gulp.task('run', function() {

	electronServer.start();
	watch();
	gulp.watch('src/main/app/**/*.js', electronServer.reload);
});


// builds an electron app package for different platforms
gulp.task('package', [], function() {

	packager({
		dir: 'dist/main/',
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

