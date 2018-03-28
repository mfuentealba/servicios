'use strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');



function saveFollow(req, res){
    var params = req.body;
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStore) => {
        if(err) return res.status(500).send({message: "error al guardar el seguimiento"});
        if(!followStore){            
            res.status(404).send("no guardado");            
        }
        return res.status(200).send({follow: followStore});
    })

}

function deleteFollow(req, res){
    var params = req.body;
    var userId = req.user.sub;
    var followId = req.params.id;
    

    Follow.find({user: userId, followed: followId}).remove(err => {
        if(err) return res.status(500).send({message: "error al dejar de seguir"});
        return res.status(200).send({message: 'Deja de seguir'});
    });



}

function getFollowingUsers(req, res){
    var userId = req.user.sub;//es el id del usuario logeado que lo saco del middleware md_auth...
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    } else {
        page = req.params.id
    }

    var itemsPerPage = 3;

    Follow.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!follows) return res.status(404).send({message: 'no existen usuarios seguidos'});
        return res.status(200).send({
            follows, total, pages: Math.ceil(total / itemsPerPage)
        });
    })
}

function getFollowedUsers(req, res){
    var userId = req.user.sub;//es el id del usuario logeado que lo saco del middleware md_auth...
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    } else {
        page = req.params.id
    }

    var itemsPerPage = 3;

    Follow.find({followed: userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total) => {//{path: 'followed'}
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!follows || follows.length < 1) return res.status(404).send({message: 'no te sigue nadie'});
        return res.status(200).send({
            follows, total, pages: Math.ceil(total / itemsPerPage)
        });
    })
}


function getMyFollow(req, res){
    var userId = req.user.sub;//es el id del usuario logeado que lo saco del middleware md_auth...
   

    var find = Follow.find({user: userId});

    if(req.params.followed){
        find = Follow.find({followed: userId});
    }

    find.populate('user').exec( (err, follows) => {//{path: 'followed'}
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!follows || follows.length < 1) return res.status(404).send({message: 'no te sigue nadie'});
        return res.status(200).send({follows});
    })
}




module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollow
}