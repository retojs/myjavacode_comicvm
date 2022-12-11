'use strict';
var express = require('express'),
    cors = require('cors'),
    path = require('path'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    multer = require('multer'),

    fileurls = require('./fileurls.js'),

    STORIES_DIR = __dirname + '/../Stories',

    comicvm = express();

comicvm.use(express.static('app'));

comicvm.use(bodyParser.json());
comicvm.use(bodyParser.urlencoded({extended: true}));


var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

comicvm.get('/stories/:story/list/scenes', cors(corsOptions), function (req, res) {
    var plotPath = '/' + req.params.story + '/plot';
    fileurls.getUrls(STORIES_DIR + plotPath, '', null, function (paths) {
        console.log('scenes:\n ' + paths);
        res.send(paths);
        console.log('----------');
    });
});

comicvm.get('/stories/:story/list/images', cors(corsOptions), function (req, res) {
    var imagesPath = '/' + req.params.story + '/images';
    fileurls.getUrls(STORIES_DIR + imagesPath, 'stories' + imagesPath, ['bgr', 'chr'], function (paths) {
        console.log('images:\n ' + paths);
        res.send(paths);
        console.log('----------');
    });
});

var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, STORIES_DIR + '/' + req.params.story + '/images/' + req.params.path);
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    }),

    upload = multer({storage: storage});

// 'image' is the property in the uploaded form data the image data is assigned to
comicvm.post('/stories/:story/upload/:path', upload.single('image'), cors(corsOptions), function (req, res) {
    res.end();
});

comicvm.post('/stories/:story/images/move/tmp/:path', cors(corsOptions), function (req, res) {
    var tmpPath = '/stories/' + req.params.story + '/images/tmp/' + req.params.path;
    var localPath = {
        from: toLocalPath(tmpPath, 'stories', STORIES_DIR),
        to: toLocalPath(req.body.dest, 'stories', STORIES_DIR)
    };

    fs.rename(localPath.from, localPath.to, function () {
        console.log('moved image\n from ' + localPath.from + '\n to : ' + localPath.to);
        res.end();
    });
});


/**
 * the stories are not inside the app directory
 *  -> return the requested file from a different local directory
 */
comicvm.get(/^\/stories/, cors(corsOptions), function (req, res) {
    console.log('GET : ' + req.originalUrl);
    var localPath = toLocalPath(req.originalUrl, 'stories', STORIES_DIR);
    res.sendFile(localPath);
});

comicvm.post(/^\/stories/, cors(corsOptions), function (req, res) {
    console.log('POST : ' + req.originalUrl);
    var localPath = toLocalPath(req.originalUrl, 'stories', STORIES_DIR);
    fs.writeFile(localPath, req.body.content, function () {
        console.log(req.originalUrl + ' saved');
        res.end();
    });
});

/**
 * the jasmine spec runner is served under the url /jasmine
 */
comicvm.get(/^\/jasmine/, cors(corsOptions), function (req, res) {
    if (req.originalUrl === '/jasmine') {
        res.sendFile(path.join(__dirname + '/../test/unit-tests/jasmine-standalone-2.3.4/SpecRunner.html'))

    } else if (req.originalUrl.indexOf('/jasmine/spec') === 0 || req.originalUrl.indexOf('/jasmine/util') === 0) {
        var localPath = toLocalPath(req.originalUrl, 'jasmine', __dirname + '/../test/unit-tests/');
        res.sendFile(localPath);

    } else {
        var localPath = toLocalPath(req.originalUrl, 'jasmine', __dirname + '/../test/unit-tests/jasmine-standalone-2.3.4/');
        res.sendFile(localPath);
    }
});

/**
 * Converts a path from a URL to a local path
 * @param url: the original URL
 * @param urlDir: the directory in the URL you want to map (e.g. 'jasmine' in 'http://localhost:8080/tests/jasmine/spec/mySpec.js)
 * @param localDir: the local directory
 * @returns {string}
 */
function toLocalPath(url, urlDir, localDir) {
    var urlSubstr = {
            from: url.indexOf(urlDir) + urlDir.length,
            to: url.indexOf('?') >= 0 ? url.indexOf('?') : undefined
        },
        pathSuffix = url.substring(urlSubstr.from, urlSubstr.to);

    if (false) {
        console.log('url ' + url);
        console.log('urlDir ' + urlDir);
        console.log('pathSuffix ' + pathSuffix);
        console.log('local path ' + path.join(localDir, pathSuffix));
    }
    return path.join(localDir, pathSuffix);
}

module.exports = comicvm;
