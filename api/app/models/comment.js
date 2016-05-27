var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var CommentSchema = new Schema({
	user_id: { type: Schema.ObjectId, ref: 'User' },
	question_id: { type: Schema.ObjectId, ref: 'Question' },
	comment: { type: String, required: true, match: /^.{1,500}$/ },
	upvotes: [{ type: Schema.ObjectId, ref: 'User' }],
	downvotes: [{ type: Schema.ObjectId, ref: 'User' }],
	is_favorite: Boolean
});

CommentSchema.methods.hasVoted = function(id) {
	for (var i = 0; i < this.upvotes.length; i++) {
		if (this.upvotes[i] && id == this.upvotes[i].toHexString()) {
			return {index: i, type: 'upvotes'};
		}
	}
	for (var i = 0; i < this.downvotes.length; i++) {
		if (this.downvotes[i] && id == this.downvotes[i].toHexString()) {
			return {index: i, type: 'downvotes'};
		}
	}
	return {index: -1};
};

module.exports = mongoose.model('Comment', CommentSchema);
