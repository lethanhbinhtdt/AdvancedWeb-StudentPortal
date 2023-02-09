const {check, validationResult} = require('express-validator')
// kiểm tra thông tin đăng ký
const registerValidator = [
    check('username').exists().withMessage('Vui lòng nhập tên tài khoản')
    .notEmpty().withMessage('Không được để trống tên tài khoản')
    .isLength({min : 6}).withMessage('Tên tài khoản cần ít nhất 6 ký tự'),

    check('password').exists().withMessage('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Không được để trống mật khẩu')
    .isLength({min : 6}).withMessage('Mật khẩu cần ít nhất 6 ký tự'),

    check('rePassword').exists().withMessage('Vui lòng nhập xác nhận mật khẩu')
    .notEmpty().withMessage('Không được để trống xác nhận mật khẩu')
    .custom((value, {req}) => {     // value là rePassword, req là cả Request => lấy body => lấy pass
        if (value !== req.body.password) {
            throw new Error('Mật khẩu không trùng khớp')
        }
        return true
    }),

    check('name').exists().withMessage('Vui lòng nhập tên Phòng/Khoa')
    .notEmpty().withMessage('Không được để trống tên Phòng/Khoa'),

]

module.exports = registerValidator