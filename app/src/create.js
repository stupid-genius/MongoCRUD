const Logger = require('./logger');
const path = require('path');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

module.exports = function(req, res){
	logger.info(`Create on db: ${req.params[0]}, collection: ${req.params[1]}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	// req.db.db(req.params[0]).collection(req.params[1]).update(req.body, req.body, {upsert:true}, function(err){
	req.db.db(req.params[0]).collection(req.params[1]).insertOne(req.body, function(err, doc){
		if(err){
			logger.error(err);
		}
		req.db.close();
		logger.debug(`successfully created: ${JSON.stringify(doc)}`);
		res.send(doc);
	});
};
