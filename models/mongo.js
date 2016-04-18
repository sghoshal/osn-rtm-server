var mongoose = require('mongoose');

var botSchema = new mongoose.Schema({
	token: String,
	userName: String,
    password: {type: String, default: "waggle"},
    botHost: String
});

botSchema.index({token: 1}, {unique: true});
botSchema.index({userName: 1, botHost: 1}, {unique: true});

module.exports.Bot = mongoose.model('Bot', botSchema);
