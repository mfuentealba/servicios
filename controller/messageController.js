'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');


/*var Publication = require('../models/publication');

var fs = require('fs');
var path = require('path');


var Follow = require('../models/follow');


var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
*/


function saveMessage(req, res){
    var params = req.body;
    
    if(!params.text || !params.receiver) return res.status(200).send({
        message: 'Completar campos requeridos'
    });
    var messageVO = new Message();
    messageVO.emitter = req.user.sub;
    messageVO.receiver = params.receiver;
    messageVO.text = params.text;
    messageVO.created_at = moment().unix();
    messageVO.viewed = 'false';
    
    messageVO.save((err, messageStore) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        if(messageStore){
            return res.status(200).send({message: messageStore});
        } else {
            return  res.status(404).send("La publicación no ha podido ser guardada. Intente nuevamente");
        }
    })   
}


function getReceiverMessage(req, res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({receiver: userId}).populate('emitter receiver', 'name surname image nick _id').paginate(page, itemsPerPage, (err, message, total) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        if(!message) return res.status(404).send({message: 'mensajes no existen'});

        return res.status(200).send({
            total,
            message,
            pages: Math.ceil(total / itemsPerPage)
        });
    });

}

function getEmitMessage(req, res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Message.find({emitter: userId}).populate('emitter receiver', 'name surname image nick _id').paginate(page, itemsPerPage, (err, messages, total) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        if(!messages) return res.status(404).send({message: 'mensajes no existen'});

        return res.status(200).send({
            total,
            messages,
            pages: Math.ceil(total / itemsPerPage)
        });
    });

}


function getUnviewedMessages(req, res){
    var userId = req.user.sub;
    
    
    Message.count({receiver: userId, viewed: 'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: "error al guardar publicacion"});
        //if(!messages) return res.status(404).send({message: 'mensajes no existen'});

        return res.status(200).send({
            'unviewed': count
        });
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


function setViewedMessages(req, res){
    var userId = req.params.id;
    var userVO = req.body;
    delete userVO.password;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No autorizado'});
    }

    Message.update({receiver: userId, viewed: 'false'}, {viewed: 'true'}, {multi: true}, (err, messagesUpdated) => { //{new: true} --> son las opciones de update y con new: true indico que retorne el objeto nuevo
        if(err) return res.status(500).send({message: 'Error en la petición'});

        

        return res.status(200).send({
            messages: messagesUpdated
        });//es el objeto original si no se agrega {new: true}
        
    });
}



module.exports = {
    
    saveMessage,
    getReceiverMessage,
    getEmitMessage,
    getUnviewedMessages,
    setViewedMessages
}