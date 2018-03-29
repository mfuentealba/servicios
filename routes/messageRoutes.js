'use strict'

var express = require('express');
var MessageController = require('../controller/messageController');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/myMessages/:page?', md_auth.ensureAuth, MessageController.getReceiverMessage);
api.get('/myMessagesEmit/:page?', md_auth.ensureAuth, MessageController.getEmitMessage);
/*api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/getMyFollows/:followed?', md_auth.ensureAuth, FollowController.getMyFollow);*/

module.exports = api;