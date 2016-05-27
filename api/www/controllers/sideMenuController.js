(function() {

	angular.module('LookAtMe').controller('SideMenuController', function ($scope, $rootScope, $http) {
		$rootScope.user = JSON.parse(localStorage.getItem('loggedUser'));
		$scope.pic = '/api/users/'+$rootScope.user.login+'/photo';
		$http({
			method: 'POST',
			url: '/api/users/update'
		}).then(function(response) {
			if (response.data.ok) {
				if (!response.data.result.friendship_solicitations) {
					response.data.result.friendship_solicitations = [];
				}
				response.data.result.user.friends = response.data.result.friends;
				$rootScope.user = response.data.result.user;
				localStorage.setItem('loggedUser', JSON.stringify($rootScope.user));
			}
		});
		$rootScope.$on('rootScope:UserUpdated', function (event, data) {
			$rootScope.user = JSON.parse(localStorage.getItem('loggedUser'));
			var time = (new Date()).toString();
			$scope.pic = $scope.pic + "?cb=" + time;
		});
		$scope.logout = function() {
			localStorage.clear(); 
			window.location.href = '/';
		};
	});
	
})();
