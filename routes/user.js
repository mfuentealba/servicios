'use strict'

var express = require('express');
var UserController = require('../controller/user');

var api = express.Router();

api.get('/home', UserController.fnHome);
api.get('/pruebas', UserController.fnPruebas);
api.post('/registerUser', UserController.saveUser);

module.exports = api;