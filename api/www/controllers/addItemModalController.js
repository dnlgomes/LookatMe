(function() {

	angular.module('LookAtMe').controller('AddItemModalController', function ($scope, $ionicModal, $http, uploadFile) {
		$scope.user = JSON.parse(localStorage.getItem('loggedUser'));
		$scope.clear = function() {
			$scope.item = {
				visibility : 'public'
			};
			$scope.picFile = undefined;
			$scope.picFileCropped = undefined;
			$scope.errors = undefined;
		};
		$scope.submit = function(file) {
			$scope.errors = {};
			if (!file) {
				$scope.errors = {
					photo : true
				};
			} else {
				$http({
					method: 'POST',
					url: '/api/items/',
					data: $scope.item
				}).then(function(response) {
					if (response.data.ok) {
						var itemId = response.data.result;
						uploadFile.upload('/api/items/' + itemId + '/photo', file, function(response) {
							if (response.data.ok) {
								$scope.refresh();
								$scope.closeModal();
							} else {
								$scope.errors = response.data.message.errors;
							}
						});
					} else {
						$scope.errors = response.data.message.errors;
					}
				});
			}
		};
		var handleFileSelect = function(evt) {
			console.log("HMMMM...");
			var file = evt.currentTarget.files[0];
			var reader = new FileReader();
			reader.onload = function(evt) {
				$scope.$apply(function($scope) {
					alert("OI");
					$scope.picFile = evt.target.result;
				});
			};
			reader.readAsDataURL(file);
		};
		document.getElementById("fileInput").onchange = handleFileSelect;
		angular.element(document.querySelector("#fileInput")).on('change', handleFileSelect);
	});
	
})();
