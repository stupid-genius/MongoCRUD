const express = require('express');
const Logger = require('log-ng');
const path = require('path');
const {
	arraysEqual,
	// objectsEqual,
	getUsers
} = require('./routeHelpers');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.get('/', (req, res) => {
	logger.debug('getting users');
	getUsers(req.user.db).then((results) => {
		const users = results.filter(() => true)
			.map((rec) => ({
				username: rec.user,
				database: rec.db,
				roles: JSON.stringify(rec.roles),
				password: Object.keys(rec.credentials)
			}));
		logger.debug(JSON.stringify(req.headers));
		if(req.get('x-ui') === 'list-only'){
			logger.debug('rendering user list only');
			res.render('dataTable', {
				baseURL: '/users',
				idField: 'username',
				rows: users
			});
		}else{
			res.render('admin', {
				rows: users,
				title: 'Manage users - MongoCRUD'
			});
		}
	}).catch((err) => {
		logger.error(err);
		req.user.db.close();
		res.status(500).end(err);
		return;
	});
});
router.post('/', async (req, res) => {
	logger.info(`Adding user: ${req.body.username}`);
	const {username, password} = req.body;
	try{
		const adminDb = req.user.db.db('admin');
		const result = await adminDb.addUser(username, password, {
			roles: ['readWriteAnyDatabase', 'dbAdminAnyDatabase']
		});
		logger.debug(`successfully added user: ${JSON.stringify(result)}`);
		getUsers(req.user.db).then((results) => {
			const users = results.filter(() => true)
				.map((rec) => ({
					username: rec.user,
					database: rec.db,
					roles: JSON.stringify(rec.roles),
					password: Object.keys(rec.credentials)
				}));
			res.render('dataTable', {
				baseURL: '/users',
				idField: 'username',
				rows: users
			});
		}).catch((err) => {
			logger.error(err);
			res.status(500).end(err);
			return;
		}).finally(() => {
			req.user.db.close();
		});
	}catch(e){
		logger.error(e);
		res.status(500).send(e);
	}
});
// for UI; maybe use accept header and merge
router.put('/edit/:id', (req, res) => {
	logger.info(`Editing user: ${req.params.id}`);
	getUsers(req.user.db, req.params.id).then((user) => {
		const context = {
			database: user.db,
			roles: JSON.stringify(user.roles),
			username: user.user
		};
		res.render('userEdit', context);
	}).catch((err) => {
		logger.error(err);
		res.status(500).end(err);
		return;
	}).finally(() => {
		req.user.db.close();
	});
});
router.put('/:id', (req, res) => {
	const userId = req.params.id;
	logger.info(`Updating user: ${userId}`);
	logger.debug(`with updates: ${JSON.stringify(req.body)}`);

	getUsers(req.user.db, userId).then(async (user) => {
		const {database, pwd} = req.body;
		const roles = JSON.parse(req.body.roles);
		const updates = {};
		if(pwd !== undefined && pwd != ''){
			logger.debug('updating password');
			const result = await req.user.db.db('admin').command({
				updateUser: userId,
				pwd
			});
			logger.info(JSON.stringify(result));
		}
		if(database !== undefined && database !== user.db){
			logger.debug(`updating database: ${user.db} -> ${database}`);
			updates.db = database;
		}
		if(roles !== undefined && !arraysEqual(roles, user.roles)){
			logger.debug(`updating roles: ${JSON.stringify(user.roles)} -> ${JSON.stringify(roles)}`);
			updates.roles = roles;
		}

		if(Object.keys(updates).length === 0){
			const user = await getUsers(req.user.db, userId);
			res.render('dataRow', {
				baseURL: '/users',
				id: user.user,
				row: {
					username: user.user,
					database: user.db,
					roles: JSON.stringify(user.roles),
					password: Object.keys(user.credentials)
				}
			});
			return;
		}

		logger.debug(JSON.stringify(updates));
		try{
			const result = await req.user.db.db('admin').collection('system.users').updateOne({ user: userId }, {$set: updates});
			if(result.modifiedCount === 1){
				logger.info(`Successfully updated: ${JSON.stringify(result)}`);
			}else{
				logger.debug(`Update result: ${JSON.stringify(result)}`);
			}
			const user = await getUsers(req.user.db, userId);
			res.render('dataRow', {
				baseURL: '/users',
				id: user.user,
				row: {
					username: user.user,
					database: user.db,
					roles: JSON.stringify(user.roles),
					password: Object.keys(user.credentials)
				}
			});
		}catch(e){
			if(e){
				logger.error(e);
			}
		}finally{
			req.user.db.close();
		}
	}).catch((err) => {
		logger.error(err);
		res.status(500).end(err);
		req.user.db.close();
		return;
	});
});
router.delete('/:username', async (req, res) => {
	const username = req.params.username;
	logger.info(`Removing user: ${username}`);
	try{
		const adminDb = req.user.db.db('admin');
		const result = await adminDb.removeUser(username);
		req.user.db.close();
		logger.debug(JSON.stringify(result));
		res.send();
	}catch(e){
		logger.error(e);
		res.status(500).send(e);
	}
});

module.exports = router;

