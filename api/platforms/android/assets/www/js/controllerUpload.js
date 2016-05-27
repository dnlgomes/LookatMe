var app = angular.module('fileUpload',
    [ 'ngAnimate',
    'ui.bootstrap',
    'ngResource',
    'ngFileUpload' ]);

app.controller('UploadCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.login = 'vitorma';
    $scope.pic = '/api/users/'+$scope.login+'/photo';
    console.log("teste");
    $scope.uploadPic = function(file) {
        if (file && !file.$error) {
                file.upload = Upload.upload({
                    url: '/api/users/'+$scope.login+'/photo',
                    file: file
                });

                file.upload.then(function (response) {
                    $scope.result = response.data;
                    var time = (new Date()).toString();
                    $scope.pic = '/api/users/'+$scope.login+'/photo' + "?cb=" + time;
                });

                file.upload.progress(function (evt) {
                    file.progress = Math.min(100, parseInt(100.0 *
                        evt.loaded / evt.total));
                });
        }

    };


}]);