(function() {

	angular.module('LookAtMe').controller('WardrobeController', function ($scope, $rootScope, $ionicModal, $http, Upload, dateConverter) {
		$scope.refresh = function() {
			hasLiked = function(item) {
				for (var i = 0; i < item.likes.length; i++) {
					if (item.likes[i] == $scope.user._id) {
						return true;
					}
				}
				return false;
			};
			$http({
				method: 'GET',
				url: '/api/items/get/' + $rootScope.user.login
			}).then(function(response) {
				if (response.data.ok) {
					$scope.items = response.data.result;
					for (var i = 0; i < $scope.items.length; i++) {
						$scope.items[i].has_liked = hasLiked($scope.items[i]);
						$scope.items[i].num_likes = $scope.items[i].likes && $scope.items[i].likes.length || 0;
						$scope.items[i].num_comments = $scope.items[i].comments && $scope.items[i].comments.length || 0;
					}
				} else {
					$scope.error = true;
				}
			});
		};
		$scope.refresh();
		$ionicModal.fromTemplateUrl('partials/addItemModal.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;
		});
		$scope.clear = function() {
			$scope.comment = null;
			$scope.item = {
				visibility : 'public'
			};
			$scope.dataUrl = undefined;
			$scope.picFile = undefined;
			$scope.errors = undefined;
		};
		$scope.openModal = function() {
			$scope.modal.show();
		};
		$scope.closeModal = function() {
			$scope.modal.hide();
		};
		$scope.$on('$destroy', function() {
			$scope.modal.remove();
			$scope.itemModal.remove();
		});
		$scope.$on('modal.shown', function() {
			$scope.clear();
		});
		$ionicModal.fromTemplateUrl('partials/itemModal.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.itemModal = modal;
		});
		$scope.openItemModal = function(item) {
			$scope.clear();
			$http({
				method: 'GET',
				url: '/api/items/' + item._id
			}).then(function(response) {
				if (response.data.ok) {
					item.comments = response.data.result.comments;
					item.num_comments = item.comments.length;
					item.likes = response.data.result.likes;
					item.num_likes = item.likes.length;
					for (var i = 0; i < item.comments.length; i++) {
						item.comments[i].date = dateConverter(item.comments[i]._id);
					}
					$scope.current_item = item;
					$scope.itemModal.show();
				}
			});
		};
		$scope.closeItemModal = function() {
			$scope.itemModal.hide();
		};
		$scope.submit = function(dataUrl, name) {
			$scope.errors = {};
			if (!$scope.dataUrl) {
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
						Upload.upload({
							url: '/api/items/' + itemId + '/photo',
							data: {
								file: Upload.dataUrltoBlob(dataUrl, name)
							}
						}).then(function(response) {
							if (response.data.ok) {
								$scope.refresh();
								$scope.closeModal();
							} else {
								$scope.errors = response.data.message;
							}
						});
					} else {
						$scope.errors = response.data.message.errors;
					}
				});
			}
		};
		var handleFileSelect = function(evt) {
			var file = evt.currentTarget.files[0];
			var reader = new FileReader();
			reader.onload = function(evt) {
				$scope.$apply(function($scope) {
					$scope.dataUrl = evt.target.result;
				});
			};
			reader.readAsDataURL(file);
		};
		$(document).on('change', 'input[name="file"]', handleFileSelect);
	});
	
})();
