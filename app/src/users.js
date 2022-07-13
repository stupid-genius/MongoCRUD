const express = require('express');
const path = require('path');
const { ObjectId } = require('mongodb');
const Logger = require('./logger');

/* eslint-disable-next-line no-undef */
const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.get('/', (req, res) => {
	logger.info('getting users');
});

module.exports = router;

