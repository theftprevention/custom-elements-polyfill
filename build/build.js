const
    fs = require('fs'),
    path = require('path'),
    through = require('through2'),
    minify = require('uglify-js').minify;

const
    reg_version = /\{VERSION_PLACEHOLDER\}/g;

var root = path.join(process.mainModule.filename, '../../'),
    pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')),
    version = pkg.version,
    src = fs.readFileSync(path.join(root, 'src/custom-elements-polyfill.js'), 'utf8'),
    dist = src.replace(reg_version, version),
    min = minify(dist, { warnings: true });

if (min.error) {
    console.error(min.error);
} else if (min.warnings && min.warnings.length > 0) {
    console.warn(min.warnings);
}

fs.writeFileSync(path.join(root, 'dist/custom-elements-polyfill.js'), dist);
fs.writeFileSync(path.join(root, 'dist/custom-elements-polyfill.min.js'), min.code);