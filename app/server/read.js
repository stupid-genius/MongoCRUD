const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	const { db, collection, id } = req;
	logger.info(`Read on db: ${db}, collection: ${collection}, id: ${id}`);
	logger.info(`query: ${JSON.stringify(req.mongoQuery)}`);
	let selector = req.mongoQuery;
	if(id !== undefined){
		selector = {
			_id: ObjectId(id)
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	req.user.db.db(db).collection(collection).find(selector).toArray(function(err, result){
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
