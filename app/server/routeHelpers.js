const path = require('path');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

function arraysEqual(arr1, arr2){
	return arr1.every((e, i) => {
		if(typeof e === 'object'){
			if(e instanceof Array){
				return arraysEqual(e, arr2[i]);
			}
			return objectsEqual(e, arr2[i]);
		}
		if(typeof e === 'string'){
			return e === arr2[i];
		}
		logger.debug(`array equality is unknown: ${e}, ${arr2[i]}`);
		return false;
	});
}
function objectsEqual(obj1, obj2){
	const obj1Keys = Object.keys(obj1).sort();
	const obj2Keys = Object.keys(obj2).sort();

	return obj1Keys.every((e, i) => {
		if(e !== obj2Keys[i]){
			return false;
		}

		const prop1 = obj1[e];
		const prop2 = obj2[e];
		if(typeof prop1 === 'object'){
			if(prop1 instanceof Array){
				return arraysEqual(prop1, prop2);
			}
			return objectsEqual(prop1, prop2);
		}
		if(typeof prop1 === 'string'){
			return prop1 === prop2;
		}
		logger.debug(`object equality is unknown: ${prop1}, ${prop2}`);
		return false;
	});
}

function docsExecutor(res, rej, err, docs){
	// logger.debug(...arguments);
	if(err){
		logger.error(err);
		rej(err);
	}
	logger.debug(`successfully found: ${JSON.stringify(docs)}`);
	// const users = docs.map((rec) => ({
	// 	username: rec.user,
	// 	db: rec.db,
	// 	roles: JSON.stringify(rec.roles),
	// 	creds: Object.keys(rec.credentials)
	// }));
	res(docs);
}
function getUsers(db, userId){
	return new Promise((res, rej) => {
		const executor = docsExecutor.bind(null, res, rej);
		// logger.debug(executor.toString());
		// logger.debug(executor.length);
		if(userId){
			db.db('admin').collection('system.users').findOne({user: userId}, executor);
		}else{
			db.db('admin').collection('system.users').find({}).toArray(executor);
		}
	});
}

module.exports = {
	arraysEqual,
	objectsEqual,
	getUsers
};
