const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	const { db, collection, id } = req;
	logger.info(`Update on db: ${db}, collection: ${collection}, id: ${id}`);
	logger.info(`query: ${JSON.stringify(req.mongoQuery)}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	let selector = req.mongoQuery;
	if(id !== undefined){
		selector = {
			_id: ObjectId(id)
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	// http://docs.mongodb.org/manual/reference/method/db.collection.update/#examples
	// req.user.db.db(db).collection(collection).updateOne(selector, {$set: req.body[1]}, req.body[2], function(err, result){
	req.user.db.db(db).collection(collection).replaceOne(selector, req.body, {upsert: false}, function(err, result){
		if(err){
			logger.error(err);
			res.status(500).send({ error: 'Update failed', details: err });
			return;
		}
		req.user.db.close();
		logger.info(`successfully updated: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
