const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountModel = new Schema({
    username: {
        type:String,
        unique:true
    },
    password: String,
    name: String,
    department: [{
        departmentID: String,
        department: String
    }],      // có thể quản lý nhiều khoa
    avatar: {
        type: String,
        default: '/images/tdtu_logo.png'
    },
    role: {
        type: String,
        default: 'department'
    }
})

module.exports = mongoose.model('Account', AccountModel)