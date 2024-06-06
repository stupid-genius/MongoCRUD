const { ObjectId } = require('mongodb');
const Logger = require('log-ng');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Update on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	let selector = req.body.selector;
	if(req.params[2]!==undefined){
		selector = {
			_id: ObjectId(req.params[2])
		};
	}
	logger.debug(`selector: ${JSON.stringify(selector)}`);
	// http://docs.mongodb.org/manual/reference/method/db.collection.update/#examples
	// req.user.db.db(req.params[0]).collection(req.params[1]).updateOne(req.body[0], {$set: req.body[1]}, req.body[2], function(err, result){
	req.user.db.db(req.params[0]).collection(req.params[1]).replaceOne(selector, req.body.doc, {upsert: true}, function(err, result){
		if(err){
			logger.error(err);
		}
		req.user.db.close();
		logger.debug(`successfully updated: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
