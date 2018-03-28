'use strict'

var express = require('express');
var FollowController = require('../controller/followController');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'})

api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/getMyFollows/:followed?', md_auth.ensureAuth, FollowController.getMyFollow);

module.exports = api;