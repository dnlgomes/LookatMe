var app = angular.module('fileUpload', ['ngFileUpload']);

app.factory('uploadFile', function (Upload) {
    return {
        upload: function(url, file, callback) {
            if (file && !file.$error) {
                file.upload = Upload.upload({
                    url: url,
                    file: file
                });
                file.upload.then(function(response) {
                    if (callback) callback(response);
                });
                file.upload.progress(function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
            } 
        }
    }



});

