(function () {

	var app = angular.module('starter');
	app.controller('WardrobeController', function ($scope, $ionicModal) {
		$scope.user = JSON.parse(localStorage.getItem("loggedUser"));
		$ionicModal.fromTemplateUrl('partials/addItemModal.html', {
			scope : $scope,
			animation : 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;
		});
		$scope.openModal = function () {
			$scope.modal.show();
		};
		$scope.closeModal = function () {
			$scope.modal.hide();
		};
		$scope.$on('$destroy', function () {
			$scope.modal.remove();
		});
		$scope.item = {};
	});
	
})();
