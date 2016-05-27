var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var passwordHelper = require('../helpers/password');
var Friendship = require('./friendship');

var UserSchema = new Schema({
	facebook_id: { type: String, required: false },
	login: { type: String, required: true, index: { unique: true }, trim: true, match: /^[a-zA-Z0-9]{3,50}$/ },
	email: { type: String, required: true, match: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i },
	password: { type: String, required: true, select: false, match: /^.{6,255}$/ },
	salt: { type: String, required: true, select: false },
	profile_photo: { type: String, default: '', select: false },
	name: { type: String, default: '', trim: true, match: /^.{3,30}$/ },
	bio: { type: String, default: '' },
	reputation: { type: Number, default: 0 },
	wallet: {
		bronze_coins: { type: Number, min: 0, max: 9, default: 0 },
		silver_coins: { type: Number, min: 0, default: 5 },
		golden_coins: { type: Number, min: 0, default: 0 }
	},
	friendship_solicitations: { type: [{ type: Schema.ObjectId, ref: 'User' }], select: false }
});

UserSchema.methods.getFriendshipStatus = function(id, callback) {
	var self = this;
	if (self.friendship_solicitations) {
		for (var i = 0; i < self.friendship_solicitations.length; i++) {
			if (self.friendship_solicitations[i].toHexString() == id) {
				return callback(null, 1);
			}
		}
	} 
	Friendship.find({ $or: [{user1_id: self._id, user2_id: id}, {user1_id: id, user2_id: self.id}] }, function(err, friendship) {
		if (err || !friendship || friendship.length == 0) return callback(null, 0);
		return callback(null, 2);
	});
};

UserSchema.methods.getFriends = function(callback) {
	var self = this;
	Friendship.find({ $or: [{user1_id: self._id}, {user2_id: self.id}] }, function(err, friendships) {
		if (err) return callback(err);
		var friends = [];
		for (var i = 0; i < friendships.length; i++) {
			if (friendships[i].user1_id.toHexString() == self._id.toHexString()) {
				friends.push(friendships[i].user2_id);
			} else {
				friends.push(friendships[i].user1_id);
			}
		}
		callback(null, friends);
	});
};

UserSchema.methods.isFriend = function(id, callback) {
	var self = this;
	self.getFriends(function(err, friends) {
		if (err) return callback(err);
		var isFriend = false;
		for (var i = 0; i < friends.length; i++) {
			if (friends[i].toHexString() == id || friends[i] == id) {
				isFriend = true;
				break;
			}
		}
		return callback(null, isFriend);
	});
};

UserSchema.statics.authenticate = function(login, password, callback) {
	this.findOne({login: login.toLowerCase()}).select('+password +salt').exec(function(err, user) {
		if (err) return callback(err, null);
		if (!user) return callback(err, user);
		passwordHelper.verify(password, user.password, user.salt, function(err, result) {
			if (err || !result) return callback(err, null);
			user.password = undefined;
			user.salt = undefined;
			callback(err, user);
		});
	});
};

UserSchema.statics.register = function(user, callback) {
	var self = this;
	passwordHelper.verify(user.password, function(err, encryptedPassword, salt) {
		user.salt = salt;
		var dbUser = new self();
		dbUser.login = user.login;
		dbUser.email = user.email;
		dbUser.password = user.password; 
		dbUser.salt = user.salt;
		dbUser.save(function(err) {
			if (err) return callback(err);
			dbUser.password = encryptedPassword;
			dbUser.save(function(err) {
				if (err) return callback(err);
				return callback(null, dbUser);
			});
		});
	});
};

UserSchema.statics.edit = function(id, newUser, callback) {
	this.findOne({_id: id}).select('+password +salt').exec(function(err, user) {
		if (err) return callback(err, null);
		if (newUser.bio) {
			user.bio = newUser.bio;
		}
		if (newUser.name) {
			user.name = newUser.name;
		}
		if (newUser.email) {
			user.email = newUser.email;
		}
		if (newUser.newPassword) {
			passwordHelper.verify(newUser.password, user.password, user.salt, function(err, result) {
				if (err || !result) return callback(err, null);
				user.password = newUser.newPassword;
				user.save(function(err) {
					if (err) return callback(err);
					passwordHelper.verify(newUser.newPassword, function(err, encryptedPassword, salt) {
						if (err) return callback(err);
						user.password = encryptedPassword;
						user.salt = salt;
						user.save(function(err) {
							if (err) return callback(err);
							user.password = undefined;
							user.salt = undefined;
							callback(null, user);
						});
					});
				});
			});
		} else {
			user.save(function(err) {
				if (err) return callback(err);
				user.password = undefined;
				user.salt = undefined;
				return callback(null, user);
			});
		}
	});
};

module.exports = mongoose.model('User', UserSchema);
