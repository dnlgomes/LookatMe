var express  	= require('express');
var router   	= express.Router();
var User		= require('../models/user');
var Question 	= require('../models/question');
var Friendship 	= require('../models/friendship');
var auth 		= require('../config/auth');
var passport 	= require('passport');
var expressJwt 	= require('express-jwt');
var jwt 		= require('jsonwebtoken');
var mongoose 	= require('mongoose');

router.use(expressJwt({ secret: auth.secret }));

router.param('question_id', function (req, res, next, question_id) {
	Question.findById(question_id, function(err, question) {
		if (!question) {
			return res.json({ ok: 0, message: 'Question not found.' });
		}
		req.question = question;
		return next();
	});
});

router.route('/')
	// Create new question
	.post(function(req, res) {
		//TODO find a better way to do this
		function normalizeItems2Mongo(items){
			wardrobeItems = [];
			for (i in items){
				wardrobeItems.push({item: items[i], likes: []})
			}
			return wardrobeItems;
		}

		User.findById(req.user._id, function(err, user) {
			if (err) return res.json({ ok: 0, message: err });
			if (user.wallet.silver_coins == 0) {
				return res.json({ ok: 0, message: { errors: { coins: 'You don\'t have enough silver coins.' } } });
			} else {
				var question = new Question({
					user_id: req.user._id,
					user_login: req.user.login,
					title: req.body.title,
					description: req.body.description,
					type: req.body.type,
					wardrobe_items: normalizeItems2Mongo(req.body.items),
					target: (req.body.target ? req.body.target : null),
					channels: [req.body.channels]
				});
				question.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					user.wallet.silver_coins -= 1;
					user.save(function(err) {
						if (err) return res.json({ ok: 0, message: err });
						return res.json({ ok: 1, result: user });
					});
				});
			}
		});
	});
	
router.route('/:question_id')
	// Get question
	.get(function(req, res) {
		var question_id = req.params.question_id;
		Question.findById(question_id)
			.populate([{ path: 'wardrobe_items.item', select: '_id name description' }, { path: 'user_id', select: '_id login name' }, { path: 'comments' }])
			.exec(function(err, question) {
				if (err) {
					return res.json({ ok: 0, message: err });
				} else if (!question) {
					return res.json({ ok: 0, message: 'Question not found.' });
				} else {
					Question.populate(question.comments, { path: 'user_id', select: '_id login name reputation' }, function(err, comments) {
						if (err) return res.json({ ok: 0, message: err });
						question.comments = comments;
						return res.json({ ok: 1, result: question });
					});
				}
		});
	})
	// Update question
	.put(function(req, res) {
		Question.edit(req.question._id, req.body, function(err, question) {
			if (err) return res.json({ ok : 0, message : err });
			return res.json({ ok : 1, result : question });
		});
	});
	// // Delete question
	// .delete(function(req, res) {
	// 	var question_id = req.params.question_id;
	// 	res.json({ ok : 0, message : 'Not implemented yet.' });
	// });

router.route('/:question_id/promote')
	// Promote question
	.put(function(req, res) {
		User.findById(req.user._id, function(err, user) {
			if (err) return res.json({ ok: 0, message: err });
			if (user.wallet.silver_coins == 0) {
				return res.json({ok: 0, message: {errors: {coins: 'You don\'t have enough silver coins.'}}});
			}
			Question.update({_id: req.question._id}, {
				promoted_at: Date.now()
			}, function(err, affected, resp) {
				if (err) return res.json({ ok : 0, message : err });
				user.wallet.silver_coins -= 1;
				user.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok : 1 });
				});
			});
		});
	});

// Get questions by channel
router.route('/channel/private')
	.get(expressJwt({ secret: auth.secret }), function(req, res) {
		Question.find({ $or: [ { target: req.user.login }, { user_id: req.user._id, target: { $ne: null } } ] }, null, { sort: {promoted_at: -1, '_id': -1 }})
			.populate([{ path: 'wardrobe_items.item', select: '_id name description' }, { path: 'user_id', select: '_id login name' }])
			.exec(function(err, questions) {
				if (err) return res.json({ ok : 0, message : err });
				return res.json({ ok : 1, result : questions });
			});
	});

router.get('/channel/friends', function(req, res) {
	Friendship.find({$or: [{user1_id: req.user._id}, {user2_id: req.user._id}]}, function (err, friendships) {
		if (err) return res.json({ok: 0, message: err});
		var friends = [];
		for (var i = 0; i < friendships.length; i++) {
			friends.push(friendships[i].user1_login);
			friends.push(friendships[i].user2_login);
		}
		friends.push(req.user.login);
		Question.find({ channels: { $in: ['friends'] } }, null, { sort: {promoted_at: -1, '_id': -1 }})
			.where('user_login').in(friends)
			.populate([{ path: 'wardrobe_items.item', select: '_id name description' }, { path: 'user_id', select: '_id login name' }])
			.exec(function (err, questions) {
				if (err) return res.json({ ok: 0, message: err });
				return res.json({ok: 1, result: questions });
			});
	});
});

router.route('/channel/:channel')
	.get(expressJwt({ secret: auth.secret }), function(req, res) {
		var channel = req.params.channel;
		var query = { target: null, channels: { $nin: ['friends'] } };
		if (channel != 'general') query.channels = channel;
		Question.find(query, null, { sort: {promoted_at: -1, '_id': -1 }})
			.populate([{ path: 'wardrobe_items.item', select: '_id name description' }, { path: 'user_id', select: '_id login name' }])
			.exec(function(err, questions) {
				if (err) return res.json({ ok : 0, message : err });
				return res.json({ ok : 1, result : questions });
			});
	});
//  TODO find a better way to avoid double voting, this is really a mess
router.route('/:question_id/vote')
	.put(expressJwt({ secret: auth.secret }), function(req, res) {
		User.findById(req.user._id, function(err, user) {
			if (err) return res.json({ ok: 0, message: err });
			Question.findOne({_id: req.question._id})
					.populate([{ path: 'wardrobe_items.item', select: '_id'}, { path: 'wardrobe_items.likes', select: '_id' }])
					.exec(function(err, question) {
						if (err) return res.json({ ok : 0, message : err });
						for(i = 0; i < question.wardrobe_items.length; i++) {
							for(j = 0; j < question.wardrobe_items[i].likes.length; j++) {
								if(question.wardrobe_items[i].likes[j]._id.toString() == user._id.toString()) {
									Question.update({_id: req.question._id, 'wardrobe_items._id': question.wardrobe_items[i]._id}, {
										$pull: {
											'wardrobe_items.$.likes': user._id
										}
									}, function(err, affected, resp) {
										if (err) return res.json({ ok : 0, message : err });
									});
								}
							}
						}
					});
			Question.update({_id: req.question._id, 'wardrobe_items._id': req.body._id}, {
				$addToSet: {
					'wardrobe_items.$.likes': user._id
				}
			}, function(err, affected, resp) {
				if (err) return res.json({ ok : 0, message : err });
				return res.json({ ok : 1, result: resp });
			});
		});
	})
		.get(expressJwt({ secret: auth.secret }), function(req, res) {
			User.findById(req.user._id, function(err, user) {
				if (err) return res.json({ ok: 0, message: err });
				Question.findOne({_id: req.question._id})
						.populate([{ path: 'wardrobe_items.item', select: '_id'}, { path: 'wardrobe_items.likes', select: '_id' }])
						.exec(function(err, question) {
							if (err) return res.json({ ok : 0, message : err });
							for(i = 0; i < question.wardrobe_items.length; i++) {
								for(j = 0; j < question.wardrobe_items[i].likes.length; j++) {
									if(question.wardrobe_items[i].likes[j]._id.toString() == user._id.toString()) {
										return res.json({ ok : 1, result :  question.wardrobe_items[i].item });
									}
								}
							}

							return res.json({ ok : 1, result : {} });
						});
			});
		});




module.exports = router;
