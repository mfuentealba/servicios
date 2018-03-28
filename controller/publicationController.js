'use strict'

var Publication = require('../models/publication');
var User = require('../models/user');
var fs = require('fs');
var path = require('path');
var mongoosePaginate = require('mongoose-pagination');
var moment = require('moment');
var Follow = require('../models/follow');


var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');



function savePublication(req, res){
    var params = req.body;
    
    if(!params.text) return res.status(200).send({
        message: 'Completar campos requeridos'
    });
    var publicationVO = new Publication();
    publicationVO.text = params.text;
    publicationVO.file = null;
    publicationVO.user = req.user.sub;
    publicationVO.created_at = moment().unix();
    
    publicationVO.save((err, publicationStore) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        if(publicationStore){
            res.status(200).send({publication: publicationStore});
        } else {
            res.status(404).send("La publicación no ha podido ser guardada. Intente nuevamente");
        }
    })   
}


function getPublications(req, res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({user: req.user.sub}).populate('followed').exec().then((follows) => {
        var followsClean = [];
        follows.forEach((follow) => {
            followsClean.push(follow.followed);
        });
        Publication.find({user: {"$in": followsClean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if(err) return res.status(500).send({message: 'Error devolver publicaciones'});
            if(!publications || publications.length < 1){
                return res.status(404).send({message: 'No hay publicaciones'});
            }
            return res.status(200).send({
                totalItems: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                publications: publications
            })
        })
    }).catch(err => {
        return res.status(500).send({message: 'Error devolver seguimiento'});
    })

}

function getPublication(req, res){
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        if(publication){
            return res.status(200).send({publication: publication});
        } else {
            return res.status(404).send("La publicación no ha podido ser Encontrada. Intente nuevamente");
        }
    });
}


function deletePublication(req, res){
    var params = req.body;
    var userId = req.user.sub;
    var PublicationId = req.params.id;
    
    

    Publication.find({'_id': PublicationId, user: userId}).remove(err => {
        if(err) return res.status(500).send({message: "error al dejar de seguir"});
        return res.status(200).send({message: 'Deja de seguir'});
    });

    /*Publication.findByIdAndRemove(PublicationId, (err, publicationRemoved) => {
        if(err) return res.status(500).send({message: "error al eliminar publicacion"});

        if(publicationRemoved){
            return res.status(200).send({publication: publicationRemoved});
        } else {
            return res.status(404).send("La publicación no ha podido ser Borrada. Intente nuevamente");
        }
    })*/

}

function uploadImage(req, res){
    var publicationId = req.params.id;
    
    var publicationVO = req.body;
    

    if(req.files && req.files.image){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        console.log(file_split);

        var file_name = file_split[2];
        console.log(file_name);
        var extSplit = file_name.split('\.')[1];
         
            
       
        if(extSplit == 'png' || extSplit == 'jpg' || extSplit == 'jpeg' || extSplit == 'gif'){
            Publication.findOne({'user': req.user.sub, '_id': publicationId}).exec((err, publicacion) => {
                if(publicacion){
                    Publication.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, publicationUpdated) => { //{new: true} --> son las opciones de update y con new: true indico que retorne el objeto nuevo
                        if(err) return res.status(500).send({message: 'Error en la petición'});
                
                        if(!publicationUpdated) return res.status(404).send({message: 'Usuario no existe'});
                
                        return res.status(200).send({publication: publicationUpdated});//es el objeto original si no se agrega {new: true}
                    });
                } else {
                    return res.status(404).send({message: "No tiene autorización para realizar esta acción."});
                }
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
    var pathFile = './uploads/publication/' + imageFile;

    fs.exists(pathFile, (exists) => {
        if(exists){
            res.sendFile(path.resolve(pathFile));
        } else {
            res.status(200).send({message: 'no existe la imagen'});
        }
    });
}



/*
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
    var identityUserId = req.user.id;//es el id del usuario logeado que lo saco del middleware md_auth...
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

    var followingClean = ['asdasdasda'];

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

    User.findByIdAndUpdate(userId, userVO, {new: true}, (err, userUpdated) => { //{new: true} --> son las opciones de update y con new: true indico que retorne el objeto nuevo
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!userUpdated) return res.status(404).send({message: 'Usuario no existe'});

        return res.status(200).send({user: userUpdated});//es el objeto original si no se agrega {new: true}
        
    });
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

    return {
        following: following,
        followed: followed
    };
}
*/
module.exports = {
    
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}