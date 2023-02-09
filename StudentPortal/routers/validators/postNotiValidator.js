const {check, validationResult} = require('express-validator')
// kiểm tra thông tin đăng nhập
const loginValidator = [
    check('title').exists().withMessage('Vui lòng nhập tiêu đề')
    .notEmpty().withMessage('Không được để trống tiêu đề'),

    check('content').exists().withMessage('Vui lòng nhập nội dung thông báo')
    .notEmpty().withMessage('Không được để trống nội dung thông báo'),
]

module.exports = loginValidator