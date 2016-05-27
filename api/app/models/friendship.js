var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var FriendshipSchema = new Schema({
	user1_id:  { type: Schema.ObjectId, ref: 'User', required: true },
	user1_login: { type: String, required: true },
	user2_id:  { type: Schema.ObjectId, ref: 'User', required: true },
	user2_login: { type: String, required: true }
});

module.exports = mongoose.model('Friendship', FriendshipSchema);
