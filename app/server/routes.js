const express = require('express');
const Logger = require('log-ng');
const path = require('path');
const config = require('./config');
const {
	filterAdmin,
	parseDBCollDoc,
	parseMongoQuery
} = require('./routeHelpers');

const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.get('/', async (req, res) => {
	const data = [];
	const adminDb = req.user.db.db('admin');
	const dbs = await adminDb.admin().listDatabases();
	const promises = dbs.databases.map(async (db) => {
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

router.use('/ui', filterAdmin, require('./ui'));
router.use('/users', require('./users'));

const docRouter = express.Router({ mergeParams: true});
docRouter.route('/')
	.post(require('./create'))
	.get(require('./read'))
	.put(require('./update'))
	.delete(require('./delete'));
// https://regex101.com/r/KorNfo/2
const dbCollDocPat = /\/(\w+)\/(\w+)(?:\/(\w{24}))?$/;
router.use(dbCollDocPat, parseDBCollDoc, parseMongoQuery, docRouter);

module.exports = router;

