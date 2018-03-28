'use strict'

var express = require('express');
var PublicationController = require('../controller/publicationController');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publications'})

api.post('/publication', md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/publication/:id?', md_auth.ensureAuth, PublicationController.getPublication);
api.delete('/publicationDelete/:id?', md_auth.ensureAuth, PublicationController.deletePublication);
api.post('/uploadImagePublication/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage);
api.get('/getImageFile/:imageFile', PublicationController.getImageFile);

module.exports = api;