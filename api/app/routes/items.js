var express = require('express');
var router  = express.Router();
var Item    = require('../models/item');
var User	= require('../models/user');
var upload  = require('../helpers/fileUploadHelper');
var auth 	= require('../config/auth');
var passport = require('passport');
var expressJwt = require('express-jwt');
var jwt 	= require('jsonwebtoken');

router.param('item_id', function (req, res, next, item_id) {
	Item.findOne({_id: item_id}, '+photo', function(err, item) {
		if (!item) {
			return res.json({ ok: 0, message: 'Item not found.' });
		}
		req.item = item;
		return next();
	});
});

// Create new wardrobe item
router.post('/', expressJwt({ secret: auth.secret }), function(req, res) {
	var item = new Item({
		user_id: req.user._id,
		user_login: req.user.login,
		name: req.body.name,
		description: req.body.description,
		visibility: req.body.visibility
	});
	item.save(function(err) { 
		if (err) return res.json({ ok: 0, message: err });
		return res.json({ ok: 1, result: item._id });
	});
});

router.get('/get/:login', expressJwt({ secret: auth.secret }), function(req, res) {
	var login = req.params.login;
	User.findOne({ login: login.toLowerCase() }, function(err, user) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!user) return res.json({ ok: 0, message: 'User not found.' });
		Item.find({ user_id: user._id }, '-photo', function(err, docs) {
			if (err) return res.json({ ok: 0, message: err });
			for (var i = 0; i < docs.length; i++) {
				docs[i].photo = undefined;
			}
			return res.json({ ok: 1, result: docs });
		});
	});
});

// Get wardrobe item
router.get('/:item', expressJwt({ secret: auth.secret }), function(req, res) {
	Item.findById(req.params.item)
		.populate({ path: 'comments' })
		.exec(function(err, item) {
			if (err) {
				return res.json({ ok: 0, message: err });
			} else if (!item) {
				return res.json({ ok: 0, message: 'Item not found.' });
			}
			item.isAvailable(req.user._id, function(err, isAvailable) {
				if (err) return res.json({ ok: 0, message: err });
				else if (!isAvailable) return res.json({ ok: 0, message: 'Item is private.' });
				Item.populate(item.comments, { path: 'user_id', select: '_id login name' }, function(err, comments) {
					if (err) return res.json({ ok: 0, message: err });
					item.comments = comments;
					return res.json({ ok: 1, result: item });
				});
			});
		});
})

// Update info
router.put('/:item_id', expressJwt({ secret: auth.secret }), function(req, res) {
	var item_id = req.params.item_id;
	res.json({ ok: 0, message: 'Not implemented yet.' });
})

// Delete wardrobe item
router.delete('/:item_id', expressJwt({ secret: auth.secret }), function(req, res) {
	var item_id = req.params.item_id;
	res.json({ ok: 0, message: 'Not implemented yet.' });
});

router.post('/:item_id/photo', expressJwt({ secret: auth.secret }), function(req, res) {
	if (req.item.user_id != req.user._id) {
		return res.json({ ok: 0, message: 'Unauthorized.' });
	}
	upload(req, res, function(err) {
		if (err) return res.json({ ok: 0, message: 'Error uploading file.' });
		Item.update({_id: req.item._id}, {
			photo: req.file["path"]
		}, function(err, affected, resp) {
			if (err) return res.json({ ok: 0, message: err });
			return res.json({ ok: 1 });
		});
	});
});

router.get('/:item_id/photo', function(req, res) {
	var id = req.params.item_id;
	if (req.item && req.item['photo']) return res.sendfile(req.item['photo']);
	return res.send('');
});

router.post('/:item_id/like', expressJwt({ secret: auth.secret }), function(req, res) {
	req.item.isAvailable(req.user._id, function(err, isAvailable) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!isAvailable) return res.json({ ok: 0, message: 'Item is private' });
		if (!req.item.likes) req.item.likes = [];
		for (var i = 0; i < req.item.likes.length; i++) {
			if (req.item.likes[i].toHexString() == req.user._id) {
				return res.json({ ok: 0, message: 'Cannot like a item twice.' });
			}
		}
		req.item.likes.push(req.user._id);
		req.item.save(function(err) {
			if (err) return res.json({ ok: 0, message: err });
			return res.json({ ok: 1 });
		});
	});
});

router.post('/:item_id/unlike', expressJwt({ secret: auth.secret }), function(req, res) {
	req.item.isAvailable(req.user._id, function(err, isAvailable) {
		if (err) return res.json({ ok: 0, message: err });
		else if (!isAvailable) return res.json({ ok: 0, message: 'Item is private.' });
		var hasLiked = -1;
		if (!req.item.likes) req.item.likes = [];
		for (var i = 0; i < req.item.likes.length; i++) {
			if (req.item.likes[i].toHexString() == req.user._id) {
				hasLiked = i;
				break;
			}
		}
		if (hasLiked == -1) return res.json({ ok: 0, message: 'Cannot unlike an unliked item.' });
		req.item.likes.splice(hasLiked, 1);
		req.item.save(function(err) {
			if (err) return res.json({ ok: 0, message: err });
			return res.json({ ok: 1 });
		});
	});
});

module.exports = router;
