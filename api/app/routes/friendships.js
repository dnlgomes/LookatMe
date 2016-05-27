var express  	= require('express');
var router   	= express.Router();
var User		= require('../models/user');
var Friendship 	= require('../models/friendship');
var auth 		= require('../config/auth');
var passport 	= require('passport');
var expressJwt 	= require('express-jwt');
var jwt 		= require('jsonwebtoken');
var mongoose 	= require('mongoose');

router.use(expressJwt({ secret: auth.secret }));

router.param('friendship_id', function (req, res, next, question_id) {
	Friendship.findById(friendship_id, function(err, question) {
		if (!question) {
			return res.json({ ok: 0, message: 'Friendship not found.' });
		}
		req.question = question;
		return next();
	});
});

// Send a new friendship solicitation
router.post('/send', function(req, res) {
	var user_id = req.body.user_id;
	if (req.user._id == user_id) return res.json({ ok: 0, message: 'Cannot send solicitation to yourself.' });
	User.findById(user_id, '+friendship_solicitations', function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		if (!user.friendship_solicitations) {
			user.friendship_solicitations = [];
		}
		for (var i = 0; i < user.friendship_solicitations.length; i++) {
			if (user.friendship_solicitations[i].toHexString() == req.user._id) {
				return res.json({ ok: 0, message: 'Solicitation already sent.' });
			}
		}
		user.isFriend(req.user._id, function(err, isFriend) {
			if (isFriend) return res.json({ ok: 0, message: 'User already friend.' });
			user.friendship_solicitations.push(req.user._id);
			user.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				return res.json({ ok: 1 });
			});
		});
	});
});

// Dismiss a friendship solicitation
router.post('/dismiss', function(req, res) {
	var user_id = req.body.user_id;
	if (req.user._id == user_id) return res.json({ ok: 0, message: 'Cannot send solicitation to yourself.' });
	User.findById(user_id, '+friendship_solicitations', function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		var deleted = false;
		if (user.friendship_solicitations) {
			for (var i = 0; i < user.friendship_solicitations.length; i++) {
				if (user.friendship_solicitations[i].toHexString() == req.user._id) {
					user.friendship_solicitations.splice(i, 1);
					deleted = true;
					break;
				}
			}
		}
		if (!deleted) return res.json({ ok: 0, message: 'Solicitation not found.' });
		user.save(function(err) {
			if (err) return res.json({ ok: 0, message: err });
			return res.json({ ok: 1 });
		});
	});
});

// Accept a friendship solicitation
router.post('/accept', function(req, res) {
	var user_id = req.body.user_id;
	var user_login = req.body.user_login;
	User.findById(user_id, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		User.findById(req.user._id, '+friendship_solicitations', function(err, receiverUser) {
			if (err) return res.json({ ok: 0, message: err });
			else if (!receiverUser.friendship_solicitations) return res.json({ ok: 0, message: 'Solicitation not sent.' });
			var solicitationIndex = -1;
			for (var i = 0; i < receiverUser.friendship_solicitations.length; i++) {
				if (receiverUser.friendship_solicitations[i].toHexString() == user_id) {
					solicitationIndex = i;
					break;
				}
			}
			if (solicitationIndex == -1) return res.json({ ok: 0, message: 'Solicitation not sent.' });
			receiverUser.friendship_solicitations.splice(solicitationIndex, 1);
			receiverUser.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				var friend = Friendship({
					user1_id: req.user._id,
					user1_login: req.user.login,
					user2_id: user_id,
					user2_login: user_login
				});
				friend.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok: 1 });
				});
			});
		});
	});
});
	
// Reject a friendship solicitation
router.post('/reject', function(req, res) {
	var user_id = req.body.user_id;
	User.findById(user_id, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		User.findById(req.user._id, '+friendship_solicitations', function(err, receiverUser) {
			if (err) return res.json({ ok: 0, message: err });
			else if (!user.friendship_solicitations) return res.json({ ok: 0, message: 'Solicitation not sent.' });
			var solicitationIndex = -1;
			for (var i = 0; i < receiverUser.friendship_solicitations.length; i++) {
				if (receiverUser.friendship_solicitations[i].toHexString() == user_id) {
					solicitationIndex = i;
					break;
				}
			}
			if (solicitationIndex == -1) return res.json({ ok: 0, message: 'Solicitation not sent.' });
			receiverUser.friendship_solicitations.splice(solicitationIndex, 1);
			receiverUser.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				return res.json({ ok: 1 });
			});
		});
	});
});

// Unfried a person
router.post('/unfriend', function(req, res) {
	var user_id = req.body.user_id;
	User.findById(req.user._id, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		user.isFriend(user_id, function(err, isFriend) {
			if (err) return res.json({ ok: 0, message: err });
			else if (!isFriend) return res.json({ ok: 0, message: 'User not your friend.' });
			Friendship.remove({ $or: [{user1_id: req.user._id, user2_id: user_id}, {user1_id: user_id, user2_id: req.user._id}] }, function(err) {
				if (err) return res.json({ ok: 0, message: err });
				return res.json({ ok: 1 });
			});
		});
	});
});

module.exports = router;
