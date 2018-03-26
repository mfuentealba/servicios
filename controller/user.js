'use strict'

var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt')

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

module.exports = {
    fnHome,
    fnPruebas,
    saveUser,
    loginUser
}