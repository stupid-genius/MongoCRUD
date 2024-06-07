const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	const { db, collection, id } = req;
	logger.info(`Delete on db: ${db}, collection: ${collection}`);
	logger.debug(`query: ${JSON.stringify(req.mongoQuery)}`);
	let selector = req.mongoQuery;
	if(id !== undefined){
		selector = {
			_id: ObjectId(id)
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	req.user.db.db(db).collection(collection).deleteOne(selector, function(err, result){
		if(err){
			logger.error(err);
			req.user.db.close();
			res.end();
			return;
		}
		req.user.db.close();
		logger.debug(`successfully deleted: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
