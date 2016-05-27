(function() {

	var app = angular.module('profile', ['starter', 'ionic', 'ngCordova', 'ngFileUpload' ])
		.controller('ProfileController', function ($scope) {
			$scope.user = JSON.parse(localStorage.getItem("loggedUser"));

		});
})();
