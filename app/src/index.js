const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const CookieStrategy = require('passport-cookie');
const servefavicon = require('serve-favicon');
const path = require('path');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger(path.basename(__filename));

const app = express();

app.use(morgan('common'));
app.use(cookieParser());

app.use(session({
	secret: 'correcthorsebatterystaple'
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy((user, pass, done) => {
	logger.debug(`user: ${user}, pass: ${pass}`);
	done(user);
}));
passport.use(new CookieStrategy((token, done) => {
	logger.debug('token %o', token);
	done();
}));

// app.use(passport.authenticate('local', {session: false}));
// app.use(passport.authenticate('cookie', {session: false}));
app.use((req, res, next) => {
	logger.debug('session %o', req.isAuthenticated());
	next();
});

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(servefavicon(path.join(__dirname, '../public/images/favicon.ico')));
app.use(require('./routes'));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/* eslint-disable no-unused-vars */
app.use((err, req, res, _next) => {
	res.status(err.status || 500);
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

