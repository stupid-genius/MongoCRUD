const express = require('express');
const Logger = require('log-ng');
const config = require('./config');

Logger(config);
const app = express();
module.exports = app;
