const express = require('express');
const Logger = require('log-ng');
const path = require('path');
const config = require('./config');
const { parseMongoQuery } = require('./routeHelpers');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.get('/', async (req, res) => {
	const data = [];
	const adminDb = req.user.db.db('admin');
	const dbs = await adminDb.admin().listDatabases();
	const promises = dbs.databases.map(async (db) => {
		// Get a list of collections for each database
		const currentDb = req.user.db.db(db.name);
		const collections = await currentDb.listCollections().toArray();
		data.push(`<div>${db.name} - Collections:</div>`);
		collections.forEach((collection) => {
			data.push(`<div>    - ${collection.name}</div>`);
		});
	});
	await Promise.all(promises);
	logger.debug(data);
	res.render('index', {
		data: data.join('<br />'),
		title: config.appDescription
	});
});
router.post('/login', (_req, res) => {
	res.status(204).end();
});
router.use('/logout', (req, res, next) => {
	req.logout((err) => {
		if(err){
			return next(err);
		}
		res.redirect('/');
	});
});
router.use('/ui', require('./ui'));
router.use('/users', require('./users'));

const dbCollDocPat = /\/(\w+)\/(\w+)(?:\/(\w{24}))?$/;
router.post(dbCollDocPat, parseMongoQuery, require('./create'));
router.get(dbCollDocPat, parseMongoQuery, require('./read'));
router.put(dbCollDocPat, parseMongoQuery, require('./update'));
router.delete(dbCollDocPat, parseMongoQuery, require('./delete'));

module.exports = router;

