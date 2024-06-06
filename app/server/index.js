const app = require('./app');
const bodyParser = require('body-parser');
const express = require('express');
const Logger = require('log-ng');
const SessionManager = require('express-session');
const MemoryStore = require('memorystore')(SessionManager);
const morgan = require('morgan');
const servefavicon = require('serve-favicon');
const passport = require('passport');
const path = require('path');
const config = require('./config');

const logger = new Logger(path.basename(__filename));

const { authenticateRequest } = require('./auth');

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use(morgan('common'));
app.use(servefavicon(path.join(__dirname, '../client/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(SessionManager({
	resave: false,
	saveUninitialized: false,
	secret: config.sessionSecret,
	store: new MemoryStore({
		checkPeriod: 3600000
	})
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '../client')));
app.use(authenticateRequest);
app.use(require('./routes'));

app.use((_req, _res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/* eslint-disable no-unused-vars */
app.use((err, req, res, _next) => {
	res.status(err.status || 500);
	if(req.headers['content-type'] && req.headers['content-type'].includes('application/json')){
		return res.send(err.message).end();
	}
	res.render('error', {
		error: logger.level === 'debug' ? err : {},
		message: err.message,
		title: 'Error'
	});
});

app.listen(3000, () => {
	logger.debug(`server running in ${config.nodeEnv} mode`);
	logger.info('server listening on port 3000');
});

