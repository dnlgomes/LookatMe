(function() {

	angular.module('LookAtMe', ['starter', 'ionic', 'ngCordova', 'fileUpload', 'ngImgCrop', 'mentio', 'dateService'])
		.factory('errorInterceptor', ['$q', '$rootScope', function ($q, $rootScope) {
				return {
					responseError: function(response) {
						if (response.status == 401) {
							localStorage.clear();
							window.location.href = '/';
							return;
						}
						return response || $q.when(response);
					}
				};
		}])
		.config(['$httpProvider', function ($httpProvider) {
			$httpProvider.defaults.headers.common = { 
				'Authorization': 'Bearer ' + localStorage.getItem('token'),
				'Accept': 'application/json;odata=verbose'
			};
			$httpProvider.interceptors.push('errorInterceptor');
		}]);
		
})();
