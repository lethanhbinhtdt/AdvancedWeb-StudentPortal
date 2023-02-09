const {check, validationResult} = require('express-validator')
// kiểm tra thông tin đăng nhập
const loginValidator = [
    check('username').exists().withMessage('Vui lòng nhập tài khoản')
    .notEmpty().withMessage('Không được để trống tài khoản'),
    check('password').exists().withMessage('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Không được để trống mật khẩu')
    .isLength({min : 6}).withMessage('Mật khẩu cần ít nhất 6 ký tự'),
]

module.exports = loginValidator