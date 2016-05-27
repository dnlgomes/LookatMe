(function() {
	
    angular.module('LookAtMe').controller('QuestionController', function ($scope, $rootScope, $http, dateConverter, $ionicPopup, $ionicModal) {
		var begin = window.location.search.search('id=');
		var question_id;
		if (begin > 0) {
			question_id = window.location.search.substr(begin + 3);
		} else {
			question_id = null;
		}
		$scope.hasCommented = false;
		$scope.refresh = function() {
			$http({
				method: 'GET',
				url: '/api/questions/' + question_id
			}).then(function(response) {
				if (response.data.ok) {
					$scope.getVote();
					console.log(response.data);
					$scope.question = response.data.result;
					$scope.hasCommented = $scope.question.user_id._id == $scope.user._id;
					for (var i = 0; i < $scope.question.comments.length; i++) {
						$scope.question.comments[i].date = dateConverter($scope.question.comments[i]._id);
						if ($scope.question.comments[i].user_id._id == $scope.user._id) {
							$scope.hasCommented = true;
						}
					}
					$scope.question.date = dateConverter($scope.question._id);
				} else {
					$scope.error = true;
				}
			});
		};
		if (question_id == null) {
			$scope.error = true;
		} else {
			$scope.refresh();
		}

		$scope.promoteQuestion = function() {
			$http({
				method: 'PUT',
				url: '/api/questions/' + question_id + '/promote'
			}).then(function (response) {
				if (response.data.ok) {
					window.location.reload(false);
				} else {
					$scope.errors = response.data.message.errors;
					if($scope.errors.coins) {
						var myPopup = $ionicPopup.show({
							title: 'Sem moedas!',
							template: 'Você precisa de mais moedas para promover esta pergunta',
							scope: $scope,
							buttons: [
								{ text: 'Cancelar' },
								{
									text: '<b>Comprar</b>',
									type: 'button-positive',
									onTap: function(e) {
										//if (!$scope.buy) {

										//} else {

										//}
									}
								}
							]
						});

						myPopup.then(function(res) {
							console.log('Tapped!', res);
						});
					}
				}
			});
		};
		
		$scope.vote = function(item) {
			$http({
				method: 'PUT',
				url: 'api/questions/'+question_id+'/vote',
				data: item
			}).then(function (response) {
				if (response.data.ok) {
					$scope.refresh();
				} else {
					$scope.errors = response.data.message.errors;
				}
			});

		};

		$scope.getVote = function() {
			$http({
				method: 'GET',
				url: 'api/questions/'+question_id+'/vote'
			}).then(function (response) {
				if (response.data.ok) {
					$scope.voted = response.data.result;
				} else {
					$scope.errors = response.data.message.errors;
				}
			});

		};
		$scope.getVote();

		$scope.addComment = function(commentText) {
			var comment = {
				question_id: $scope.question._id,
				comment: commentText,
				user_id: $scope.user,
				upvotes: [],
				downvotes: [],
				is_favorite: false
			};
			$scope.errorComment = false;
			$http({
				method: 'POST',
				url: '/api/comments',
				data: comment
			}).then(function(response) {
				if (response.data.ok) {
					localStorage.setItem('loggedUser', JSON.stringify(response.data.result));
					$rootScope.$emit('rootScope:UserUpdated', '');
					$scope.hasCommented = true;
					$("#comment").val("");
					$scope.refresh();
				} else {
					$scope.errorComment = true;
				}
			});
		};
		$scope.upvote = function(comment) {
			$http({
				method: 'POST',
				url: '/api/comments/' + comment._id + '/upvote' 
			}).then(function(response) {
				if (response.data.ok) {
					comment.upvotes = response.data.result.upvotes;
					comment.downvotes = response.data.result.downvotes;
					comment.user_id.reputation = response.data.result.reputation;
				}
			});
		};
		$scope.downvote = function(comment) {
			$http({
				method: 'POST',
				url: '/api/comments/' + comment._id + '/downvote' 
			}).then(function(response) {
				if (response.data.ok) {
					comment.upvotes = response.data.result.upvotes;
					comment.downvotes = response.data.result.downvotes;
					comment.user_id.reputation = response.data.result.reputation;
				}
			});
		};
		$scope.favorite = function(comment) {
			$http({
				method: 'POST',
				url: '/api/comments/' + comment._id + '/favorite' 
			}).then(function(response) {
				if (response.data.ok) {
					comment.is_favorite = response.data.result.is_favorite;
					comment.user_id.reputation = response.data.result.reputation;
					//comment.user_id.wallet.silver_coins = response.data.result.silver_coins;
				}
			});
		};
		$scope.contains_favorite = function(comments) {
			var ret = false;
			for (i in comments) {
				if(comments[i].is_favorite) {
					ret = true;
					break;
				}
			}
			return ret;
		};
		$scope.contains = function(array, id) {
			for (var i = 0; i < array.length; i++) {
				if (array[i] == id) return true;
			}
			return false;
		};
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
		$scope.clear = function() {
			
		};
	});

})();
