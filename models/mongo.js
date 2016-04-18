var mongoose = require('mongoose');

var botSchema = new mongoose.Schema({
	token: String,
	userName: String,
    password: {type: String, default: "waggle"},
    botServerUrl: String
});

botSchema.index({token: 1}, {unique: true});
botSchema.index({userName: 1, botServerUrl: 1}, {unique: true});

module.exports.Bots = mongoose.model('Bot', botSchema);
