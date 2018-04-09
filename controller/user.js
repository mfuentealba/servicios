'use strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

function fnHome(req, res){
    res.status(200).send({
        message: 'hola mundo'
    })
}

function fnPruebas(req, res) {
    console.log(req.body);
    console.log(req);
    res.status(200).send({
        
        message: 'hola'
    })
}

function saveUser(req, res){
    var params = req.body;
    var userVO = new User();
    if(params.name && params.surname && params.nick && params.email && params.password){
        userVO.name = params.name;
        userVO.surname = params.surname;
        userVO.nick = params.nick;
        userVO.email = params.email;
        userVO.role = 'USUARIO_NORMAL';
        userVO.image = null;

        User.find({$or: [
            {email: userVO.email.toLowerCase()},
            {nick: userVO.nick.toLowerCase()}
        ]}).exec((err, users) => {
            if(err) return res.status(500).send({message: "error en la peticion"})
            if(users && users.length > 0){
                return res.status(200).send({message: 'usuario existente'});
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    userVO.password =hash;
                    userVO.save((err, userStore) => {
                        if(err) return res.status(500).send({message: "error al crear usuario"});
                        if(userStore){
                            res.status(200).send({user: userStore});
                        } else {
                            res.status(404).send("No se ha registrado el usuario, vuelva a intentar");
                        }
                    })
                });
            }
        });
        
        
    } else {
        res.status(200).send({
            message: 'Completar campos requeridos'
        });
    }
}

function loginUser(req, res){
    var params = req.body;
    var email = params.email;
    var pass = params.password;
    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(user){
            bcrypt.compare(pass, user.password, (err, check) => {
                if(check){
                    if(params.gettoken){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })

                    } else {
                        user.password = undefined;
                    }
                    
                    return res.status(200).send({user});
                } else {
                    return res.status(404).send({message: 'Contraseña inválida'});
                }
            })
        } else {
            return res.status(404).send({message: 'Usuario no encontrado'});
        }
    });

    
}


function getUser(req, res){
    var userId = req.params.id;
    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'Usuario no existe'});

        

        followThisUser(req.params.id, userId).then((value) => {
            return res.status(200).send({
                user,
                following: value.following,
                followed: value.followed
            })
        });
    });


}

async function followThisUser(identityUserId, userId){
    var following = await Follow.findOne({"user": identityUserId, 'followed': userId}).exec().then((follow) => {
        console.log('lala');
        return follow;
    }).catch((err)=>{
        return handleerror(err);
    });

    var followed = await Follow.findOne({"user": userId, 'followed': identityUserId}).exec().then((follow) => {
        
        return follow;
    }).catch((err)=>{
        return handleerror(err);
    });

    return {
        followed: followed,
        following: following
    }
}

function getUsers(req, res){
    var identityUserId = req.user.sub;//es el id del usuario logueado que lo saco del middleware md_auth...
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(!users) return res.status(404).send({message: 'no existen usuarios'});
        followUserIds(identityUserId).then((value) => {
            return res.status(200).send({
                users, total, 
                usersFollowing: value.following,
                usersFollowMe: value.followed,
                pages: Math.ceil(total / itemsPerPage)
            });
        })
    })
}


async function followUserIds(userId){
    var following = await Follow.find({"user": userId}).select({'_id': 0, '__v':0, 'user': 0}).exec().then(follows => {
        
        return follows;
    }).catch(err => {

    });

    var followed = await Follow.find({"followed": userId}).select({'_id': 0, '__v':0, 'followed': 0}).exec().then(follows => {
        
        return follows;
    }).catch(err => {

    });

    var followingClean = [];

    following.forEach((follow) => {
        followingClean.push(follow.followed)
    });

    var followedClean = [];

    followed.forEach((follow) => {
        followedClean.push(follow.user)
    });

    return {
        following:followingClean,
        followed: followedClean
    }

}

function updateUser(req, res){
    var userId = req.params.id;
    var userVO = req.body;
    delete userVO.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No autorizado'});
    }
    User.find({$or: [
        {email: userVO.email.toLowerCase()},
        {nick: userVO.nick.toLowerCase()}
    ]}).exec().then(users => {
        var user_isset = false;
        users.forEach(user => {
            if(user && user._id != userId) user_isset = true;
        });
        if(user_isset) return res.status(404).send({message: 'Los datos ya estan en uso'});
        User.findByIdAndUpdate(userId, userVO, {new: true}, (err, userUpdated) => { //{new: true} --> son las opciones de update y con new: true indico que retorne el objeto nuevo
            if(err) return res.status(500).send({message: 'Error en la petición'});

            if(!userUpdated) return res.status(404).send({message: 'Usuario no existe'});

            return res.status(200).send({user: userUpdated});//es el objeto original si no se agrega {new: true}
            
        });

    }).catch(err => {

    })
   
}


function uploadImage(req, res){
    var userId = req.params.id;
    
    var userVO = req.body;
    delete userVO.password;

    if(req.files && req.files.image){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];
        console.log(file_name);
        var extSplit = file_name.split('\.')[1];
        if(userId != req.user.sub){
            return removeFilesOfUploads(file_path, 'Archivo no cargado');
            
            
        }
        if(extSplit == 'png' || extSplit == 'jpg' || extSplit == 'jpeg' || extSplit == 'gif'){
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) => { //{new: true} --> son las opciones de update y con new: true indico que retorne el objeto nuevo
                if(err) return res.status(500).send({message: 'Error en la petición'});
        
                if(!userUpdated) return res.status(404).send({message: 'Usuario no existe'});
        
                return res.status(200).send({user: userUpdated});//es el objeto original si no se agrega {new: true}
            });
        } else {
            return removeFilesOfUploads(file_path, 'Extension no valida');
        }
    } else {
        return res.status(200).send({message: "No ha cargado archivo"});
    }

}    

function removeFilesOfUploads(file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message});
    })
}

function getImageFile(req, res){
    var imageFile = req.params.imageFile;
    var pathFile = './uploads/users/' + imageFile;

    fs.exists(pathFile, (exists) => {
        if(exists){
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({message: 'no existe la imagen'});
        }
    });
}

function getCounters(req, res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
    } 
    getContFollow(userId).then((value) => {
        return res.status(200).send(value);
    }).catch((err) => {return handleError(err);});
}

async function getContFollow(userId){
    var following = await Follow.count({'user': userId}).exec().then(count => {
        return count;
    }).catch(err => {
        return handleError(err);
    });

    var followed = await Follow.count({'followed': userId}).exec().then(count => {
        return count;
    }).catch(err => {
        return handleError(err);
    });

    var publications = await Publication.count({"user": userId}).exec().then(count => {
        return count;
    }).catch(err => {
        return handleError(err);
    });

    return {
        following: following,
        followed: followed,
        publications: publications
    };
}

module.exports = {
    fnHome,
    fnPruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile,
    getCounters
}