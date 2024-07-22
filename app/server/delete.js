const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

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
		req.user.db.close();
		if(err){
			logger.error(err);
			res.status(500).send({ error: 'Delete failed', details: err });
		}else{
			logger.debug(`successfully deleted: ${JSON.stringify(result)}`);
			res.send(result);
		}
	});
};
