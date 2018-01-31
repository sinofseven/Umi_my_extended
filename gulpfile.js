const Gulp = require('gulp');
const Plugins = require('gulp-load-plugins')();
const Fs = require('fs');
const Del = require('del');
const RunSequence = require('run-sequence');
const BrowserSync = require('browser-sync').create();

const PackageJSON = JSON.parse(Fs.readFileSync('./package.json'));

const BANNER = `/*!
 * ${PackageJSON.config.packageName} v${PackageJSON.version} (${PackageJSON.website})
 * Copyright ${PackageJSON.config.projectStartYear} ${PackageJSON.author}
 * Licensed under ${PackageJSON.license} (${PackageJSON.config.licenseUrl})
 */`;

Gulp.task('default', () => {
});

Gulp.task('js:clean', () => {
  return Del(['dist/js/**/*']);
});

Gulp.task('js:copy', ['js:clean'],() => {
  return Gulp.src(['bootstrap/dist/js/**/*.js'], { cwd: 'node_modules' })
    .pipe(Gulp.dest('dist/js'));
});

Gulp.task('css:clean', () => {
  return Del(['dist/css/**/*']);
});

Gulp.task('css:lint', () => {
  return Gulp.src(['scss/**/*.scss'])
    .pipe(Plugins.stylelint({
      failAfterError: true,
      reporters: [
        { formatter: 'verbose', console: true },
      ],
    }));
});

Gulp.task('css:build', () => {
  return Gulp.src(['scss/**/*.scss'])
    .pipe(Plugins.plumber({
      errorHandler(err) {
        console.error(err.message);
        this.emit('end');
      },
    }))
    .pipe(Plugins.sass({
      includePaths: [
        'node_modules/',
      ],
      outputStyle: 'expanded',
      sourceMap: true,
      sourceMapContents: true,
      lineFeed: 'lf',
      precision: 6,
    }))
    .pipe(Plugins.plumber.stop())
    .pipe(Plugins.postcss({
      noMap: true,
      use: 'autoprefixer',
      config: '../build/postcss.config.js',
      replace: 'dist/css/bootstrap.css',
    }))
    .pipe(Gulp.dest('dist/css'));
});

Gulp.task('css:banner', () => {
  return Gulp.src(['dist/css/*.css'])
    .pipe(Plugins.replace('/*!', `@charset "UTF-8";\n${BANNER}\n/*!`))
    .pipe(Gulp.dest('dist/css'));
});

Gulp.task('css:minify', () => {
  return Gulp.src(['dist/css/*.css', '!dist/css/*.min.css'])
    .pipe(Plugins.cleanCss({
      level: 1,
    }))
    .pipe(Plugins.rename({
      extname: '.min.css',
    }))
    .pipe(Gulp.dest('dist/css'));
});

Gulp.task('docs:clean', () => {
  return Del(['docs/css/**/*', 'docs/js/**/*']);
});

Gulp.task('docs:copy', () => {
  return Gulp.src(['dist/**/*'], { base: 'dist' })
    .pipe(Gulp.dest('docs'));
});

Gulp.task('docs:css', () => {
  return Gulp.src(['docs/assets/scss/**/*.scss'])
    .pipe(Plugins.plumber({
      errorHandler(err) {
        console.error(err.message);
        this.emit('end');
      },
    }))
    .pipe(Plugins.sass({
      includePaths: [
        'node_modules/',
        'scss/',
      ],
      outputStyle: 'expanded',
      sourceMap: true,
      sourceMapContents: true,
      lineFeed: 'lf',
      precision: 6,
    }))
    .pipe(Plugins.plumber.stop())
    .pipe(Plugins.postcss({
      noMap: true,
      use: 'autoprefixer',
      config: '../../../build/postcss.config.js',
      replace: 'docs/assets/css/bootstrap.css',
    }))
    .pipe(Gulp.dest('docs/assets/css'));
});

Gulp.task('docs:serve', () => {
  BrowserSync.init({
    server: 'docs/',
    port: 8000,
  });
});

Gulp.task('watch', () => {
  const message = (ev) => {
    console.log(`File: ${ev.path} was ${ev.type}, running tasks...`);
  };
  Gulp.watch(['scss/**/*'], () => { RunSequence('css', 'docs:copy'); })
    .on('change', message);
  Gulp.watch(['docs/**/*.html'])
    .on('change', message)
    .on('change', BrowserSync.reload);
  Gulp.watch(['docs/assets/scss/**/*.scss'], ['docs:css'])
    .on('change', message);
});

Gulp.task('docs', (resolve) => {
  return RunSequence('docs:clean', 'docs:copy', 'docs:css', () => { resolve(); });
});

Gulp.task('serve', ['docs:serve', 'watch']);

Gulp.task('clean', (resolve) => {
  return RunSequence(['css:clean', 'js:clean'], () => { resolve(); });
});

Gulp.task('css', (resolve) => {
  return RunSequence('css:clean', 'css:build', 'css:minify', 'css:banner', () => { resolve(); });
});

Gulp.task('js', (resolve) => {
  return RunSequence('js:clean', 'js:copy', () => { resolve(); });
});
