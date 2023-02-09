const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationModel = new Schema({
    title: String,
    content: String,
    create_on: String,
    department: String,       // thông báo của phòng ban
    departmentID: String
})

module.exports = mongoose.model('Notification', NotificationModel)