'use strict'

var express = require('express');
var UserController = require('../controller/user');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.get('/home', UserController.fnHome);
api.get('/pruebas', md_auth.ensureAuth, UserController.fnPruebas);
api.post('/registerUser', md_auth.ensureAuth, UserController.saveUser);
api.post('/loginUser', UserController.loginUser);

module.exports = api;