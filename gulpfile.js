var gulp = require("gulp");
var ts = require("gulp-typescript");
var bootlint  = require('gulp-bootlint');

//Specify files to monitor in tsconfig.json
var tsProject = ts.createProject("tsconfig.json");

//Compiles the TypeScript files specified in tsconfig.json into JavaScript files
gulp.task('compile', function () {
    return tsProject.src()
        .pipe(ts(tsProject))
        .js.pipe(gulp.dest("./project/static/js"));
});

//Runs bootlint on all html files
gulp.task('linter', function () {
    return gulp.src('./project/templates/*.html')
        .pipe(bootlint({
            reportFn: function(file, lint, isError, isWarning, errorLocation) {
                var message = (isError) ? "ERROR! - " : "WARN! - ";
                if (errorLocation)
                    message += file.path.split('/').pop() + ' (line:' + (errorLocation.line + 1) + ', col:' + (errorLocation.column + 1) + ') [' + lint.id + '] ' + lint.message;
                else
                    message += file.path.split('/').pop() + ': ' + lint.id + ' ' + lint.message;
                console.log(message);
            }
        }));
});

//Monitors files and automatically recompiles upon file changes
gulp.task('default', function () {
	gulp.start("compile");
//	gulp.start("linter");
	gulp.watch("./project/static/ts/*.ts", ['compile']);
//	gulp.watch("./project/templates/*.html", ['linter']);
});
