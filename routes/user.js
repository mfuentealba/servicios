'use strict'

var express = require('express');
var UserController = require('../controller/user');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'})

api.get('/home', UserController.fnHome);
api.get('/pruebas', md_auth.ensureAuth, UserController.fnPruebas);
api.post('/registerUser', md_auth.ensureAuth, UserController.saveUser);
api.post('/loginUser', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.put('/userUpdate/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/uploadImageUser/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/getImageFile/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
module.exports = api;