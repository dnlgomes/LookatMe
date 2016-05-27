(function() {
	
	angular.module('LookAtMe').controller('EditProfileController', function ($rootScope, $scope, $http, Upload) {
		var form = document.getElementById('form');
		$scope.submit = function(dataUrl, name) {
			$('#save').button('loading');
			$scope.form = $(form).serializeArray().reduce(function(obj, item) {
				obj[item.name] = item.value;
				return obj;
			}, {});
			$scope.form.errors = undefined;
			$scope.form.success = false;
			if ($scope.form.newPassword && $scope.form.newPassword != $scope.form.confirmNewPassword) {
				$scope.form.errors = {
					confirmPassword: true
				};
				$('#save').button('reset');
				return;
			} 
			if ($scope.form.newPassword && $scope.form.newPassword.length < 6) {
				$scope.form.errors = {
					password: true
				};
				$('#save').button('reset');
				return;
			} 
			var data = {
				name: $scope.form.name,
				bio: $scope.form.bio,
				password: $scope.form.password,
				newPassword: $scope.form.newPassword
			};
			if ($scope.form.email != $rootScope.user.email) {
				data.email = $scope.form.email;
			}
			$scope.update = function() {
				$rootScope.$emit('rootScope:UserUpdated', '');
				$http({
					method: 'PUT',
					url: '/api/users/',
					data: data
				}).then(function(response) {
					$('#save').button('reset');
					if (response.data.ok) {
						localStorage.setItem('loggedUser', JSON.stringify(response.data.result));
						$rootScope.$emit('rootScope:UserUpdated', '');
						$scope.form = {};
						$scope.form.errors = undefined;
						$scope.form.success = true;
						form.password.value = "";
						form.newPassword.value = "";
						form.confirmNewPassword.value = "";
					} else {
						$scope.form.errors = response.data.message.errors;
					}
				}, function errorCallback(response) {
					$('#save').button('reset');
					$scope.form.errors = {
						unknown: true
					};
				});
			};
			if ($scope.dataUrl) {
				Upload.upload({
					url: '/api/users/photo',
					data: {
						file: Upload.dataUrltoBlob(dataUrl, name)
					}
				}).then(function(response) {
					if (response.data.ok) {
						$scope.update();
					} else {
						$scope.form = {};
						$scope.form.errors = {
							photo: true
						};
					}
				});
			} else {
				$scope.update();
			}
		}
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
