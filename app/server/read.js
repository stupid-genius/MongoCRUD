const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Read on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`query: ${JSON.stringify(req.query)}`);
	let selector = req.query;
	if(req.params[2] !== undefined){
		selector = {
			_id: ObjectId(req.params[2])
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	req.user.db.db(req.params[0]).collection(req.params[1]).find(selector).toArray(function(err, result){
		if(err){
			logger.error(err);
			req.user.db.close();
			res.end();
			return;
		}
		req.user.db.close();
		logger.debug(`successfully found: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
