const {check, validationResult} = require('express-validator')
// kiểm tra thông tin
const resetPassValidator = [

    check('oldPassword').exists().withMessage('Vui lòng nhập mật khẩu hiện tại')
    .notEmpty().withMessage('Không được để trống mật khẩu hiện tại')
    .isLength({min : 6}).withMessage('Mật khẩu hiện tại cần ít nhất 6 ký tự'),

    check('password').exists().withMessage('Vui lòng nhập mật khẩu mới')
    .notEmpty().withMessage('Không được để trống mật khẩu mới')
    .isLength({min : 6}).withMessage('Mật khẩu mới cần ít nhất 6 ký tự'),

    check('rePassword').exists().withMessage('Vui lòng nhập xác nhận mật khẩu')
    .notEmpty().withMessage('Không được để trống xác nhận mật khẩu')
    .custom((value, {req}) => {     // value là rePassword, req là cả Request => lấy body => lấy pass
        if (value !== req.body.password) {
            throw new Error('Mật khẩu không trùng khớp')
        }
        return true
    }),

]

module.exports = resetPassValidator