const Logger = require('log-ng');
const path = require('path');

const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	const { db, collection } = req;
	logger.info(`Create on db: ${db}, collection: ${collection}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	req.user.db.db(db).collection(collection).insertOne(req.body, function(err, result){
		if(err){
			logger.error(err);
		}
		req.user.db.close();
		logger.debug(`successfully created: ${JSON.stringify(result)}`);
		res.send(result);
	});
};
