var crypto  = require('crypto');

module.exports.verify = function(password, dbPassword, dbSalt, callback) {
	var md5 = crypto.createHash('md5');
	if (arguments.length == 4) {
		md5.update(password + dbSalt);
		var encryptedPassword = md5.digest('hex');
		callback(null, encryptedPassword == dbPassword);
	} else {
		callback = dbPassword;
		var salt = crypto.randomBytes(16).toString('hex');
		md5.update(password + salt);
		var encryptedPassword = md5.digest('hex');
		callback(null, encryptedPassword, salt);
	}
};
