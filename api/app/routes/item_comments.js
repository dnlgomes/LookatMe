var express  = require('express');
var router   = express.Router();
var Item		= require('../models/item');
var ItemComment  = require('../models/item_comment');
var User 	 	= require('../models/user');
var auth 		= require('../config/auth');
var passport 	= require('passport');
var expressJwt 	= require('express-jwt');
var jwt 		= require('jsonwebtoken');
var mongoose 	= require('mongoose');

router.use(expressJwt({ secret: auth.secret }));

router.param('comment_id', function (req, res, next, comment_id) {
	ItemComment.findById(comment_id, function(err, comment) {
		if (!comment) {
			return res.json({ ok: 0, message: 'Comment not found.' });
		}
		req.comment = comment;
		return next();
	});
});

// Create new comment
router.post('/', function(req, res) {
	Item.findById(req.body.item_id, function(err, item) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!item) return res.json({ ok: 0, message: 'Item not found.' });
		item.isAvailable(req.user._id, function(err, isAvailable) {
			if (err) return res.json({ ok: 0, message: err });
			else if (!isAvailable) return res.json({ ok: 0, message: 'Item is private.' });
			var comment = new ItemComment({
				user_id: req.user._id,
				comment: req.body.comment
			});
			comment.save(function(err) {
				if (err) return res.json({ ok: 0, message: err });
				item.comments.push(comment._id);
				item.save(function(err) {
					if (err) return res.json({ ok: 0, message: err });
					return res.json({ ok: 1, result: comment._id });
				});
			});
		});
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

module.exports = router;
