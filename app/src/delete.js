const { ObjectId } = require('mongodb');
const path = require('path');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Delete on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`query: ${JSON.stringify(req.query)}`);
	let selector = req.query;
	if(req.params[2] !== undefined){
		selector = {
			_id: ObjectId(req.params[2])
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	req.db.db(req.params[0]).collection(req.params[1]).deleteOne(selector, function(err, result){
		if(err){
			logger.error(err);
			req.db.close();
			res.end();
			return;
		}
		req.db.close();
		logger.debug(`successfully deleted: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
