var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var CommentSchema = require('./comment.js');

var QuestionSchema = new Schema({
	user_id:  { type: Schema.ObjectId, ref: 'User', required: true },
	user_login: { type: String, required: true },
	target:  { type: String },
	mentions_ids:  [{ type: Schema.ObjectId, ref: 'User', required: false }],
	title: { type: String, required: true, match: /^.{5,20}$/ },
	type: { type: String, required: true, enum: ['open', 'pool'] },
	description: { type: String, match: /^.{0,500}$/, default: '' },
	wardrobe_items: { type: [{
			item: {type: Schema.ObjectId, ref: 'Item' },
			likes: [{type: Schema.ObjectId, ref: 'User'}]
		}],
		validate: [function(val) { return val.length >= 1 && val.length <= 5 }, 'Number of wardrobe items must be between 1 and 5']
	},
	channels: { type: [String], required: true },
	importance: {type:Number, default:0},
	comments: [{ type: Schema.ObjectId, ref: 'Comment' }],
	promoted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
