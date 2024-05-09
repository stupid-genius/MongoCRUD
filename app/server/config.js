const packageJson = require(process.env.npm_package_json);

module.exports = Object.freeze({
	appName: packageJson.name,
	appDescription: packageJson.description,
	appVersion: packageJson.version,
	dbHost: process.env.DBHOST || 'mongo',
	dbPort: process.env.DBPORT || 27017,
	logFile: process.env.LOGFILE || 'app.log',
	logLevel: process.env.LOGLEVEL || (process.env.NODE_ENV==='production'?'info':'debug'),
	nodeEnv: process.env.NODE_ENV || 'not set'
});

