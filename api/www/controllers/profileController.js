(function() {
	
    angular.module('LookAtMe').controller('ProfileController', function ($scope, $rootScope, $http, $ionicModal, dateConverter, $ionicPopup) {
		var begin = window.location.search.search('user=');
		var user;
		if (begin > 0) {
			user = window.location.search.substr(begin + 5);
		} else {
			user = null;
		}
		if (!user) {
			$scope.errors = true;
		} else {
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
				url: '/api/users/' + user
			}).then(function(response) {
				if (response.data.ok && response.data.result) {
					$scope.profileUser = response.data.result.user;
					for (var i = 0; i < $scope.user.friendship_solicitations.length; i++) {
						if ($scope.user.friendship_solicitations[i]._id == $scope.profileUser._id) {
							$scope.friendshipStatus = 4;
							return;
						}
					}
					$scope.friendshipStatus = response.data.result.friendship_status;
					$scope.friends = response.data.result.friends;
					$scope.questions = response.data.result.questions;
					$scope.answers = response.data.result.answers;
					$scope.favoritedAnswers = response.data.result.favoritedAnswers;
				} else {
					$scope.errors = true;
				}
			});
			$http({
				method: 'GET',
				url: '/api/items/get/' + user
			}).then(function(response) {
				if (response.data.ok) {
					$scope.items = response.data.result;
					for (var i = 0; i < $scope.items.length; i++) {
						$scope.items[i].has_liked = hasLiked($scope.items[i]);
						$scope.items[i].num_likes = $scope.items[i].likes && $scope.items[i].likes.length || 0;
						$scope.items[i].num_comments = $scope.items[i].comments && $scope.items[i].comments.length || 0;
					}
				}
			});
		}
		$scope.tab = 0;
		$ionicModal.fromTemplateUrl('partials/itemModal.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.itemModal = modal;
		});
		$scope.clear = function() {
			$scope.comment = null;
		};
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
				} else {
					$ionicPopup.show({
						title: 'Oops...',
						subTitle: 'Item é privado',
						scope: $scope,
						buttons: [
							{ 
								text: 'OK',
								type: 'button-positive'
							}
						]
					});
				}
			});
		};
		$scope.closeItemModal = function() {
			$scope.itemModal.hide();
		};
		$scope.$on('$destroy', function() {
			$scope.itemModal.remove();
		});
		$scope.sendSolicitation = function() {
			$http({
				method: 'POST',
				url: '/api/friendships/send',
				data: {
					user_id: $scope.profileUser._id
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.friendshipStatus = 1;
				}
			});
		};
		$scope.dismissSolicitation = function() {
			$http({
				method: 'POST',
				url: '/api/friendships/dismiss',
				data: {
					user_id: $scope.profileUser._id
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.friendshipStatus = 0;
				}
			});
		};
		$scope.unfriend = function() {
			$http({
				method: 'POST',
				url: '/api/friendships/unfriend',
				data: {
					user_id: $scope.profileUser._id
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.friendshipStatus = 0;
				}
			});
		};
		$scope.acceptSolicitation = function() {
			$http({
				method: 'POST',
				url: '/api/friendships/accept',
				data: {
					user_id: $scope.profileUser._id, 
					user_login: $scope.profileUser.login
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.friendshipStatus = 2;
				}
			});
		};
		$scope.rejectSolicitation = function() {
			$http({
				method: 'POST',
				url: '/api/friendships/reject',
				data: {
					user_id: $scope.profileUser._id
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.friendshipStatus = 0;
				}
			});
		};
		$scope.like = function(item) {
			$http({
				method: 'POST',
				url: '/api/items/' + item._id + '/like'
			}).then(function(response) {
				if (response.data.ok) {
					item.num_likes++;
					item.has_liked = true;
				}
			});
		};
		$scope.unlike = function(item) {
			$http({
				method: 'POST',
				url: '/api/items/' + item._id + '/unlike'
			}).then(function(response) {
				if (response.data.ok) {
					item.num_likes--;
					item.has_liked = false;
				}
			});
		};
		$scope.addComment = function(item, comment) {
			$scope.errorComment = null;
			var comment = {
				item_id: item._id,
				comment: comment,
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
					$scope.comment = null;
				} else {
					$scope.errorComment = response.data.result;
				}
			});
		};
		/*
		* if given group is the selected group, deselect it
		* else, select the given group
		*/
		$scope.toggleGroup = function(group) {
			if ($scope.isGroupShown(group)) {
			  $scope.shownGroup = null;
			} else {
			  $scope.shownGroup = group;
			}
		};
		$scope.isGroupShown = function(group) {
			return $scope.shownGroup === group;
		};
		$scope.changeTab = function(tab) {
			$scope.tab = tab;
		};
	});

})();
