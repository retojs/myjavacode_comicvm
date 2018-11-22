var fs = require('fs'),
    path = require('path');

/**
 * Returns a list of the files in the specified basePath + subPath directory.
 * Files in sub-directories are included in the result list.
 * The name of the files from sub-directories specifies the path relative to the basePath.
 *
 * @param basePath
 * @param subPath
 * @param imagesBaseUrl
 * @param result
 * @param cb
 */
function listFileUrls(basePath, subPath, imagesBaseUrl, subdirs, result, cb) {
    var filePath = basePath + subPath;

    console.log('collecting list elements in folder \n ' + filePath);

    if (false) {
        console.log('subPath:\n ' + subPath);
        console.log('imagesBaseUrl:\n ' + imagesBaseUrl);
        console.log('result:\n ' + result);
        console.log('subdirs:\n ' + subdirs);
        console.log('cb:\n ' + cb);
    }

    fs.readdir(filePath, function (err, files) {
        if (err) {
            throw err;
        }

        var pending = files.length;
        if (!pending) return cb([]);

        files.forEach(function (file) {
            if (file.indexOf('_') === 0 || file.indexOf('.') === 0) { // ignore files starting with underscore or dot
                if (!--pending) cb(result);
            } else {
                absPath = path.resolve(filePath, file);
                fs.stat(absPath, function (err, stat) {

                    if (stat && stat.isDirectory()) {
                        if (!subdirs || subdirs.indexOf(file) > -1) {
                            listFileUrls(basePath, subPath + '/' + file, imagesBaseUrl, subdirs, result, function (result) {
                                if (!--pending) cb(result);
                            });
                        } else {
                            if (!--pending) cb(result);
                        }
                    } else if (stat && stat.isFile() && file !== 'Thumbs.db') {

                        result.push(imagesBaseUrl + subPath + '/' + file);
                        if (!--pending) cb(result);
                    }
                });
            }
        });
    });
}

module.exports = {

    /**
     * Returns a list of files in the specified directory mapped to urls with the specified prefix
     *
     * @param directory: the directory to scan
     * @param baseUrl: the base URL to append the file paths
     * @param cb: callback
     */
    getUrls: function (directory, baseUrl, subdirs, cb) {
        return listFileUrls(directory, '', baseUrl, subdirs, [], cb);
    }
};