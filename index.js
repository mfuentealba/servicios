'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/servicios')
    .then(() => {
        console.log("Conectado!!");
        //CREAR SERVER
        app.listen(port, () =>{
            console.log("SERVER");
        })
    })
    .catch(err => console.log(err))