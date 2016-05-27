var express = require('express');
var router  = express.Router();
var app     = express();
var User    = require('../models/user');
var Friendship = require('../models/friendship');
var Question = require('../models/question');
var Comment = require('../models/comment');
var upload  = require('../helpers/fileUploadHelper');
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt 	= require('jsonwebtoken');
var auth 	= require('../config/auth');
var fs 		= require('fs');

// Local register
router.post('/signup', function(req, res) {
	User.register(req.body, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		var token = auth.generateToken(user);
		return res.json({ ok: 1, token: token });
	});
});

// Local login
router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User or password doesn\'t match.' });
		var token = auth.generateToken(user);
		return res.json({ ok: 1, result: user, token: token });
	})(req, res, next);
});

// Sign in with Facebook
router.get('/login/facebook', passport.authenticate('facebook', { scope: 'email', failureRedirect: '/' }), function(req, res) {
	var data = {
		user: req.user,
		token: auth.generateToken(req.user)
	};
	return res.redirect('/main.html?' + (new Buffer(JSON.stringify(data)).toString('base64')));
});

// Logout
router.post('/logout', function(req, res) {
	//req.logout();
	res.json({ ok: 1});
});

// Update info about logged user 
router.post('/update', expressJwt({ secret: auth.secret }), function(req, res) {
	User.findById(req.user._id, '+friendship_solicitations')
		.populate([{ path: 'friendship_solicitations', select: '_id login name bio' }])
		.exec(function(err, user) {
			if (err) return res.json({ ok: 0, message: err });
			user.getFriends(function(err, friendsId) {
				if (err) return res.json({ ok: 0, message: err });
				User.find({ _id: { $in: friendsId } }, '_id login name bio', function(err, friends) {
					return res.json({ ok: 1, result: {user: user, friends: friends} });
				});
			});
	});
});

// Get profile 
router.get('/:login', expressJwt({ secret: auth.secret }), function(req, res) {
	var login = req.params.login;
	User.findOne({ login: login.toLowerCase() }, '+friendship_solicitations', function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		user.getFriendshipStatus(req.user._id, function(err, friendshipStatus) {
			if (err) return res.json({ ok: 0, message: err });
			user.friendship_solicitations = null;
			user.getFriends(function(err, friendsId) {
				if (err) return res.json({ ok: 0, message: err });
				User.find({ _id: { $in: friendsId } }, '_id login name bio', function(err, friends) {
					Question.find({user_id: user._id}).sort({_id: -1}).limit(5).exec(function(err, questions) {
						if (err) return res.json({ ok: 0, message: err });
						Comment.find({user_id: user._id}).sort({_id: -1}).limit(5).populate([{ path: 'question_id' }]).exec(function(err, answers) {
							if (err) return res.json({ ok: 0, message: err });
							Comment.find({user_id: user._id, is_favorite: true}).sort({_id: -1}).limit(5).populate([{ path: 'question_id' }]).exec(function(err, favoritedAnswers) {
								if (err) return res.json({ ok: 0, message: err });
								return res.json({ ok: 1, result: { user: user, friendship_status: friendshipStatus, 
									friends: friends, questions: questions, answers: answers, favoritedAnswers: favoritedAnswers } });
							});
						});
					});
				});
			});
		});
	});
});

// Get photo
router.get('/:login/photo', function(req, res) {
	var login = req.params.login;
	User.findOne({ login: login.toLowerCase() }, '+profile_photo', function(err, user) {
		if (!user || !user.profile_photo) return res.send('');
		if (user.profile_photo.substr(0, 4) == 'http') {
			return res.redirect(user.profile_photo);
		} else {
			return res.sendfile(user.profile_photo);
		}
	});
});

// Get all users
router.get('/', function(req, res) {
	User.find({}, function(err, users) {
		if (err) return res.json({ ok: 0, message: err });
		return res.json({ ok: 1, result: users });
	});
});

// Update info
router.put('/',  expressJwt({ secret: auth.secret }), function(req, res) {
	User.edit(req.user._id, req.body, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: { errors: { message: 'Password doesn\'t match.' } } });
		return res.json({ ok: 1, result: user });
	});
});

// Delete user
router.delete('/', expressJwt({ secret: auth.secret }), function(req, res) {
	res.json({ ok: 0, message: 'Not implemented yet.' });
});

// Upload a new photo
router.post('/photo', expressJwt({ secret: auth.secret }), function(req, res, err) {
	User.findById(req.user._id, '+profile_photo', function(err, user) {
		if (err) return res.json({ ok: 0, message: 'Error uploading file.' });
		var profilePhoto = user.profile_photo;
		fs.exists(profilePhoto, function(exists) {
			if (exists) {
				fs.unlink(profilePhoto);
			}
			upload(req, res, function(err) {
				if (err) return res.json({ ok: 0, message: 'Error uploading file.' });
				User.update({_id: req.user._id}, {
					profile_photo: req.file["path"]
				}, function(err, affected, resp) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok: 1 });
				});
			});
		});
	});
});

module.exports = router;
