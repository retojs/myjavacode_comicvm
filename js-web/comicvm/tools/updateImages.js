var fs = require('fs');

var imagesPath = '../app/images/';
var imagesUrl = 'images/';

function readImages(path, listing, callback) {
	fs.readdir(path, function(err, files) {
		if (err) {
			throw err;
		}
		
		files.filter(function(file) {
			return fs.statSync(path + '/' + file).isFile() && file !== 'Thumbs.db';
		}).forEach(function(file) {
			var subPath = path.substr(path.indexOf(imagesPath) + imagesPath.length);  // get the path suffix that comes after imagesPath
			listing.push(imagesUrl + subPath + '/' + file);
		});
		
		callback(listing);
	});	
}

function writeFile(filename, listing) {	
	fs.writeFile(filename, JSON.stringify(listing), function(err){
		if (err) throw err;
	});
	log(filename + " updated (" + listing.length + " images)");
}

var filename = imagesPath + 'images.json';

var listing = [];

readImages(imagesPath + 'bgr', listing, function(listing) {
	readImages(imagesPath + 'chr', listing, function(listing) {
		writeFile(filename, listing);
	});
});
