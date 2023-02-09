const express = require('express')
const Router = express.Router()
const {validationResult, check} = require('express-validator')
const rateLimit = require('express-rate-limit')
const { json } = require('express')

// giới hạn đăng bài của sinh viên
const blogLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2, // start blocking after 2 requests
    message: "Không thể gửi quá 2 bài trong 10s"
})

// upload file
const multer = require('multer') //multi part/form data
const upload = multer({dest: 'public/images/avatar', // thư mục lưu trữ
                    fileFilter: (req, file, callback) => {
                        if (file.mimetype.startsWith('image/'))
                            callback(null, true)        // cho upload
                        else callback(null, false)      // chặn upload
                    }, limits: {fileSize: 1024 * 1024 * 2}})     // max 2mb
const fs = require('fs')            // đổi tên file khi upload
const uuid = require('short-uuid')  // sinh id ngẫu nhiên

// auth
const checkLogin = require('../auth/checkLogin')
const checkDepartmentLogin = require('../auth/checkDepartment')

// valid
const postNotiValidator = require('./validators/postNotiValidator')

// model
const DepartmentModel = require('../models/DepartmentModel')
const NotificationModel = require('../models/NotificationModel')
const BlogModel = require('../models/BlogModel')


//--- trang chủ
Router.get('/', checkLogin, (req, res) => {
    const user = req.session.user
    const page = 'home'
    // load new noti
    NotificationModel.find()
    .then(notifications => {
        notifications = notifications.reverse().slice(0, 4) // lấy 4 thông báo mới nhất
        // load blog
        BlogModel.find()
        .then(blogs => {
            blogs = blogs.reverse()
            return res.render('home', {user, page, notifications, blogs})
        })
        
    })
    .catch(e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    })
    
})


//--- tất cả thông báo
Router.get('/notifications', checkLogin, (req, res) => {
    const user = req.session.user
    const page = 'notification'
    NotificationModel.find()
    .then(notifications => {
        notifications = notifications.reverse() // sắp xếp từ mới tới cũ
        return res.render('notifications', {user, page, byDepartment:'', notifications})
    })
    .catch(e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {error})
    })
    
})
//--- chi tiết thông báo
Router.get('/notification/:id', checkLogin, (req, res) => {
    const {id} = req.params
    const user = req.session.user
    NotificationModel.findById(id)
    .then(notification => {
        return res.render('notification-detail', {user, page: '', notification})
    })
    .catch(e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    })
})

//--- đăng thông báo mới
Router.get('/add', checkDepartmentLogin, (req, res) => {
    const user = req.session.user
    if (user.role == "admin"){
        // get all department 
        DepartmentModel.find()
        .then(departments => {
            // get all department success
            return res.render('notification-post', {user, page:'Đăng', notiID: '', departments, title: '', content: '', departmentIDSelected: '', error: ''})
        })
        .catch(e => {
            const error = "503 - " + e.massage; // 503 Service Unavailable
            return res.render('error', {layout: 'layouts/LoginLayout', error})
        })
    }
    if (user.role == "department"){
        return res.render('notification-post', {user, page:'Đăng', notiID:'', departments: user.department, title: '', content: '', departmentIDSelected: '', error: ''})
    }
    
})

Router.post('/add', checkDepartmentLogin, postNotiValidator, (req, res) => {
    let result = validationResult(req)
    const user = req.session.user
    let {title, content, departmentIDSelected} = req.body
    // Kiểm tra Khoa có quyền đăng không
    let picked = user.department.find(o => o.departmentID == departmentIDSelected)
    if (!picked && user.role != "admin") {
        const error = "401 - " + "Thao tác không hợp lệ"; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    }

    if (result.errors.length === 0){
        // thêm vào CSDL
        
        DepartmentModel.findOne({departmentID: departmentIDSelected})
        .then(department => {
            // get date dd/mm/yyyy
            let date = new Date()
            let a = date.toISOString().slice(0,10)  // 2021-05-11
            let b = a.split('-')
            let create_on = b[2]+'/'+b[1]+'/'+b[0]  // 11/05/2021
            // end get date
            let newPost = new NotificationModel({
                title: title,
                content: content,
                create_on: create_on,
                department: department.department,
                departmentID: department.departmentID
            })
            newPost.save()
            return res.redirect('/noti/notifications')
        })
        .catch(e => {
            const error = "503 - " + e.massage; // 503 Service Unavailable
            return res.render('error', {layout: 'layouts/LoginLayout', error})
        })
        
    }else {
        // có lỗi
        let error = result.errors[0].msg // msg bỏ các thông tin thừa
        
        if (user.role == "admin") {
            DepartmentModel.find()
            .then(departments => {
                // get all department success
                return res.render('notification-post', {user, page: 'Đăng', notiID:'', departments, title, content, departmentIDSelected, error})
            })
            .catch(e => {
                const error = "503 - " + e.massage; // 503 Service Unavailable
                return res.render('error', {layout: 'layouts/LoginLayout', error})
            })
        }else if (user.role == "department") {
            return res.render('notification-post', {user, page: 'Đăng', notiID:'', departments: user.department, title, content, departmentIDSelected, error})
        }else {
            const error = "401 - " + "Thao tác không hợp lệ"; // 503 Service Unavailable
            return res.render('error', {layout: 'layouts/LoginLayout', error})
        }
    }
})

//--- Sửa thông báo
Router.get('/update/:id', checkDepartmentLogin, (req, res) => {
    const notiID = req.params.id
    const user = req.session.user
    
    NotificationModel.findById(notiID)
    .then(notification => {
        let {title, content, departmentID} = notification;
        // Kiểm tra Khoa có quyền đăng không
        let picked = user.department.find(o => o.departmentID == departmentID)
        if (!picked && user.role != "admin") {
            const error = "401 - " + "Thao tác không hợp lệ"; // 503 Service Unavailable
            return res.render('error', {layout: 'layouts/LoginLayout', error})
        }
        // Hiển thị
        if (user.role == "admin"){
            // get all department 
            DepartmentModel.find()
            .then(departments => {
                // get all department success
                return res.render('notification-post', {user, page: 'Sửa', notiID, departments, title, content, departmentIDSelected: departmentID, error: ''});
            })
        }
        if (user.role == "department"){
            return res.render('notification-post', {user, page: 'Sửa', notiID, departments: user.department, title, content, departmentIDSelected: departmentID, error: ''});
        }
    })
    .catch (e => {
        const error = "503 - " + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    });
});


Router.post('/update/:id', checkDepartmentLogin, postNotiValidator, (req, res) => {
    let result = validationResult(req)
    const user = req.session.user
    let notiID = req.params.id
    let {title, content, departmentIDSelected} = req.body

    // Kiểm tra Khoa có quyền đăng không
    let picked = user.department.find(o => o.departmentID == departmentIDSelected)
    if (!picked && user.role != "admin") {
        const error = "401 - " + "Thao tác không hợp lệ"; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    }
    
    if (result.errors.length === 0){
        // sửa vào CSDL
        DepartmentModel.findOne({departmentID: departmentIDSelected})
        .then(department => {

            let updatePost = {
                title: title,
                content: content,
                department: department.department,
                departmentID: department.departmentID
            }
            NotificationModel.findByIdAndUpdate(notiID, updatePost)
            .then(() => {
                return res.redirect('/noti/notifications')
            })
            .catch(e => {
                const error = "503 - " + e.massage; // 503 Service Unavailable
                return res.render('error', {layout: 'layouts/LoginLayout', error})
            })
                
            
        })
        .catch(e => {
            const error = "503 - " + e.massage; // 503 Service Unavailable
            return res.render('error', {layout: 'layouts/LoginLayout', error})
        })
        
    }else {
        // có lỗi
        let error = result.errors[0].msg // msg bỏ các thông tin thừa
        if (user.role == "admin") {
            DepartmentModel.find()
            .then(departments => {
                // get all department success
                return res.render('notification-post', {user, page: 'Sửa', notiID, departments, title, content, departmentIDSelected, error});
            })
            .catch(e => {
                const error = "503 - " + e.massage; // 503 Service Unavailable
                return res.render('error', {layout: 'layouts/LoginLayout', error})
            })
        }
        
    }
})

//--- API Xóa thông báo
Router.post('/delete/:id', checkDepartmentLogin, (req, res) => {
    const user = req.session.user
    const notiID = req.params.id
    // kiểm tra phòng ban có quyền xóa không
    NotificationModel.findById(notiID)
    .then(noti => {
        let picked = user.department.find(o => o.departmentID == noti.departmentID)
        if (user.role == 'admin' || picked) {
            NotificationModel.findByIdAndRemove(notiID)
            .then(() => {
                return json({code: '0', message: 'Xóa thành công'})
            })
            .catch(e => {
                return json({code: '503', message: e.message})
            })
        } else {
            return json({code: '404', message: 'Thao tác không hợp lệ'})
        }
    })
    
})
module.exports = Router