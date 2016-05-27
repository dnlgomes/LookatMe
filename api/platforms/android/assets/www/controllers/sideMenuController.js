(function () {

	var app = angular.module('starter');
	app.controller('SideMenuController', function ($scope) {
		$scope.user = JSON.parse(localStorage.getItem("loggedUser"));
	});
	
})();
