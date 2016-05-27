var multer  = require('multer');
var uuid    = require('uuid');
var mime    = require('mime');
var mkdirp  = require('mkdirp');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var destBaseFolder = process.env.OPENSHIFT_DATA_DIR || './uploads/';
        var destUserFolder = destBaseFolder + req.user.login + '/';
        mkdirp(destUserFolder);
        callback(null, destUserFolder);
    },
    filename: function (req, file, callback) {
        var extension = mime.extension(file['mimetype']);
        // uuid is for generating unique filenames.
        var fileName = uuid.v4()+ "." + extension;
        callback(null, fileName);
    }	
});

var upload = multer({ storage : storage}).single('file');

module.exports = upload;
