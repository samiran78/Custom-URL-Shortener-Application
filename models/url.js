
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true
    },
    redirectUrl: {
        type: String,
        required: true
    },
    clicksCount: {
        type: Number,
        default: 0 // Helps track total clicks efficiently
    },
    totalClicksHistory: [{
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        }
    }],

  createdBywhom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users of us',

  }
}, {
    timestamps: true
},);

const URL = mongoose.model('URL', urlSchema);
module.exports = URL;
