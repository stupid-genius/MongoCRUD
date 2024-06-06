const OIDC = require('express-openid-connect').auth;
const Logger = require('log-ng');
const requiresAuth = require('express-openid-connect').requiresAuth;
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const MongoClient = require('mongodb').MongoClient;
const app = require('./app');
const config = require('./config');

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
			logger.warn(`Failed to authenticate ${username}: ${e}`);
			return done(null, false);
		}
	});
	passport.use(strategy);
	authenticateRequest = function(req, res, next){
		logger.debug(`Checking auth for request ${req.url}`);
		if(req.isAuthenticated()){
			logger.debug(`${req.user.name} has a valid session`);
			next();
		}else{
			passport.authenticate(strategyName, {
				failureFlash: true,
				failureMessage: true
				// failureRedirect: '/login.html',
				// successRedirect: '/'
			}, (err, user, info) => {
				if(info !== undefined){
					logger.info(JSON.stringify(info, null, 2));
				}
				if(!user){
					logger.warn('Not authenticated');
					res.status(401);
					if(req.headers?.['accept'] === 'application/json; q=0'){
						return res.end();
					}else{
						return res.redirect('/login.html');
					}
				}
				if(err){
					logger.error(err);
					return next(err);
				}
				if(req.headers?.['accept'] === 'application/json; q=0'){
					req.login(user, next);
					return;
				}else{
					req.login(user, () => {
						res.redirect('/');
					});
				}
			})(req, res, next);
		}
	};
	break;
}

passport.serializeUser((user, done) => {
	/* eslint-disable-next-line no-unused-vars */
	const { db, password, ...serializable } = user;
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
