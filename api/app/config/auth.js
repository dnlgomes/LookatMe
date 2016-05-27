var expressJwt = require('express-jwt');
var jwt 	   = require('jsonwebtoken');

module.exports = {
	facebookAuth : {
		clientID		: '970373979715046',
		clientSecret 	: '8d0be4a92d294ea08591a6582d24cb75',
		callbackURL   : '/api/users/login/facebook'
	},
	secret: 'lookatmeisthebestappever',
	generateToken: function(user) {
		return jwt.sign({
			_id : user._id,
			login : user.login
		}, 'lookatmeisthebestappever', { expiresIn: 18000 });
	}
};
