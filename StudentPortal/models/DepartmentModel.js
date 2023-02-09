const mongoose = require('mongoose')
const Schema = mongoose.Schema
// Danh sách phòng ban
const DepartmentModel = new Schema({
    departmentID: {type: String, unique: true},
    department: String
})

module.exports = mongoose.model('Department', DepartmentModel)