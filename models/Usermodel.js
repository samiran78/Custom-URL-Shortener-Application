const mongoose = require('mongoose');


const userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // Optional: Add a field to track the user who created the URL
    role: {
        type: String,
        required: true,
        //as i create my functionallity logic middleware for NORMAL USERS SO DEFAULT WILL BE NORMAL
        default: 'NORMAL_USER'
    },
    password: {
        type: String,
        required: true
    },


}, {
    timestamps: true
});

const userdatas = mongoose.model('userdatas', userschema);
module.exports = userdatas;