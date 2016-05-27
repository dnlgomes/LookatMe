(function() {

	angular.module('LookAtMe').controller('AddQuestionModalController', function ($scope, $rootScope, $ionicModal, $http, Upload, $q) {
		$scope.itemsPreview = {};
		$scope.clear = function() {
			$scope.question = {
				type: 'open',
				channels: 'general',
				items: [],
				target: null
			};
			$scope.errors = {};
			$scope.itemsPreview = {};
			$scope.page = 0;
			$scope.refreshItem();
		};
		$scope.refreshItem = function() {
			$scope.item = {
				visibility: 'public'
			};
			$scope.dataUrl = undefined;
			$scope.picFile = undefined;
			$scope.itemErrors = undefined;
		};
		$scope.$on('modal.shown', function() {
			$scope.clear();
		});
		$scope.goItem = function() {
			$scope.page = 1;
		};
		$scope.backItem = function() {
			$scope.page = 0;
		};
		$scope.goItemCreation = function() {
			$scope.page = 2;
		};
		$scope.backItemCreation = function() {
			$scope.page = 1;
			$scope.refreshItem();
		};
		$scope.addItem = function(event, item) {
			var isChecked = $(event.currentTarget).find('input[type="checkbox"]').is(':checked');
			if (isChecked) {
				$scope.itemsPreview[item._id] = item;
			} else {
				delete $scope.itemsPreview[item._id];
			}
		};
		$scope.isEmpty = function(obj) {
			for (var key in obj) {
				return false;
			}
			return true;
		};
		$scope.createQuestion = function() {
			$scope.errors = {};
			$scope.question.items = [];
			for (var key in $scope.itemsPreview) {
				$scope.question.items.push($scope.itemsPreview[key]._id);
			}
			/*var mentions = parseMentions($scope.question.description);
			$scope.question.mentions_ids = [];
			angular.forEach(mentions, function(item) {
				$scope.question.mentions_ids.push($scope.getUserIdByLogin(item));
				return $scope.question.mentions_ids;
			});
			console.log($scope.question.mentions_ids);
			*/
			$http({
				method: 'POST',
				url: '/api/questions/',
				data: $scope.question
			}).then(function(response) {
				if (response.data.ok) {
					localStorage.setItem('loggedUser', JSON.stringify(response.data.result));
					$rootScope.$emit('rootScope:UserUpdated', '');
					$scope.refresh();
					$scope.closeModal();
				} else {
					$scope.errors = response.data.message.errors;
				}
			});
			return false;
		};

		$scope.getUserIdByLogin = function(term) {
			var user_id;
			$http.get('/api/users/'+term.replace('@', '')).then(function (response) {
				if(response.data.ok) {
					user_id = response.data.result._id;
				}
				return user_id;
			});
		};

		$scope.getUsersIds = function(users) {
			var idList = [];
			angular.forEach(users, function(item) {
				idList.push($scope.getUserIdByLogin(item));
			});
			return idList;
		};

		$scope.searchUser = function(term) {
			var userList = [];
			return $http.get('/api/users/').then(function (response) {
				angular.forEach(response.data.result, function(item) {
					if (item.name.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
						userList.push(item);
					}
				});
				$scope.users = userList;
				return $q.when(userList);
			});
		};

		$scope.getUserTextRaw = function(item) {
			return '@' + item.login;
		};

		function parseMentions(text) {
			var mentionsRegex = new RegExp('@([a-zA-Z0-9\_\.]+)', 'gim');
			var matches = text.match(mentionsRegex);
			return matches
		}
		$scope.createItem = function(dataUrl, name) {
			$scope.itemErrors = {};
			if (!$scope.dataUrl) {
				$scope.itemErrors = {
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
								$scope.item._id = itemId;
								$scope.items.push($scope.item);
								$scope.itemsPreview[$scope.item._id] = $scope.item;
								$scope.refreshItem();
								$scope.page = 0;
							} else {
								$scope.itemErrors = response.data.message;
							}
						});
					} else {
						$scope.itemErrors = response.data.message.errors;
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
	})
	.filter('words', function () {
		return function (input, words) {
			if (isNaN(words)) {
				return input;
			}
			if (words <= 0) {
				return '';
			}
			if (input) {
				var inputWords = input.split(/\s+/);
				if (inputWords.length > words) {
					input = inputWords.slice(0, words).join(' ') + '\u2026';
				}
			}
			return input;
		};
	});
		
})();

