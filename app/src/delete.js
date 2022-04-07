const { ObjectId } = require('mongodb');
const path = require('path');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Delete on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(JSON.stringify(req.params));
	let query = req.query;
	if(req.params[2] !== undefined){
		query = {
			_id: ObjectId(req.params[2])
		};
	}
	logger.debug(`query: ${JSON.stringify(query)}`);
	req.db.db(req.params[0]).collection(req.params[1]).deleteOne(query, function(err, docs){
		if(err){
			logger.log('error', err);
			req.db.close();
			res.end();
			return;
		}
		req.db.close();
		logger.debug(`successfully deleted: ${JSON.stringify(docs)}`);
		res.send(docs);
	});
};
