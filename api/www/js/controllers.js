
angular.module('starter.controllers', [])

    .controller('MenuController', function ($scope, $location) {
           $scope.goTo = function(page) {
            console.log('Going to ' + page);
            $location.url('/' + page);
        };

    });
