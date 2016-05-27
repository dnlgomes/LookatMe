var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var User	 = require('./user');

var ItemSchema = new Schema({
	name: { type: String, required: true, match: /^.{3,16}$/ },
	description: { type: String, match: /^.{0,300}$/, default: '' },
	photo: { type: String, default: '', select: false },
	user_id:  { type: Schema.ObjectId, ref: 'User', required: true },
	user_login: { type: String, required: true },
	visibility: { type: String, required: true, enum: ['public', 'private', 'friends'], default: 'public' },
	likes: [{ type: Schema.ObjectId, ref: 'User' }],
	comments: [{ type: Schema.ObjectId, ref: 'ItemComment' }]
});

ItemSchema.methods.isAvailable = function(user_id, callback) {
	var self = this;
	if (self.user_id.toHexString() == user_id || self.visibility == 'public') return callback(null, true);
	User.findById(self.user_id, function(err, user) {
		if (err) return callback(err);
		user.isFriend(user_id, function(err, isFriend) {
			return callback(err, isFriend);
		});
	});
};

module.exports = mongoose.model('Item', ItemSchema);
