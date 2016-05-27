(function() {
	
	var app = angular.module('auth', ['starter', 'ionic', 'ngCordova'])
		.controller('AuthController', function ($scope, $http) {
			$scope.errors = {};
			$scope.user = {};
			$scope.newUser = {};
			$scope.login = function() {
				$('#login').button('loading');
				$http({
					method: 'POST',
					url: '/api/users/login',
					data: $scope.user
				}).then(function(response) {
					if(response.data.ok) {
						$scope.success(response.data.result, response.data.token);
					} else {
						$('#login').button('reset');
						$scope.errors.unknown = 'Usuário ou senha não coincidem.';
					}
				});
				return false;
			};
			$scope.signup = function() {
				$scope.errors = {};
				$('#register').button('loading');
				if (!$scope.newUser.login) {
					$('#register').button('reset');
					$scope.errors.login = 'Login é obrigatório.';
				} else if (!$scope.newUser.email) {
					$('#register').button('reset');
					$scope.errors.email = 'E-mail é obrigatório.';
				} else if (!$scope.newUser.password) {
					$('#register').button('reset');
					$scope.errors.password = 'Senha é obrigatória.';
				} else if ($scope.newUser.password !== $scope.newUser.confirmPassword) {
					$('#register').button('reset');
					$scope.errors.confirmPassword = 'Senhas não coincidem.';
				} else {
					$('#register').button('loading'); 
					$http({
						method: 'POST',
						url: '/api/users/signup',
						data: $scope.newUser
					}).then(function(response) {
						if(response.data.ok) {
							$scope.success($scope.newUser, response.data.token);
						} else {
							if (response.data.message.code == 11000 || response.data.message.errors.login) {
								$scope.errors.login = 'Login já existente.';
							} else if (response.data.message.errors.email) {
								$scope.errors.email = 'E-mail inválido.';
							} else if (response.data.message.errors.password) {
								$scope.errors.password = 'Senha deve conter letras e digitos.';
							} else {
								$scope.error = 'Um erro ocorreu. Tente novamente.';
							}
						}
					});
				}
				return false;
			};
			$scope.success = function(response, token) {
				localStorage.setItem('loggedUser', JSON.stringify(response));
				localStorage.setItem('token', token);
				window.location.href = '/main.html';
			};
			$scope.go = function() {
				$scope.errors = {};
				$scope.user = {};
				$scope.newUser = {};
				$('#login-panel').fadeOut(function() {
					$('#login-panel form')[0].reset();
					$('#login-panel .alert').hide();
					$('#register-panel').fadeIn();
					setTimeout(function() {
						$('#register-panel input[name=name]').focus();
					}, 500);
				});
			};
			$scope.back = function() {
				$scope.errors = {};
				$scope.user = {};
				$scope.newUser = {};
				$('#register-panel').fadeOut(function() {
					$('#register-panel form')[0].reset();
					$('#register-panel .alert').hide();
					$('#login-panel').fadeIn();
					setTimeout(function() {
						$('#login-panel input[name=email]').focus();
					}, 500);
				});
			};
		});
		
})();
