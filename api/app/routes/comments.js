var express  = require('express');
var router   = express.Router();
var Comment  = require('../models/comment');
var Question = require('../models/question');
var User 	 = require('../models/user');
var auth 		= require('../config/auth');
var passport 	= require('passport');
var expressJwt 	= require('express-jwt');
var jwt 		= require('jsonwebtoken');
var mongoose 	= require('mongoose');

router.use(expressJwt({ secret: auth.secret }));

router.param('comment_id', function (req, res, next, comment_id) {
	Comment.findById(comment_id, function(err, comment) {
		if (!comment) {
			return res.json({ ok: 0, message: 'Comment not found.' });
		}
		req.comment = comment;
		return next();
	});
});

router.route('/')
	// Create new comment
	.post(function(req, res) {
		Question.findById(req.body.question_id)
				.populate({ path: 'comments' })
				.exec(function(err, question) {
			if (err) {
				return res.json({ ok: 0, message: err });
			} else if (!question) {
				return res.json({ ok: 0, message: 'Question not found.' });
			} else if (question.user_id == req.user._id) {
				return res.json({ ok: 0, message: 'Question owner cannot comment.' });
			} else {
				hasCommented = false;
				for (var i = 0; i < question.comments.length; i++) {
					if (question.comments[i] && question.comments[i].user_id.toHexString() == req.user._id) {
						hasCommented = true;
						break;
					}
				}
				if (hasCommented) {
					return res.json({ ok: 0, message: 'User already commented.' });
				} else {
					var comment = new Comment({
						user_id: req.user._id,
						question_id: req.body.question_id,
						comment: req.body.comment
					});
					comment.save(function(err) {
						if (err) return res.json({ ok: 0, message: err });
						question.comments.push(comment._id);
						question.save(function(err) {
							if (err) return res.json({ ok: 0, message: err });
							User.findById(req.user._id, function(err, user) {
								if (err) return res.json({ ok: 0, message: err });
								user.wallet.bronze_coins += 1;
								if (user.wallet.bronze_coins > 10) { 
									user.wallet.bronze_coins = 0;
									user.wallet.silver_coins += 1;
								}
								user.save(function(err) {
									if (err) return res.json({ ok: 0, message: err });
									return res.json({ ok: 1, result: user });
								});
							});
						});
					});
				}
			}
		});
	});
	
router.route('/:comment_id')
	// Get comment
	.get(function(req, res) {
		res.json({ ok : 1, result: req.comment });
	})
	// Update comment
	.put(function(req, res) {
		var comment_id = req.params.comment_id;
		res.json({ ok : 0, message : 'Not implemented yet.' });
	})
	// Delete comment
	.delete(function(req, res) {
		var comment_id = req.params.comment_id;
		res.json({ ok : 0, message : 'Not implemented yet.' });
	})

//favorite
router.post('/:comment_id/favorite', function(req, res) {
	var comment = req.comment;
	comment.is_favorite = true;
	var REPUTATION_INC = 5;
	var SILVER_COINS_INC = 1;
	comment.save(function(err) {
		if (err) return res.json({ ok: 0, message: err });
		User.findById(comment.user_id, function(err, user) {
			if (err) return res.json({ ok: 0, message: err });
			user.reputation += REPUTATION_INC;
			user.wallet.silver_coins += SILVER_COINS_INC;
			user.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				return res.json({ ok: 1, result: {is_favorite: comment.is_favorite, reputation: user.reputation} });
			});
		});
	});	
});



// Upvote a comment
router.post('/:comment_id/upvote', function(req, res) {
	var comment = req.comment;
	if (comment.user_id == req.user._id) {
		return res.json({ ok: 0, message: 'User cannot upvote its own comment.' });
	}
	hasVoted = comment.hasVoted(req.user._id);
	if (hasVoted.index == -1) {
		comment.upvotes.push(req.user._id);
		comment.save(function(err) {
			if (err) return res.json({ ok: 0, message: err });
			User.findById(comment.user_id, function(err, user) {
				if (err) return res.json({ ok: 0, message: err });
				user.reputation += 1;
				user.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok: 1, result: {upvotes: comment.upvotes, downvotes: comment.downvotes, reputation: user.reputation} });
				});
			});
		});
	} else {
		if (hasVoted.type != 'upvotes') {
			comment.downvotes.splice(hasVoted.index, 1);
			comment.upvotes.push(req.user._id);
			comment.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				User.findById(comment.user_id, function(err, user) {
					if (err) return res.json({ ok: 0, message: err });
					user.reputation += 2;
					user.save(function(err) {
						if (err) return res.json({ ok: 0, message: err });
						return res.json({ ok: 1, result: {upvotes: comment.upvotes, downvotes: comment.downvotes, reputation: user.reputation} });
					});
				});
			});
		} else {
			return res.json({ ok: 0 });
		}
	}
});

// Downvote a comment
router.post('/:comment_id/downvote', function(req, res) {
	var comment = req.comment;
	if (comment.user_id == req.user._id) {
		return res.json({ ok: 0, message: 'User cannot downvote its own comment.' });
	}
	hasVoted = comment.hasVoted(req.user._id);
	if (hasVoted.index == -1) {
		comment.downvotes.push(req.user._id);
		comment.save(function(err) {
			if (err) return res.json({ ok: 0, message: err });
			User.findById(comment.user_id, function(err, user) {
				if (err) return res.json({ ok: 0, message: err });
				user.reputation -= 1;
				user.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok: 1, result: {upvotes: comment.upvotes, downvotes: comment.downvotes, reputation: user.reputation} });
				});
			});
		});
	} else {
		if (hasVoted.type != 'downvotes') {
			comment.upvotes.splice(hasVoted.index, 1);
			comment.downvotes.push(req.user._id);
			comment.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				User.findById(comment.user_id, function(err, user) {
					if (err) return res.json({ ok: 0, message: err });
					user.reputation -= 2;
					user.save(function(err) {
						if (err) return res.json({ ok: 0, message: err });
						return res.json({ ok: 1, result: {upvotes: comment.upvotes, downvotes: comment.downvotes, reputation: user.reputation} });
					});
				});
			});
		} else {
			return res.json({ ok: 0 });
		}
	}
});

module.exports = router;
