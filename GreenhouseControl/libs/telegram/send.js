/**
 * http://usejsdoc.org/
 */
var	log = require('log4js').getLogger('libs.telegram'),
	telegram = require('telegram-bot-api'),
	util = require('util');

//var TOKEN = '167537300:AAFa8zPQHvjyUk84ke__owGsgPdbZP9iUlE';

var TOKEN = config.telegram.token;

var api = new telegram({
        token: TOKEN
});
 
exports.message = function(message){
	api.sendMessage({
		chat_id: 189659617,
		text: message
	})
	.then(function(data)
	{
		log.debug(util.inspect(data, false, null));
	})
	.catch(function(err)
	{
		log.debug(err);
	});
};