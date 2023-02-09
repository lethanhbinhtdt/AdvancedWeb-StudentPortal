const express = require('express')
const Router = express.Router()
const {validationResult, check} = require('express-validator')
const bcrypt = require('bcrypt')

// Google OAuth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '689290054244-rfjevtf426iup4fsudlmq3m9skoub09k.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID);

// model
const Account = require('../models/AccountModel')
const StudentAccount = require('../models/StudentModel')
const DepartmentModel = require('../models/DepartmentModel')
const BlogModel = require('../models/BlogModel')

// check information
const registerValidator = require('./validators/registerValidator')
const loginValidator = require('./validators/loginValidator')
const resetPassValidator = require('./validators/resetPassValidator')
const checkLogin = require('../auth/checkLogin')
const checkAdminLogin = require('../auth/checkAdmin')
const checkDepartmentLogin = require('../auth/checkDepartment');

const { json } = require('express');

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


//--- login
Router.get('/', (req, res) => {
    res.redirect('/user/login')
})

Router.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/noti')
    } else {
        res.render('login', { layout: 'layouts/LoginLayout', username: '', error: ''})
    }
})
// login with username, password
Router.post('/login', loginValidator, (req, res) => {
    let result = validationResult(req)
    if (result.errors.length === 0){
        let {username, password} = req.body
        let error = ''
        let account = undefined

        Account.findOne({username: username})
        .then(acc => {
            if (!acc) {
                throw new Error('Tài khoản không tồn tại')
            }
            account = acc
            // compareSync - đợi xác nhận xong mới chạy tiếp
            return bcrypt.compareSync(password, acc.password) 
        })
        .then((passwordMatch) => {
            // sai mật khẩu
            if(!passwordMatch){
                error = 'Tài khoản hoặc mật khẩu không chính xác'
                return res.render('login', {layout: 'layouts/LoginLayout', username, error})
            }
            // Đăng nhập thành công
            req.session.user = { 
                'role': account.role,
                '_id': account._id,
                'faculty': account.faculty,
                'username': account.username,
                'email': account.email,
                'name': account.name,
                'avatar': account.avatar,
                'department': account.department
            }
            return res.redirect('/noti/')
        })
        .catch(e => {
            // Tài khoản không chính xác
            
            error = 'Tài khoản hoặc mật khẩu không chính xác'
            return res.render('login', {layout: 'layouts/LoginLayout', username, error})
        })
    }else {
        // có lỗi
        // let messages = result.mapped()   // nhóm lỗi theo từng field
        let error = result.errors[0].msg // msg bỏ các thông tin thừa
        let {username} = req.body
        return res.render('login', {layout: 'layouts/LoginLayout', username, error})
    }
})

// login with Google (student mail)
Router.post('/loginGG', (req, res) => {
    
    let token = req.body.token;
    let hd = '';    // đuôi email
    let user = {};
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        let payload = ticket.getPayload();
        hd = payload['hd']; // check đuôi email
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
    }
    verify()
    .then(() => {
        if(hd === 'student.tdtu.edu.vn'){
            // Đăng nhập thành công
            // Lưu thông tin nếu đăng nhập lần đầu
            // kiểm tra email
            StudentAccount.findOne({email: user.email})
            .then(acc => {
                if (!acc) {
                    // Đăng nhập lần đầu -> lưu thông tin
                    let newUser = new StudentAccount({
                        email: user.email,
                        name: user.name,
                        nickName: '',
                        class: '',
                        department: '',
                        avatar: user.picture
                    })
                    
                    // Lưu thông tin cho lần đăng nhập đầu tiên
                    newUser.save()
                    .then(() => {
                        req.session.user = newUser;
                    })
                } else {
                    req.session.user = acc;
                }
                
                return res.send('success');
            })
        } else {
            res.send('invalid email');
        }
    })
    .catch(e => {
        console.log(e.message)
    });
})

//--- logout
Router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/user/login')
})

//--- user setting
Router.get('/setting', checkLogin, (req, res) => {
    const user = req.session.user

    res.render('setting', {user, page: ''})
})
// API edit info
Router.post('/setting', checkLogin, (req, res) => {
    
    let user = req.session.user
    const {id, action, value} = req.body
    if (id != user._id) {
        return json({code: '1', message: 'Thao tác không hợp lệ'})
    }
    let newInfo;
    if (action == 'nickName') {
        newInfo = {nickName: value}
    }
    if (action == 'class') {
        newInfo = {class: value}
    }
    if (action == 'department') {
        newInfo = {department: value}
    }
    
    StudentAccount.findByIdAndUpdate(user._id, newInfo)
    .then((e) => {
        req.session.user[action] = value
        user = req.session.user
        console.log(user)
        return res.render('setting', {user, page: ''})
        // return json({code: '0', message: 'Cập nhật thông tin thành công'})
    })
    .catch(e => {
        return json({code: '2', message: 'Cập nhật thông tin không thành công'})
    })
})
// edit avatar
Router.post('/setting/avatar', checkLogin, (req, res) => {
    let user = req.session.user

    // let {userID} = req.body
    // console.log(user, user.role, userID)
    // if ((user.role != 'student') || (user._id != userID)) {
    //     return json({code: '1', message: 'Thao tác không hợp lệ'})
    // }

    let uploader = upload.single('image')
    uploader(req, res, err => {
        let image = req.file
    
        // lưu ảnh với tên ngẫu nhiên
        let tmp = image.originalname.split('.')         // ví dụ - originalname: 'avatar.jpg',
        let newName = uuid.generate() + '.' + tmp[1]
        let imagePath = `public/images/avatar/${newName}`
        fs.renameSync(image.path, imagePath)
        
        // cập nhật user
        imagePath = imagePath.slice(6) //  /public/images/avatar/name.jpg => /images/avatar/name.jpg
        let newInfo = {avatar: imagePath}
        StudentAccount.findByIdAndUpdate(user._id, newInfo)
        .then(() => {
            req.session.user['avatar'] = imagePath
            user = req.session.user
            // return json({code: '0', message: 'Cập nhật thông tin thành công'})
            return res.redirect('/user/setting')
        })
        .catch(e => {
            return json({code: '2', message: 'Cập nhật thông tin không thành công'})
        })
        
    })
})

//--- phòng ban thay đổi password
Router.get('/change-password', checkDepartmentLogin, (req, res) => {
    const user = req.session.user;
    res.render('change-password', {user, page:'', oldPassword:'', password:'', rePassword:'', error:''})
})
Router.post('/change-password', checkDepartmentLogin, resetPassValidator, (req, res) => {
    let result = validationResult(req)
    const user = req.session.user

    if (result.errors.length === 0){
        let {oldPassword, password} = req.body
        let error = ''
        let account = undefined

        Account.findOne({username: user.username})
        .then(acc => {
            if (!acc) {
                throw new Error('Tài khoản không tồn tại')
            }
            account = acc
            // compareSync - đợi xác nhận xong mới chạy tiếp
            return bcrypt.compareSync(oldPassword, acc.password) 
        })
        .then((passwordMatch) => {
            // sai mật khẩu
            if(!passwordMatch){
                error = 'Mật khẩu hiện tại không chính xác'
                return res.render('change-password', {user, page:'', error})
            }
            //--- Lưu mật khẩu mới
            bcrypt.hash(password, 10)
            .then(hashed => {
                let newPass = {
                    password: hashed
                }
                Account.findOneAndUpdate({username:user.username}, newPass)
                .then(() => {
                    // Lưu thành công
                    return res.redirect('/user/setting')
                })
            })
        })
        .catch(e => {
            error = '503 - ' + e.message
            return res.render('change-password', {user, page:'', error})
        })
    }else {
        // có lỗi
        // let messages = result.mapped()   // nhóm lỗi theo từng field
        let error = result.errors[0].msg // msg bỏ các thông tin thừa
        return res.render('change-password', {user, page:'', error})
    }
})

//--- account managerment
Router.get('/account-management', checkAdminLogin, (req, res) => {
    const user = req.session.user
    const page = ''
    Account.find()
    .then(accounts => {
        StudentAccount.find()
        .then(students => {
            res.render('account-management', {user, page, accounts, students})
        })
    })
    .catch(e => {
        const error = "503" + e.massage; // 503 Service Unavailable
        return res.render('error', {layout: 'layouts/LoginLayout', error})
    })
})

//--- register account for department
Router.get('/register', checkAdminLogin, (req, res) => {
    const user = req.session.user
    const page = ''
    DepartmentModel.find()
    .then(departments => {
        res.render('register', {user, page, departments, username: '', name: '', error: ''})
    })
})

Router.post('/register', checkAdminLogin, registerValidator, (req, res) => {
    let result = validationResult(req)
    const user = req.session.user
    const page = ''
    // get all faculty
    DepartmentModel.find()
    .then(departments => {
        if (result.errors.length === 0){
            // kiểm tra tên tài khoản
            let {username, password, name, faculty} = req.body
            Account.findOne({username})
            .then(acc => {
                if (acc) {
                    throw new Error('Tên tài khoản đã tồn tại')
                }
            })
            // đăng ký
            .then(() => bcrypt.hash(password, 10))
            .then(hashed => {
                // tìm id các Phòng ban được chọn
                DepartmentModel.find({department: faculty})
                .then(departmentsL => {
                    let user = new Account({
                        username: username,
                        password: hashed,
                        name: name,
                        department: departmentsL
                    })
        
                    return user.save();      // lưu vào mongoDB
                })
            }) 
            .then(() => {
                // Đăng ký thành công
                return res.redirect('/user/account-management')
            })
            .catch(e => {
                const error = "503" + e.massage; // 503 Service Unavailable
                return res.render('error', {layout: 'layouts/LoginLayout', error})
            })
        }else {
            // có lỗi
            let error = result.errors[0].msg // msg bỏ các thông tin thừa
            let {username, password, rePassword, name} = req.body
            return res.render('register', {user, page, departments, username, name, error})
        }
    })

    
})

//--- trang cá nhân
Router.get('/profile/:id', checkLogin, (req, res) => {
    const userID = req.params.id
    const user = req.session.user
    let page = ''
    if (user._id == userID) {
        page = 'PofM' // page of me
    }
    BlogModel.find({userID})
    .then(blogs => {
        blogs = blogs.reverse()
        res.render('profile', {user, page, blogs})
    })
})

module.exports = Router
