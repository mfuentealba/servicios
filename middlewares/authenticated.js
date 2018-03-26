'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'No contiene cabecera de autorizacion'});
    }

    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
        var payload = jwt.decode(token, secret);
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'Sesión expirada'
            });
        }
    } catch(ex){
        return res.status(404).send({
            message: 'Token Invalido'
        });
    }

    req.user = payload;

    next();
    
}