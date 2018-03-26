'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FollowSchema = Schema({
    user: {type: Schema.ObjectId, ref: 'User'},
    follower: {type: Schema.ObjectId, ref: 'User'}  
     

});

module.exports = mongoose.model('Follow', FollowSchema);