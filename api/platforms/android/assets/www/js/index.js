$(function() {
    // Update User button click
	$('#edit-btn').on('click', updateUser);
	// Go to sign up page 
	$('#create').click(function(e) {
		e.preventDefault();
		$('#login-panel').fadeOut(function() {
			$('#login-panel form')[0].reset();
			$('#login-panel .alert').hide();
			$('#register-panel').fadeIn();
			setTimeout(function() {
				$('#register-panel input[name=name]').focus();
			}, 500);
		});
	});
	// Go back to log in page 
	$('#back').click(function(e) {
		e.preventDefault();
		$('#register-panel').fadeOut(function() {
			$('#register-panel form')[0].reset();
			$('#register-panel .alert').hide();
			$('#login-panel').fadeIn();
			setTimeout(function() {
				$('#login-panel input[name=email]').focus();
			}, 500);
		});
	});
	function showLoginSuccess(msg) {
		window.location.href = '/main.html';
	}
	function showLoginError(msg) {
		$('#login-panel .alert').html(msg);
		$('#login-panel .alert').show();
		$('#login').button('reset');
	}
	function showSignupSuccess(msg)	{
		//alert('OK');
		$('#register').button('reset');
		window.location.href = '/main.html';
	}
	function showSignupError(msg) {
		$('#register-panel .alert').html(msg);
		$('#register-panel .alert').show();
		$('#register').button('reset');
	}
	// User submit login form 
	$('#login-panel form').submit(function(e) {
		e.preventDefault();
		$('#login').button('loading');
		var user = {
			'login': $('#login-form input[name=login]').val(),
			'password': $('#login-form input[name=password]').val()
		}
		$.ajax({
			type: 'POST',
			data: user,
			url: '/api/users/login',
			dataType: 'JSON'
		}).done(function(response) {
			// Check for successful
			if(response.ok === 1) {
				if (typeof(Storage) !== "undefined") {
					localStorage.setItem("loggedUser", JSON.stringify(response.result));
				}
				showLoginSuccess(response);
			} else {
				showLoginError('Usuário ou senha não coincidem.');
			}
		});
	});
	// User submit signup form 
	$('#register-panel form').submit(function(e) {
		e.preventDefault();
		$('#register').button('loading');
		if ($('#register-form input[name=repeat-password]').val() === $('#register-form input[name=password]').val()){
		    $('#register').button('loading'); 
		    var newUser = {
				'login': $('#register-form input[name=login]').val(),
				'email': $('#register-form input[name=email]').val(),
				'password': $('#register-form input[name=password]').val()
		    }
		    $.ajax({
				type: 'POST',
				data: newUser,
				url: '/api/users/signup',
				dataType: 'JSON'
			}).done(function(response) {
				// Check for successful
				if(response.ok === 1) {
					showSignupSuccess(response);
				} else {
					if (response.message.code == 11000 || response.message.errors.login) {
						showSignupError('Login já existente.');
					} else if (response.message.errors.email) {
						showSignupError('E-mail inválido.');
					} else if (response.message.errors.password) {
						showSignupError('Senha deve conter letras e digitos.');
					} else {
						showSignupError('Um erro ocorreu. Tente novamente.');
					}
				}
			});
		} else {
			showSignupError('Senhas não coincidem.');
		}

	});
    
        function updateUser(event){
          event.preventDefault();

          // Pop up a confirmation dialog
          var confirmation = confirm('Are you sure you want to update this user?');

          // Check and make sure the user confirmed
          if (confirmation === true) {
            // If they did, do our update

            //set the _id of the user to be update
            var _id = JSON.parse(localStorage.loggedUser).login;
              console.log(_id);
            var newUser = {
				'bio': $('#edit-form input[name=new-bio]').val(),
				'email': $('#edit-form input[name=new-email]').val(),
                'password' : $('#edit-form input[name=password]').val(),
				'new-password': $('#edit-form input[name=new-password]').val()
		    }

            // do the AJAX
            $.ajax({
              type: 'PUT',
              url: '/api/users/' + _id,
              data: newUser,
              dataType: 'JSON'
            }).done(function( response ) {
              if(response.ok === 0) {
					alert("Erro: " + response.message);//atualizar depois
				} else {
				    alert("Perfil editado com sucesso.");//atualizar depois
				}
            });
          }
          else {

            // If they said no to the confirm, do nothing
            return false;
          }
    };

});
