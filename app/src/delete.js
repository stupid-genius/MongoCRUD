const Logger = require('./logger');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Delete on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`${JSON.stringify(req.body)}`);
	req.db.db(req.params[0]).collection(req.params[1]).deleteOne(req.body, function(err){
		if(err){
			logger.log('error', err);
			req.db.close();
			res.end();
			return;
		}
		req.db.close();
		res.send();
	});
};
