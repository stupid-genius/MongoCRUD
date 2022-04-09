const express = require('express');
const path = require('path');
const { ObjectId } = require('mongodb');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.post('/add', (req, res) => {
	res.render('create', {});
});
router.post('/create', (req, res) => {
	logger.info(`Create on db: ${req.body.database}, collection: ${req.body.collection}`);
	logger.debug(`body: ${JSON.stringify(req.body)}`);
	try{
		const newDoc = JSON.parse(req.body.doc);
		req.db.db(req.body.database).collection(req.body.collection).insertOne(newDoc, function(err, doc){
			if(err){
				logger.error(err);
			}
			req.db.close();
			logger.debug(`successfully created: ${JSON.stringify(doc)}`);
			res.redirect(`/ui/read?database=${req.body.database}&collection=${req.body.collection}`);
		});
	}catch(e){
		logger.error(e);
		res.status(500).send(e);
	}
});
router.post(/\/edit\/(\w{24})?$/, (req, res) => {
	logger.info(`Read ${req.params[0]} on db: ${req.body.database}, collection: ${req.body.collection}`);
	req.db.db(req.body.database).collection(req.body.collection).findOne({_id: ObjectId(req.params[0])}, function(err, docs){
		if(err){
			logger.error(err);
			req.db.close();
			res.status(500).end(err);
			return;
		}
		req.db.close();
		logger.debug(`successfully found: ${JSON.stringify(docs)}`);

		const context = {
			colspan: Object.keys(docs).length*2,
			id: docs._id,
		};
		delete docs._id;
		context.row = JSON.stringify(docs);
		res.render('edit', context);
	});
});
router.put(/\/update\/(\w{24})$/, (req, res) => {
	logger.info(`Update ${req.params[0]} on db: ${req.body.database}, collection: ${req.body.collection}`);
	logger.debug(`updated: ${req.body.row}`);
	const newRow = JSON.parse(req.body.row);
	req.db.db(req.body.database).collection(req.body.collection).replaceOne({_id: ObjectId(req.params[0])}, newRow, function(err, docs){
		if(err){
			logger.error(err);
		}
		req.db.close();
		logger.debug(JSON.stringify(docs));
		res.render('dataRow', {
			row: {
				_id: req.params[0],
				...newRow
			}
		});
	});
});
router.get('/read', (req, res) => {
	logger.info(JSON.stringify(req.body));
	req.db.db(req.query.database).collection(req.query.collection).find({}).toArray(function(err, docs){
		if(err){
			logger.error(err);
			req.db.close();
			res.status(500).end(err);
			return;
		}
		req.db.close();
		logger.debug(`successfully found: ${JSON.stringify(docs)}`);
		res.render('dataTable', {
			rows: docs
		});
	});
});
router.delete(/\/delete\/(\w{24})?$/, (req, res) => {
	logger.info(`Delete ${req.params[0]} on db: ${req.body.database}, collection: ${req.body.collection}`);
	req.db.db(req.body.database).collection(req.body.collection).deleteOne({_id: ObjectId(req.params[0])}, function(err, docs){
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
});

module.exports = router;

