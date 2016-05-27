var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var CommentSchema = new Schema({
	user_id: { type: Schema.ObjectId, ref: 'User' },
	comment: { type: String, required: true, match: /^.{1,500}$/ }
});

module.exports = mongoose.model('ItemComment', CommentSchema);
