'use strict'

var express = require('express');
var UserController = require('../controller/user');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.get('/home', UserController.fnHome);
api.get('/pruebas', md_auth.ensureAuth, UserController.fnPruebas);
api.post('/registerUser', md_auth.ensureAuth, UserController.saveUser);
api.post('/loginUser', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);

module.exports = api;