const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const config = require('./config');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));
const router = express.Router();

function parseAuthHeader(authorization = ''){
	const token = authorization.split(/\s+/).pop()||'',
		auth = Buffer.from(token, 'base64').toString(),
		parts = auth.split(/:/);
	return {
		username: parts[0],
		password: parts[1]
	};
}

// this is the only way to open a connection to the db
async function authCheck(req, res, next) {
	const { username, password } = parseAuthHeader(req.headers['authorization']);
	logger.info(`Authenticating access to ${req.originalUrl}`);

	// if(config.nodeEnv === 'development'){
	// 	logger.info('DEVELOPMENT MODE: skipping authentication');
	// 	next();
	// }else{
	let mc;
	try{
		const connString = `mongodb://${username}:${password}@${config.dbHost}/?authMechanism=DEFAULT`;
		logger.info(`authenticating against ${connString}`);

		mc = new MongoClient(connString);
		await mc.connect();
		await mc.db('admin').command({ ping: 1 });
		logger.info(`authenticated user ${username}`);
		req.db = mc;
		next();
	}catch(err){
		logger.warn(err);
		res.status(401);
		if(username === undefined || password === undefined){
			res.setHeader('WWW-Authenticate', 'Basic');
		}
		res.send('authentication failed');
		if(mc){
			await mc.close();
		}
	}
	// }
}

router.use(authCheck);
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.get('/', (_req, res) => {
	res.render('index', {
		data: 'loading',
		title: config.appDescription
	});
});
router.use('/ui', require('./ui'));
// router.use('/users', require('./users'));

const dbCollDocPat = /\/(\w+)\/(\w+)(?:\/(\w{24}))?$/;
router.post(dbCollDocPat, require('./create'));
router.get(dbCollDocPat, require('./read'));
router.put(dbCollDocPat, require('./update'));
router.delete(dbCollDocPat, require('./delete'));

module.exports = router;

