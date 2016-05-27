(function() {

	angular.module('LookAtMe').controller('MainController', function ($scope, $rootScope, $ionicModal, $ionicScrollDelegate, $http, dateConverter, $ionicPopup) {
		$scope.items = [];
		$scope.channels = { general: 'Geral', friends: 'Amigos', private: 'Privado' };
		$scope.currentChannel = 'general';
		$scope.questions = {};
		$scope.panel = 0;
		$http({
			method: 'GET',
			url: '/api/items/get/' + $rootScope.user.login
		}).then(function(response) {
			if (response.data.ok) {
				$scope.items = response.data.result;
			}
		});
		$ionicModal.fromTemplateUrl('partials/addQuestionModal.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;
		});
		$scope.openModal = function() {
			console.log('$scope.openModal = function()')
			$scope.modal.show();
		};
		$scope.closeModal = function() {
			$scope.modal.hide();
		};
		$scope.$on('$destroy', function() {
			$scope.modal.remove();
		});		
		$scope.refresh = function() {
			console.log('$scope.refresh = function()')
			for (var channel in $scope.channels) {
				(function(channel) {
					$http({
						method: 'GET',
						url: '/api/questions/channel/' + channel
					}).then(function(response) {
						if (response.data.ok) {
							$scope.questions[channel] = [];
							for (var i = 0; i < response.data.result.length; i++) {
								response.data.result[i].date = dateConverter(response.data.result[i]._id);
								$scope.questions[channel].push(response.data.result[i]);
							}
						} else {
							$scope.error = true;
						}
					});
				})(channel);
			}
			
		};		
		$scope.changeChannel = function(channel) {
			$scope.currentChannel = channel;
		};
		$scope.changePanel = function(panel) {
			$scope.panel = panel;
		};
		$scope.refresh();
		$scope.promoteQuestion = function(question_id) {
			$http({
				method: 'PUT',
				url: '/api/questions/' + question_id + '/promote'
			}).then(function (response) {
				if (response.data.ok) {
					$scope.refresh();
					$ionicScrollDelegate.scrollTop();
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
		$scope.acceptSolicitation = function(user, index) {
			$http({
				method: 'POST',
				url: '/api/friendships/accept',
				data: {
					user_id: user._id, 
					user_login: user.login
				}
			}).then(function(response) {
				console.log(response.data);
				if (response.data.ok) {
					$scope.user.friendship_solicitations.splice(index, 1);
					$scope.user.friends.unshift(user);
				}
			});
		};
		$scope.rejectSolicitation = function(user, index) {
			$http({
				method: 'POST',
				url: '/api/friendships/reject',
				data: {
					user_id: user._id
				}
			}).then(function(response) {
				console.log(response);
				if (response.data.ok) {
					$scope.user.friendship_solicitations.splice(index, 1);
				}
			});
		};
		$scope.unfriend = function(user, index) {
			$http({
				method: 'POST',
				url: '/api/friendships/unfriend',
				data: {
					user_id: user._id
				}
			}).then(function(response) {
				if (response.data.ok) {
					$scope.user.friends.splice(index, 1);
				}
			});
		};
	});
	
})();
