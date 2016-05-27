(function() {
	
    angular.module('LookAtMe').controller('ItemController', function ($scope, $rootScope, $http, $ionicModal, dateConverter) {
		$scope.like = function(item) {
			$http({
				method: 'POST',
				url: '/api/items/' + item._id + '/like'
			}).then(function(response) {
				if (response.data.ok) {
					item.has_liked = true;
					item.num_likes++;
				}
			});
		};
		$scope.unlike = function(item) {
			$http({
				method: 'POST',
				url: '/api/items/' + item._id + '/unlike'
			}).then(function(response) {
				if (response.data.ok) {
					item.has_liked = false;
					item.num_likes--;
				}
			});
		};
		$scope.addComment = function(item) {
			$scope.errorComment = null;
			var comment = {
				item_id: item._id,
				comment: item.comment,
				user_id: $scope.user
			};
			$http({
				method: 'POST',
				url: '/api/item_comments/',
				data: comment
			}).then(function(response) {
				if (response.data.ok) {
					if (!item.comments) item.comments = [];
					comment._id = response.data.result;
					comment.date = dateConverter(comment._id);
					item.comments.push(comment);
					item.num_comments++;
					item.comment = null;
				} else {
					$scope.errorComment = response.data.result;
				}
			});
		};
	});

})();
