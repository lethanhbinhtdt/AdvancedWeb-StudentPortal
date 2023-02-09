const express = require('express')
const Router = express.Router()

// auth
const checkLogin = require('../auth/checkLogin')

// model
const DepartmentModel = require('../models/DepartmentModel')
const NotificationModel = require('../models/NotificationModel')

//--- tất cả phòng ban
Router.get('/', checkLogin, (req, res) => {
    const user = req.session.user
    const page = 'department'
    DepartmentModel.find()
    .then(departments => {
        // get all department success
        res.render('department', {user, page, departments: departments})
    })
    .catch(e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    })
    
})

//--- thông báo theo phòng ban
Router.get('/:id', checkLogin, (req, res) => {
    const user = req.session.user
    const page = 'notification'
    let departmentID = req.params.id
    DepartmentModel.findOne({departmentID})
    .then(department => {
        NotificationModel.find({departmentID: departmentID})
        .then(notifications => {
            notifications = notifications.reverse() // sắp xếp từ mới tới cũ
            return res.render('notifications', {user, page, byDepartment:department.department, notifications})
        })
    })
    .catch(e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    })
})


module.exports = Router