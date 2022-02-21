const Logger = require('./logger');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Update on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`${JSON.stringify(req.body)}`);
	// http://docs.mongodb.org/manual/reference/method/db.collection.update/#examples
	req.db.db(req.params[0]).collection(req.params[1]).updateOne(req.body[0], {$set: req.body[1]}, req.body[2], function(err){
		if(err){
			logger.error(err);
		}
		req.db.close();
		res.send();	// return new docs
	});
};
