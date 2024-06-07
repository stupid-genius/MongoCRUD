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
	// req.user.db.db(req.params[0]).collection(req.params[1]).updateOne(req.body[0], {$set: req.body[1]}, req.body[2], function(err, result){
	req.user.db.db(db).collection(collection).replaceOne(selector, req.body, {upsert: true}, function(err, result){
		if(err){
			logger.error(err);
		}
		req.user.db.close();
		logger.debug(`successfully updated: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
