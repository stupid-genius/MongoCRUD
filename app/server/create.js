const Logger = require('./logger');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Create on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	req.user.db.db(req.params[0]).collection(req.params[1]).insertOne(req.body, function(err, result){
		if(err){
			logger.error(err);
		}
		req.user.db.close();
		logger.debug(`successfully created: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
