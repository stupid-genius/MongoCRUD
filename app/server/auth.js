const OIDC = require('express-openid-connect').auth;
const requiresAuth = require('express-openid-connect').requiresAuth;
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const MongoClient = require('mongodb').MongoClient;
const app = require('./app');
const config = require('./config');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));

let strategy, strategyName;
let authenticateRequest;

switch(config.authStrategy){
case 'oidc':
	app.use(OIDC({
		authRequired: false,
		issuerBaseURL: config.OIDCProviderMetadataURL,
		baseURL: config.appURL,
		clientID: config.OIDCClientID,
		clientSecret: config.OIDCClientSecret,
		secret: config.sessionSecret
	}));
	authenticateRequest = requiresAuth();
	break;
default:
	logger.warn(`Unrecognized passport strategy: ${config.authStrategy}−defaulting to LocalStrategy`);
	/* falls through */
case 'local':
	strategyName = 'local';
	strategy = new LocalStrategy({
		session: false,
	},
	async function(username, password, done){
		const connString = `mongodb://${username}:${password}@${config.dbHost}/?authMechanism=DEFAULT`;
		logger.info(`Authenticating ${username}`);

		let mc;
		try{
			mc = await getMongoClient(connString);
			logger.info(`Successfully authenticated ${username}`);
			return done(null, {
				connString,
				db: mc,
				name: username
			});
		}catch(e){
			logger.warn(`Failed to authenticate ${username}`);
			return done(e);
		}
	}
	);
	passport.use(strategy);
	authenticateRequest = function(req, res, next){
		logger.debug(`Checking auth for request ${req.url}`);
		if(req.isAuthenticated()){
			logger.debug(`${req.user.name} has a valid session`);
			next();
		}else{
			passport.authenticate(strategyName, {
				failureRedirect: '/login.html',
				successRedirect: '/'
			})(req, res, next);
		}
	};
	break;
}

passport.serializeUser((user, done) => {
	/* eslint-disable-next-line no-unused-vars */
	const { db, ...serializable } = user;
	// logger.debug(`Serializing user ${JSON.stringify(user, (k,v) => k==='password'?undefined:v,2)}`);
	logger.debug(`Serializing user ${JSON.stringify(serializable)}`);
	done(null, serializable);
});
passport.deserializeUser(async (user, done) => {
	logger.debug(`Deserializing user ${JSON.stringify(user)}`);
	try{
		const mc = await getMongoClient(user.connString);
		done(null, {
			db: mc,
			...user
		});
	}catch(e){
		logger.error(`Deserialization failed: ${e}`);
		done(e);
	}
});

async function getMongoClient(connectionString){
	logger.info(`Attempting to open connection: ${connectionString}`);
	let mc;
	try{
		mc = new MongoClient(connectionString);
		await mc.connect();
		await mc.db('admin').command({ ping: 1 });
		return mc;
	}catch(err){
		logger.warn(err);
		if(mc){
			await mc.close();
		}
		throw new Error(err);
	}
}

// const connString = `mongodb://${username}:${password}@${config.dbHost}/?authMechanism=DEFAULT`;
// function LoggableString(template, model){
// 	const string = {};
// 	Object.defineProperties(string, {
// 		loggable: {
// 			get: function(){
// 				return '';
// 			}
// 		},
// 		value: {
// 			get: function(){
// 				return '';
// 			}
// 		}
// 	});
// 	Object.freeze(string);
// 	return string;
// }

module.exports = {
	authenticateRequest
};
