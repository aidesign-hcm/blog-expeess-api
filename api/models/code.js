const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const codeSchema = new Schema({
    code: {
        type: String,
        required: true,
    },
},{timestamps: true})

codeSchema.index({createdAt: 1},{expireAfterSeconds: 300});

module.exports = mongoose.model('Code', codeSchema)