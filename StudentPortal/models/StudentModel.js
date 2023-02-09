const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StudentModel = new Schema({
    email: {
        type:String,
        unique:true
    },
    name: String,
    nickName: String,
    class: String,
    department: String,
    avatar: String,
    role: {
        type: String,
        default: 'student'
    }
})

module.exports = mongoose.model('StudentAccount', StudentModel)