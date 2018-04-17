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

        followsClean.push(req.user.sub);

        Publication.find({user: {"$in": followsClean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
            if(err) return res.status(500).send({message: 'Error devolver publicaciones'});
            if(!publications){
                return res.status(404).send({message: 'No hay publicaciones'});
            }
            return res.status(200).send({
                totalItems: total,
                pages: Math.ceil(total / itemsPerPage),
                page: page,
                items_per_page: itemsPerPage,
                publications: publications
            })
        })
    }).catch(err => {
        return res.status(500).send({message: 'Error devolver seguimiento'});
    })

}

function getPublicationsUser(req, res){
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var user = req.user.sub;

    if(req.params.user){
        user = req.params.user;
    }

    var itemsPerPage = 4;

    

    Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
        if(err) return res.status(500).send({message: 'Error devolver publicaciones'});
        if(!publications){
            return res.status(404).send({message: 'No hay publicaciones'});
        }
        return res.status(200).send({
            totalItems: total,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            items_per_page: itemsPerPage,
            publications: publications
        })
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



module.exports = {
    
    savePublication,
    getPublications,
    getPublicationsUser,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}