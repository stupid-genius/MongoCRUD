const Logger = require('log-ng');
const path = require('path');

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

// not sure this is the right approach
function filterAdmin(req, res, next){
	if(req.body.database === 'admin'){
		const msg = 'CRUD directly on admin not allowed';
		logger.warn(msg);
		res.status(403).end(msg);
		return;
	}
	next();
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

function parseValue(value){
	if(!isNaN(value)){
		return Number(value);
	}
	if(value === 'true'){
		return true;
	}
	if(value === 'false'){
		return false;
	}
	return value;
}

function parseArray(value){
	return value.split(/,/).map(item => parseValue(item.trim()));
}

function parseLogicalOperator(operator, field, value){
	logger.debug(`parsing logical operator: ${operator} on field: ${field} with value: ${value}`);
	const terms = value.split(';').map(queryTerm => {
		const [queryKey, queryValue] = queryTerm.split('=');
		const [field, operator] = queryKey.split('__');
		return applyOperator(operator, field, queryValue);
	});
	return {[operator]: terms};
}

const operatorHandlers = {
	'and': parseLogicalOperator.bind(null, '$and'),
	'exists': (field, value) => ({[field]: {$exists: value === 'true'}}),
	'gt': (field, value) => ({[field]: {$gt: Number(value)}}),
	'gte': (field, value) => ({[field]: {$gte: Number(value)}}),
	'in': (field, value) => ({[field]: {$in: parseArray(value)}}),
	'lt': (field, value) => ({[field]: {$lt: Number(value)}}),
	'lte': (field, value) => ({[field]: {$lte: Number(value)}}),
	'ne': (field, value) => ({[field]: {$ne: parseValue(value)}}),
	'nin': (field, value) => ({[field]: {$nin: parseArray(value)}}),
	'or': parseLogicalOperator.bind(null, '$or'),
	'regex': (field, value) => ({[field]: {$regex: value}}),
	'mongo': (_field, value) => decodeURIComponent(value)
};

function applyOperator(operator, field, value){
	logger.debug(`applying operator: ${operator} to field: ${field} with value: ${value}`);
	if(operator && operatorHandlers[operator]){
		return operatorHandlers[operator](field, value);
	}else{
		return {
			[field]: parseValue(value)
		};
	}
}

/**
 * Parse query string for MongoDB query operators
 * @example
 * /users?username=john_doe
 * /users?age__gt=20&experience__gte=5
 * /users?role__in=user,moderator&role__nin=admin,superuser
 * /users?email__exists=true
 * /users?__and=age__gt=20;experience__gte=5
 * /users?__or=role__in=user,moderator;department__eq=engineering
 * /users?username__regex=^john
 */
function parseMongoQuery(req, _res, next){
	const query = decodeURIComponent(JSON.stringify(req.query));
	logger.debug(`parsing query: ${query}`);
	req.mongoQuery = Object.keys(JSON.parse(query))
		.filter((key) => Object.prototype.hasOwnProperty.call(req.query, key))
		.reduce((query, key) => {
			logger.debug(`key: ${key}, query: ${JSON.stringify(query)}`);
			if(Object.prototype.hasOwnProperty.call(req.query, key)){
				const [field, operator] = key.split('__');
				logger.debug(`field: ${field}, operator: ${operator}`);
				const operatorResult = applyOperator(operator, field, req.query[key]);
				logger.debug(`operatorResult: ${JSON.stringify(operatorResult)}`);
				const resultField = field || `$${operator}`;
				if(query[resultField]){
					query[resultField] = {...query[resultField], ...operatorResult[resultField]};
				}else{
					query[resultField] = operatorResult[resultField];
				}
			}
			logger.debug(`query: ${JSON.stringify(query)}`);
			return query;
		}, {});
	logger.debug(`parsed query: ${JSON.stringify(req.mongoQuery)}`);
	next();
}

function parseDBCollDoc(req, _res, next){
	logger.debug(`parsing db: ${req.params[0]}, collection: ${req.params[1]}, doc: ${req.params[2]}`);
	req.db = req.params[0];
	req.collection = req.params[1];
	req.id = req.params[2];
	next();
}

module.exports = {
	arraysEqual,
	filterAdmin,
	getUsers,
	objectsEqual,
	parseDBCollDoc,
	parseMongoQuery
};
